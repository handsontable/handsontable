/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

interface TaskRow {
  task: string;
  owner: string;
  status: string;
  __children?: TaskRow[];
}

const projectPlan: TaskRow[] = [
  {
    task: 'Marketing',
    owner: 'Dana',
    status: 'In progress',
    __children: [
      {
        task: 'Website refresh',
        owner: 'Ivy',
        status: 'In progress',
        __children: [
          { task: 'Copywriting', owner: 'Leo', status: 'Done' },
          { task: 'Visual design', owner: 'Mia', status: 'In review' },
        ],
      },
      { task: 'Ad campaign', owner: 'Nico', status: 'Planned' },
    ],
  },
  {
    task: 'Engineering',
    owner: 'Sam',
    status: 'In progress',
    __children: [
      {
        task: 'API v2',
        owner: 'Ravi',
        status: 'In progress',
        __children: [{ task: 'Auth endpoints', owner: 'Tess', status: 'Done' }],
      },
      { task: 'Bug triage', owner: 'Kai', status: 'Planned' },
    ],
  },
];

// Physical row indexes follow the source data, depth first. Walk the tree once to map every task
// name to its physical row - that is the index `expandToRow` needs.
const physicalRowOf = new Map<string, number>();

let physicalRow = 0;

(function walk(rows: TaskRow[]) {
  rows.forEach((row) => {
    physicalRowOf.set(row.task, physicalRow);
    physicalRow += 1;
    walk(row.__children ?? []);
  });
})(projectPlan);

@Component({
  selector: 'app-example3',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="revealTask('Auth endpoints')">
          Find "Auth endpoints"
        </button>
        <button class="button button--primary" (click)="revealTask('Visual design')">
          Find "Visual design"
        </button>
        <button class="button button--primary" (click)="collapseEverything()">
          Collapse everything
        </button>
      </div>
      <output class="console">{{ output }}</output>
    </div>
    <hot-table [settings]="gridSettings" [data]="projectPlan"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  output = 'Everything starts collapsed. Pick a task to jump to.';

  readonly projectPlan = projectPlan;

  readonly gridSettings: GridSettings = {
    columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
    colHeaders: ['Task', 'Owner', 'Status'],
    rowHeaders: true,
    nestedRows: true,
    height: 'auto',
    afterInit(this: Handsontable) {
      this.getPlugin('nestedRows').collapseAll();
    },
  };

  // Reveals a task that is currently hidden inside collapsed parents, then selects it.
  revealTask(taskName: string): void {
    const hot = this.hotTable.hotInstance!;
    const plugin = hot.getPlugin('nestedRows');
    const row = physicalRowOf.get(taskName)!;
    const wasHidden = hot.toVisualRow(row) === null;

    // `expandToRow` takes a PHYSICAL index, because a hidden row has no visual index yet.
    plugin.expandToRow(row);

    const visualRow = hot.toVisualRow(row)!;

    hot.selectCell(visualRow, 0);

    this.output =
      `"${taskName}" was ${wasHidden ? 'hidden' : 'already visible'}.\n` +
      `physical row ${row} -> visual row ${visualRow}, nesting level ${plugin.getRowLevel(visualRow)}`;
  }

  collapseEverything(): void {
    const hot = this.hotTable.hotInstance!;

    hot.getPlugin('nestedRows').collapseAll();
    this.output = `Collapsed again - ${hot.countRows()} rows are visible.`;
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
