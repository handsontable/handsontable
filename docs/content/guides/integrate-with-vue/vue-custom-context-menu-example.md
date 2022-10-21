---
title: Custom context menu in Vue 2
metaTitle: Custom context menu - Vue 2 Data Grid | Handsontable
description: Customize the right-click context menu of your Vue 2 data grid, by creating a custom function for each menu item.
permalink: /vue-custom-context-menu-example
canonicalUrl: /vue-custom-context-menu-example
searchCategory: Guides
---

# Custom context menu in Vue 2

Customize the right-click context menu of your Vue 2 data grid, by creating a custom function for each menu item.

[[toc]]

## Example

The following example implements the `@handsontable/vue` component, adding a custom Context Menu.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import { HotTable } from '@handsontable/vue';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          ['A1', 'B1', 'C1', 'D1', 'E1'],
          ['A2', 'B2', 'C2', 'D2', 'E2'],
          ['A3', 'B3', 'C3', 'D3', 'E3'],
          ['A4', 'B4', 'C4', 'D4', 'E4'],
          ['A5', 'B5', 'C5', 'D5', 'E5'],
        ],
        colHeaders: true,
        contextMenu: {
          items: {
            'row_above': {
              name: 'Insert row above this one (custom name)'
            },
            'row_below': {},
            'separator': ContextMenu.SEPARATOR,
            'clear_custom': {
              name: 'Clear all cells (custom)',
              callback() {
                this.clear();
              }
            }
          }
        },
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  components: {
    HotTable
  }
}

export default ExampleComponent;

/* start:non-previewable */
new Vue({
  ...ExampleComponent,
  el: '#example1',
});
/* end:non-previewable */
```
:::

## Related articles

### Related guides

- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Adding comments via the context menu](@/guides/cell-features/comments.md#adding-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)

### Related blog articles

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

### Related API reference

- Configuration options:
  - [`allowInsertColumn`](@/api/options.md#allowinsertcolumn)
  - [`allowInsertRow`](@/api/options.md#allowinsertrow)
  - [`allowRemoveColumn`](@/api/options.md#allowremovecolumn)
  - [`allowRemoveRow`](@/api/options.md#allowremoverow)
  - [`contextMenu`](@/api/options.md#contextmenu)
  - [`dropdownMenu`](@/api/options.md#dropdownmenu)
- Hooks:
  - [`afterContextMenuDefaultOptions`](@/api/hooks.md#aftercontextmenudefaultoptions)
  - [`afterContextMenuHide`](@/api/hooks.md#aftercontextmenuhide)
  - [`afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)
  - [`afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions)
  - [`afterDropdownMenuHide`](@/api/hooks.md#afterdropdownmenuhide)
  - [`afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)
  - [`afterOnCellContextMenu`](@/api/hooks.md#afteroncellcontextmenu)
  - [`beforeContextMenuSetItems`](@/api/hooks.md#beforecontextmenusetitems)
  - [`beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow)
  - [`beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)
  - [`beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow)
  - [`beforeOnCellContextMenu`](@/api/hooks.md#beforeoncellcontextmenu)
- Plugins:
  - [`ContextMenu`](@/api/contextMenu.md)
