/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example7',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    [1, 'Ana Garcia', 'Product Manager', 'Spain', '2022-03-14'],
    [2, 'James Okafor', 'Senior Engineer', 'Nigeria', '2021-07-02'],
    [3, 'Li Wei', 'Data Analyst', 'China', '2023-01-19'],
    [4, 'Sofia Rossi', 'UX Designer', 'Italy', '2020-11-30'],
    [5, 'Mateo Fernandez', 'Engineering Lead', 'Argentina', '2019-05-08'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['Employee ID', 'Employee full name', 'Current job title', 'Country of residence', 'Employment start date'],
    rowHeaders: true,
    colWidths: [100, 130, 130, 130, 130],
    columnHeaderHeight: 50,
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
