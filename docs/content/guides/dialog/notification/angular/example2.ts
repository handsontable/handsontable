/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableModule, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'notification-example-2',
  template: `
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <button type="button" (click)="onSave()">Save</button>
      <button type="button" (click)="onSyncError()">Sync error</button>
      <button type="button" (click)="onLowStock()">Low stock</button>
    </div>
    <hot-table #hotTable [data]="hotData" [settings]="hotSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild('hotTable', { static: false }) hotTable!: HotTableComponent;

  readonly hotData = [
    ['SKU-001', 'Alkaline AA 4pk', 240, 40, 'A-12'],
    ['SKU-002', 'USB-C cable 1m', 18, 24, 'B-03'],
    ['SKU-003', 'Notebook A5 ruled', 0, 30, 'C-01'],
    ['SKU-004', 'Wireless mouse', 6, 15, 'B-07'],
    ['SKU-005', 'HDMI cable 2m', 2, 10, 'A-04'],
    ['SKU-006', 'Desk lamp LED', 45, 12, 'D-02'],
    ['SKU-007', 'Laptop stand aluminum', 0, 8, 'C-14'],
    ['SKU-008', 'Mechanical keycap set', 112, 20, 'B-01'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Qty on hand', 'Reorder at', 'Bin'],
    columns: [
      { data: 0, type: 'text', width: 90 },
      { data: 1, type: 'text', width: 200 },
      { data: 2, type: 'numeric', width: 100 },
      { data: 3, type: 'numeric', width: 95 },
      { data: 4, type: 'text', width: 70 },
    ],
    rowHeaders: true,
    width: '100%',
    height: 280,
    notification: true,
  };

  onSave(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    hot.getPlugin('notification').showMessage({
      title: 'Saved',
      message: 'Inventory updates were written.',
      variant: 'success',
      position: 'top-end',
      duration: 2500,
    });
  }

  onSyncError(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    const plugin = hot.getPlugin('notification');

    plugin.showMessage({
      title: 'Sync failed',
      message: 'The service is unavailable. Retry when your connection is stable.',
      variant: 'error',
      position: 'bottom-end',
      duration: 0,
      actions: [
        {
          label: 'Retry',
          type: 'primary',
          callback: () => {
            plugin.hideAll();
            plugin.showMessage({
              message: 'Sync completed.',
              variant: 'success',
              position: 'bottom-end',
            });
          },
        },
        { label: 'Dismiss', type: 'secondary', callback: () => plugin.hideAll() },
      ],
    });
  }

  onLowStock(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    hot.getPlugin('notification').showMessage({
      title: 'Review quantities',
      message:
        'SKUs below reorder: USB-C cable 1m, Wireless mouse, HDMI cable 2m. Out of stock: Notebook A5 ruled, Laptop stand.',
      variant: 'warning',
      position: 'top-start',
      duration: 6000,
    });
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
