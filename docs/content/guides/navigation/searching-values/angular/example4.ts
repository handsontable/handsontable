/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

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
          aria-label="Search"
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
    search: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  resultCount = 0;

  searchFieldKeyup(event: KeyboardEvent): void {
    const search = this.hotTable?.hotInstance?.getPlugin('search');

    if (!search) {
      return;
    }

    // the default callback marks the matching cells, so they stay highlighted
    const defaultCallback = search.getCallback();
    let count = 0;

    // pass your custom callback function: it calls the default callback and counts the matches
    const queryResult = search.query((event.target as HTMLInputElement).value, (instance, row, col, value, result) => {
      defaultCallback(instance, row, col, value, result);

      if (result) {
        count += 1;
      }
    });

    console.log(queryResult);
    this.setResultCounter(count);

    this.hotTable?.hotInstance?.render();
  }

  private setResultCounter(count: number): void {
    this.resultCount = count;
  }
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
