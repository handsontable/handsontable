---
title: Language change in Angular
metaTitle: Language change - Angular Data Grid | Handsontable
description: Change the default language of the right-click context menu from English to any of the built-in translations, using the "language" property.
permalink: /angular-language-change-example
canonicalUrl: /angular-language-change-example
searchCategory: Guides
---

# Language change in Angular

Change the default language of the right-click context menu from English to any of the built-in translations, using the `language` property.

[[toc]]

## Example

The following example is an implementation of the `@handsontable/angular` component with an option to change the Context Menu language.

Select a language from the selector above the table and open the Context Menu to see the result.

::: example :angular-languages --html 1 --js 2
```html
<app-root></app-root>
```
```js
/* file: app.component.ts */
import { Component } from '@angular/core';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
  deCH,
  deDE,
  esMX,
  frFR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  zhCN,
  zhTW
} from 'handsontable/i18n';
import Handsontable from 'handsontable/base';

registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

@Component({
  selector: 'app-root',
  template: `
    <div class="controls select-language"><label>Select language of the context menu:
    <select [(ngModel)]="language">
      <option *ngFor="let l of languages" [value]="l.languageCode">{{l.languageCode}}</option>
    </select></label></div>
    <div>
      <hot-table [language]="language" [settings]="hotSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: [
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ],
    colHeaders: true,
    rowHeaders: true,
    contextMenu: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };
  language = 'en-US';
  languages = getLanguagesDictionaries();
}

/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
/* start:non-compilable */
import { AppComponent } from './app.component';
/* end:non-compilable */

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, FormsModule, HotTableModule ],
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
