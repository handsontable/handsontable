/* file: app.component.ts */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

// marks a change as coming from another collaborator, so it isn't broadcast again
const REMOTE_SOURCE = 'remotePeer';

@Component({
  selector: 'example1-collaboration',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <p class="controls">{{ statusText }}</p>
    </div>
    <div>
      <hot-table [data]="hotData" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  statusText = 'A remote update to the first row arrives in 3 seconds.';

  private timeoutId?: ReturnType<typeof setTimeout>;

  readonly hotData = [
    ['Update onboarding flow', 'Ana García', 'In progress'],
    ['Fix invoice rounding bug', 'James Okafor', 'Blocked'],
    ['Write Q3 release notes', 'Li Wei', 'In progress'],
    ['Migrate auth service', 'Sofia Rossi', 'Done'],
    ['Design empty states', 'Diego Fernández', 'In progress'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Assignee', 'Status'],
    rowHeaders: true,
    height: 'auto',
    beforeChange: (changes: (Handsontable.CellChange | null)[], source: Handsontable.ChangeSource | string) => {
      if (source === REMOTE_SOURCE || !changes) {
        return;
      }

      changes.forEach((change) => {
        if (!change) {
          return;
        }

        const [row, column, , newValue] = change;

        // send the local edit to your collaboration backend here
        console.log('Broadcasting local edit:', row, column, newValue);
      });
    },
  };

  ngOnInit(): void {
    // simulate an update coming from another collaborator - start editing the Status
    // cell in the first row before the timeout fires to see the update wait for you
    this.timeoutId = setTimeout(() => this.applyRemoteChange(0, 2, 'Done'), 3000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId);
  }

  applyRemoteChange(row: number, column: number, value: string): void {
    const hot = this.hotTable?.hotInstance;
    const editor = hot?.getActiveEditor();
    const editingSameCell = editor?.isOpened() && editor.row === row && editor.col === column;

    if (editingSameCell) {
      // don't overwrite a cell the local user is editing right now -
      // check again shortly, and apply the change once the local edit finishes
      this.timeoutId = setTimeout(() => this.applyRemoteChange(row, column, value), 300);

      return;
    }

    hot?.setDataAtCell(row, column, value, REMOTE_SOURCE);
    this.statusText = 'A collaborator marked "Update onboarding flow" as Done.';
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
