/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-searching-values',
  standalone: false,
  template: ` <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field"
          type="search"
          placeholder="Search"
          (keyup)="searchFieldKeyup($event)"
        />
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class Example1SearchingValuesComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: Array<Array<string | number>> = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    search: true,
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
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1SearchingValuesComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main-dark-auto',
        license: NON_COMMERCIAL_LICENSE,
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example1SearchingValuesComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1SearchingValuesComponent ]
})

export class AppModule { }
/* end-file */
