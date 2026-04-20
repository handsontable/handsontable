/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';
import Handsontable from 'handsontable/base';

type RowData = {
  id: number;
  product: string;
  stock: number;
  price: number;
  status: 'active' | 'draft' | 'paused';
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'No pending changes',
  saving: 'Saving...',
  saved: 'Saved \u2713',
  error: 'Error',
};

const STATUS_COLORS: Record<SaveStatus, string> = {
  idle: '#616161',
  saving: '#1a42e8',
  saved: '#117a1f',
  error: '#c62828',
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-auto-save-backend',
  template: `
    <div
      class="auto-save-status"
      [style.color]="statusColor"
    >{{ statusLabel }}</div>
    <hot-table [data]="hotData" [settings]="hotSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  saveStatus: SaveStatus = 'idle';

  get statusLabel(): string {
    return STATUS_LABELS[this.saveStatus];
  }

  get statusColor(): string {
    return STATUS_COLORS[this.saveStatus];
  }

  readonly hotData: RowData[] = [
    { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
    { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
    { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
    { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
    { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
  ];

  private dirtyRows = new Set<number>();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private saveRequestCounter = 0;

  private async saveRowsToBackend(rows: RowData[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    // Replace with fetch('/api/products', { method: 'PATCH', body: ... }) in production.
    // eslint-disable-next-line no-console
    console.log('PATCH /api/products', rows);
  }

  readonly hotSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['ID', 'Product', 'Stock', 'Price', 'Status'],
    columns: [
      { data: 'id', type: 'numeric', readOnly: true, width: 70 },
      { data: 'product', type: 'text', width: 180 },
      { data: 'stock', type: 'numeric', width: 90 },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 110 },
      { data: 'status', type: 'text', width: 120 },
    ],
    stretchH: 'all',
    height: 'auto',
    afterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
      if (!changes || source === 'loadData') {
        return;
      }

      const hot = this.hotTable?.hotInstance;

      if (!hot) {
        return;
      }

      changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
        if (oldValue !== newValue) {
          const physicalRow = hot.toPhysicalRow(visualRow as number);

          if (physicalRow !== null && physicalRow >= 0) {
            this.dirtyRows.add(physicalRow);
          }
        }
      });

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      this.saveTimeout = setTimeout(async () => {
        const physicalRows = Array.from(this.dirtyRows);

        if (physicalRows.length === 0) {
          return;
        }

        const requestId = ++this.saveRequestCounter;
        const rowsToSave = physicalRows
          .map((physicalRow) => hot.getSourceDataAtRow(physicalRow))
          .filter((row): row is RowData => row !== undefined && row !== null);

        this.dirtyRows.clear();
        this.saveStatus = 'saving';

        try {
          await this.saveRowsToBackend(rowsToSave);

          if (requestId === this.saveRequestCounter) {
            this.saveStatus = 'saved';
          }
        } catch (_error) {
          physicalRows.forEach((physicalRow) => this.dirtyRows.add(physicalRow));

          if (requestId === this.saveRequestCounter) {
            this.saveStatus = 'error';
          }
        }
      }, 800);
    },
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
