---
title: React installation
metaTitle: React installation - Guide - Handsontable Documentation
permalink: /9.0/react-installation
canonicalUrl: /react-installation
---

# Installation

[[toc]]


## Overview

React installation and basic usage guide.

## Install with npm

This component needs the Handsontable library to work. Use [npm](https://www.npmjs.com/package/@handsontable/react) to install the packages.

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
