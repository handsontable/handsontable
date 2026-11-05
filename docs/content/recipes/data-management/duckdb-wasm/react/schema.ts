export type ColumnKind = 'text' | 'numeric' | 'date';

export interface ColumnDef {
  kind: ColumnKind;
  // SQL used in SELECT and WHERE. Dates are compared as YYYY-MM-DD text, the same
  // string the grid shows, so text filter conditions behave the way users expect.
  expr: string;
  // SQL used in ORDER BY. Dates sort on the real DATE column.
  sortExpr: string;
  editable: boolean;
}

// The only columns the SQL builders accept. Column names can't be bound as parameters,
// so every prop that reaches SQL is checked against this map first.
export const COLUMNS: Record<string, ColumnDef> = {
  id: { kind: 'numeric', expr: 'id', sortExpr: 'id', editable: false },
  order_no: { kind: 'text', expr: 'order_no', sortExpr: 'order_no', editable: false },
  customer: { kind: 'text', expr: 'customer', sortExpr: 'customer', editable: true },
  region: { kind: 'text', expr: 'region', sortExpr: 'region', editable: true },
  product: { kind: 'text', expr: 'product', sortExpr: 'product', editable: true },
  quantity: { kind: 'numeric', expr: 'quantity', sortExpr: 'quantity', editable: true },
  unit_price: { kind: 'numeric', expr: 'unit_price', sortExpr: 'unit_price', editable: true },
  status: { kind: 'text', expr: 'status', sortExpr: 'status', editable: true },
  order_date: {
    kind: 'date',
    expr: "strftime(order_date, '%Y-%m-%d')",
    sortExpr: 'order_date',
    editable: true,
  },
};

export const SELECT_LIST = Object.entries(COLUMNS)
  .map(([prop, { expr }]) => (expr === prop ? prop : `${expr} AS ${prop}`))
  .join(', ');

export function getColumn(prop: string): ColumnDef {
  const column = Object.hasOwn(COLUMNS, prop) ? COLUMNS[prop] : undefined;

  if (!column) {
    throw new Error(`Unknown column: ${prop}`);
  }

  return column;
}
