---
title: Angular installation
metaTitle: Angular installation - Guide - Handsontable Documentation
permalink: /10.0/angular-installation
canonicalUrl: /angular-installation
---

# Installation

## Overview
Angular installation and basic usage guide.

### Install with npm

This component needs the Handsontable library to work. Use [npm](https://www.npmjs.com/package/@handsontable/angular) to install the packages.

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
