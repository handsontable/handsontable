/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example7-cell-renderer',
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data = [
    { asset: 'Bitcoin', btcValue: 12.45, portfolioShare: 452 },
    { asset: 'Ethereum', btcValue: 3.82, portfolioShare: 268 },
    { asset: 'Solana', btcValue: 1.15, portfolioShare: 134 },
    { asset: 'Cardano', btcValue: 0.47, portfolioShare: 81 },
    { asset: 'Polkadot', btcValue: 0.29, portfolioShare: 65 },
  ];

  readonly gridSettings: GridSettings = {
    data: this.data,
    colHeaders: ['Asset', 'BTC-equivalent value', 'Portfolio share'],
    columns: [
      { data: 'asset' },
      {
        data: 'btcValue',
        // Bitcoin (₿) isn't an ISO 4217 currency, so `numericFormat` can't format it.
        // `valueFormatter` prepends the symbol instead.
        valueFormatter(value: unknown) {
          return `₿${(value as number).toFixed(4)}`;
        },
      },
      {
        data: 'portfolioShare',
        // Per mille (‰) isn't a unit sanctioned by `Intl.NumberFormat`, so `valueFormatter`
        // appends the symbol manually.
        valueFormatter(value: unknown) {
          return `${value}‰`;
        },
      },
    ],
    height: 'auto',
  };
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
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
