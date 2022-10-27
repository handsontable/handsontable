---
title: Password cell type
metaTitle: Password cell type - JavaScript Data Grid | Handsontable
description: Use the password cell type to mask confidential values by rendering entered characters as symbols.
permalink: /password-cell-type
canonicalUrl: /password-cell-type
react:
  metaTitle: Password cell type - React Data Grid | Handsontable
searchCategory: Guides
---

# Password cell type

Use the password cell type to mask confidential values by rendering entered characters as symbols.

[[toc]]

## Overview

The password cell type behaves like a text cell, the only difference being that it masks its value using asterisks in the cell renderer. An `<input type="password">` field is used for the cell editor. Data is stored in the data source as plain text.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password' }
  ]
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
        { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
        { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
      ]}
      colHeaders={['ID', 'First name', 'Last name', 'Password']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'password', type: 'password' }
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Fixed hash length

By default, every hash has a length equal to the length of its corresponding value. Use option `hashLength` to set a fixed hash length.

::: only-for javascript
::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password', hashLength: 10 }
  ]
});
```
:::
:::

::: only-for react
::: example #example2 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
        { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
        { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
      ]}
      colHeaders={['ID', 'First name', 'Last name', 'Password']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'password', type: 'password', hashLength: 10 }
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```
:::
:::


## Custom hash symbol

By default, every hash consists of asterisks `*`. Use the option `hashSymbol` to set a custom hash symbol. You can use any character, entity, or even HTML. Note that you can't change the symbol used by the input field due to browser limitations.

::: only-for javascript
::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password', hashSymbol: '&#9632;' }
  ]
});
```
:::
:::

::: only-for react
::: example #example3 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
        { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
        { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
      ]}
      colHeaders={['ID', 'First name', 'Last name', 'Password']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'password', type: 'password', hashSymbol: '&#9632;' }
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```
:::
:::


## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

### Related API reference

- Configuration options:
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
