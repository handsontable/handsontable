---
title: Installation
metaTitle: Installation - Guide - Handsontable Documentation
permalink: /10.0/installation
canonicalUrl: /installation
tags:
  - quick start
---

# Installation

[[toc]]

## Overview
This guide details how to install Handsontable.

::: tip
This section is dedicated to the pure JavaScript version of Handsontable. If you use a framework in your project, follow one of the available guides to install and use the library:
 - [Integrate with React](@/guides/integrate-with-react/react-installation.md)
 - [Integrate with Angular](@/guides/integrate-with-angular/angular-installation.md)
 - [Integrate with Vue](@/guides/integrate-with-vue/vue-installation.md)
:::

## Download and install the library

Run the following command in your terminal

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
