/* file: app.component.ts */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { BaseRenderer, baseRenderer } from 'handsontable/renderers';

type OrderRow = {
  id: number;
  customer: string;
  region: string;
  sales: number[];
};

/* start:skip-in-preview */
const CUSTOMERS = ['Acme Corp', 'Vertex Industries', 'Harbor Goods', 'Alpine Supply Co.', 'Northwind Traders', 'Lumen Retail'];
const REGIONS = ['North', 'South', 'East', 'West'];

// Twelve monthly sales figures per customer, generated deterministically so every load looks the same.
function createRows(count: number): OrderRow[] {
  const rows: OrderRow[] = [];

  for (let index = 0; index < count; index += 1) {
    const sales: number[] = [];
    let seed = (index + 1) * 7919;

    for (let month = 0; month < 12; month += 1) {
      seed = (seed * 48271) % 2147483647;
      sales.push(1000 + (seed % 9000));
    }

    rows.push({
      id: 1001 + index,
      customer: CUSTOMERS[index % CUSTOMERS.length],
      region: REGIONS[index % REGIONS.length],
      sales,
    });
  }

  return rows;
}
/* end:skip-in-preview */

const data = createRows(300);
const stats = { rendererCalls: 0, computations: 0 };

// The slow part of the renderer: a text sparkline plus the change from the first to the last month.
// It is a pure function -- the same input always gives the same output -- so its result can be cached.
function buildTrend(sales: number[]): string {
  const glyphs = '▁▂▃▄▅▆▇█';
  const min = Math.min(...sales);
  const max = Math.max(...sales);
  const range = max - min || 1;
  const bars = sales
    .map((value) => glyphs[Math.round(((value - min) / range) * (glyphs.length - 1))])
    .join('');
  const change = Math.round(((sales[sales.length - 1] - sales[0]) / sales[0]) * 100);

  return `${bars} ${change >= 0 ? '+' : ''}${change}%`;
}

// One cache entry per data record, never per `td`: the grid reuses a `td` for a different record
// as you scroll. A WeakMap releases the entry together with the record. Each entry remembers the
// input it was computed from, so a replaced array is computed again.
const trendCache = new WeakMap<OrderRow, { input: number[]; output: string }>();

const trendRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);
  stats.rendererCalls += 1;

  // `row` is a visual index, and `data` is in physical order, so translate before the lookup.
  // Read the record from your own array: `getSourceDataAtRow()` returns a copy of the row on
  // every call, which can never be a WeakMap key. Keep this closure and the grid's data source
  // the same array -- after `updateData()`, point it at the new one.
  const record = data[instance.toPhysicalRow(row)];
  const sales = value;

  // A row without a record (a `minSpareRows` row, or one mid-`alter()`) and an empty cell both
  // reach the renderer. Neither can be cached: `undefined` is not a valid WeakMap key.
  if (!record || !Array.isArray(sales) || sales.length === 0) {
    td.textContent = '—';

    return;
  }

  let entry = trendCache.get(record);

  if (!entry || entry.input !== sales) {
    stats.computations += 1;
    entry = { input: sales, output: buildTrend(sales) };
    trendCache.set(record, entry);
  }

  td.textContent = entry.output;
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-expensive-cell-renderer',
  styles: [`
    .render-stats {
      margin: 8px 0 0;
      font-size: 13px;
      color: #666;
    }
  `],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" (click)="renderAgain()">Render again</button>
        <button type="button" (click)="updateFirstRow()">Update the first row</button>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    <p #statsLine class="render-stats">Renderer calls: 0 | Computations: 0</p>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;
  @ViewChild('statsLine', { static: true }) readonly statsLine!: ElementRef<HTMLParagraphElement>;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders: ['ID', 'Customer', 'Region', 'Trend (12 months)'],
    columns: [
      { data: 'id', type: 'numeric', width: 70, readOnly: true },
      { data: 'customer', type: 'text', width: 170 },
      { data: 'region', type: 'text', width: 90 },
      { data: 'sales', renderer: trendRenderer, width: 190, readOnly: true },
    ],
    rowHeaders: true,
    height: 320,
    width: '100%',
    autoWrapRow: true,
    // Runs once per draw, scroll draws included, after every cell renderer. The grid runs outside
    // Angular's zone, and the first draw happens during `ngAfterViewInit`. Write the counters
    // straight into the element instead of into a bound property: a bound property set from here
    // costs a whole-application change-detection pass on every draw, and on the first draw it
    // raises NG0100 (ExpressionChangedAfterItHasBeenCheckedError).
    afterViewRender: () => {
      this.statsLine.nativeElement.textContent =
        `Renderer calls: ${stats.rendererCalls} | Computations: ${stats.computations}`;
    },
  };

  renderAgain(): void {
    this.hotTable?.hotInstance?.render();
  }

  updateFirstRow(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    // Bring the first row into view, so its renderer runs and the counter shows the single
    // recomputation. A cell outside the rendered band is not painted at all.
    hot.scrollViewportTo({ row: 0 });

    // Replace the array instead of changing it in place: the renderer compares inputs by identity.
    const nextSales = data[0].sales.map((value, month) => Math.round(value * (1 + month / 10)));

    hot.setSourceDataAtCell(0, 'sales', nextSales);
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
