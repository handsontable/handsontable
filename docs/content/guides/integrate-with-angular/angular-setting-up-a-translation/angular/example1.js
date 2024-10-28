/* file: app.component.ts */
import { Component } from '@angular/core';
import numbro from 'numbro';
// @ts-ignore: Missing TypeScript declaration file for "numbro" languages files
import jaJP from 'numbro/languages/ja-JP';
// @ts-ignore: Missing TypeScript declaration file for "numbro" languages files
import trTR from 'numbro/languages/tr-TR';

numbro.registerLanguage(jaJP);
numbro.registerLanguage(trTR);

type Product = {
  productName: string,
  JP_price: number,
  TR_price: number
};

@Component({
  selector: 'app-root',
  template: `
    <div>
      <hot-table [data]="dataset" [colHeaders]="true" height="auto" [autoWrapRow]="true" [autoWrapCol]="true" licenseKey="non-commercial-and-evaluation">
        <hot-column
          data="productName"
          [readOnly]="true"
          title="Product Name"
        ></hot-column>
        <hot-column
          data="JP_price"
          title="Price in Japan"
          type="numeric"
          [numericFormat]="formatJP"
        ></hot-column>
        <hot-column
          data="TR_price"
          title="Price in Turkey"
          type="numeric"
          [numericFormat]="formatTR"
        ></hot-column>
      </hot-table>
    </div>
  `
})
export class AppComponent {
  formatTR = {
    pattern: '0,0.00 $',
    culture: 'tr-TR'
  };
  formatJP = {
    pattern: '0,0.00 $',
    culture: 'ja-JP'
  };
  dataset: Product[] = [
    { productName: 'Product A', JP_price: 1.32, TR_price: 100.56 },
    {
      productName: 'Product B',
      JP_price: 2.22,
      TR_price: 453.5
    },
    { productName: 'Product C', JP_price: 3.1, TR_price: 678.1 }
  ];
}
/* end-file */

/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
