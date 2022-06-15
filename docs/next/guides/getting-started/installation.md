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

## Overview
This guide details how to install Handsontable.

::: tip
This section is dedicated to the pure JavaScript version of Handsontable. If you use a framework in your project, follow one of the available guides to install and use the library:
 - [Integrate with React](@/guides/integrate-with-react/react-installation.md)
 - [Integrate with Angular](@/guides/integrate-with-angular/angular-installation.md)
 - [Integrate with Vue 2](@/guides/integrate-with-vue/vue-installation.md)
 - [Integrate with Vue 3](@/guides/integrate-with-vue3/vue3-installation.md)
:::

## Download and install the library

You can install the package locally by running one the following commands in your terminal

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
</code-group>

Alternatively, you can get the files from a CDN, using the following locations:

- https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js
- https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css

## Import JavaScript into your application

If you are using the CommonJS package or the ECMAScript module (from npm, Yarn, etc), import the full distribution into your application as a JavaScript file using the preferred method of your bundler, for example:

```js
import Handsontable from 'handsontable';
```

For a more optimized build, you can also individual parts of Handsontable using [modules](@/guides/tools-and-building/modules.md).

Alternatively, if you are using the traditional UMD package, import the full distribution into your application as a minified JavaScript file using a script tag. For example, assuming the file is loaded from a CDN, the script tag will be the following:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
```

## Import CSS into your application

If your bundler allows it, you might import Handsontable's full distribution CSS file using an `import` statement.

```
import 'handsontable/dist/handsontable.full.css';
```

Otherwise, just use a link tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" />
```

## Create a container

Insert an empty div tag in your HTML that will serve as the container for your instance of Handsontable.

```html
<div id="example"></div>
```

## Initialize the grid

Now turn your container into a data grid with sample data.
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