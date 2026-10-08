import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import type { IntakeService } from './intakeService.js';
import type { AdminService } from './adminService.js';

const MAX_BODY_BYTES = 256 * 1024;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const error = new Error('Content-Type must be application/json.');
    Object.assign(error, { statusCode: 415 });
    throw error;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.');
      Object.assign(error, { statusCode: 413 });
      throw error;
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) throw new Error('Request body is required.');
  return JSON.parse(raw);
}

export function createDominusHttpServer(intakeService: IntakeService, adminService: AdminService) {
  return createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true, service: 'dominus-local-api', mode: 'mock' });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/intake') {
      try {
        const payload = await readJson(request);
        const result = await intakeService.receive(payload);
        sendJson(response, result.duplicate ? 200 : 201, result);
      } catch (error) {
        if (error instanceof ZodError) {
          sendJson(response, 400, {
            error: 'Invalid intake payload.',
            issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
          });
          return;
        }

        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error
            ? Number(error.statusCode)
            : error instanceof SyntaxError
              ? 400
              : 500;
        sendJson(response, statusCode, {
          error: statusCode === 500 ? 'The intake could not be processed.' : (error as Error).message,
        });
      }
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/dashboard') {
      sendJson(response, 200, await adminService.dashboard());
      return;
    }

    const stageMatch = url.pathname.match(/^\/api\/admin\/submissions\/([^/]+)\/stage$/);
    if (request.method === 'PATCH' && stageMatch) {
      try {
        const body = (await readJson(request)) as { stage?: unknown };
        const submission = await adminService.updateStage(
          decodeURIComponent(stageMatch[1]),
          body.stage,
        );
        sendJson(response, 200, { submission });
      } catch (error) {
        if (error instanceof ZodError) {
          sendJson(response, 400, { error: 'Invalid pipeline stage.' });
          return;
        }
        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error
            ? Number(error.statusCode)
            : error instanceof SyntaxError
              ? 400
              : 500;
        sendJson(response, statusCode, {
          error: statusCode === 500 ? 'The stage could not be updated.' : (error as Error).message,
        });
      }
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  });
}
