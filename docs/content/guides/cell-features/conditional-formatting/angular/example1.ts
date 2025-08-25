/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { registerRenderer } from 'handsontable/renderers';

const firstRowRenderer = (
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: any,
  value: any,
  cellProperties: any
) => {
  Handsontable.renderers.TextRenderer(
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
  prop: any,
  value: any,
  cellProperties: any
) => {
  Handsontable.renderers.TextRenderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );

  // if the row contains a negative number
  if (parseInt(value, 10) < 0) {
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
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1ConditionalFormattingComponent {

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
    afterSelection: function (this: Handsontable, _row, _col, row2, col2) {
      const meta = this.getCellMeta(row2, col2);

      if (meta.readOnly) {
        this.updateSettings({
          fillHandle: false,
        });
      } else {
        this.updateSettings({
          fillHandle: true,
        });
      }
    },
    cells: function (row, col) {
      const cellProperties: Handsontable.CellMeta = {};
      const data = this.instance.getData();

      if (row === 0 || (data[row] && data[row][col] === 'readOnly')) {
        cellProperties.readOnly = true; // make cell read-only if it is first row or the text reads 'readOnly'
      }

      if (row === 0) {
        cellProperties.renderer = firstRowRenderer;
      } else {
        cellProperties.renderer = 'negativeValueRenderer';
      }

      return cellProperties;
    }
  };
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1ConditionalFormattingComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example1ConditionalFormattingComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1ConditionalFormattingComponent ]
})

export class AppModule { }
/* end-file */
