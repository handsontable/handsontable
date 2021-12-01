---
title: 'React: Modules'
metaTitle: 'React: Modules - Guide - Handsontable Documentation'
permalink: /next/react-modules
canonicalUrl: /react-modules
---

# React: Modules

[[toc]]

## Overview

To reduce the size of your app, you can use Handsontable by importing individual [modules](@/guides/building-and-testing/modules.md).

## Using modules with React

To use modules with Handsontable's [React wrapper](@/guides/integrate-with-react/react-installation.md), follow the steps below:

### Step 1: Import the `handsontable/base` module
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

### Step 2: Import modules and their registering functions
Import the modules that you want to use (for the full list of Handsontable modules, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)).

Also, import those modules' registering functions.

For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

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
Register your modules, using the registering functions that you imported (for the full list of Handsontable's registering functions, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)):
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