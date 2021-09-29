---
title: Language change example
metaTitle: Language change example - Guide - Handsontable Documentation
permalink: /10.0/angular-language-change-example
canonicalUrl: /angular-language-change-example
---

# Language change example

## Overview
The following example is an implementation of the `@handsontable/angular` component with an option to change the Context Menu language.

Select a language from the selector above the table and open the Context Menu to see the result.

## Example
::: example :angular-languages --html 1 --js 2
```html
<app-root></app-root>
```
```js
// app.component.ts
import { Component } from '@angular/core';
import * as Handsontable from 'handsontable';

@Component({
  selector: 'app-root',
  template: `
  <label for="languages">Select language:</label>
  <select [(ngModel)]="language">
    <option *ngFor="let l of languages" [value]="l.languageCode">{{l.languageCode}}</option>
  </select><br/><br/>
  <div>
    <hot-table [language]="language" [settings]="hotSettings"></hot-table>
  </div>
  `,
})
class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 10),
    colHeaders: true,
    rowHeaders: true,
    contextMenu: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };
  language = 'en-US';
  languages = Handsontable.languages.getLanguagesDictionaries();
}

// app.module.ts
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';

@NgModule({
  imports:      [ BrowserModule, FormsModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
class AppModule { }

// bootstrap
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```
