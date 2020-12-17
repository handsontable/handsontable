---
id: frameworks-wrapper-for-angular-custom-context-menu-example
title: Custom Context Menu example
sidebar_label: Custom Context Menu example
slug: /frameworks-wrapper-for-angular-custom-context-menu-example
---

An implementation of the `@handsontable/angular` component with a custom Context Menu added.

<app-root></app-root>

Edit

```
// app.component.ts import { Component } from '@angular/core'; import \* as Handsontable from 'handsontable'; @Component({ selector: 'app-root', template: \` <div class="hot"> <hot-table \[settings\]="hotSettings"></hot-table> </div> \`, }) class AppComponent { hotSettings: Handsontable.GridSettings = { data: Handsontable.helper.createSpreadsheetData(5, 5), colHeaders: true, contextMenu: { items: { 'row\_above': { name: 'Insert row above this one (custom name)' }, 'row\_below': {}, 'separator': Handsontable.plugins.ContextMenu.SEPARATOR, 'clear\_custom': { name: 'Clear all cells (custom)', callback: function() { this.clear(); } } } } }; } // app.module.ts import { NgModule } from '@angular/core'; import { BrowserModule } from '@angular/platform-browser'; import { HotTableModule } from '@handsontable/angular'; @NgModule({ imports: \[ BrowserModule, HotTableModule \], declarations: \[ AppComponent \], bootstrap: \[ AppComponent \] }) class AppModule { } // bootstrap import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'; platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```

The same example you can find [here](https://stackblitz.com/edit/handsontable-angular).
