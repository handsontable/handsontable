/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-column-adding',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table [data]="hotData" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly hotData = [
    ['Ana García', 'Engineering', 'Senior Engineer', '2021-04-12'],
    ['James Okafor', 'Marketing', 'Product Manager', '2022-08-30'],
    ['Li Wei', 'Engineering', 'Staff Engineer', '2019-02-18'],
    ['Sofia Rossi', 'Sales', 'Account Executive', '2023-01-09'],
    ['Diego Fernández', 'Design', 'UX Designer', '2020-11-23'],
    ['Amara Singh', 'Engineering', 'Engineering Manager', '2018-06-05'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Name', 'Department', 'Title', 'Hire date'],
    rowHeaders: true,
    height: 'auto',
    // show only the column insert and remove items in the context menu
    contextMenu: ['col_left', 'col_right', 'remove_col'],
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
