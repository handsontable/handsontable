/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example12-binding-data',
  standalone: false,
  template: ` <div>
    <hot-table [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example12BindingDataComponent {
  private readonly sourceRows: Array<{ id: number; name: string; city: string }> = [
    { id: 1, name: 'Alice', city: 'London' },
    { id: 2, name: 'Bob', city: 'Paris' },
    { id: 3, name: 'Charlie', city: 'Berlin' },
    { id: 4, name: 'Diana', city: 'Warsaw' },
  ];

  readonly gridSettings: GridSettings = {
    dataProvider: async(queryParameters, { signal }) => {
      const { page, pageSize } = queryParameters;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 200);

        signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Request aborted'));
        });
      });

      return {
        rows: this.sourceRows.slice(start, end),
        totalRows: this.sourceRows.length,
      };
    },
    rowId: 'id',
    colHeaders: ['ID', 'Name', 'City'],
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'city' },
    ],
    height: 'auto',
  };
}
/* end-file */

/* file: app.module.ts */
import { ApplicationConfig, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example12BindingDataComponent } from './app.component';
/* end:skip-in-compilation */

// Register Handsontable's modules.
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example12BindingDataComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example12BindingDataComponent],
})
export class AppModule { }
/* end-file */
