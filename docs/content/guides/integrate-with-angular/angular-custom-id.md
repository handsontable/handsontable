---
title: Custom ID in Angular
metaTitle: Custom ID - Angular Data Grid | Handsontable
description: Pass a custom ID to the "HotTable" component to further customize your Angular data grid.
permalink: /angular-custom-id
canonicalUrl: /angular-custom-id
---

# Custom ID in Angular

[[toc]]

## Overview

A custom `id` can be passed in together with other attributes to the `hot-table` wrapper element. It will be applied to the root Handsontable element, allowing further customization of the table.

## Example

::: example :angular --html 1 --js 2
```html
<app-root></app-root>
```
```js
// app.component.ts
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'app-root',
  template: `
  <div>
    <hot-table
      [settings]="hotSettings"
      [hotId]="id">
    </hot-table>
  </div>
  `,
})
class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    startRows: 5,
    startCols: 5,
    colHeaders: true,
    stretchH: 'all',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };
  id = 'my-custom-id';
}

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

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

