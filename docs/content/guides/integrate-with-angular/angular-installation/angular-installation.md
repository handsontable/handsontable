---
id: bptpnpet
title: Installation in Angular
metaTitle: Installation - Angular Data Grid | Handsontable
description: Install Handsontable's Angular wrapper via npm, import the stylesheets, and get your application up and running.
permalink: /angular-installation
canonicalUrl: /angular-installation
react:
  id: sf0e1o0c
  metaTitle: Installation - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Installation in Angular

Install Handsontable's Angular wrapper via npm, import the stylesheets, and get your application up and running.

[[toc]]

## Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/angular
```

## Basic usage

Import the Handsontable styles to your project.

```scss
@import '~handsontable/styles/handsontable.min.css';
@import '~handsontable/styles/ht-theme-main.min.css';
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

::: tip

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/integrate-with-angular/angular-modules/angular-modules.md) that you need.

:::

Now, you can use the Handsontable component in your HTML files.

```html
<div class="ht-theme-main-dark-auto">
  <hot-table
    [colHeaders]="true"
    [rowHeaders]="true"
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation">
  </hot-table>
</div>
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
