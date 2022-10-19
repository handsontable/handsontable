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
import { getLanguagesDictionaries } from 'handsontable/i18n';
import Handsontable from 'handsontable/base';

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
    data: Handsontable.helper.createSpreadsheetData(5, 10),
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
import { AppComponent } from './app.component';

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, FormsModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
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
