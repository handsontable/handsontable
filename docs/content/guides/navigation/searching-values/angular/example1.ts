/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-searching-values',
  standalone: true,
  imports: [HotTableModule],
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
export class AppComponent {
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
