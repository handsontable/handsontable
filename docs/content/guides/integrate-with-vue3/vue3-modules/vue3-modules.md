---
id: 0xtliaah
title: Modules in Vue 3
metaTitle: Modules - Vue 3 Data Grid | Handsontable
description: Reduce the size of your Vue 3 app by importing only the modules that you need and use.
permalink: /vue3-modules
canonicalUrl: /vue3-modules
react:
  id: q4l7029o
  metaTitle: Modules - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Modules in Vue 3

Reduce the size of your Vue 3 app by importing only the modules that you need and use.

[[toc]]

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Use modules with Vue 3

To use modules with Handsontable's [Vue 3 wrapper](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md), follow the steps below:

### Step 1: Import the base module

No matter which [optional modules](@/guides/tools-and-building/modules/modules.md#optional-modules) you use, you need to import the [base module](@/guides/tools-and-building/modules/modules.md#base-module).

In the entry point file of your application, import the `handsontable/base` module:

```js
import Handsontable from 'handsontable/base';
```

### Step 2: Import optional modules

Import optional modules of your choice, along with their registering functions.

- [Optional modules](@/guides/tools-and-building/modules/modules.md#optional-modules)
- [List of all modules](@/guides/tools-and-building/modules/modules.md#list-of-all-modules)
- [List of all module imports](@/guides/tools-and-building/modules/modules.md#list-of-all-module-imports)

For example, to import the [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell type module and the [`UndoRedo`](@/api/undoRedo.md) plugin module:

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

For example, to register the [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell type module and the [`UndoRedo`](@/api/undoRedo.md) plugin module:

```jsx
registerCellType(NumericCellType);
registerPlugin(UndoRedo);
```

### Full example

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

registerCellType(NumericCellType);
registerPlugin(UndoRedo);

createApp(App).use(router).mount('#app');
```

## Related guides

<div class="boxes-list gray">

- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Bundle size](@/guides/optimization/bundle-size/bundle-size.md)

</div>
