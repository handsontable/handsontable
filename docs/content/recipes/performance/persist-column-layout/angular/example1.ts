/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { RowObject } from "handsontable";

const STORAGE_KEY = 'ht-column-layout-v1';

/* start:skip-in-preview */
const data: RowObject[] = [
  { sku: 'SKU-001', name: 'Wireless Keyboard', category: 'Electronics', price: 49.99, stock: 142, status: 'Active' },
  { sku: 'SKU-002', name: 'USB-C Hub', category: 'Electronics', price: 34.99, stock: 87, status: 'Active' },
  { sku: 'SKU-003', name: 'Ergonomic Chair', category: 'Furniture', price: 399.00, stock: 23, status: 'Active' },
  { sku: 'SKU-004', name: 'Monitor Stand', category: 'Furniture', price: 79.99, stock: 55, status: 'Active' },
  { sku: 'SKU-005', name: 'Noise-Cancelling Headphones', category: 'Electronics', price: 199.99, stock: 0, status: 'Out of Stock' },
  { sku: 'SKU-006', name: 'Mechanical Keyboard', category: 'Electronics', price: 129.99, stock: 34, status: 'Active' },
  { sku: 'SKU-007', name: 'Standing Desk', category: 'Furniture', price: 549.00, stock: 12, status: 'Active' },
  { sku: 'SKU-008', name: 'Webcam HD', category: 'Electronics', price: 89.99, stock: 61, status: 'Active' },
  { sku: 'SKU-009', name: 'Cable Organizer', category: 'Accessories', price: 14.99, stock: 203, status: 'Active' },
  { sku: 'SKU-010', name: 'Laptop Stand', category: 'Accessories', price: 29.99, stock: 0, status: 'Discontinued' },
  { sku: 'SKU-011', name: 'Blue Light Glasses', category: 'Accessories', price: 24.99, stock: 98, status: 'Active' },
  { sku: 'SKU-012', name: 'Desk Lamp', category: 'Furniture', price: 44.99, stock: 77, status: 'Active' },
];
/* end:skip-in-preview */

const DEFAULT_COL_WIDTHS: number[] = [90, 200, 120, 90, 70, 110];
const DEFAULT_COL_ORDER: number[] = [0, 1, 2, 3, 4, 5];

type SavedLayout = { widths: number[]; order: number[] };

function loadLayout(): SavedLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as SavedLayout).widths) ||
      !Array.isArray((parsed as SavedLayout).order)
    ) {
      return null;
    }

    return parsed as SavedLayout;
  } catch {
    return null;
  }
}

function saveLayout(widths: number[], order: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widths, order }));
}

const saved = loadLayout();
const initialWidths = saved ? saved.widths : DEFAULT_COL_WIDTHS;
const initialOrder = saved ? saved.order : null;

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-persist-column-layout',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" (click)="resetLayout()">Reset layout</button>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;

  gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Name', 'Category', 'Price ($)', 'Stock', 'Status'],
    columns: [
      { data: 'sku', type: 'text' },
      { data: 'name', type: 'text' },
      { data: 'category', type: 'text' },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
      { data: 'stock', type: 'numeric' },
      { data: 'status', type: 'text' },
    ],
    colWidths: initialWidths,
    manualColumnResize: true,
    manualColumnMove: initialOrder ?? true,
    rowHeaders: true,
    height: 320,
    width: '100%',
    autoWrapRow: true,
    afterColumnResize: () => {
      const hot = this.hotTable?.hotInstance;

      if (!hot) return;
      const widths = (hot.getColHeader() as string[]).map(
        (_, visualIndex) => hot.getColWidth(visualIndex) as number
      );

      saveLayout(widths, this.getCurrentOrder());
    },
    afterColumnMove: (
      _movedColumns: number[],
      _finalIndex: number,
      _dropIndex: number | undefined,
      _movePossible: boolean,
      movePerformed: boolean
    ) => {
      if (!movePerformed) return;
      saveLayout(this.getCurrentWidths(), this.getCurrentOrder());
    },
  };

  resetLayout(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) return;
    localStorage.removeItem(STORAGE_KEY);
    hot.columnIndexMapper.setIndexesSequence(DEFAULT_COL_ORDER);
    const resizePlugin = hot.getPlugin('manualColumnResize');

    DEFAULT_COL_WIDTHS.forEach((width, visualIndex) => {
      resizePlugin.setManualSize(visualIndex, width);
    });
    hot.render();
  }

  private getCurrentOrder(): number[] {
    const hot = this.hotTable?.hotInstance;

    if (!hot) return DEFAULT_COL_ORDER;
    const count = hot.countCols();
    const order: number[] = [];

    for (let i = 0; i < count; i++) {
      order.push(hot.toPhysicalColumn(i) as number);
    }

    return order;
  }

  private getCurrentWidths(): number[] {
    const hot = this.hotTable?.hotInstance;

    if (!hot) return DEFAULT_COL_WIDTHS;
    const count = hot.countCols();
    const widths: number[] = [];

    for (let i = 0; i < count; i++) {
      widths.push(hot.getColWidth(i) as number);
    }

    return widths;
  }
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
