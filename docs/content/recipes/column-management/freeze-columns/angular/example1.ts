/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
type CampaignRow = {
  campaign: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  revenue: number;
  roi: number;
};

const data: CampaignRow[] = [
  { campaign: 'Spring Sale', channel: 'Email', impressions: 120000, clicks: 4800, conversions: 320, cpc: 0.42, revenue: 9600, roi: 2.28 },
  { campaign: 'Summer Push', channel: 'Paid Search', impressions: 85000, clicks: 3100, conversions: 210, cpc: 1.15, revenue: 6300, roi: 1.82 },
  { campaign: 'Back to School', channel: 'Social', impressions: 200000, clicks: 7200, conversions: 540, cpc: 0.31, revenue: 16200, roi: 3.10 },
  { campaign: 'Black Friday', channel: 'Display', impressions: 450000, clicks: 9000, conversions: 720, cpc: 0.65, revenue: 28800, roi: 2.94 },
  { campaign: 'Holiday Deals', channel: 'Email', impressions: 310000, clicks: 11200, conversions: 890, cpc: 0.28, revenue: 35600, roi: 4.12 },
  { campaign: 'New Year Offer', channel: 'Paid Search', impressions: 95000, clicks: 3800, conversions: 290, cpc: 1.22, revenue: 8700, roi: 1.65 },
  { campaign: 'Valentine Push', channel: 'Social', impressions: 140000, clicks: 5600, conversions: 410, cpc: 0.38, revenue: 12300, roi: 2.56 },
  { campaign: 'Spring Relaunch', channel: 'Display', impressions: 175000, clicks: 6300, conversions: 480, cpc: 0.55, revenue: 14400, roi: 2.18 },
];
/* end:skip-in-preview */

const colHeaders = ['Campaign', 'Channel', 'Impressions', 'Clicks', 'Conversions', 'CPC ($)', 'Revenue ($)', 'ROI'];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-freeze-columns',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        @for (header of colHeaders; track header; let i = $index) {
          <button type="button" (click)="freezeUpTo(i + 1)">
            Freeze up to "{{ header }}"
          </button>
        }
      </div>
      <div class="controls">
        <button type="button" (click)="unfreezeAll()">Unfreeze all</button>
        <span class="freeze-status">{{ statusText }}</span>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;
  readonly colHeaders = colHeaders;

  frozenCount = 0;

  get statusText(): string {
    return this.frozenCount === 0
      ? 'No columns frozen'
      : `${this.frozenCount} column${this.frozenCount > 1 ? 's' : ''} frozen`;
  }

  readonly gridSettings: GridSettings = {
    colHeaders,
    columns: [
      { data: 'campaign', type: 'text' },
      { data: 'channel', type: 'text' },
      { data: 'impressions', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
      { data: 'clicks', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
      { data: 'conversions', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
      { data: 'cpc', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
      { data: 'revenue', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } },
      { data: 'roi', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    ],
    fixedColumnsStart: 0,
    manualColumnMove: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
  };

  freezeUpTo(n: number): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) return;
    const total = hot.countCols();

    this.frozenCount = Math.min(n, total);
    hot.updateSettings({ fixedColumnsStart: this.frozenCount });
  }

  unfreezeAll(): void {
    this.frozenCount = 0;
    this.hotTable?.hotInstance?.updateSettings({ fixedColumnsStart: 0 });
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
