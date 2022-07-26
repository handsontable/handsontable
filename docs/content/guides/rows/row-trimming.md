---
title: Row trimming
metaTitle: Row trimming - Guide - Handsontable Documentation
permalink: /row-trimming
canonicalUrl: /row-trimming
---

# Row trimming

[[toc]]

## Overview

The _Trim Rows_ plugin allows the trimming of specific rows from the table. Rows being trimmed **aren't rendered** and **aren't included** in a `DataMap`, which can be retrieved by calling the [getData](@/api/core.md#getdata) method.

## Setup

The [`trimRows`](@/api/options.md#trimrows) option needs to be set to an array of row indexes to enable the plugin.
See the [examples](#example) section for a live demo.

## Example

Note that the second, third, and sixth rows are missing in the following example:

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 4),
  colHeaders: true,
  rowHeaders: true,
  trimRows: [1, 2, 5],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::
::: only-for react
::: example #example1 :react
```jsx
import React, { Fragment, useEffect } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotSettings = {
    data: Handsontable.helper.createSpreadsheetData(10, 4),
    colHeaders: true,
    rowHeaders: true,
    trimRows: [1, 2, 5],
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };

  return (
    <Fragment>
      <HotTable settings={hotSettings}>
      </HotTable>
    </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## API examples

The plugin instance can be accessed by calling:

```js
const plugin = hot.getPlugin('trimRows');
```

To trim a single row, call the [`trimRow()`](@/api/trimRows.md#trimrow) method of the plugin object:

```js
plugin.trimRow(4);
```
To trim multiple rows, either pass them as arguments to the [`trimRow()`](@/api/trimRows.md#trimrow) method, or pass an array of indexes to the [`trimRows()`](@/api/trimRows.md#trimrows) method:

```js
plugin.trimRow(0, 4, 6);
// or
plugin.trimRows([0, 4, 6]);
```

To restore the trimmed row(s), use the following methods:

```js
plugin.untrimRow(4);
```
```js
plugin.untrimRow(0, 4, 6);
```
```js
plugin.untrimRows([0, 4, 6]);
```

To see the changes made, call `hot.render();` to re-render the table.

## Related API reference

- Options:
  - [`trimRows`](@/api/options.md#trimrows)
- Hooks:
  - [`afterTrimRow`](@/api/hooks.md#aftertrimrow)
  - [`afterUntrimRow`](@/api/hooks.md#afteruntrimrow)
  - [`beforeTrimRow`](@/api/hooks.md#beforetrimrow)
  - [`beforeUntrimRow`](@/api/hooks.md#beforeuntrimrow)
- Plugins:
  - [`TrimRows`](@/api/trimRows.md)
