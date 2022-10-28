---
title: Installation
metaTitle: Installation - JavaScript Data Grid | Handsontable
description: Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.
permalink: /installation
canonicalUrl: /installation
tags:
  - quick start
react:
  metaTitle: Installation - React Data Grid | Handsontable
searchCategory: Guides
---

# Installation

::: only-for javascript

Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.

:::

::: only-for react

Install Handsontable through your preferred package manager, and control your grid through the `HotTable` component's props.

:::

[[toc]]

::: only-for react

## Install Handsontable

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable @handsontable/react
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable @handsontable/react
  ```

  </code-block>
</code-group>

:::

::: only-for javascript

## Overview

To start using Handsontable, follow these steps:

## 1. Install Handsontable

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

## 2. Import JavaScript

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

## 3. Import CSS

Import Handsontable's CSS into your application.

### Using `import`

If your bundler allows it, you can import Handsontable's full distribution CSS file, using an `import` statement.

```js
import 'handsontable/dist/handsontable.full.min.css';
```

### Using the `link` tag

You can also import Handsontable's CSS using a link tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" />
```

## 4. Create a container

In your HTML, add an empty `div`, which serves as a container for your Handsontable instance.

```html
<div id="example"></div>
```

## 5. Initialize the grid

Now turn your container into a data grid with sample data.

```js
const data = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
];

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```

### Preview the result

::: example #example
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

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
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```
:::

:::

::: only-for react

## Import Handsontable's CSS

Import Handsontable's CSS into your application.

```jsx
import 'handsontable/dist/handsontable.full.min.css';
```

## Register Handsontable's modules

Import and register all of Handsontable's modules with a single function call:

```jsx
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

Or, to reduce the size of your JavaScript bundle, [import only the modules that you need](@/guides/tools-and-building/modules.md).

## Use the `HotTable` component

The main Handsontable component is called `HotTable`.
```jsx
import { HotTable } from '@handsontable/react';
```

To set Handsontable's [configuration options](@/guides/getting-started/configuration-options.md), use `HotTable`'s props. For example:

```jsx
<HotTable
  data={data}
  rowHeaders={true}
  colHeaders={true}
  height="auto"
  licenseKey="non-commercial-and-evaluation" // for non-commercial use only
/>
```

## Basic example
::: example #example :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ];

  return (
      <HotTable
        data={data}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
      />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example'));
/* end:skip-in-preview */
```
:::
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
