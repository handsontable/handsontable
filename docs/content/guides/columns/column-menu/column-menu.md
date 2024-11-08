---
id: 25b7vhfs
title: Column menu
metaTitle: Column menu - JavaScript Data Grid | Handsontable
description: Display a configurable dropdown menu, triggered by clicking on a button in a column header.
permalink: /column-menu
canonicalUrl: /column-menu
tags:
  - dropdown menu
react:
  id: uc7w8gu1
  metaTitle: Column menu - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column menu

Display a configurable dropdown menu, triggered by clicking on a button in a column header.

[[toc]]

## Overview

The [`DropdownMenu`](@/api/dropdownMenu.md) plugin enables you to add a configurable dropdown menu to the table's column headers.
The dropdown menu acts like the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) but is triggered by clicking the button in the header.

## Quick setup

To enable the plugin, set the [`dropdownMenu`](@/api/options.md#dropdownmenu) configuration option to `true` when initializing Handsontable.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-menu/javascript/example1.js)
@[code](@/content/guides/columns/column-menu/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-menu/react/example1.jsx)
@[code](@/content/guides/columns/column-menu/react/example1.tsx)

:::

:::

## Plugin configuration

To use the default dropdown contents, set it to `true`, or to customize it by setting it to use a custom list of actions. For the available entry options reference, see the [Context Menu demo](@/guides/accessories-and-menus/context-menu/context-menu.md#page-specific).

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-menu/javascript/example2.js)
@[code](@/content/guides/columns/column-menu/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-menu/react/example2.jsx)
@[code](@/content/guides/columns/column-menu/react/example2.tsx)

:::

:::

## Related keyboard shortcuts

| Windows                                                  | macOS                                                       | Action                                                                                                       |  Excel  | Sheets  |
| -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | :-----: | :-----: |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> | <kbd>**Shift**</kbd>+<kbd>**Option**</kbd>+<kbd>**↓**</kbd> | Open the column menu. Works in any cell, if the respective column header displays the menu button.           | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>                | <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>                   | Open the column menu. Works only when you're selecting a column header that displays the column menu button. | &cross; | &cross; |

## Related articles

### Related guides

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

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
