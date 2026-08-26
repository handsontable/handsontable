/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

interface TaskRow {
  task: string;
  owner: string;
  status: string;
  __children?: TaskRow[];
}

@Component({
  selector: 'app-example2',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="collapseAll()">collapseAll()</button>
        <button class="button button--primary" (click)="expandAll()">expandAll()</button>
        <button class="button button--primary" (click)="toggleFirst()">toggleParent(0)</button>
        <button class="button button--primary" (click)="readState()">Read the state</button>
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

  output = 'Click a button to call a method.';

  readonly projectPlan: TaskRow[] = [
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

  readonly gridSettings: GridSettings = {
    columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
    colHeaders: ['Task', 'Owner', 'Status'],
    rowHeaders: true,
    nestedRows: true,
    contextMenu: true,
    height: 'auto',
  };

  collapseAll(): void {
    const hot = this.hotTable.hotInstance!;

    hot.getPlugin('nestedRows').collapseAll();
    this.output = `collapseAll() -> ${hot.countRows()} rows are visible now`;
  }

  expandAll(): void {
    const hot = this.hotTable.hotInstance!;

    hot.getPlugin('nestedRows').expandAll();
    this.output = `expandAll() -> ${hot.countRows()} rows are visible now`;
  }

  // `toggleParent` takes a visual row index and returns `true` when the state changed.
  toggleFirst(): void {
    const plugin = this.hotTable.hotInstance!.getPlugin('nestedRows');
    const changed = plugin.toggleParent(0);

    this.output = `toggleParent(0) -> ${changed}, collapsed: ${plugin.isParentCollapsed(0)}`;
  }

  // `getCollapsedParents` returns physical row indexes, because a parent collapsed inside another
  // collapsed parent has no visual index at all.
  readState(): void {
    const plugin = this.hotTable.hotInstance!.getPlugin('nestedRows');

    this.output =
      `getCollapsedParents() -> [${plugin.getCollapsedParents()}]\n` +
      `getRowLevel(0) -> ${plugin.getRowLevel(0)}\n` +
      `countChildren(0) -> ${plugin.countChildren(0)}`;
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
