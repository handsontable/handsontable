---
id: frameworks-wrapper-for-react-installation
title: Installation
sidebar_label: Installation
slug: /frameworks-wrapper-for-react-installation
---

**Handsontable for React** is the official wrapper for Handsontable, a JavaScript data grid component with a spreadsheet look & feel. It easily integrates with any data source and comes with lots of useful features like data binding, validation, sorting or powerful context menu.

### Installation

This component needs the Handsontable library to work. We suggest using [npm](https://www.npmjs.com/package/@handsontable/react) to install the package.

    npm install handsontable @handsontable/react

### Basic usage

Import the Handsontable styles to your project

          `@import 'handsontable/dist/handsontable.full.css';`
        

Then use Handsontable for React component in your codebase

```
        `import React from 'react';
import { HotTable } from '@handsontable/react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.data = [
      ["", "Ford", "Volvo", "Toyota", "Honda"],
      ["2016", 10, 11, 12, 13],
      ["2017", 20, 11, 14, 13],
      ["2018", 30, 15, 12, 13]
    ];
  }

  render() {
    return (
      <div id="hot-app">
        <HotTable data={this.data} colHeaders={true} rowHeaders={true} width="600" height="300" />
      </div>
    );
  }
}`
```

### License

Handsontable for React wrapper is released under [the MIT license](https://github.com/handsontable/react-handsontable/blob/master/LICENSE) but under the hood it uses Handsontable, which is [dual-licensed](https://handsontable.com/docs/8.2.0/tutorial-licensing.html). You can either use it for free in all your non-commercial projects or purchase a commercial license.

