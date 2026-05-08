/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      #hotTable
      [settings]="hotSettings"
      [data]="hotData"
    >
    </hot-table>
  `,
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
      message: (source: string) => {
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
                    const filtersPlugin = this.hotTable.hotInstance!.getPlugin('filters');

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
                    this.hotTable.hotInstance!.loadData([
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
