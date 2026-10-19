/* file: app.component.ts */
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example2-numeric-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table #hotTable [data]="data" [settings]="gridSettings"></hot-table>
      <p id="example2-readout" aria-live="polite">{{ readout }}</p>
    </div>
  `,
})
export class AppComponent {
  @ViewChild('hotTable') hotTable!: HotTableComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  readout = 'Edit a cell in the Default or preserveNumericLiteral column to see the stored value.';

  readonly data = [
    ['Stainless Steel Water Bottle', 24.5, 24.5],
    ['Wireless Mouse', 18, 18],
    ['USB-C Charging Cable', 9.9, 9.9],
    ['Desk Lamp', 32, 32],
    ['Notebook A5', 4.75, 4.75],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Default', 'preserveNumericLiteral: true'],
    columns: [
      { type: 'text', readOnly: true, width: 240 },
      { type: 'numeric' },
      { type: 'numeric', preserveNumericLiteral: true },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    afterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
      if (source === 'loadData' || !changes) {
        return;
      }

      const [row, prop] = changes[changes.length - 1];
      const column = prop as number;
      const value = this.hotTable.hotInstance!.getDataAtCell(row, column);
      const label = column === 1 ? 'Default' : 'preserveNumericLiteral';

      this.readout = `${label} stores: ${JSON.stringify(value)} (${typeof value})`;
      this.cdr.detectChanges();
    },
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
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
