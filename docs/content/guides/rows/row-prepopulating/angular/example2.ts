/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { textRenderer } from 'handsontable/renderers/textRenderer';

const templateValues = ['one', 'two', 'three'];

function isEmptyRow(instance: Handsontable, row: number) {
  const rowData = instance.getDataAtRow(row);

  for (let i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

const defaultValueRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue,
  cellProperties: Handsontable.CellProperties
) => {
  if (value === null && isEmptyRow(instance, row)) {
    value = templateValues[col];
    td.style.color = '#999';
  } else {
    td.style.color = '';
  }

  textRenderer(instance, td, row, col, prop, value, cellProperties);
};

@Component({
  selector: 'app-example2',
  template: `
    <hot-table [settings]="gridSettings" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
  ];

  readonly gridSettings: GridSettings = {
    minSpareRows: 1,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    cells() {
      return { renderer: defaultValueRenderer };
    },
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
