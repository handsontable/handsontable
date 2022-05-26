---
title: 'Modules in React'
metaTitle: 'Modules in React - Guide - Handsontable Documentation'
permalink: /next/react-modules
canonicalUrl: /react-modules
---

# Modules in React

[[toc]]

Import just the modules that you actually need, to reduce Handsontable's impact on the size of your React app.

## Use modules in React

To use modules with Handsontable's [React wrapper](@/guides/integrate-with-react/react-installation.md), follow the steps below:

### Step 1: Import core modules

No matter which [optional modules](@/guides/building-and-tooling/modules.md#optional-modules) you use, you need to import the [core modules](@/guides/building-and-tooling/modules.md#core-modules).

In the entry point file of your application, import the `handsontable/base` module:

```jsx
import Handsontable from 'handsontable/base';
```

### Step 2: Import optional modules

Import optional modules of your choice, along with their registering functions.

- [Optional modules](@/guides/building-and-tooling/modules.md#optional-modules)
- [List of all modules](@/guides/building-and-tooling/modules.md#list-of-all-modules)
- [List of all module imports](@/guides/building-and-tooling/modules.md#list-of-all-module-imports)

For example, to import the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type module and the [`UndoRedo`](@/api/undoRedo.md) plugin module:

```jsx
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

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

## Related guides

- [Modules](@/guides/building-and-tooling/modules.md)
- [Bundle size](@/guides/optimization/bundle-size.md)