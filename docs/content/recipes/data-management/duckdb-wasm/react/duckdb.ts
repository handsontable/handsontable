import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

// Vite serves these files from node_modules, so the app needs no CDN at runtime.
const BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
};

interface Database {
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}

let databasePromise: Promise<Database> | null = null;

// Starts DuckDB in a Web Worker once and shares one connection across the app.
export function getDatabase(): Promise<Database> {
  databasePromise ??= (async () => {
    const bundle = await duckdb.selectBundle(BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    // COUNT(*) and nextval() return BIGINT. Cast to JS numbers so the grid never sees a BigInt.
    await db.open({ query: { castBigIntToDouble: true } });

    return { db, conn: await db.connect() };
  })();

  return databasePromise;
}

// The grid can start a fetch while a mutation's refetch is still pending. Running every
// statement through one queue keeps them from interleaving on the shared connection.
let queue: Promise<unknown> = Promise.resolve();

export function exclusive<T>(task: (database: Database) => Promise<T>): Promise<T> {
  const run = queue.then(async () => task(await getDatabase()));

  queue = run.catch(() => undefined);

  return run;
}

// Runs a parameterized statement and returns plain objects. The statement is always closed.
export async function query<T = Record<string, unknown>>(
  conn: duckdb.AsyncDuckDBConnection,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const statement = await conn.prepare(sql);

  try {
    const table = await statement.query(...params);

    return table.toArray().map((row) => row.toJSON() as T);
  } finally {
    await statement.close();
  }
}
