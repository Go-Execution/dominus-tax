import { getProductionRuntime } from '../server/src/productionRuntime.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../server/src/webResponse.js';
import { requireWebhookSecret } from '../server/src/webhookAuth.js';

export async function POST(request: Request) {
  try {
    requireWebhookSecret(request);
    const payload = await readLimitedJson(request);
    const { intakeService } = getProductionRuntime();
    const result = await intakeService.receive(payload);
    return jsonResponse(result, result.duplicate ? 200 : 201);
  } catch (error) {
    return errorResponse(error);
  }
}
