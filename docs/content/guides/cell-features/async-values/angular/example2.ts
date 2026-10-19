/* file: app.component.ts */
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

const categories: [string, string][] = [
  ['bottle', 'Drinkware'],
  ['water', 'Drinkware'],
  ['mouse', 'Electronics'],
  ['usb', 'Electronics'],
  ['speaker', 'Electronics'],
  ['chair', 'Furniture'],
  ['desk', 'Furniture'],
  ['stand', 'Furniture'],
  ['bag', 'Apparel'],
];

// A stand-in for a model call: it classifies a batch after a delay, and stops when the signal is aborted.
function classifyProducts(products: string[], signal: AbortSignal): Promise<(string | Error)[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(products.map((product) => {
        if (product === 'Ceramic Mug Set') {
          return new Error('The model could not classify this product');
        }

        return categories.find(([keyword]) => product.toLowerCase().includes(keyword))?.[1] ?? 'Other';
      }));
    }, 500 + Math.random() * 700);

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

@Component({
  selector: 'example2-async-values',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="classify()">Classify</button>
        <button class="button button--primary" (click)="plugin.retryErrors()">Retry failed</button>
        <button class="button button--primary" (click)="plugin.cancelAll()">Stop</button>
        <span>{{ progress }}</span>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly changeDetector = inject(ChangeDetectorRef);

  progress = '0 of 12 done, 0 failed';

  readonly data = [
    { id: 1, sku: 'SKU-4821', product: 'Stainless Steel Water Bottle', category: null },
    { id: 2, sku: 'SKU-0093', product: 'Wireless Mouse', category: null },
    { id: 3, sku: 'SKU-1170', product: 'Ergonomic Office Chair', category: null },
    { id: 4, sku: 'SKU-2208', product: 'USB-C Charging Cable', category: null },
    { id: 5, sku: 'SKU-3341', product: 'Aluminum Water Filter', category: null },
    { id: 6, sku: 'SKU-4412', product: 'Canvas Tote Bag', category: null },
    { id: 7, sku: 'SKU-5088', product: 'USB-C Hub', category: null },
    { id: 8, sku: 'SKU-6120', product: 'Ceramic Mug Set', category: null },
    { id: 9, sku: 'SKU-7294', product: 'Desk Lamp', category: null },
    { id: 10, sku: 'SKU-8015', product: 'Laptop Stand', category: null },
    { id: 11, sku: 'SKU-9166', product: 'Bluetooth Speaker', category: null },
    { id: 12, sku: 'SKU-1042', product: 'Standing Desk', category: null },
  ];

  // Show how many cells are done and how many failed.
  private readonly updateProgress = () => {
    const hot = this.hotTable.hotInstance!;
    const done = hot.getSourceDataAtCol(2).filter(category => category !== null).length;

    this.progress = `${done} of ${hot.countRows()} done, ${this.plugin.countErrors()} failed`;
    this.changeDetector.markForCheck();
  };

  readonly gridSettings: GridSettings = {
    columns: [
      { data: 'sku', title: 'SKU' },
      { data: 'product', title: 'Product' },
      { data: 'category', title: 'Category', readOnly: true },
    ],
    colWidths: [110, 230, 130],
    rowId: 'id',
    asyncValues: { concurrency: 2 },
    rowHeaders: true,
    height: 'auto',
    afterAsyncValueStart: this.updateProgress,
    afterAsyncValueResolve: this.updateProgress,
    afterAsyncValueReject: this.updateProgress,
    afterAsyncValueCancel: this.updateProgress,
    afterAsyncValuesIdle: this.updateProgress,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  get plugin() {
    return this.hotTable.hotInstance!.getPlugin('asyncValues');
  }

  classify(): void {
    const hot = this.hotTable.hotInstance!;

    this.plugin.setAsyncValuesInBatches('all', 'category', (cells, signal) => (
      classifyProducts(cells.map(cell => hot.getSourceDataAtCell(cell.physicalRow, 'product') as string), signal)
    ), { batchSize: 4, dependsOn: ['product'], source: 'AI.classify', meta: { aiGenerated: true } });
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
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
