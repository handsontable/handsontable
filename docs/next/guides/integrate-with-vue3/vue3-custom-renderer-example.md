---
title: 'Custom renderer in Vue 3'
metaTitle: 'Custom renderer in Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-custom-renderer-example
canonicalUrl: /vue3-custom-renderer-example
---

# Custom renderer in Vue 3

[[toc]]

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example - Declaring a renderer as a function

The following example is an implementation of `@handsontable/vue3` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import { createApp } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const app = createApp({
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
              const escaped = `${value}`;

              if (escaped.indexOf('http') === 0) {
                const img = document.createElement('IMG');
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
      }
    }
  },
  components: {
    HotTable,
  }
});

app.mount('#example1');
```
:::
