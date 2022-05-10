---
title: 'Custom context menu in Angular'
metaTitle: 'Custom context menu in Angular - Guide - Handsontable Documentation'
permalink: /next/angular-custom-context-menu-example
canonicalUrl: /angular-custom-context-menu-example
---

# Custom context menu in Angular

[[toc]]

## Overview

The following is an implementation of the `@handsontable/angular` component with a custom context menu added.

## Example
::: example :angular --html 1 --js 2
```html
<app-root></app-root>
```
```js
// app.component.ts
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { createSpreadsheetData } from './helpers';

@Component({
  selector: 'app-root',
  template: `
  <div>
    <hot-table [settings]="hotSettings"></hot-table>
  </div>
  `,
})
class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: createSpreadsheetData(5, 5),
    colHeaders: true,
    contextMenu: {
      items: {
        'row_above': {
          name: 'Insert row above this one (custom name)'
        },
        'row_below': {},
        'separator': ContextMenu.SEPARATOR,
        'clear_custom': {
          name: 'Clear all cells (custom)',
          callback: function() {
            this.clear();
          }
        }
      }
    },
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };
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

## Related articles

#### Related guides

- [Adding comments via the context menu](@/guides/cell-features/comments.md#adding-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)

#### Related blog articles

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

#### Related API reference

- [Options: `contextMenu`](@/api/options.md#contextmenu)
- [Plugins: `ContextMenu`](@/api/contextMenu.md)