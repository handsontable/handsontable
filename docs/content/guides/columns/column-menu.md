---
title: Column menu
metaTitle: Column menu - JavaScript Data Grid | Handsontable
description: Display a configurable dropdown menu, triggered by clicking on a button in a column header.
permalink: /column-menu
canonicalUrl: /column-menu
tags:
  - dropdown menu
react:
  metaTitle: Column menu - React Data Grid | Handsontable
searchCategory: Guides
---

# Column menu

Display a configurable dropdown menu, triggered by clicking on a button in a column header.

[[toc]]

## Overview

The [`DropdownMenu`](@/api/dropdownMenu.md) plugin enables you to add a configurable dropdown menu to the table's column headers.
The dropdown menu acts like the **Context Menu** but is triggered by clicking the button in the header.

## Quick setup

To enable the plugin, set the [`dropdownMenu`](@/api/options.md#dropdownmenu) configuration option to `true` when initializing Handsontable.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
  ],
  colHeaders: true,
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
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
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
      ]}
      colHeaders={true}
      dropdownMenu={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Plugin configuration

To use the default dropdown contents, set it to `true`, or to customize it by setting it to use a custom list of actions. For the available entry options reference, see the [Context Menu demo](@/guides/accessories-and-menus/context-menu.md#page-specific).

::: only-for javascript
::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
  ],
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  dropdownMenu: [
    'remove_col',
    '---------',
    'make_read_only',
    '---------',
    'alignment'
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
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
      ]}
      colHeaders={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      dropdownMenu={[
        'remove_col',
        '---------',
        'make_read_only',
        '---------',
        'alignment'
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


## Related articles

### Related guides

- [Context menu](@/guides/accessories-and-menus/context-menu.md)

### Related API reference

- Configuration options:
  - [`dropdownMenu`](@/api/options.md#dropdownmenu)
- Hooks:
  - [`afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions)
  - [`afterDropdownMenuHide`](@/api/hooks.md#afterdropdownmenuhide)
  - [`afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)
  - [`beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)
  - [`beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow)
- Plugins:
  - [`DropdownMenu`](@/api/dropdownMenu.md)
