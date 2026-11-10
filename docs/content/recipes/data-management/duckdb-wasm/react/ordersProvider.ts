import type {
  DataProviderFetchOptions,
  DataProviderFetchResult,
  DataProviderQueryParameters,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';
import { exclusive, query } from './duckdb';
import { filtersToWhere } from './filterToSql';
import { getColumn, SELECT_LIST } from './schema';

export interface FetchStats {
  totalRows: number;
  ms: number;
}

// The App subscribes to this to show how long each fetch took.
let reportStats: (stats: FetchStats) => void = () => {};

export function onFetchStats(listener: (stats: FetchStats) => void) {
  reportStats = listener;
}

export async function fetchRows(
  { page, pageSize, sort, filters }: DataProviderQueryParameters,
  { signal }: DataProviderFetchOptions,
): Promise<DataProviderFetchResult> {
  const where = filtersToWhere(filters);
  const direction = sort?.order === 'desc' ? 'DESC' : 'ASC';
  // LIMIT/OFFSET needs a total order or pages can repeat or skip rows. With no sort,
  // newest rows come first; with a sort, id breaks ties (a region has ~250k rows).
  const orderBy = sort
    ? `${getColumn(sort.prop).sortExpr} ${direction}, id ${direction}`
    : 'id DESC';
  const limit = Math.max(1, Math.trunc(pageSize));
  const offset = Math.max(0, Math.trunc(page) - 1) * limit;

  const { rows, totalRows, ms } = await exclusive(async ({ conn }) => {
    const started = performance.now();
    const pageRows = await query(
      conn,
      `SELECT ${SELECT_LIST} FROM orders ${where.sql} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
      where.params,
    );
    const [{ total }] = await query<{ total: number }>(
      conn,
      `SELECT count(*) AS total FROM orders ${where.sql}`,
      where.params,
    );

    return { rows: pageRows, totalRows: total, ms: performance.now() - started };
  });

  // DuckDB-Wasm can't cancel a prepared query, so a superseded result is simply dropped.
  if (signal.aborted) {
    return { rows: [], totalRows: 0 };
  }

  reportStats({ totalRows, ms });

  return { rows, totalRows };
}

// DuckDB-Wasm binds JS numbers as DOUBLE, so integer-only arguments need an explicit cast.
export function onRowsCreate({ rowsAmount }: RowsCreatePayload): Promise<unknown[]> {
  return exclusive(({ conn }) => query(
    conn,
    `INSERT INTO orders
       SELECT id, 'ORD-' || lpad(id::VARCHAR, 7, '0'), 'New customer', 'North America',
              'Laptop', 1, 0, 'Pending', current_date
       FROM (SELECT nextval('orders_id_seq') AS id FROM range(CAST(? AS BIGINT)))
     RETURNING id`,
    [rowsAmount],
  ));
}

function toSqlValue(prop: string, value: unknown): unknown {
  const column = getColumn(prop);

  if (!column.editable) {
    throw new Error(`${prop} is read-only`);
  }

  if (column.kind === 'numeric') {
    const number = Number(value);

    if (value === '' || value === null || Number.isNaN(number)) {
      throw new Error(`${prop} must be a number`);
    }

    return number;
  }

  return value === null || value === undefined ? null : String(value);
}

// All edits from one user action (a paste can touch hundreds of rows) commit in one transaction.
export function onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
  return exclusive(async ({ conn }) => {
    await conn.query('BEGIN TRANSACTION');

    try {
      for (const { id, changes } of rows) {
        const props = Object.keys(changes);
        const assignments = props.map((prop) => (getColumn(prop).kind === 'date'
          ? `${prop} = CAST(? AS DATE)`
          : `${prop} = ?`));
        const values = props.map((prop) => toSqlValue(prop, changes[prop]));

        if (props.length > 0) {
          await query(conn, `UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, [...values, Number(id)]);
        }
      }

      await conn.query('COMMIT');
    } catch (error) {
      await conn.query('ROLLBACK');
      throw error;
    }
  });
}

export function onRowsRemove(rowIds: unknown[]): Promise<void> {
  const ids = rowIds.map(Number).filter(Number.isInteger);

  return exclusive(async ({ conn }) => {
    if (ids.length > 0) {
      await query(conn, `DELETE FROM orders WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
    }
  });
}
