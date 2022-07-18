---
title: 'Installation in Angular'
metaTitle: 'Installation in Angular - Guide - Handsontable Documentation'
permalink: /next/angular-installation
canonicalUrl: /angular-installation
---

# Installation in Angular

[[toc]]

## Overview

Angular installation and basic usage guide.

### Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/angular
```

### Basic usage

Import the Handsontable styles to your project.

```scss
@import '~handsontable/dist/handsontable.full.css';
```

Import the Handsontable component in your module.

```js
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

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

Now, you can use the Handsontable component in your HTML files.

```html
<hot-table
  [colHeaders]="true"
  [rowHeaders]="true"
  [data]="dataset"
  licenseKey="non-commercial-and-evaluation">
</hot-table>
```

## Related API reference

- Configuration options:
  - [`maxCols`](@/api/options.md#maxcols)
  - [`maxRows`](@/api/options.md#maxrows)
  - [`minCols`](@/api/options.md#mincols)
  - [`minRows`](@/api/options.md#minrows)
  - [`minSpareCols`](@/api/options.md#minsparecols)
  - [`minSpareRows`](@/api/options.md#minsparerows)
  - [`startCols`](@/api/options.md#startcols)
  - [`startRows`](@/api/options.md#startrows)
- Hooks:
  - [`afterInit`](@/api/hooks.md#afterinit)
  - [`beforeInit`](@/api/hooks.md#beforeinit)
  - [`beforeInitWalkontable`](@/api/hooks.md#beforeinitwalkontable)
  - [`construct`](@/api/hooks.md#construct)
