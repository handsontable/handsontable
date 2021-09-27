---
title: Custom editor example
metaTitle: Custom editor example - Guide - Handsontable Documentation
permalink: /next/angular-custom-editor-example
canonicalUrl: /angular-custom-editor-example
---

# Custom editor example

## Overview

The following is an implementation of the `@handsontable/angular` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

## Example

::: example :angular --html 1 --js 2 --no-edit
```html
<app-root></app-root>
```

```js
/// file: app.component.ts
import { Component } from '@angular/core';
import * as Handsontable from 'handsontable';
//import { CustomEditor } from './CustomEditor.js';

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
    startRows: 5,
    columns: [
      {
        editor: CustomEditor
      }
    ],
    colHeaders: true,
    colWidths: 200,
    licenseKey: 'non-commercial-and-evaluation'
  };
}

/// file: app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';

@NgModule({
  imports:      [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
class AppModule { }

/// file: CustomEditor.js
export class CustomEditor extends Handsontable.editors.TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    Handsontable.dom.empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

/// bootstrap:
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```
:::
