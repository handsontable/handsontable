---
title: 'Custom renderer in Vue 2'
metaTitle: 'Custom renderer in Vue 2 - Guide - Handsontable Documentation'
permalink: /next/vue-custom-renderer-example
canonicalUrl: /vue-custom-renderer-example
---

# Custom renderer in Vue 2

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
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

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
    HotTable
  }
});
```
:::

## Related articles

### Related guides

- [Cell renderer](@/guides/cell-functions/cell-renderer.md)

### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`renderer`](@/api/options.md#renderer)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)