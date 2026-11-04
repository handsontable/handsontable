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
      <p role="status">{{ status }}</p>
      <pre>{{ output }}</pre>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  output = 'Select a cell to see where its values come from.';

  status = '';

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
    // keep the selection when you click the button below the grid
    outsideClickDeselects: false,
    // let the Tab key move the focus out of the grid, to the button
    tabNavigation: false,
    // grid level
    readOnly: false,
    reviewer: 'HR team',
    // column level: the Department column
    columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
    // cell level: one cell in the Department column
    cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
    afterSelection: () => this.show(),
  };

  private selectedCell(): { row: number; col: number } | null {
    const highlight = this.hotTable?.hotInstance?.getSelectedRangeLast()?.highlight;

    // with `navigableHeaders`, the highlight can sit on a header, which has a negative index
    if (!highlight || highlight.row === null || highlight.col === null || highlight.row < 0 || highlight.col < 0) {
      return null;
    }

    return { row: highlight.row, col: highlight.col };
  }

  private levelOf(row: number, col: number, key: string): string {
    const hot = this.hotTable.hotInstance!;

    if (has(hot.getCellMeta(row, col), key)) {
      return 'cell';
    }

    return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
  }

  private show(): void {
    const hot = this.hotTable?.hotInstance;
    const cell = this.selectedCell();

    if (!hot || !cell) {
      return;
    }

    const { row, col } = cell;
    const meta = hot.getCellMeta(row, col);

    this.output = [
      `Cell (${row}, ${col})`,
      `readOnly: ${meta.readOnly} (from the ${this.levelOf(row, col, 'readOnly')} level)`,
      `reviewer: ${meta['reviewer']} (from the ${this.levelOf(row, col, 'reviewer')} level)`,
    ].join('\n');
    this.cdr.markForCheck();
  }

  setReviewer(): void {
    const hot = this.hotTable.hotInstance;
    const cell = this.selectedCell();

    if (!hot || !cell) {
      this.status = 'Select a cell first.';

      return;
    }

    hot.setCellMeta(cell.row, cell.col, 'reviewer', 'Audit team');
    this.show();
    this.status = `The reviewer of cell (${cell.row}, ${cell.col}) is now Audit team.`;
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
