/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example5-selection',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="selectCell()">Select cell B2</button>
        <button (click)="selectRange()">Select range B2:D4</button>
        <button (click)="deselect()">Deselect</button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, 12, '2026-03-14'],
    ['James Okafor',   'Marketing',   'Product Manager',  88000,  8, '2026-07-01'],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000,  5, '2026-01-10'],
    ['Maria Santos',   'HR',          'HR Specialist',    71000,  3, '2026-11-20'],
    ['David Kim',      'Engineering', 'Backend Dev',      85000,  7, '2026-08-05'],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000,  2, '2026-02-14'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  selectCell(): void {
    // Select a single cell: row 1, col 1 (B2)
    this.hotTable?.hotInstance?.selectCell(1, 1);
  }

  selectRange(): void {
    // Select a range: row 1, col 1 to row 3, col 3 (B2:D4)
    this.hotTable?.hotInstance?.selectCell(1, 1, 3, 3);
  }

  deselect(): void {
    this.hotTable?.hotInstance?.deselectCell();
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
