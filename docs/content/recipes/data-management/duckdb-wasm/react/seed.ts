import { exclusive } from './duckdb';

export const ROW_COUNT = 1_000_000;

// Builds the demo table entirely in SQL: no download, works offline. hash() makes the
// values look random but stay the same on every load.
const SEED_SQL = `
  CREATE OR REPLACE TABLE orders AS
  SELECT
    (i + 1)::INTEGER AS id,
    'ORD-' || lpad((i + 1)::VARCHAR, 7, '0') AS order_no,
    (['Bluefin Logistics', 'Cobalt Health', 'Driftwood Retail', 'Ember Energy', 'Fjord Foods',
      'Granite Bank', 'Harbor Insurance', 'Ironleaf Pharma', 'Juniper Telecom', 'Kestrel Aerospace']
    )[1 + (hash(i * 3 + 1) % 10)::INTEGER] AS customer,
    (['North America', 'EMEA', 'APAC', 'LATAM'])[1 + (hash(i * 5 + 2) % 4)::INTEGER] AS region,
    (['Laptop', 'Monitor', 'Dock', 'Keyboard', 'Headset', 'Server rack', 'Switch', 'License'])
      [1 + (hash(i * 7 + 3) % 8)::INTEGER] AS product,
    (1 + hash(i * 11 + 4) % 500)::INTEGER AS quantity,
    round(5 + (hash(i * 13 + 5) % 199500) / 100.0, 2)::DOUBLE AS unit_price,
    (['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'])
      [1 + (hash(i * 17 + 6) % 5)::INTEGER] AS status,
    (DATE '2024-01-01' + (hash(i * 19 + 7) % 1035)::INTEGER) AS order_date
  FROM range(${ROW_COUNT}) AS t(i);

  CREATE OR REPLACE SEQUENCE orders_id_seq START ${ROW_COUNT + 1};
`;

export function seedOrders(): Promise<void> {
  return exclusive(async ({ conn }) => {
    await conn.query(SEED_SQL);
  });
}

// Replaces the table with a user's Parquet or CSV file. The file never leaves the browser.
// The casts enforce the demo schema: a file without these columns fails with a clear error
// and the current table is left as it was.
export function loadFile(file: File): Promise<number> {
  const isParquet = file.name.toLowerCase().endsWith('.parquet');
  // A fixed internal name keeps the user's file name out of the SQL text.
  const internalName = isParquet ? 'upload.parquet' : 'upload.csv';
  const reader = isParquet ? `read_parquet('${internalName}')` : `read_csv_auto('${internalName}')`;

  return exclusive(async ({ db, conn }) => {
    await db.registerFileBuffer(internalName, new Uint8Array(await file.arrayBuffer()));

    try {
      await conn.query(`
        CREATE OR REPLACE TABLE orders AS
        SELECT id::INTEGER AS id, order_no::VARCHAR AS order_no, customer::VARCHAR AS customer,
               region::VARCHAR AS region, product::VARCHAR AS product, quantity::INTEGER AS quantity,
               unit_price::DOUBLE AS unit_price, status::VARCHAR AS status, order_date::DATE AS order_date
        FROM ${reader}`);

      const table = await conn.query('SELECT count(*) AS total, coalesce(max(id), 0) AS max_id FROM orders');
      const { total, max_id: maxId } = table.toArray()[0].toJSON() as { total: number; max_id: number };

      await conn.query(`CREATE OR REPLACE SEQUENCE orders_id_seq START ${Math.trunc(maxId) + 1}`);

      return total;
    } finally {
      await db.dropFile(internalName);
    }
  });
}

// Writes the current table, edits included, to a Parquet file the user can download.
export function exportParquet(): Promise<Blob> {
  return exclusive(async ({ db, conn }) => {
    await conn.query("COPY orders TO 'orders.parquet' (FORMAT parquet)");

    try {
      return new Blob([new Uint8Array(await db.copyFileToBuffer('orders.parquet'))], { type: 'application/vnd.apache.parquet' });
    } finally {
      await db.dropFile('orders.parquet');
    }
  });
}
