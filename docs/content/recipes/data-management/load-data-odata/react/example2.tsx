import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const SERVICE_URL = 'https://services.odata.org/V4/Northwind/Northwind.svc/Products';

// Ask the OData service for up to 10 product names that contain the typed text.
async function fetchProductNames(query: string): Promise<string[]> {
  const term = query.toLowerCase().replace(/'/g, "''");
  const params = new URLSearchParams({
    $select: 'ProductName',
    $top: '10',
    $orderby: 'ProductName',
    $filter: `contains(tolower(ProductName),'${term}')`,
  });
  const response = await fetch(`${SERVICE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();

  return json.value.map((product: { ProductName: string }) => product.ProductName);
}

// Keep the data outside the component, so a re-render does not reload it.
const data = [
  { order: 'SO-10248', product: 'Queso Cabrales', quantity: 12 },
  { order: 'SO-10249', product: 'Tofu', quantity: 9 },
  { order: 'SO-10250', product: 'Manjimup Dried Apples', quantity: 35 },
  { order: 'SO-10251', product: 'Ravioli Angelo', quantity: 6 },
  { order: 'SO-10252', product: 'Chang', quantity: 25 },
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Order', 'Product', 'Quantity']}
      columns={[
        { data: 'order', readOnly: true },
        {
          data: 'product',
          type: 'autocomplete',
          width: 240,
          strict: false,
          // Show no suggestions when the request fails.
          source(query, process) {
            fetchProductNames(query).then(process, () => process([]));
          },
        },
        { data: 'quantity', type: 'numeric' },
      ]}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
