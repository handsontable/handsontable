/* file: app.component.ts */
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {GridSettings, HotTableComponent} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'app-example1',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  hotData = [

  ];

  hotSettings: GridSettings = {

  };

  ngAfterViewInit() {
    const templateValues = ['one', 'two', 'three'];
    const data = [
      ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
      ['2017', 10, 11, 12, 13],
      ['2018', 20, 11, 14, 13],
      ['2019', 30, 15, 12, 13],
    ];

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
      instance: any,
      td: any,
      row: any,
      col: any,
      prop: any,
      value: any,
      cellProperties: any
    ) => {
      if (value === null && isEmptyRow(instance, row)) {
        value = templateValues[col];
        td.style.color = '#999';
      } else {
        td.style.color = '';
      }

      Handsontable.renderers.TextRenderer(
        instance,
        td,
        row,
        col,
        prop,
        value,
        cellProperties
      );
    };

    const hot = this.hotTable.hotInstance!;

    this.hotSettings = {
      startRows: 8,
      startCols: 5,
      minSpareRows: 1,
      contextMenu: true,
      height: 'auto',
      licenseKey: 'non-commercial-and-evaluation',
      cells() {
        return { renderer: defaultValueRenderer };
      },
      beforeChange: function (changes) {
        const instance = hot;
        const columns = instance.countCols();
        const rowColumnSeen = {};
        const rowsToFill = {};
        const ch = changes === null ? [] : changes!;

        for (let i = 0; i < changes.length; i++) {
          // if oldVal is empty
          if (ch[i]![2] === null && ch[i]![3] !== null) {
            if (isEmptyRow(instance, ch[i]![0])) {
              // add this row/col combination to the cache so it will not be overwritten by the template
              // @ts-ignore
              rowColumnSeen[`${ch[i]![0]}/${ch[i]![1]}`] = true;
              // @ts-ignore
              rowsToFill[ch[i][0]] = true;
            }
          }
        }

        for (const r in rowsToFill) {
          if (rowsToFill.hasOwnProperty(r)) {
            for (let c = 0; c < columns; c++) {
              // if it is not provided by user in this change set, take the value from the template
              // @ts-ignore
              if (!rowColumnSeen[`${r}/${c}`]) {
                changes.push([Number(r), c, null, templateValues[c]]);
              }
            }
          }
        }
      },
      autoWrapRow: true,
      autoWrapCol: true,
    }

    this.hotTable.hotInstance!.loadData(data);
  }

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
import { AppComponent } from './app.component';
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
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
