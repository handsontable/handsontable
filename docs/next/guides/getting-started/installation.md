---
title: Installation
metaTitle: Installation - Guide - Handsontable Documentation
permalink: /next/installation
canonicalUrl: /installation
tags:
  - quick start
---

# Installation

[[toc]]

This guide details how to install Handsontable.

::: only-for javascript
::: tip
This section is dedicated to the pure JavaScript version of Handsontable. If you use a framework in your project, follow one of the available guides to install and use the library:
 - [Integrate with React](../../react-data-grid)
 - [Integrate with Angular](@/guides/integrate-with-angular/angular-installation.md)
 - [Integrate with Vue 2](@/guides/integrate-with-vue/vue-installation.md)
 - [Integrate with Vue 3](@/guides/integrate-with-vue3/vue3-installation.md)
:::
:::

## Download and install the library

Run the following command in your terminal:

::: only-for javascript

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable
  ```

  </code-block>
  <code-block title="Nuget">

  ```bash
  PM> Install-Package Handsontable
  ```

  </code-block>
  <code-block title="CDN">

  ```html
  // minified JS
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>

  // minified CSS
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" />
  ```

  </code-block>
</code-group>
:::


::: only-for react
```bash
npm install handsontable @handsontable/react
```
:::

::: only-for javascript
## Create a placeholder

```html
<div id="example"></div>
```

Import JavaScript and CSS into your application. You don't have to do that if you use CDN files.
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
```

## Initialize the grid

Now turn your placeholder into a data grid with sample data.
```js
const data = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```

## Preview the result

::: example #example
```js
const data = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```
:::
:::

::: only-for react
## Basic usage

Import the Handsontable styles to your project.

```scss
@import 'handsontable/dist/handsontable.full.css';
```

Use the Handsontable for React component in your app.

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const hotData = [
  ["", "Tesla", "Volvo", "Toyota", "Honda"],
  ["2020", 10, 11, 12, 13],
  ["2021", 20, 11, 14, 13],
  ["2022", 30, 15, 12, 13]
];

const App = () => {
  return (
    <div id="hot-app">
      <HotTable
        data={hotData}
        colHeaders={true}
        rowHeaders={true}
        width="600"
        height="300"
      />
    </div>
  );
}
```
:::

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