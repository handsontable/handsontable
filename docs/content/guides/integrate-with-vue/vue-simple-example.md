---
title: Basic example in Vue 2
metaTitle: Basic example - Vue 2 Data Grid | Handsontable
description: Start with a basic example of the Vue 2 data grid, using component props for configuration and external control.
permalink: /vue-basic-example
canonicalUrl: /vue-basic-example
searchCategory: Guides
---

# Basic example in Vue 2

[[toc]]

## Overview

The following example is a simple implementation of the `@handsontable/vue` component.

## Example

In this example, a `div` element of `id="example1"` where the `@handsontable/vue` component will be rendered.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
    <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable/base';

// register Handsontable's modules
registerAllModules();

new Vue({
  el: '#example1',
  data: function() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(6, 10),
        colHeaders: true,
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
