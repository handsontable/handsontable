---
id: d4l2e6vr
title: Custom context menu in Angular
metaTitle: Custom context menu - Angular Data Grid | Handsontable
description: Customize the context menu of your Angular data grid, by creating a custom function for each menu item.
permalink: /angular-custom-context-menu-example
canonicalUrl: /angular-custom-context-menu-example
react:
  id: y1xxl0xk
  metaTitle: Custom context menu - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Custom context menu in Angular

Customize the context menu of your Angular data grid, by creating a custom function for each menu item.

[[toc]]

## Example

The following is an implementation of the `@handsontable/angular` component with a custom context menu added.

::: example :angular --html 1 --js 2

@[code](@/content/guides/integrate-with-angular/angular-custom-context-menu-example/angular/example1.html)
@[code](@/content/guides/integrate-with-angular/angular-custom-context-menu-example/angular/example1.js)

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Adding comments via the context menu](@/guides/cell-features/comments/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)

</div>

### Related blog articles

<div class="boxes-list">

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

</div>

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
