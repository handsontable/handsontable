---
title: Custom Context Menu example
permalink: /next/angular-custom-context-menu-example
---

# Custom Context Menu example

An implementation of the `@handsontable/angular` component with a custom Context Menu added.

::: example #example1 :angular
```js
// app.component.ts
import { Component } from '@angular/core';
import * as Handsontable from 'handsontable';

@Component({
  selector: '#example1',
  template: `
  <div class="hot">
    <hot-table [settings]="hotSettings"></hot-table>
  </div>
  `,
})
class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 5),
    colHeaders: true,
    contextMenu: {
      items: {
        'row_above': {
          name: 'Insert row above this one (custom name)'
        },
        'row_below': {},
        'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
        'clear_custom': {
          name: 'Clear all cells (custom)',
          callback: function() {
            this.clear();
          }
        }
      }
    }
  };
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
