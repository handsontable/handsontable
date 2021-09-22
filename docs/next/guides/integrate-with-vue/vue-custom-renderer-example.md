---
title: Custom renderer example
metaTitle: Custom renderer example - Guide - Handsontable Documentation
permalink: /next/vue-custom-renderer-example
canonicalUrl: /vue-custom-renderer-example
---

# Custom renderer example

[[toc]]

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

## Example - Declaring a renderer as a function

The following example is an implementation of `@handsontable/vue` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data() {
    return {
      hotSettings: {
        data:
          [
            ['A1', 'https://handsontable.com/docs/next/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
            ['A2', 'https://handsontable.com/docs/next/img/examples/javascript-the-good-parts.jpg']],
        columns: [
          {},
          {
            renderer(instance, td, row, col, prop, value, cellProperties) {
              const escaped = Handsontable.helper.stringify(value);

              if (escaped.indexOf('http') === 0) {
                const img = document.createElement('IMG');
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
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  components: {
    HotTable
  }
});
```
:::
