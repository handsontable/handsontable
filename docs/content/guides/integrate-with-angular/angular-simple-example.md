---
title: Basic example in Angular
metaTitle: Basic example - Angular Data Grid | Handsontable
description: Start with the Angular data grid basic configuration examples, using component properties for configuration and external control.
permalink: /angular-basic-example
canonicalUrl: /angular-basic-example
searchCategory: Guides
---

# Basic example in Angular

Start with the Angular data grid basic configuration examples, using component properties for configuration and external control.

[[toc]]

## Example

The following example is a basic implementation of the `@handsontable/angular` wrapper.

::: example :angular --html 1 --js 2
```html
<app-root></app-root>
```

```js
/* file: app.component.ts */
import { Component } from '@angular/core';

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
export class AppComponent {
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

/* start:skip-in-preview */
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => { console.error(err) });
/* end:skip-in-preview */
```
:::
