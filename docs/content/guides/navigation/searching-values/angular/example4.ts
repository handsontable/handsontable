/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example4-searching-values',
  standalone: false,
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
export class Example4SearchingValuesComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: Array<Array<string | number>> = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    search: {
      // add your custom callback function
      callback: (
        _instance: Handsontable,
        _row: number,
        _col: number,
        _value: any,
        result: any
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
    _value: any,
    result: any
  ): void {
    _instance.getCellMeta(_row, _col).isSearchResult = result;
    if (result) {
      this.setResultCounter(this.resultCount + 1);
    }
  }

  private setResultCounter(count: number): void {
    this.resultCount = count;
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
import { Example4SearchingValuesComponent } from './app.component';
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
  declarations: [ Example4SearchingValuesComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4SearchingValuesComponent ]
})

export class AppModule { }
/* end-file */
