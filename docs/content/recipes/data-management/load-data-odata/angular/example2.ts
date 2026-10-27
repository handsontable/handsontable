/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

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

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example2-load-data-odata',
  template: `<hot-table [data]="data" [settings]="gridSettings"></hot-table>`,
})
export class AppComponent {
  readonly data = [
    { order: 'SO-10248', product: 'Queso Cabrales', quantity: 12 },
    { order: 'SO-10249', product: 'Tofu', quantity: 9 },
    { order: 'SO-10250', product: 'Manjimup Dried Apples', quantity: 35 },
    { order: 'SO-10251', product: 'Ravioli Angelo', quantity: 6 },
    { order: 'SO-10252', product: 'Chang', quantity: 25 },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Order', 'Product', 'Quantity'],
    columns: [
      { data: 'order', readOnly: true },
      {
        data: 'product',
        type: 'autocomplete',
        width: 240,
        strict: false,
        source(query: string, process: (names: string[]) => void) {
          fetchProductNames(query).then(process, () => process([]));
        },
      },
      { data: 'quantity', type: 'numeric' },
    ],
    height: 'auto',
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
