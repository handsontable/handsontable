---
type: tutorial
id: 38qivuj4
title: Custom context menu in Vue 3
metaTitle: Custom context menu - Vue 3 Data Grid | Handsontable
description: Customize the context menu of your Vue 3 data grid, by creating a custom function for each menu item.
permalink: /vue3-custom-context-menu-example
canonicalUrl: /vue3-custom-context-menu-example
react:
  id: rw3lzobe
  metaTitle: Custom context menu - Vue 3 Data Grid | Handsontable
angular:
  id: fp49yb44
  metaTitle: Custom context menu - Vue 3 Data Grid | Handsontable
vue:
  id: 8wqgvxxv
searchCategory: Guides
category: Integrate with Vue 3
---
In this tutorial, you will add custom items to the Handsontable context menu in a Vue 3 application. You will learn to define menu items with labels and callback functions.

[[toc]]

## Example

The following example implements the `@handsontable/vue3` component, adding a custom Context Menu.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3

@[code](@/content/guides/integrate-with-vue3/vue3-custom-context-menu-example/vue/example1.vue)

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Adding comments via the context menu](@/guides/cell-features/comments/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)

</div>

**Related blog articles**

<div class="boxes-list">

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

</div>

**Configuration options**

<div class="boxes-list">

- [allowInsertColumn](@/api/options.md#allowinsertcolumn)
- [allowInsertRow](@/api/options.md#allowinsertrow)
- [allowRemoveColumn](@/api/options.md#allowremovecolumn)
- [allowRemoveRow](@/api/options.md#allowremoverow)
- [contextMenu](@/api/options.md#contextmenu)
- [dropdownMenu](@/api/options.md#dropdownmenu)

</div>

**Hooks**

<div class="boxes-list">

- [afterContextMenuDefaultOptions](@/api/hooks.md#aftercontextmenudefaultoptions)
- [afterContextMenuHide](@/api/hooks.md#aftercontextmenuhide)
- [afterContextMenuShow](@/api/hooks.md#aftercontextmenushow)
- [afterDropdownMenuDefaultOptions](@/api/hooks.md#afterdropdownmenudefaultoptions)
- [afterDropdownMenuHide](@/api/hooks.md#afterdropdownmenuhide)
- [afterDropdownMenuShow](@/api/hooks.md#afterdropdownmenushow)
- [afterOnCellContextMenu](@/api/hooks.md#afteroncellcontextmenu)
- [beforeContextMenuSetItems](@/api/hooks.md#beforecontextmenusetitems)
- [beforeContextMenuShow](@/api/hooks.md#beforecontextmenushow)
- [beforeDropdownMenuSetItems](@/api/hooks.md#beforedropdownmenusetitems)
- [beforeDropdownMenuShow](@/api/hooks.md#beforedropdownmenushow)
- [beforeOnCellContextMenu](@/api/hooks.md#beforeoncellcontextmenu)

</div>

**Plugins**

<div class="boxes-list">

- [ContextMenu](@/api/contextMenu.md)

</div>

## What you learned

- How to enable the context menu in a Vue 3 Handsontable application.
- How to define custom menu items with labels and callback functions.
- How to restrict menu items to specific contexts using the `contextMenu` option.

## Next steps

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) -- explore the full context menu API.
- [Custom editor in Vue 3](@/guides/integrate-with-vue3/vue3-custom-editor-example/vue3-custom-editor-example.md) -- build a custom cell editor.
- [Custom renderer in Vue 3](@/guides/integrate-with-vue3/vue3-custom-renderer-example/vue3-custom-renderer-example.md) -- build a custom cell renderer.
