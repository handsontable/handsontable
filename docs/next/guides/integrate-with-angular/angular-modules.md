---
title: 'Modules in Angular'
metaTitle: 'Modules in Angular - Guide - Handsontable Documentation'
permalink: /next/angular-modules
canonicalUrl: /angular-modules
---

# Modules in Angular

[[toc]]

Import just the modules that you actually need, to reduce Handsontable's impact on the size of your Angular app.

## Use modules in Angular

To use modules with Handsontable's [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md), follow the steps below:

### Step 1: Import the base module

No matter which [optional modules](@/guides/tools-and-building/modules.md#optional-modules) you use, you need to import the [base module](@/guides/tools-and-building/modules.md#base-module).

In the entry point file of your application, import the `handsontable/base` module:

```js
import Handsontable from 'handsontable/base';
```

### Step 2: Import optional modules

Import optional modules of your choice:

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

###  Full example

```js
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HotTableModule } from '@handsontable/angular';

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

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HotTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Related guides

- [Modules](@/guides/tools-and-building/modules.md)
- [Bundle size](@/guides/optimization/bundle-size.md)