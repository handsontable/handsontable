---
title: 'Custom editor in Angular'
metaTitle: 'Custom editor in Angular - Guide - Handsontable Documentation'
permalink: /11.1/angular-custom-editor-example
canonicalUrl: /angular-custom-editor-example
---

# Custom editor example in Angular

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
import Handsontable from 'handsontable/base';
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
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports:      [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
class AppModule { }

/// file: CustomEditor.js
export class CustomEditor extends TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

/// bootstrap:
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
```
:::
