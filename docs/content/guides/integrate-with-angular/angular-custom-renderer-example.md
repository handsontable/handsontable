---
title: 'Custom renderer in Angular'
metaTitle: 'Custom renderer in Angular - Guide - Handsontable Documentation'
permalink: /angular-custom-renderer-example
canonicalUrl: /angular-custom-renderer-example
---

# Custom renderer in Angular

## Overview
The following example is an implementation of `@handsontable/angular` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

## Example
::: example :angular --html 1 --js 2
```html
<app-root></app-root>
```

```js
// app.component.ts
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { textRenderer } from 'handsontable/renderers/textRenderer';

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
    data:
      [
<<<<<<< HEAD
        ['A1', 'https://handsontable.com/docs/11.0/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
        ['A2', 'https://handsontable.com/docs/11.0/img/examples/javascript-the-good-parts.jpg']
=======
        ['A1', 'https://handsontable.com/docs/{{$page.currentVersion}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
        ['A2', 'https://handsontable.com/docs/{{$page.currentVersion}}/img/examples/javascript-the-good-parts.jpg']
>>>>>>> fe5356882 (Inject dynamic docs version variable)
      ],
    columns: [
      {},
      {
        renderer(instance, td, row, col, prop, value, cellProperties) {
          const escaped = `${value}`;
          let img = null;

          if (escaped.indexOf('http') === 0) {
            img = document.createElement('IMG');
            img.src = value;

            img.addEventListener('mousedown', event => {
              event.preventDefault();
            });

            td.innerText = '';
            td.appendChild(img);

          } else {
            textRenderer.apply(this, arguments);
          }

          return td;
        }
      }
    ],
    colHeaders: true,
    rowHeights: 55,
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
