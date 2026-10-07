/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example4-searching-values',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field3"
          type="search"
          placeholder="Search"
          (keyup)="searchFieldKeyup($event)"
        />
      </div>
      <output class="console" id="output"> {{ resultCount }} results </output>
    </div>

    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: Array<Array<string | number>> = [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
    search: {
      // add your custom callback function
      callback: (
        _instance: Handsontable,
        _row: number,
        _col: number,
        _value: Handsontable.CellValue,
        result: boolean
      ) => this.searchResultCounter(_instance, _row, _col, _value, result),
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  resultCount = 0;

  searchFieldKeyup(event: KeyboardEvent): void {
    this.setResultCounter(0);

    const search = this.hotTable?.hotInstance?.getPlugin('search');
    const queryResult = search?.query((event.target as any).value);

    console.log(queryResult);

    this.hotTable?.hotInstance?.render();
  }

  //  define your custom callback function
  searchResultCounter(
    _instance: Handsontable,
    _row: number,
    _col: number,
    _value: Handsontable.CellValue,
    result: boolean
  ): void {
    _instance.getCellMeta(_row, _col)['isSearchResult'] = result;
    if (result) {
      this.setResultCounter(this.resultCount + 1);
    }
  }

  private setResultCounter(count: number): void {
    this.resultCount = count;
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
