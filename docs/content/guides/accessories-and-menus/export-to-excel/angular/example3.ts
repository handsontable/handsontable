/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';

@Component({
  selector: 'app-example3',
  template: `
    <div class="example-controls-container">
      <p>Right-click any cell to open the context menu.</p>
    </div>
    <hot-table [settings]="hotSettings" [data]="hotData"></hot-table>
  `,
  standalone: false,
})
export class AppComponent {
  readonly hotData = [
    ['Laptop Pro 15"',   'Electronics',  1299.99, 38,  true ],
    ['Wireless Mouse',   'Accessories',    29.99, 214, true ],
    ['USB-C Hub 7-in-1', 'Accessories',    49.99, 87,  true ],
    ['Monitor 27" 4K',   'Electronics',   449.99, 12,  false],
    ['Mech Keyboard',    'Accessories',   119.99, 65,  true ],
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['Electronics', 'Accessories', 'Software'] },
      {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      { type: 'numeric' },
      { type: 'checkbox' },
    ],
    colHeaders: ['Product', 'Category', 'Unit Price', 'Stock', 'Active?'],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    contextMenu: true,
    exportFile: { engines: { xlsx: ExcelJS } },
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

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [AppComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent],
})
export class AppModule {}
/* end-file */
