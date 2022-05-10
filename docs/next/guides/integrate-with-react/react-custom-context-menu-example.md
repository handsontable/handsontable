---
title: 'Custom context menu in React'
metaTitle: 'Custom context menu in React - Guide - Handsontable Documentation'
permalink: /next/react-custom-context-menu-example
canonicalUrl: /react-custom-context-menu-example
---

# Custom context menu in React

[[toc]]

## Overview

The following example is an implementation of the `@handsontable/react` component with a custom Context Menu added using React.

## Example

::: example #example1 :react
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const hotSettings = {
  data: createSpreadsheetData(5, 5),
  colHeaders: true,
  height: 'auto',
  contextMenu: {
    items: {
      'row_above': {
        name: 'Insert row above this one (custom name)'
      },
      'row_below': {},
      'separator': ContextMenu.SEPARATOR,
      'clear_custom': {
        name: 'Clear all cells (custom)',
        callback: function() {
          this.clear();
        }
      }
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  return (
    <div>
      <HotTable
        id="hot"
        settings={hotSettings}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('example1'));
```

## Related articles

#### Related guides

- [Adding comments via the context menu](@/guides/cell-features/comments.md#adding-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)

#### Related blog articles

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

#### Related API reference

- Configuration options:
  - [`contextMenu`](@/api/options.md#contextmenu)
- Hooks:
  - [`afterContextMenuDefaultOptions`](@/api/hooks.md#aftercontextmenudefaultoptions)
  - [`afterContextMenuHide`](@/api/hooks.md#aftercontextmenuhide)
  - [`afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)
  - [`afterOnCellContextMenu`](@/api/hooks.md#afteroncellcontextmenu)
  - [`beforeContextMenuSetItems`](@/api/hooks.md#beforecontextmenusetitems)
  - [`beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow)
  - [`beforeOnCellContextMenu`](@/api/hooks.md#beforeoncellcontextmenu)
- Plugins:
  - [`ContextMenu`](@/api/contextMenu.md)