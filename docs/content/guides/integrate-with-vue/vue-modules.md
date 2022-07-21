---
title: 'Modules in Vue 2'
metaTitle: 'Modules in Vue 2 - Guide - Handsontable Documentation'
permalink: /next/vue-modules
canonicalUrl: /vue-modules
---

# Modules in Vue 2

[[toc]]

Import just the modules that you actually need, to reduce Handsontable's impact on the size of your Vue 2 app.

## Use modules in Vue

To use modules with Handsontable's [Vue 2 wrapper](@/guides/integrate-with-vue/vue-installation.md), follow the steps below:

### Step 1: Import base modules

No matter which [optional modules](@/guides/tools-and-building/modules.md#optional-modules) you use, you need to import the [base module](@/guides/tools-and-building/modules.md#base-module).

In the entry point file of your application, import the `handsontable/base` module:
```js
import Handsontable from 'handsontable/base';
```

### Step 2: Import optional modules

Import optional modules of your choice, along with their registering functions.

- [Optional modules](@/guides/tools-and-building/modules.md#optional-modules)
- [List of all modules](@/guides/tools-and-building/modules.md#list-of-all-modules)
- [List of all module imports](@/guides/tools-and-building/modules.md#list-of-all-module-imports)

For example, to import the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type module and the [`UndoRedo`](@/api/undoRedo.md) plugin module:

```js
import {
registerCellType, // cell types' registering function
NumericCellType,
} from 'handsontable/cellTypes';

import {
registerPlugin, // plugins' registering function
UndoRedo,
} from 'handsontable/plugins';
```

### Step 3: Register your modules
Register your modules, to let Handsontable recognize them.
For example, to register the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type module and the [`UndoRedo`](@/api/undoRedo.md) plugin module:
```jsx
registerCellType(NumericCellType);
registerPlugin(UndoRedo);
```

### Full example

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
registerCellType(NumericCellType);
registerPlugin(UndoRedo);
Vue.config.productionTip = false;
new Vue({
  render: h => h(App),
}).$mount('#app');
```

## Related guides

- [Modules](@/guides/tools-and-building/modules.md)
- [Bundle size](@/guides/optimization/bundle-size.md)