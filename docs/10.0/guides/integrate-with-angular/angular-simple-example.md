---
title: Basic example in Angular
metaTitle: Basic example in Angular - Guide - Handsontable Documentation
permalink: /10.0/angular-simple-example
canonicalUrl: /angular-simple-example
---

# Angular basic example

## Overview
The following example is a basic implementation of the `@handsontable/angular` wrapper.

## Example
::: example :angular --html 1 --js 2
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
  <div>
    <hot-table
      [data]="dataset"
      [colHeaders]="true"
      [rowHeaders]="true"
      height="auto"
      licenseKey="non-commercial-and-evaluation">
        <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
        <hot-column data="name" title="Full name"></hot-column>
        <hot-column data="address" title="Street name"></hot-column>
    </hot-table>
  </div>
  `,
})
class AppComponent {
  dataset: any[] = [
    {id: 1, name: 'Ted Right', address: 'Wall Street'},
    {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
    {id: 3, name: 'Joan Well', address: 'Broadway'},
    {id: 4, name: 'Gail Polite', address: 'Bourbon Street'},
    {id: 5, name: 'Michael Fair', address: 'Lombard Street'},
    {id: 6, name: 'Mia Fair', address: 'Rodeo Drive'},
    {id: 7, name: 'Cora Fair', address: 'Sunset Boulevard'},
    {id: 8, name: 'Jack Right', address: 'Michigan Avenue'},
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
