---
title: Custom renderer example
permalink: /next/angular-custom-renderer-example
canonicalUrl: /angular-custom-renderer-example
---

# Custom renderer example

An implementation of the `@handsontable/angular` with a custom renderer added. It takes an image url as the input and renders the image in the edited cell.

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
    <hot-table [settings]="hotSettings"></hot-table>
  </div>
  `,
})
class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data:
      [
        ['A1', 'https://handsontable.com/docs/images/examples/professional-javascript-developers-nicholas-zakas.jpg'],
        ['A2', 'https://handsontable.com/docs/images/examples/javascript-the-good-parts.jpg']
      ],
    columns: [
      {},
      {
        renderer(instance, td, row, col, prop, value, cellProperties) {
          const escaped = Handsontable.helper.stringify(value);
          let img = null;

          if (escaped.indexOf('http') === 0) {
            img = document.createElement('IMG');
            img.src = value;

            Handsontable.dom.addEvent(img, 'mousedown', event => {
              event.preventDefault();
            });

            Handsontable.dom.empty(td);
            td.appendChild(img);

          } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
          }

          return td;
        }
      }
    ],
    colHeaders: true,
    rowHeights: 55,
    licenseKey: 'non-commercial-and-evaluation'
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
