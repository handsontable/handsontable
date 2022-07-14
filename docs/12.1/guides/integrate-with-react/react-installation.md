---
title: 'Installation in React'
metaTitle: 'Installation in React - Guide - Handsontable Documentation'
permalink: /12.1/react-installation
canonicalUrl: /react-installation
---

# Installation in React

[[toc]]

## Overview

React installation and basic usage guide.

## Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/react
```

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