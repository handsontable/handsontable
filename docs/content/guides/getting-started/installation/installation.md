---
id: rqtn1ajf
title: Installation
metaTitle: Installation - JavaScript Data Grid | Handsontable
description: Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.
permalink: /installation
canonicalUrl: /installation
tags:
  - quick start
react:
  id: zqk2jjw3
  metaTitle: Installation - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Installation

::: only-for javascript

Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.

:::

::: only-for react

Install Handsontable through your preferred package manager, and control your grid through the `HotTable` component's props.

:::

[[toc]]

<div class="instalationPage">

::: only-for javascript

## Overview

To start using Handsontable, follow these steps:

## Install Handsontable

Get Handsontable's files in your preferred way.

### Using a package manager

To install Handsontable locally using a package manager, run one of these commands:

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
  <code-block title="pnpm">

  ```bash
  pnpm add handsontable
  ```

  </code-block>
</code-group>

### Using a CDN

To get Handsontable's files from a CDN, use the following locations:

- [https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js](https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js)
- [https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css](https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css)
- [https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css](https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css)

## Import Handsontable's JavaScript

Import Handsontable's JavaScript into your application.

::: tip
For a more optimized build, import individual parts of Handsontable's JavaScript, using [modules](@/guides/tools-and-building/modules/modules.md).
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
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
```

### Using the `link` tag

You can also import Handsontable's CSS using a link tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" />
```

## Create a container

In your HTML, add an empty `div`, which serves as a container for your Handsontable instance.

```html
<div id="example" class="ht-theme-main-dark-auto"></div>
```

## Initialize your grid

Now turn your container into a data grid with sample data.

```js
const container = document.querySelector('#example');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ],
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```

### Preview the result

::: example #example --js 1 --ts 2

@[code](@/content/guides/getting-started/installation/javascript/example.js)
@[code](@/content/guides/getting-started/installation/javascript/example.ts)

:::

:::

::: only-for react

## Install Handsontable

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable @handsontable/react-wrapper
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable @handsontable/react-wrapper
  ```

  </code-block>
  <code-block title="pnpm">

  ```bash
  pnpm add handsontable @handsontable/react-wrapper
  ```

  </code-block>
</code-group>

## Import Handsontable's CSS

Import Handsontable's CSS into your application.

```jsx
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
```

## Register Handsontable's modules

Import and register all of Handsontable's modules with a single function call:

```jsx
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

Or, to reduce the size of your JavaScript bundle, [import only the modules that you need](@/guides/tools-and-building/modules/modules.md).

## Use the `HotTable` component

The main Handsontable component is called `HotTable`.

```jsx
import { HotTable } from '@handsontable/react-wrapper';
```

To set Handsontable's [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), use `HotTable`'s props. For example:

```jsx
<div class="ht-theme-main-dark-auto">
  <HotTable
    data={[
      ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
      ['2019', 10, 11, 12, 13],
      ['2020', 20, 11, 14, 13],
      ['2021', 30, 15, 12, 13]
    ]}
    rowHeaders={true}
    colHeaders={true}
    height="auto"
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation" // for non-commercial use only
  />
</div>
```

::: tip

`@handsontable/react-wrapper` requires at least React@18 and is built with functional editors and renderers components in mind. If you use a lower version of React or prefer to use class-based components, you can use the `@handsontable/react` package instead.

For more information on `@handsontable/react`, see the [14.6 documentation](https://handsontable.com/docs/14.6/react-data-grid/installation/).

:::

### Preview the result

::: example #example :react --js 1 --ts 2

@[code](@/content/guides/getting-started/installation/react/example.jsx)
@[code](@/content/guides/getting-started/installation/react/example.tsx)

:::

:::

</div>

## Related articles

### Related guides

- [Modules](@/guides/tools-and-building/modules/modules.md)

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
