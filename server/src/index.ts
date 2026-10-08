import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { getConfig } from './config.js';
import { IntakeRepository } from './database.js';
import { MockGhlAdapter } from './ghl.js';
import { createDominusHttpServer } from './httpServer.js';
import { IntakeService } from './intakeService.js';
import { AdminService } from './adminService.js';

if (existsSync('.env.server')) loadEnvFile('.env.server');

const config = getConfig();
const repository = new IntakeRepository(config.databasePath);
const intakeService = new IntakeService(repository, new MockGhlAdapter());
const adminService = new AdminService(repository);
const server = createDominusHttpServer(intakeService, adminService);

server.listen(config.port, '127.0.0.1', () => {
  console.log(`Dominus local API listening on http://127.0.0.1:${config.port}`);
  console.log(`Integration mode: ${config.integrationMode}`);
  console.log(`Local metadata database: ${config.databasePath}`);
});

function shutdown() {
  server.close(() => {
    repository.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
