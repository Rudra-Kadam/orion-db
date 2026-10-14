import { SupavoltDb } from './db';
import { SupavoltRealtime } from './realtime';
import { SupavoltStorage } from './storage';
import { SupavoltAuth } from './auth';

export class SupavoltClient {
  readonly db: SupavoltDb;
  readonly realtime: SupavoltRealtime;
  readonly storage: SupavoltStorage;
  readonly auth: SupavoltAuth;

  constructor(
    private projectUrl: string,
    private apiKey: string,
  ) {
    this.db = new SupavoltDb(projectUrl, apiKey);
    this.realtime = new SupavoltRealtime(projectUrl, apiKey);
    this.storage = new SupavoltStorage(projectUrl, apiKey);
    this.auth = new SupavoltAuth(projectUrl);
  }

  from<T = Record<string, unknown>>(table: string) {
    return this.db.from<T>(table);
  }
}
