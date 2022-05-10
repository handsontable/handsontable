---
title: 'Modules in Angular'
metaTitle: 'Modules in Angular - Guide - Handsontable Documentation'
permalink: /next/angular-modules
canonicalUrl: /angular-modules
---

# Modules in Angular

[[toc]]

## Overview

To reduce the size of your app, you can use Handsontable by importing individual [modules](@/guides/building-and-testing/modules.md).

## Using modules in Angular

To use modules with Handsontable's [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md), follow the steps below:

### Step 1: Import the `handsontable/base` module
In the entry point file of your application, import the `handsontable/base` module:
  ```js
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

  // import the `handsontable/base` module
  import Handsontable from 'handsontable/base';
  ```

### Step 2: Import modules and their registering functions
Import the modules that you want to use (for the full list of Handsontable modules, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)).

Also, import those modules' registering functions.

For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

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
Register your modules, using the registering functions that you imported (for the full list of Handsontable's registering functions, see the modules cheatsheet):
  ```jsx
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

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
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

## Related articles

#### Related guides

- [Modules](@/guides/building-and-testing/modules.md)
- [Performance](@/guides/advanced-topics/performance.md)

#### Related blog articles

- [Modularizing to improve the developer experience](https://handsontable.com/blog/modularizing-to-improve-the-developer-experience)
- [Handsontable 11.0.0: modularization for React, Angular, and Vue](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)