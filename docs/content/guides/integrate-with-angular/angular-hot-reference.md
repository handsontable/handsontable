---
title: Referencing a Handsontable instance in Angular
metaTitle: Referencing Handsontable - Angular Data Grid | Handsontable
description: Referencing a Handsontable instance from an Angular component to programmatically perform actions such as reloading the data in your data grid.
permalink: /angular-hot-reference
canonicalUrl: /angular-hot-reference
searchCategory: Guides
---

# Referencing a Handsontable instance in Angular

Reference a Handsontable instance from an Angular component to programmatically perform actions such as reloading the data in your data grid.

[[toc]]

## Example

The following example is an implementation of `@handsontable/angular`, which shows you how to reference the Handsontable instance from the wrapper component.

::: example :angular --html 1 --js 2
```html
<app-root></app-root>
```
```js
/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { HotTableRegisterer } from '@handsontable/angular';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <hot-table [hotId]="id" [settings]="hotSettings"></hot-table>
    </div>
    <br>
    <button (click)="swapHotData()" class="controls">Load new data</button>
  `,
})
export class AppComponent {
  private hotRegisterer = new HotTableRegisterer();
  id = 'hotInstance';
  hotSettings: Handsontable.GridSettings = {
    data: [
      ['A1', 'B1', 'C1', 'D1'],
      ['A2', 'B2', 'C2', 'D2'],
      ['A3', 'B3', 'C3', 'D3'],
      ['A4', 'B4', 'C4', 'D4'],
    ],
    colHeaders: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };

  swapHotData() {
    this.hotRegisterer.getInstance(this.id).loadData([['new', 'data']]);
  }
}

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
  imports: [ BrowserModule, HotTableModule.forRoot() ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

/* start:skip-in-preview */
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => { console.error(err) });
/* end:skip-in-preview */
```
:::
