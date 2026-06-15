/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

// Build column headers: 'Cost Center' + 49 monthly labels (Jan 2021 … Jan 2025)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders: string[] = ['Cost Center'];
let year = 2021;
let monthIndex = 0;

while (colHeaders.length < 50) {
  colHeaders.push(`${months[monthIndex]} ${year}`);
  monthIndex += 1;

  if (monthIndex >= months.length) {
    monthIndex = 0;
    year += 1;
  }
}

// Build 50 rows of budget data
const tableData: (string | number)[][] = [];

for (let row = 0; row < 50; row++) {
  const rowData: (string | number)[] = [`CC-${1000 + row}`];

  for (let col = 0; col < 49; col++) {
    rowData.push(2000 + row * 100 + col * 50);
  }

  tableData.push(rowData);
}

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table [settings]="hotSettings" [data]="hotData"></hot-table>
  `,
})
export class AppComponent {
  readonly hotData = tableData;

  readonly hotSettings: GridSettings = {
    colHeaders,
    width: 500,
    height: 220,
    rowHeaders: true,
    dragToScroll: true,
  };
}
/* end-file */


/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';

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
