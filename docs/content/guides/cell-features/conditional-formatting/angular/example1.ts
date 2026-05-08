/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

const firstRowRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue,
  cellProperties: Handsontable.CellProperties
) => {
  textRenderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );
  td.style.fontWeight = 'bold';
  td.style.color = 'green';
  td.style.background = '#CEC';
};

const negativeValueRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue,
  cellProperties: Handsontable.CellProperties
) => {
  textRenderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );

  // if the row contains a negative number
  if (parseInt(value as string, 10) < 0) {
    td.style.color = '#FF5A12';
  }

  if (!value || value === '') {
    td.style.background = 'rgb(238, 238, 238, 0.4)';
  } else {
    if (instance.getDataAtCell(0, col) === 'Nissan') {
      td.style.fontStyle = 'italic';
    }

    td.style.background = '';
  }
};

//  maps function to a lookup string
registerRenderer('negativeValueRenderer', negativeValueRenderer);

@Component({
  selector: 'example1-conditional-formatting',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', -5, '', 12, 13],
    ['2018', '', -11, 14, 13],
    ['2019', '', 15, -12, 'readOnly'],
  ];

  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
    afterSelection: function (this: Handsontable, _row: number, _col: number, row2: number, col2: number) {
      const meta = this.getCellMeta(row2, col2);

      if (meta['readOnly']) {
        this.updateSettings({
          fillHandle: false,
        });
      } else {
        this.updateSettings({
          fillHandle: true,
        });
      }
    },
    cells: function (row: number, col: number) {
      const cellProperties: Handsontable.CellMeta = {};
      const data = (this as any).instance.getData();

      if (row === 0 || (data[row] && data[row][col] === 'readOnly')) {
        cellProperties['readOnly'] = true; // make cell read-only if it is first row or the text reads 'readOnly'
      }

      if (row === 0) {
        cellProperties['renderer'] = firstRowRenderer;
      } else {
        cellProperties['renderer'] = 'negativeValueRenderer';
      }

      return cellProperties;
    }
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
