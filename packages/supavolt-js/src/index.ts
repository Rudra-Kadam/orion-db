import { SupavoltClient } from './client';

export function createClient(
  projectUrl: string,
  apiKey: string,
): SupavoltClient {
  return new SupavoltClient(projectUrl, apiKey);
}

export { SupavoltClient } from './client';
export { QueryBuilder, SupavoltDb } from './db';
export type { QueryResult } from './db';
export { SupavoltRealtime } from './realtime';
export type { RealtimeCallback } from './realtime';
export { SupavoltStorage } from './storage';
export { SupavoltAuth } from './auth';
