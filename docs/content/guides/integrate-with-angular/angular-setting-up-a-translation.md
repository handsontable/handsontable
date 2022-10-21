---
title: Setting up a translation in Angular
metaTitle: Setting up a translation - Angular Data Grid | Handsontable
description: Configure your Angular data grid with different number formats, depending on the specified language and culture.
permalink: /angular-setting-up-a-translation
canonicalUrl: /angular-setting-up-a-translation
searchCategory: Guides
---

# Setting up a translation in Angular

Configure your Angular data grid with different number formats, depending on the specified language and culture.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Angular.

::: example :angular-numbro --html 1 --js 2
```html
<app-root></app-root>
```

```ts
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

/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
/* start:non-compilable */
import { AppComponent } from './app.component';
/* end:non-compilable */

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

/* start:non-previewable */
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => { console.error(err) });
/* end:non-previewable */
```
:::

## Related articles

### Related guides

- [Language](@/guides/internationalization/language.md)
- [Layout direction](@/guides/internationalization/layout-direction.md)
- [Locale](@/guides/internationalization/locale.md)

### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)
