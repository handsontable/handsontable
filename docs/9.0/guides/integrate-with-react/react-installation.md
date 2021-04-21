---
title: Installation
permalink: /9.0/react-installation
canonicalUrl: /react-installation
---

# {{ $frontmatter.title }}

[[toc]]

**Handsontable for React** is the official wrapper for Handsontable.

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

Use Handsontable for React component in your app.

```jsx
import React from 'react';
import { HotTable } from '@handsontable/react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.data = [
      ["", "Tesla", "Volvo", "Toyota", "Honda"],
      ["2020", 10, 11, 12, 13],
      ["2021", 20, 11, 14, 13],
      ["2022", 30, 15, 12, 13]
    ];
  }

  render() {
    return (
      <div id="hot-app">
        <HotTable data={this.data} colHeaders={true} rowHeaders={true} width="600" height="300" />
      </div>
    );
  }
}
```
