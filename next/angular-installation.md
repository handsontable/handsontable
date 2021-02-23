---
title: Installation
permalink: /next/angular-installation
canonicalUrl: /angular-installation
---

# {{ $frontmatter.title }}

**Handsontable for Angular** is the official wrapper for Handsontable, a JavaScript data grid component with a spreadsheet look & feel. It easily integrates with any data source and comes with lots of useful features like data binding, validation, sorting or powerful context menu.

### Installation

This component needs the Handsontable library to work. We suggest using [npm](https://www.npmjs.com/package/@handsontable/angular) to install the package.

```
npm install handsontable @handsontable/angular
```

### Basic usage

Import the Handsontable styles to your project

```scss
@import '~handsontable/dist/handsontable.full.css';
```

Import the Handsontable component in your module

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

Now, you can use the Handsontable component in your HTML files

```html
<hot-table
  [colHeaders]="true"
  [rowHeaders]="true"
  [data]="dataset"></hot-table>`
```

### License

Handsontable for Angular wrapper is released under [the MIT license](https://github.com/handsontable/angular-handsontable/blob/master/LICENSE) but under the hood it uses Handsontable, which is [dual-licensed](licensing.md). You can either use it for free in all your non-commercial projects or purchase a commercial license.
