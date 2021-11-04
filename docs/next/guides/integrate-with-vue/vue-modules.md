---
title: Using modules with Vue
metaTitle: Using modules with Vue - Guide - Handsontable Documentation
permalink: /next/vue-modules
canonicalUrl: /vue-modules
---

# Using modules with Vue

[[toc]]

## Overview

To reduce the size of your app, you can use Handsontable by importing individual [modules](@/guides/building-and-testing/modules.md).

## Using modules with Vue

To use modules with Handsontable's [Vue 2 wrapper](@/guides/integrate-with-vue/vue-installation.md), follow the steps below:

### Step 1: Import the `handsontable/base` module
In the entry point file of your application, import the `handsontable/base` module:
  ```js
  // your `main.js` file
  import Vue from 'vue';
  import App from './App.vue';

  // import the `handsontable/base` module
  import Handsontable from 'handsontable/base';
  ```

### Step 2: Import modules and their registering functions
Import the required modules (for the list of Handsontable modules, ssee the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)).

For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import Vue from 'vue';
  import App from './App.vue';

  import Handsontable from 'handsontable/base';

  // import the `NumericCellType` module and the `registerCellType()` function
  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  // import the `UndoRedo` module and the `registerPlugin()` function
  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';
  ```

### Step 3: Register the modules
Register the required modules (for the full list of Handsontable's registering functions, see the see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)):
  ```js
  import Vue from 'vue';
  import App from './App.vue';

  import Handsontable from 'handsontable/base';

  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
  registerPlugin(UndoRedo);
  
  Vue.config.productionTip = false;

  new Vue({
    render: h => h(App),
  }).$mount('#app');
  ```