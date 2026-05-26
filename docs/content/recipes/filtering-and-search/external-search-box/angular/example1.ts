/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable';

const data = [
  ['Alice Johnson', 'Engineering', 'Berlin', 'alice.johnson@example.com'],
  ['Noah Smith', 'Design', 'Warsaw', 'noah.smith@example.com'],
  ['Mia Garcia', 'Marketing', 'New York', 'mia.garcia@example.com'],
  ['Liam Brown', 'Engineering', 'Toronto', 'liam.brown@example.com'],
  ['Emma Davis', 'Sales', 'London', 'emma.davis@example.com'],
  ['Oliver Miller', 'Support', 'Madrid', 'oliver.miller@example.com'],
];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-external-search-box',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label for="external-search-input">Search rows</label>
        <input
          id="external-search-input"
          type="search"
          placeholder="Type to highlight matching cells..."
          style="min-width: 20rem"
          (input)="onSearch($event)"
        />
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Name', 'Team', 'Location', 'Email'],
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    autoWrapCol: true,
    search: true,
  };

  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const hot = this.hotTable.hotInstance;

      if (!hot) {
        return;
      }

      hot.getPlugin('search').query(value);
      hot.render();
    }, 120);
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
