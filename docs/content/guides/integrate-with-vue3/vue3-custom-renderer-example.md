---
title: Custom renderer in Vue 3
metaTitle: Custom cell renderer - Vue 3 Data Grid | Handsontable
description: Create a custom cell renderer, and use it in your Vue 3 data grid by declaring it as a function.
permalink: /vue3-custom-renderer-example
canonicalUrl: /vue3-custom-renderer-example
searchCategory: Guides
---

# Custom renderer in Vue 3

Create a custom cell renderer, and use it in your Vue 3 data grid by declaring it as a function.

[[toc]]

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Declare a renderer as a function

The following example is an implementation of `@handsontable/vue3` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
        data:
          [
            ['A1', '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
            ['A2', '{{$basePath}}/img/examples/javascript-the-good-parts.jpg']
          ],
        columns: [
          {},
          {
            renderer(instance, td, row, col, prop, value) {
              const img = document.createElement('img');

              img.src = value;

              img.addEventListener('mousedown', event => {
                event.preventDefault();
              });

              td.innerText = '';
              td.appendChild(img);

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

export default ExampleComponent;

/* start:skip-in-preview */
import { createApp } from 'vue';

const app = createApp(ExampleComponent);

app.mount('#example1');
/* end:skip-in-preview */
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
