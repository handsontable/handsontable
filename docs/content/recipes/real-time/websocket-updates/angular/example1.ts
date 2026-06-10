/* file: app.component.ts */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

type StockRow = {
  symbol: string;
  company: string;
  price: number;
  change: number;
  volume: number;
  marketCap: string;
};

const STOCK_DATA: StockRow[] = [
  { symbol: 'AAPL', company: 'Apple Inc.', price: 189.25, change: 1.45, volume: 52341200, marketCap: '2.94T' },
  { symbol: 'MSFT', company: 'Microsoft Corp.', price: 415.80, change: -0.72, volume: 18920400, marketCap: '3.08T' },
  { symbol: 'GOOG', company: 'Alphabet Inc.', price: 175.40, change: 2.13, volume: 21780000, marketCap: '2.19T' },
  { symbol: 'AMZN', company: 'Amazon.com Inc.', price: 198.60, change: -1.30, volume: 34560000, marketCap: '2.09T' },
  { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 875.35, change: 14.20, volume: 41230000, marketCap: '2.15T' },
  { symbol: 'META', company: 'Meta Platforms Inc.', price: 512.90, change: 3.55, volume: 15670000, marketCap: '1.30T' },
  { symbol: 'TSLA', company: 'Tesla Inc.', price: 248.75, change: -5.60, volume: 98120000, marketCap: '793B' },
  { symbol: 'BRK', company: 'Berkshire Hathaway', price: 3890.00, change: 12.00, volume: 3450000, marketCap: '876B' },
];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-websocket-updates',
  template: `<hot-table [data]="hotData" [settings]="hotSettings"></hot-table>`,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly hotData: StockRow[] = STOCK_DATA;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly hotSettings: GridSettings = {
    colHeaders: ['Symbol', 'Company', 'Price ($)', 'Change ($)', 'Volume', 'Market Cap'],
    columns: [
      { data: 'symbol', readOnly: true },
      { data: 'company', readOnly: true, width: 180 },
      { data: 'price', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
      { data: 'change', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
      { data: 'volume', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
      { data: 'marketCap', readOnly: true },
    ],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    stretchH: 'all',
    afterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
      if ((source as string) !== 'external' || !changes) {
        return;
      }

      const hot = this.hotTable?.hotInstance;

      if (!hot) {
        return;
      }

      changes.forEach(([row]) => {
        [2, 3].forEach((col) => {
          const td = hot.getCell(row as number, col);

          if (td) {
            td.classList.remove('ht-cell-flash');
            void td.offsetWidth;
            td.classList.add('ht-cell-flash');
            td.addEventListener('animationend', () => td.classList.remove('ht-cell-flash'), { once: true });
          }
        });
      });
    },
  };

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      const hot = this.hotTable?.hotInstance;

      if (!hot) {
        return;
      }

      const row = Math.floor(Math.random() * STOCK_DATA.length);
      const basePrice = STOCK_DATA[row].price;
      const newPrice = parseFloat((basePrice + (Math.random() - 0.5) * 4).toFixed(2));
      const newChange = parseFloat((newPrice - basePrice + STOCK_DATA[row].change).toFixed(2));

      hot.setDataAtRowProp(row, 'price', newPrice, 'external');
      hot.setDataAtRowProp(row, 'change', newChange, 'external');
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
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
