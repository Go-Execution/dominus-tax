import path from 'node:path';

export interface ApiConfig {
  port: number;
  databasePath: string;
  integrationMode: 'mock';
}

export function getConfig(): ApiConfig {
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  const mode = process.env.GHL_INTEGRATION_MODE || 'mock';
  if (mode !== 'mock') {
    throw new Error(
      'Only GHL_INTEGRATION_MODE=mock is enabled locally. Add the reviewed server-side GHL adapter before using live mode.',
    );
  }

  return {
    port,
    databasePath: path.resolve(process.env.DOMINUS_DB_PATH || '.local-data/dominus.db'),
    integrationMode: mode,
  };
}
