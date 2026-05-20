/* file: app.component.ts */
import { Component, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

const COLUMN_LABELS = ['Item', 'Quantity', 'Unit price'];

/** Column index -> returns `null` when valid, otherwise an error message. */
const validationRules: Record<number, (value: unknown) => string | null> = {
  0: (value) => {
    const text = String(value ?? '').trim();
    return text.length > 0 ? null : 'Item name is required';
  },
  1: (value) => {
    if (value === null || value === '') {
      return 'Quantity is required';
    }
    const n = Number(value);
    return !Number.isNaN(n) && n > 0 && Number.isInteger(n)
      ? null
      : 'Quantity must be a positive whole number';
  },
  2: (value) => {
    if (value === null || value === '') {
      return 'Unit price is required';
    }
    const n = Number(value);
    return !Number.isNaN(n) && n > 0 ? null : 'Unit price must be greater than 0';
  },
};

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-row-validation-error-summary',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" (click)="onSubmit()">Submit orders</button>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    <div class="example-controls-container validation-summary" aria-live="polite">
      <p class="validation-summary__title">Validation issues</p>
      <ul class="validation-summary__list">
        @for (issue of issues; track $index) {
          <li>Row {{ issue.row + 1 }}, {{ columnLabels[issue.col] }}: {{ issue.message }}</li>
        }
      </ul>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly columnLabels = COLUMN_LABELS;

  private readonly cdr = inject(ChangeDetectorRef);

  invalidCells = new Set<string>();
  issues: { row: number; col: number; message: string }[] = [];

  readonly data = [
    { item: 'Widget A', qty: 2, price: 19.99 },
    { item: '', qty: 1, price: 5 },
    { item: 'Gadget', qty: -1, price: 12 },
    { item: 'Cable', qty: 3, price: 0 },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: COLUMN_LABELS,
    columns: [
      { data: 'item', type: 'text', width: 180 },
      { data: 'qty', type: 'numeric', width: 100 },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '0.00' }, width: 110 },
    ],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    afterRenderer: (TD: HTMLTableCellElement, row: number, col: number) => {
      TD.style.backgroundColor = this.invalidCells.has(cellKey(row, col))
        ? 'var(--ht-cell-error-background-color, #ffe4e4)'
        : '';
    },
    afterChange: (changes, source) => {
      if (source === 'loadData' || !changes) {
        return;
      }
      let touched = false;
      const hot = this.hotTable?.hotInstance;
      if (!hot) {
        return;
      }
      for (const change of changes) {
        const [row, prop] = change;
        const col = (typeof prop === 'string' ? hot.propToCol(prop) : prop) as number;
        const key = cellKey(row, col);
        if (!this.invalidCells.has(key)) {
          continue;
        }
        hot.removeCellMeta(row, col, 'className');
        hot.removeCellMeta(row, col, 'title');
        this.invalidCells.delete(key);
        this.issues = this.issues.filter((i) => !(i.row === row && i.col === col));
        touched = true;
      }
      if (touched) {
        this.cdr.detectChanges();
        hot.render();
      }
    },
  };

  onSubmit(): void {
    const hot = this.hotTable?.hotInstance;
    if (!hot) {
      return;
    }

    this.invalidCells.forEach((key) => {
      const [r, c] = key.split(':').map(Number);
      hot.removeCellMeta(r, c, 'className');
      hot.removeCellMeta(r, c, 'title');
    });
    this.invalidCells.clear();

    const newIssues: { row: number; col: number; message: string }[] = [];
    for (let row = 0; row < hot.countRows(); row++) {
      for (let col = 0; col < hot.countCols(); col++) {
        const rule = validationRules[col];
        if (!rule) {
          continue;
        }
        const value = hot.getDataAtCell(row, col);
        const message = rule(value);
        if (message !== null) {
          newIssues.push({ row, col, message });
        }
      }
    }

    this.issues = newIssues;

    newIssues.forEach((issue) => {
      hot.setCellMeta(issue.row, issue.col, 'className', 'htInvalid');
      hot.setCellMeta(issue.row, issue.col, 'title', issue.message);
      this.invalidCells.add(cellKey(issue.row, issue.col));
    });

    this.cdr.detectChanges();
    hot.render();
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
