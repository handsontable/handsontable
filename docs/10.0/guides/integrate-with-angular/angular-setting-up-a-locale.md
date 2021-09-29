---
title: Setting up a locale
metaTitle: Setting up a locale - Guide - Handsontable Documentation
permalink: /10.0/angular-setting-up-a-locale
canonicalUrl: /angular-setting-up-a-locale
---

# Setting up a locale

## Overview
The following example shows a Handsontable instance with locales set up in Angular.

## Example
::: example :angular-numbro --html 1 --js 2
```html
<app-root></app-root>
```

```ts
// app.component.ts
import { Component } from '@angular/core';
import Handsontable from 'handsontable';
import * as numbro from 'numbro';
import * as languages from 'numbro/dist/languages.min';

numbro.registerLanguage(languages['ja-JP']);
numbro.registerLanguage(languages['tr-TR']);

type Product = {
  productName: string,
  JP_price: number,
  TR_price: number
};

@Component({
  selector: 'app-root',
  template: `
    <div>
      <hot-table [data]="dataset" [colHeaders]="true" height="auto" licenseKey="non-commercial-and-evaluation">
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
class AppComponent {
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

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';

@NgModule({
  imports:      [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
class AppModule { }

// bootstrap
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```
:::
