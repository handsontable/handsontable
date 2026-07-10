/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import type { BaseRenderer } from 'handsontable/renderers';

interface Task {
  task: string;
  assignee: string;
  dueDate: string;
  flagged: boolean;
}

// Icons from the `@handsontable/spreadsheet-icons` package - see the "Icon
// pack" reference page for the full set.
// `currentColor` picks up the button's text color, so the icon stays visible
// in both light and dark themes instead of a hardcoded color disappearing
// against the background.
const FLAG_FULL_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6,4.8H5V20H6V13.21c4.18,2.51,8.37-2.51,12.56,0V4.8C14.38,2.29,10.19,7.31,6,4.8Z"/></svg>';
const FLAG_EMPTY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" opacity="0.6"><path d="M15.87,4.08c-2.41,0-4.83,1.45-7.25,1.45A5,5,0,0,1,6,4.81v0H5V20H6V13.29A5,5,0,0,0,8.62,14c2.42,0,4.84-1.45,7.25-1.45a5,5,0,0,1,2.66.72V4.8A5,5,0,0,0,15.87,4.08Zm1.66,7.68a6.45,6.45,0,0,0-1.66-.21,13.64,13.64,0,0,0-3.91.77A12.11,12.11,0,0,1,8.62,13,4.17,4.17,0,0,1,7,12.67l-1-.43V5.9l1,.41a6,6,0,0,0,1.66.22,13.51,13.51,0,0,0,3.91-.77,12.11,12.11,0,0,1,3.34-.68,4,4,0,0,1,1.66.33Z"/></svg>';

// The icon itself has no accessible name, so the button carries an
// `aria-label` that describes what clicking it does.
const flagRenderer: BaseRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  _col: number,
  _prop: string | number,
  value: Handsontable.CellValue
) => {
  const taskName = String(instance.getDataAtCell(row, 0));
  const button = document.createElement('button');

  button.type = 'button';
  button.style.cssText = 'background: none; border: none; cursor: pointer; padding: 0.25rem;';
  button.innerHTML = value ? FLAG_FULL_ICON : FLAG_EMPTY_ICON;
  button.setAttribute(
    'aria-label',
    value ? `Remove the follow-up flag from ${taskName}` : `Flag ${taskName} for follow-up`
  );
  button.addEventListener('click', () => {
    instance.setDataAtCell(row, 3, !value);
  });

  td.innerText = '';
  td.appendChild(button);

  return td;
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example1',
  template: `
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly data: Task[] = [
    { task: 'Update API docs', assignee: 'Ana García', dueDate: '2025-06-30', flagged: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', dueDate: '2025-06-18', flagged: false },
    { task: 'Review pull request', assignee: 'Li Wei', dueDate: '2025-06-20', flagged: false },
    { task: 'Write release notes', assignee: 'Sara Nowak', dueDate: '2025-06-25', flagged: true },
    { task: 'Fix flaky test', assignee: 'Marco Rossi', dueDate: '2025-06-22', flagged: false },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Assignee', 'Due date', 'Flagged'],
    columns: [
      { data: 'task' },
      { data: 'assignee' },
      { data: 'dueDate', type: 'date', dateFormat: 'YYYY-MM-DD' },
      { data: 'flagged', renderer: flagRenderer, className: 'htCenter' },
    ],
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
