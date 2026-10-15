/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example5',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    { task: 'Update API docs', assignee: 'Ana García', done: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', done: false },
    { task: 'Review pull request', assignee: 'Li Wei', done: true },
    { task: 'Plan sprint', assignee: 'Ana García', done: false },
    { task: 'Fix login bug', assignee: 'James Okafor', done: false },
    { task: 'Write release notes', assignee: 'Li Wei', done: false },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      { data: 'task', title: 'Task' },
      { data: 'assignee', title: 'Assignee' },
      {
        data: 'done',
        title: 'Done',
        type: 'checkbox',
        // add a "check all" checkbox to the column header
        headerCheckbox: true,
      },
    ],
    colHeaders: true,
    rowHeaders: true,
    // reach the header checkboxes with the arrow keys, toggle them with Space
    navigableHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
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
