/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-searching-values',
  standalone: false,
  template: ` <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field2"
          type="search"
          placeholder="Search"
          (keyup)="searchFieldKeyup($event)"
        />
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  styles: `.my-custom-search-result-class{
      color: #ff0000;
      font-weight: 900;
    }`,
  encapsulation: ViewEncapsulation.None,
})
export class Example2SearchingValuesComponent {
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
      searchResultClass: 'my-custom-search-result-class',
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  searchFieldKeyup(event: KeyboardEvent): void {
    const hot = this.hotTable?.hotInstance;
    // get the `Search` plugin's instance
    const search = hot?.getPlugin('search');
    // use the `Search` plugin's `query()` method
    const queryResult = search?.query((event.target as any).value);

    console.log(queryResult);

    hot?.render();
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
import { Example2SearchingValuesComponent } from './app.component';
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
  declarations: [ Example2SearchingValuesComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2SearchingValuesComponent ]
})

export class AppModule { }
/* end-file */
