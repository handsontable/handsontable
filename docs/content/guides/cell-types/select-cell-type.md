---
title: Select cell type
metaTitle: Select cell type - JavaScript Data Grid | Handsontable
description: Use the select cell type to collect user input with a HTML <select> element that creates a multi-item dropdown menu.
permalink: /select-cell-type
canonicalUrl: /select-cell-type
react:
  metaTitle: Select cell type - React Data Grid | Handsontable
---

# Select cell type

[[toc]]

## Overview
The select cell type is a simpler form of the dropdown cell type.

## Usage
The select editor should be considered an example of how to write editors rather than used as a fully-featured editor. It is a much simpler form of the [Dropdown editor](@/guides/cell-types/dropdown-cell-type.md). We recommend that you use the latter in your projects.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30]
  ],
  colWidths: [50, 70, 50],
  colHeaders: true,
  columns: [
    {},
    {
      editor: 'select',
      selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda']
    },
    {}
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['2017', 'Honda', 10],
        ['2018', 'Toyota', 20],
        ['2019', 'Nissan', 30]
      ]}
      colWidths={[50, 70, 50]}
      colHeaders={true}
      columns={[
        {},
        {
          editor: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda']
        },
        {}
      ]}
      licenseKey="non-commercial-and-evaluation"
    />
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
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type.md)

### Related API reference

- Configuration options:
  - [`selectOptions`](@/api/options.md#selectoptions)
  - [`type`](@/api/options.md#type)
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
