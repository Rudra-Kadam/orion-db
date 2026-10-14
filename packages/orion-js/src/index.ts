import { OrionClient } from './client';

export function createClient(
  projectUrl: string,
  apiKey: string,
): OrionClient {
  return new OrionClient(projectUrl, apiKey);
}

export { OrionClient } from './client';
export { QueryBuilder, OrionDb } from './db';
export type { QueryResult } from './db';
export { OrionRealtime } from './realtime';
export type { RealtimeCallback } from './realtime';
export { OrionStorage } from './storage';
export { OrionAuth } from './auth';
