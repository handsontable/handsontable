/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-column-adding',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="insertColumn()">
          Insert column
        </button>
        <button class="button button--primary" (click)="removeColumn()">
          Remove last column
        </button>
      </div>
    </div>
    <div>
      <hot-table [data]="hotData" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

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
    autoWrapRow: true,
    autoWrapCol: true,
  };

  insertColumn(): void {
    const hot = this.hotTable?.hotInstance;

    // insert one column at the end of the grid
    hot?.alter('insert_col_end', hot.countCols() - 1, 1);
  }

  removeColumn(): void {
    const hot = this.hotTable?.hotInstance;

    // remove the last column, but keep at least one column in the grid
    if (hot && hot.countCols() > 1) {
      hot.alter('remove_col', hot.countCols() - 1, 1);
    }
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
