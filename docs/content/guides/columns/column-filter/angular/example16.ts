/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

// the order you want in the "Filter by value" list, most severe first
const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];

// turns an ordered list into a comparator; values the list does not know go last
const orderBy = (order: string[]) => (a: unknown, b: unknown): number => {
  const rank = (value: unknown) =>
    order.indexOf(value as string) === -1 ? order.length : order.indexOf(value as string);

  return rank(a) - rank(b);
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example16',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {
  readonly hotData = [
    { task: 'Fix login timeout', priority: 'High', size: 'M' },
    { task: 'Update privacy page', priority: 'Low', size: 'XS' },
    { task: 'Database failover', priority: 'Critical', size: 'XL' },
    { task: 'Refresh icons', priority: 'Medium', size: 'S' },
    { task: 'Rotate API keys', priority: 'High', size: 'L' },
    { task: 'Archive old reports', priority: '', size: 'S' },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      { title: 'Task', data: 'task', type: 'text' },
      {
        title: 'Priority',
        data: 'priority',
        type: 'text',
        // order this column's filter list by severity rather than alphabetically
        filterValueComparator: orderBy(priorityOrder),
      },
      {
        title: 'Size',
        data: 'size',
        type: 'text',
        filterValueComparator: orderBy(sizeOrder),
      },
    ],
    filters: true,
    dropdownMenu: true,
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
