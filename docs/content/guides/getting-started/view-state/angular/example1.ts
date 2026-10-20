/* file: app.component.ts */
import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-view-state',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button id="save" class="button button--primary button--blue" (click)="saveClickCallback()">
          Save view
        </button>
        <button id="restore" class="button button--primary button--blue" (click)="restoreClickCallback()">
          Restore view
        </button>
      </div>
      <output class="console" id="output">{{ output }}</output>
    </div>
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  // The saved view is plain JSON, so you can keep it in a field, `localStorage`, or on a server.
  private savedView: string | null = null;

  output = 'Sort, filter, hide, or resize columns, then click "Save view"';

  readonly gridSettings: GridSettings = {
    data: [
      ['Laptop Pro 14', 'Computers', 1499, 24, 4.7],
      ['Wireless Mouse', 'Accessories', 29, 310, 4.4],
      ['Mechanical Keyboard', 'Accessories', 119, 85, 4.8],
      ['4K Monitor 27"', 'Displays', 449, 41, 4.6],
      ['USB-C Dock', 'Accessories', 189, 67, 4.2],
      ['Tablet Air 11', 'Computers', 599, 52, 4.5],
      ['Webcam HD', 'Accessories', 79, 140, 4.1],
      ['Ultrawide Monitor 34"', 'Displays', 799, 18, 4.9],
    ],
    colHeaders: ['Product', 'Category', 'Price', 'Stock', 'Rating'],
    rowHeaders: true,
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    contextMenu: true,
    hiddenColumns: { indicators: true },
    manualColumnResize: true,
    height: 'auto',
  };

  saveClickCallback(): void {
    const hot = this.hotTable.hotInstance!;

    this.savedView = JSON.stringify(hot.getPlugin('viewState').getViewState());
    this.output = 'View saved';
    this.cdr.markForCheck();
  }

  restoreClickCallback(): void {
    const hot = this.hotTable.hotInstance!;

    if (this.savedView === null) {
      this.output = 'Save a view first';
      this.cdr.markForCheck();

      return;
    }

    const { skipped } = hot.getPlugin('viewState').setViewState(JSON.parse(this.savedView));

    this.output = skipped.length === 0
      ? 'View restored'
      : `View restored, skipped: ${skipped.map(({ part, reason }) => `${part} (${reason})`).join(', ')}`;
    this.cdr.markForCheck();
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
