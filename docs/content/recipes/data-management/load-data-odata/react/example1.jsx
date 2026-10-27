import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const SERVICE_URL = 'https://services.odata.org/V4/Northwind/Northwind.svc/Products';
const NUMERIC_FIELDS = ['UnitPrice', 'UnitsInStock'];

// Each Handsontable filter condition becomes one OData `$filter` expression.
const CONDITIONS = {
  eq: (f, a) => `${f} eq ${a}`,
  neq: (f, a) => `${f} ne ${a}`,
  gt: (f, a) => `${f} gt ${a}`,
  gte: (f, a) => `${f} ge ${a}`,
  lt: (f, a) => `${f} lt ${a}`,
  lte: (f, a) => `${f} le ${a}`,
  between: (f, a, b) => `${f} ge ${a} and ${f} le ${b}`,
  not_between: (f, a, b) => `${f} lt ${a} or ${f} gt ${b}`,
  contains: (f, a) => `contains(${f},${a})`,
  not_contains: (f, a) => `not contains(${f},${a})`,
  begins_with: (f, a) => `startswith(${f},${a})`,
  ends_with: (f, a) => `endswith(${f},${a})`,
  empty: (f) => `${f} eq null`,
  not_empty: (f) => `${f} ne null`,
};

function toODataFilter(filters) {
  return (filters ?? [])
    .map(({ prop, operation, conditions }) => {
      const isNumeric = NUMERIC_FIELDS.includes(prop);
      // Compare text in lower case, because the Filters plugin ignores case.
      const field = isNumeric ? prop : `tolower(${prop})`;
      const toLiteral = (value) =>
        isNumeric ? parseFloat(String(value)) : `'${String(value).toLowerCase().replace(/'/g, "''")}'`;
      const parts = conditions.flatMap(({ name = '', args }) => {
        // Like the Filters plugin, accept the two bounds of `between` in either order.
        const values = isNumeric ? args.map(toLiteral).sort((x, y) => Number(x) - Number(y)) : args.map(toLiteral);
        // Skip a condition the table does not map, or a numeric input that is not a number.
        const isMapped =
          Object.hasOwn(CONDITIONS, name) && values.every((v) => typeof v === 'string' || Number.isFinite(v));

        return isMapped ? [`(${CONDITIONS[name](field, ...values)})`] : [];
      });

      return parts.length ? `(${parts.join(operation === 'conjunction' ? ' and ' : ' or ')})` : '';
    })
    .filter(Boolean)
    .join(' and ');
}

async function fetchRows({ page, pageSize, sort, filters }, { signal }) {
  const filter = toODataFilter(filters);
  const query = new URLSearchParams({
    $count: 'true',
    $top: `${pageSize}`,
    $skip: `${(page - 1) * pageSize}`,
    ...(sort ? { $orderby: `${sort.prop} ${sort.order}` } : {}),
    ...(filter ? { $filter: filter } : {}),
  });
  const response = await fetch(`${SERVICE_URL}?${query}`, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();

  return { rows: json.value, totalRows: json['@odata.count'] };
}

const dataProvider = {
  rowId: 'ProductID',
  fetchRows,
  // The Northwind demo service is read-only, so the write callbacks do nothing.
  onRowsCreate: async () => [],
  onRowsUpdate: async () => {},
  onRowsRemove: async () => {},
};

const ExampleComponent = () => {
  return (
    <HotTable
      dataProvider={dataProvider}
      colHeaders={['Product', 'Quantity per unit', 'Unit price', 'Units in stock']}
      columns={[
        { data: 'ProductName', width: 240 },
        { data: 'QuantityPerUnit', width: 180 },
        { data: 'UnitPrice', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD' } },
        { data: 'UnitsInStock', type: 'numeric' },
      ]}
      readOnly={true}
      pagination={{ pageSize: 10 }}
      columnSorting={true}
      filters={true}
      dropdownMenu={true}
      emptyDataState={true}
      notification={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
