---
title: 'Modules in React'
metaTitle: 'Modules in React - Guide - Handsontable Documentation'
permalink: /next/react-modules
canonicalUrl: /react-modules
---

# Modules in React

[[toc]]

To reduce the size of your React app, use Handsontable [modules](@/guides/building-and-testing/modules.md).

## Using modules in React

To use modules with Handsontable's [React wrapper](@/guides/integrate-with-react/react-installation.md), follow the steps below:

### Step 1: Import required modules

No matter which [optional modules](@/guides/building-and-testing/modules.md#list-of-all-modules) you use, you need to [import the required modules](@/guides/building-and-testing/modules.md#importing-required-modules).

In the entry point file of your application, import the `handsontable/base` module:
  ```js
  // your `index.js` file
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  // import the `handsontable/base` module
  import Handsontable from 'handsontable/base';
  ```

### Step 2: Import optional modules

Import optional modules of your choice:

- [List of all modules &#8594;](@/guides/building-and-testing/modules.md#list-of-all-modules)
- [Importing and registering all modules &#8594;](@/guides/building-and-testing/modules.md#importing-and-registering-all-modules)

For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  import Handsontable from 'handsontable/base';

  import {
    // import the `NumericCellType` module
    NumericCellType,
  } from 'handsontable/cellTypes';

  import {
    // import the `UndoRedo` module
    UndoRedo,
  } from 'handsontable/plugins';
  ```

### Step 3: Import your modules' registering methods

Import the registering methods that let you register your chosen modules:

- [Importing and registering all modules &#8594;](@/guides/building-and-testing/modules.md#importing-and-registering-all-modules)

For example, to import the registering methods of the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and of the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  import Handsontable from 'handsontable/base';

  import {
    NumericCellType,
    // import the `registerCellType()` method
    registerCellType,
  } from 'handsontable/cellTypes';

  import {
    UndoRedo,
    // import the `registerPlugin()` method
    registerPlugin,
  } from 'handsontable/plugins';
  ```

### Step 4: Register your modules
Register your chosen modules, using the registering methods.

For example, to register the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin: 
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

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
  registerPlugin(UndoRedo);

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  ```