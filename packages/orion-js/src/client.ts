import { OrionDb } from './db';
import { OrionRealtime } from './realtime';
import { OrionStorage } from './storage';
import { OrionAuth } from './auth';

export class OrionClient {
  readonly db: OrionDb;
  readonly realtime: OrionRealtime;
  readonly storage: OrionStorage;
  readonly auth: OrionAuth;

  constructor(
    private projectUrl: string,
    private apiKey: string,
  ) {
    this.db = new OrionDb(projectUrl, apiKey);
    this.realtime = new OrionRealtime(projectUrl, apiKey);
    this.storage = new OrionStorage(projectUrl, apiKey);
    this.auth = new OrionAuth(projectUrl);
  }

  from<T = Record<string, unknown>>(table: string) {
    return this.db.from<T>(table);
  }
}
