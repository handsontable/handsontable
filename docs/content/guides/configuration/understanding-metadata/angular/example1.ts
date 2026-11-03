/* file: app.component.ts */
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

@Component({
  selector: 'example1-understanding-metadata',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
      <p>
        <button type="button" (click)="setReviewer()">Give the selected cell its own reviewer</button>
      </p>
      <pre role="status" aria-label="Metadata of the selected cell">{{ output }}</pre>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  output = 'Select a cell to see where its values come from.';

  readonly gridSettings: GridSettings = {
    data: [
      ['Ana García', 'Engineering', 'Senior Engineer'],
      ['James Okafor', 'Marketing', 'Product Manager'],
      ['Li Wei', 'Engineering', 'Staff Engineer'],
      ['Priya Nair', 'Finance', 'Financial Analyst'],
      ['Tom Becker', 'Marketing', 'Brand Designer'],
    ],
    colHeaders: ['Name', 'Department', 'Title'],
    rowHeaders: true,
    width: 'auto',
    height: 'auto',
    outsideClickDeselects: false,
    tabNavigation: false,
    // grid level
    readOnly: false,
    reviewer: 'HR team',
    // column level: the Department column
    columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
    // cell level: one cell in the Department column
    cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
    afterSelection: (row: number, col: number) => this.show(row, col),
  };

  private levelOf(row: number, col: number, key: string): string {
    const hot = this.hotTable.hotInstance!;

    if (has(hot.getCellMeta(row, col), key)) {
      return 'cell';
    }

    return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
  }

  private show(row: number, col: number): void {
    if (!this.hotTable?.hotInstance || row < 0 || col < 0) {
      return;
    }

    const meta = this.hotTable.hotInstance.getCellMeta(row, col);

    this.output = [
      `Cell (${row}, ${col})`,
      `readOnly: ${meta.readOnly} (from the ${this.levelOf(row, col, 'readOnly')} level)`,
      `reviewer: ${meta['reviewer']} (from the ${this.levelOf(row, col, 'reviewer')} level)`,
    ].join('\n');
    this.cdr.markForCheck();
  }

  setReviewer(): void {
    const hot = this.hotTable.hotInstance;
    const selected = hot?.getSelectedLast();

    if (!hot || !selected || selected[0] < 0 || selected[1] < 0) {
      this.output = 'Select a cell first.';

      return;
    }

    hot.setCellMeta(selected[0], selected[1], 'reviewer', 'Audit team');
    this.show(selected[0], selected[1]);
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
