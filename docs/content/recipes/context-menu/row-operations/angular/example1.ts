/* file: app.component.ts */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
const INITIAL_DATA: string[][] = [
  ['Migrate auth service to OAuth 2.0', 'Alice Johnson', 'High', 'In Progress'],
  ['Write API documentation', 'Bob Smith', 'Normal', 'To Do'],
  ['Fix pagination bug on dashboard', 'Carol White', 'High', 'In Review'],
  ['Add CSV export feature', 'David Lee', 'Normal', 'To Do'],
  ['Upgrade React to v19', 'Eve Martinez', 'Low', 'Backlog'],
  ['Implement dark mode toggle', 'Frank Brown', 'Normal', 'In Progress'],
  ['Set up end-to-end test suite', 'Grace Kim', 'High', 'To Do'],
  ['Refactor database connection pool', 'Henry Wilson', 'Low', 'Backlog'],
];
/* end:skip-in-preview */

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-row-operations',
  template: `
    <div class="example-controls-container" #toolbar>
      <div class="controls">
        <button type="button" (click)="addRow()">Add Row</button>
        <button type="button" (click)="deleteRow()" [disabled]="selectedRow === null">Delete Row</button>
        <button type="button" (click)="moveUp()" [disabled]="selectedRow === null || selectedRow === 0">Move Up</button>
        <button type="button" (click)="moveDown()" [disabled]="selectedRow === null || isLastRow">Move Down</button>
      </div>
    </div>
    <hot-table [data]="hotData" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;
  @ViewChild('toolbar', { static: true }) readonly toolbarRef!: ElementRef<HTMLElement>;

  readonly hotData: string[][] = [...INITIAL_DATA];

  selectedRow: number | null = null;

  get isLastRow(): boolean {
    const hot = this.hotTable?.hotInstance;

    return hot ? this.selectedRow === hot.countRows() - 1 : false;
  }

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Assignee', 'Priority', 'Status'],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    manualRowMove: true,
    // Keep the grid selected when clicking toolbar buttons. Without this,
    // Handsontable treats toolbar clicks as outside clicks and deselects,
    // which clears selectedRow before the button's click handler runs.
    outsideClickDeselects: (target: HTMLElement) => {
      return !this.toolbarRef?.nativeElement?.contains(target);
    },
    afterSelectionEnd: (row: number, _col: number, row2: number) => {
      this.selectedRow = row === row2 ? Math.min(row, row2) : null;
    },
    afterDeselect: () => {
      this.selectedRow = null;
    },
  };

  addRow(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    hot.alter('insert_row_below', hot.countRows() - 1);
  }

  deleteRow(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    const selected = hot.getSelected();

    if (!selected) {
      return;
    }

    const rowSet = new Set<number>();

    selected.forEach(([r1, , r2]) => {
      const from = Math.min(r1, r2);
      const to = Math.max(r1, r2);

      for (let r = from; r <= to; r++) {
        rowSet.add(r);
      }
    });

    // Delete from bottom to top so earlier indices stay valid
    const rows = [...rowSet].sort((a, b) => b - a);

    rows.forEach((row) => hot.alter('remove_row', row, 1));
  }

  moveUp(): void {
    const hot = this.hotTable?.hotInstance;

    if (this.selectedRow === null || this.selectedRow === 0 || !hot) {
      return;
    }

    hot.getPlugin('manualRowMove').moveRow(this.selectedRow, this.selectedRow - 1);
    hot.render();
    this.selectedRow -= 1;
    hot.selectRows(this.selectedRow);
  }

  moveDown(): void {
    const hot = this.hotTable?.hotInstance;

    if (this.selectedRow === null || !hot || this.selectedRow === hot.countRows() - 1) {
      return;
    }

    hot.getPlugin('manualRowMove').moveRow(this.selectedRow, this.selectedRow + 2);
    hot.render();
    this.selectedRow += 1;
    hot.selectRows(this.selectedRow);
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
