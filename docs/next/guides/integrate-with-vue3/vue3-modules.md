---
title: 'Modules in Vue 3'
metaTitle: 'Modules in Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-modules
canonicalUrl: /vue3-modules
---

# Modules in Vue 3

[[toc]]

## Overview

To reduce the size of your app, you can use Handsontable by importing individual [modules](@/guides/building-and-testing/modules.md).

[Find out which Vue 3 versions are supported &#8594;](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Using modules with Vue 3

To use modules with Handsontable's [Vue 3 wrapper](@/guides/integrate-with-vue3/vue3-installation.md), follow the steps below:

### Step 1: Import the `handsontable/base` module
In the entry point file of your application, import the `handsontable/base` module:
```js
// your `main.js` file
import { createApp } from 'vue';
import App from './App.vue';

// import the `handsontable/base` module
import Handsontable from 'handsontable/base';
```

### Step 2: Import modules and their registering functions
Import the modules that you want to use (for the full list of Handsontable modules, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)).

Also, import those modules' registering functions.

For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
```js
import { createApp } from 'vue';
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
Register your modules, using the registering functions that you imported (for the full list of Handsontable's registering functions, see the see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)):
```js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

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

createApp(App).use(router).mount('#app');
```
