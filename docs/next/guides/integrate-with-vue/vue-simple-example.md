---
title: Basic example in Vue
metaTitle: Basic example in Vue - Guide - Handsontable Documentation
permalink: /next/vue-simple-example
canonicalUrl: /vue-simple-example
---

# Basic example

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
import Handsontable from 'handsontable';

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
