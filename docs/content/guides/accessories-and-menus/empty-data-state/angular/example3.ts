/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      #hotTable
      [settings]="hotSettings!"
      [data]="hotData"
    >
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {
  @ViewChild('hotTable') hotTable!: HotTableComponent;

  readonly hotData = [];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['First Name', 'Last Name', 'Email'],
    rowHeaders: true,
    navigableHeaders: true,
    dropdownMenu: true,
    filters: true,
    contextMenu: true,
    emptyDataState: {
      message: (source) => {
        switch (source) {
          case 'filters':
            return {
              title: 'No results found',
              description: 'Your current filters are hiding all results. Try adjusting your search criteria.',
              buttons: [
                {
                  text: 'Clear Filters',
                  type: 'secondary',
                  callback: () => {
                    const filtersPlugin = this.hotTable.hotInstance.getPlugin('filters');

                    if (filtersPlugin) {
                      filtersPlugin.clearConditions();
                      filtersPlugin.filter();
                    }
                  }
                }
              ]
            };
          default:
            return {
              title: 'No data available',
              description: 'There\'s nothing to display yet. Add some data to get started.',
              buttons: [
                {
                  text: 'Add Sample Data',
                  type: 'primary',
                  callback: () => {
                    this.hotTable.hotInstance.loadData([
                      ['John', 'Doe', 'john@example.com'],
                      ['Jane', 'Smith', 'jane@example.com'],
                      ['Bob', 'Johnson', 'bob@example.com'],
                      ['Alice', 'Johnson', 'alice@example.com'],
                    ]);
                  }
                }
              ]
            };
        }
      }
    },
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
