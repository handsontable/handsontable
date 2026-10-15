export const products = [
  { sku: 'SKU-4821', product: 'Stainless Steel Water Bottle', supplier: 'Harbor Goods', status: 'Active' },
  { sku: 'SKU-0093', product: 'Wireless Mouse', supplier: 'Alpine Supply Co.', status: 'Active' },
  { sku: 'SKU-1170', product: 'Ergonomic Office Chair', supplier: 'Cascade Distributors', status: 'Active' },
  { sku: 'SKU-2208', product: 'USB-C Charging Cable', supplier: 'Summit Trading', status: 'Discontinued' },
  { sku: 'SKU-3341', product: 'Aluminum Water Filter', supplier: 'Northgate Wholesale', status: 'Active' },
];

export const stock = [
  { inStock: true, product: 'Stainless Steel Water Bottle', warehouse: 'Rotterdam', quantity: 120 },
  { inStock: false, product: 'Wireless Mouse', warehouse: 'Gdansk', quantity: 0 },
  { inStock: true, product: 'Ergonomic Office Chair', warehouse: 'Hamburg', quantity: 18 },
  { inStock: false, product: 'USB-C Charging Cable', warehouse: 'Antwerp', quantity: 0 },
  { inStock: true, product: 'Aluminum Water Filter', warehouse: 'Rotterdam', quantity: 64 },
];
