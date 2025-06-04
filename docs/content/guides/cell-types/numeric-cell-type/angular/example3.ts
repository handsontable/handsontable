/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import numbro from 'numbro';
// @ts-ignore: Missing TypeScript declaration file for "numbro" languages files
import jaJP from 'numbro/languages/ja-JP';
// @ts-ignore: Missing TypeScript declaration file for "numbro" languages files
import trTR from 'numbro/languages/tr-TR';

// register the languages you need
numbro.registerLanguage(jaJP);
numbro.registerLanguage(trTR);

// define formats
const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP',
};

const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR',
};

@Component({
  selector: 'example3-numeric-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example3NumericCellTypeComponent {

  readonly data = [
    {
      productName: 'Product A',
      JP_price: 1450.32,
      TR_price: 202.14,
    },
    {
      productName: 'Product B',
      JP_price: 2430.22,
      TR_price: 338.86,
    },
    {
      productName: 'Product C',
      JP_price: 3120.1,
      TR_price: 435.2,
    },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: false,
    autoColumnSize: false,
    columnSorting: true,
    colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'productName', type: 'text', width: '150' },
      {
        data: 'JP_price',
        type: 'numeric',
        numericFormat: formatJP,
        width: '150',
      },
      {
        data: 'TR_price',
        type: 'numeric',
        numericFormat: formatTR,
        width: '150',
      },
    ]
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
import { Example3NumericCellTypeComponent } from './app.component';
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
  declarations: [ Example3NumericCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3NumericCellTypeComponent ]
})

export class AppModule { }
/* end-file */
