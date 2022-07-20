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

Install Handsontable in your preferred way.

::: only-for javascript
::: tip
To install Handsontable using a framework, see:

 - [Installation in React](../../react-data-grid/installation)
 - [Installation in Angular](@/guides/integrate-with-angular/angular-installation.md)
 - [Installation in Vue 2](@/guides/integrate-with-vue/vue-installation.md)
 - [Installation in Vue 3](@/guides/integrate-with-vue3/vue3-installation.md)
:::
:::

## Overview

You can get started with Handsontable in a few different ways. The most common is:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable
  ```

  </code-block>
  <code-block title="Your HTML">

  ```html
  <div id="example"></div>
  ```

  </code-block>
  <code-block title="Your application">

  ```js
  import Handsontable from "handsontable";
  import "handsontable/dist/handsontable.full.css";
  const data = [
    ["", "Tesla", "Volvo", "Toyota", "Ford"],
    ["2019", 10, 11, 12, 13],
    ["2020", 20, 11, 14, 13],
    ["2021", 30, 15, 12, 13],
  ];
  const container = document.getElementById("example");
  const hot = new Handsontable(container, {
    data: data,
    rowHeaders: true,
    colHeaders: true,
    height: "auto",
    licenseKey: "non-commercial-and-evaluation", // for non-commercial use only
  });
  ```

  </code-block>
</code-group>

For more details and other installation methods, follow these steps:

1. [Install Handsontable](#install-handsontable).
2. [Import Handsontable's JavaScript into your application](#import-handsontable-s-javascript).
3. [Import Handsontable's CSS into your application](#import-handsontable-s-css).
4. [Create an HTML container](#create-a-container).
5. [Initialize Handsontable](#initialize-handsontable).

## Install Handsontable

Get Handsontable's files in your preferred way.

### Using a package manager

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">
	@@ -99,81 +44,50 @@ To install Handsontable locally using a package manager, run one of these comman
  ```

  </code-block>
  <code-block title="NuGet">

  ```bash
  PM> Install-Package Handsontable
  ```

  </code-block>
</code-group>

### Using a CDN

To get Handsontable's files from a CDN, use the following locations:

- [https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js](https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js)
- [https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css](https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css)

## Import Handsontable's JavaScript

Import Handsontable's JavaScript into your application.

::: tip
For a more optimized build, import individual parts of Handsontable's JavaScript, using [modules](@/guides/tools-and-building/modules.md).
:::

### Using CommonJS or a package manager

If you're using Handsontable as a CommonJS package, or as an ECMAScript module (using a package manager), import the full distribution of Handsontable as a JavaScript file.

Use your bundler's preferred method of importing files. For example:

```js
import Handsontable from 'handsontable';
```

### Using the `script` tag

If you're using Handsontable as a traditional UMD package, import the full distribution of Handsontable as a minified JavaScript file.

Use the `script` tag. For example, if you're loading Handsontable's JavaScript from a CDN:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
```

## Import Handsontable's CSS

Import Handsontable's CSS into your application.

### Using `import`

If your bundler allows it, you can import Handsontable's full distribution CSS file, using an `import` statement.

```js
import 'handsontable/dist/handsontable.full.css';
```

### Using the `link` tag

You can also import Handsontable's CSS using a link tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" />
```

## Create a container

In your HTML, add an empty `div`, which serves as a container for your Handsontable instance.

```html
<div id="example"></div>
```

## Initialize Handsontable

Now turn your container into a data grid with sample data.
```js
const data = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
	@@ -213,14 +127,50 @@ const hot = new Handsontable(container, {
});
```
:::

## Related articles

### Related guides

- [Modules](@/guides/tools-and-building/modules.md)

### Related API reference

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