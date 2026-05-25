/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import {GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { textRenderer } from 'handsontable/renderers/textRenderer';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  hotData = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
  ];

  hotSettings: GridSettings = {};

  ngAfterViewInit() {
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

      textRenderer(
        instance,
        td,
        row,
        col,
        prop,
        value,
        cellProperties
      );
    };

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
      beforeChange: (changes: Handsontable.CellChange[] | null) => {
        const instance = this.hotTable.hotInstance!;
        const columns = instance.countCols();
        const rowColumnSeen: Record<string, boolean> = {};
        const rowsToFill: Record<string, boolean> = {};
        const ch = changes === null ? [] : changes!;

        for (let i = 0; i < ch.length; i++) {
          // if oldVal is empty
          if (ch[i]![2] === null && ch[i]![3] !== null) {
            if (isEmptyRow(instance, ch[i]![0])) {
              // add this row/col combination to the cache so it will not be overwritten by the template
              rowColumnSeen[`${ch[i]![0]}/${ch[i]![1]}`] = true;
              rowsToFill[String(ch[i]![0])] = true;
            }
          }
        }

        for (const r in rowsToFill) {
          if (rowsToFill.hasOwnProperty(r)) {
            for (let c = 0; c < columns; c++) {
              // if it is not provided by user in this change set, take the value from the template
              if (!rowColumnSeen[`${r}/${c}`]) {
                ch.push([Number(r), c, null, templateValues[c]]);
              }
            }
          }
        }
      },
      autoWrapRow: true,
      autoWrapCol: true,
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
