import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __avisoSql: postgres.Sql | undefined;
}

function criar() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idle_timeout: 20,
    // pooler do Supabase (modo transaction) não suporta prepared statements
    prepare: !/pooler\.supabase\.com/.test(url),
    types: {
      // date (oid 1082) volta como string AAAA-MM-DD, sem fuso
      date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
    },
    transform: { undefined: null },
  });
}

/** Cliente SQL único por processo (reaproveitado no hot reload). */
export const sql: postgres.Sql = globalThis.__avisoSql ?? (globalThis.__avisoSql = criar());

export type Tx = postgres.TransactionSql | postgres.Sql;
