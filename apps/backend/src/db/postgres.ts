import pg from "pg";

const cache = new Map<string, { rows: unknown[]; at: number }>();
const CACHE_TTL_MS = 30_000;

export class PostgresReadOnly {
  private pool: pg.Pool | null = null;
  private connectionString: string | null = null;

  configure(connectionString: string | null) {
    if (this.pool) {
      void this.pool.end();
      this.pool = null;
    }
    this.connectionString = connectionString;
    cache.clear();
    if (connectionString) {
      this.pool = new pg.Pool({ connectionString, max: 3 });
    }
  }

  getStatus() {
    return { configured: !!this.pool, connectionStringSet: !!this.connectionString };
  }

  assertSelectOnly(sql: string) {
    const normalized = sql.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalized.startsWith("select")) {
      throw new Error("Only SELECT queries are allowed");
    }
    const forbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i;
    if (forbidden.test(normalized)) {
      throw new Error("Query contains forbidden keywords");
    }
  }

  async query(sql: string, useCache = true): Promise<{ rows: unknown[]; rowCount: number }> {
    if (!this.pool) {
      throw new Error("Postgres is not configured. Set DATABASE_URL or configure via API.");
    }
    this.assertSelectOnly(sql);

    const cacheKey = sql.trim();
    if (useCache) {
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
        return { rows: hit.rows, rowCount: hit.rows.length };
      }
    }

    const result = await this.pool.query(sql);
    const rows = result.rows as unknown[];
    cache.set(cacheKey, { rows, at: Date.now() });
    return { rows, rowCount: rows.length };
  }
}

export const postgresReadOnly = new PostgresReadOnly();
