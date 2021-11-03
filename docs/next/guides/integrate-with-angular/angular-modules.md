---
title: Using modules with Angular
metaTitle: Using modules with Angular - Guide - Handsontable Documentation
permalink: /next/angular-modules
canonicalUrl: /angular-modules
---

# Using modules with Angular

[[toc]]

## Overview

To reduce the size of your app, you can use Handsontable by importing individual [modules](@/guides/building-and-testing/modules.md).

## Using modules with Angular

To use modules with Handsontable's [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md), follow the steps below:

### Step 1: Import the `Base` module
In the entry point file of your application, import Handsontable's `Base` module:
  ```js
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

  // import Handsontable's `Base` module
  import Handsontable from 'handsontable/base';
  ```

### Step 2: Import modules and their registering functions
Import the required modules (for the list of Handsontable modules, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)).

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
Register the required modules (for the full list of Handsontable's registering functions, see the [modules cheatsheet](@/guides/building-and-testing/modules.md#modules-cheatsheet)):
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
