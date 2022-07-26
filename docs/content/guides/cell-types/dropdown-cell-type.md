---
title: Dropdown cell type
metaTitle: Dropdown cell type - Guide - Handsontable Documentation
permalink: /dropdown-cell-type
canonicalUrl: /dropdown-cell-type
---

# Dropdown cell type

[[toc]]

## Overview
The dropdown cell type is based on an autocomplete cell type and can also be searchable.

## Usage
This example shows the usage of the dropdown feature. Dropdown is based on [Autocomplete](@/guides/cell-types/autocomplete-cell-type.md) cell type. All options used by `autocomplete` cell type apply to `dropdown` as well.

Internally, cell `{type: 'dropdown'}` is equivalent to cell `{type: 'autocomplete', strict: true, filter: false}`. Therefore you can think of `dropdown` as a searchable `<select>`.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {},
    { type: 'numeric' },
    {
      type: 'dropdown',
      source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
    },
    {
      type: 'dropdown',
      source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
    }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::
::: only-for react
::: example #example1 :react
```jsx
import React, { Fragment, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {

  const hotSettings = {
    data: [
      ['Tesla', 2017, 'black', 'black'],
      ['Nissan', 2018, 'blue', 'blue'],
      ['Chrysler', 2019, 'yellow', 'black'],
      ['Volvo', 2020, 'white', 'gray']
    ],
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    columns: [
      {},
      { type: 'numeric' },
      {
        type: 'dropdown',
        source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
      },
      {
        type: 'dropdown',
        source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
      }
    ],
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


## Related articles

### Related guides

- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type.md)
- [Cell type](@/guides/cell-types/cell-type.md)
- [Select cell type](@/guides/cell-types/select-cell-type.md)

### Related API reference

- Configuration options:
  - [`allowHtml`](@/api/options.md#allowhtml)
  - [`source`](@/api/options.md#source)
  - [`trimDropdown`](@/api/options.md#trimdropdown)
  - [`type`](@/api/options.md#type)
  - [`visibleRows`](@/api/options.md#visiblerows)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)
