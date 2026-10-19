/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { CellChange } from 'handsontable';

const products: Record<string, string> = {
  'A-100': 'Desk lamp',
  'B-200': 'Office chair',
  'C-300': 'Standing desk',
  'D-400': 'Monitor arm',
};

// A stand-in for a server request: it answers after a delay, and stops when the signal is aborted.
function lookUpProduct(sku: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (products[sku]) {
        resolve(products[sku]);
      } else {
        reject(new Error(`Unknown SKU: ${sku}`));
      }
    }, 600 + Math.random() * 1400);

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

@Component({
  selector: 'example1-async-values',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="lookUpAll()">Look up products</button>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    { sku: 'A-100', product: '' },
    { sku: 'B-200', product: '' },
    { sku: 'X-999', product: '' },
    { sku: 'C-300', product: '' },
    { sku: 'D-400', product: '' },
  ];

  readonly gridSettings: GridSettings = {
    columns: [
      { data: 'sku', title: 'SKU' },
      { data: 'product', title: 'Product', readOnly: true },
    ],
    colWidths: [120, 220],
    rowHeaders: true,
    height: 'auto',
    asyncValues: true,
    // Look the product up again when its SKU changes.
    afterChange: (changes: CellChange[] | null) => {
      changes?.forEach(([row, prop]) => {
        if (prop === 'sku') {
          this.lookUpRows(row, row);
        }
      });
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };

  lookUpAll(): void {
    this.lookUpRows(0, this.hotTable.hotInstance!.countRows() - 1);
  }

  lookUpRows(fromRow: number, toRow: number): void {
    const hot = this.hotTable.hotInstance!;

    hot.getPlugin('asyncValues').setAsyncValues(fromRow, 1, toRow, 1, ({ physicalRow, signal }) => (
      lookUpProduct(hot.getSourceDataAtCell(physicalRow, 'sku') as string, signal)
    ), { dependsOn: ['sku'] });
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
