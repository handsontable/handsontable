---
id: frameworks-wrapper-for-angular-custom-editor-example
title: Custom editor example
sidebar_label: Custom editor example
slug: /frameworks-wrapper-for-angular-custom-editor-example
---

An implementation of the `@handsontable/angular` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

<app-root></app-root>

Edit

```
// app.component.ts import { Component } from '@angular/core'; import \* as Handsontable from 'handsontable'; class CustomEditor extends Handsontable.editors.TextEditor { constructor(props) { super(props); } createElements() { super.createElements(); this.TEXTAREA = document.createElement('input'); this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder'); this.TEXTAREA.setAttribute('data-hot-input', true); this.textareaStyle = this.TEXTAREA.style; Handsontable.dom.empty(this.TEXTAREA\_PARENT); this.TEXTAREA\_PARENT.appendChild(this.TEXTAREA); } } @Component({ selector: 'app-root', template: \` <div class="hot"> <hot-table \[settings\]="hotSettings"></hot-table> </div> \`, }) class AppComponent { hotSettings: Handsontable.GridSettings = { startRows: 5, columns: \[ { editor: CustomEditor } \], colHeaders: true, colWidths: 200 }; } // app.module.ts import { NgModule } from '@angular/core'; import { BrowserModule } from '@angular/platform-browser'; import { HotTableModule } from '@handsontable/angular'; @NgModule({ imports: \[ BrowserModule, HotTableModule \], declarations: \[ AppComponent \], bootstrap: \[ AppComponent \] }) class AppModule { } // bootstrap import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'; platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-angular-examples.html)
