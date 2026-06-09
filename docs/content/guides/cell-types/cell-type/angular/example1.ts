/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { BaseRenderer } from 'handsontable/renderers';

const yellowRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);
  td.style.backgroundColor = 'yellow';
};

const greenRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);

  td.style.backgroundColor = 'green';
};

const colors: string[] = [
  'yellow',
  'red',
  'orange',
  'green',
  'blue',
  'gray',
  'black',
  'white',
];

@Component({
  selector: 'example1-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    {
      id: 1,
      name: 'Ted',
      isActive: true,
      color: 'orange',
      date: '2015-01-01',
    },
    { id: 2, name: 'John', isActive: false, color: 'black', date: null },
    { id: 3, name: 'Al', isActive: true, color: 'red', date: null },
    { id: 4, name: 'Ben', isActive: false, color: 'blue', date: null },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'id', type: 'text' },
      // 'text' is default, you don't actually need to declare it
      { data: 'name', renderer: yellowRenderer },
      // use default 'text' cell type but overwrite its renderer with yellowRenderer
      { data: 'isActive', type: 'checkbox' },
      { data: 'date', type: 'intl-date', locale: 'en-US', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
      { data: 'color', type: 'autocomplete', source: colors },
    ],
    cell: [{ row: 1, col: 0, renderer: greenRenderer }],
    cells: (row: number, col: number) => {
      if (row === 0 && col === 0) {
        return { renderer: greenRenderer };
      }

      return {};
    },
    height: 'auto'
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
