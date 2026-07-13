---
type: how-to
title: Text alignment
metaTitle: Text alignment - JavaScript Data Grid | Handsontable
description: "Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell)."
permalink: /text-alignment
canonicalUrl: /text-alignment
tags:
  - align
  - alignment
  - text-align
  - horizontal-alignment
  - vertical-alignment
  - justify
react:
  metaTitle: Text alignment - React Data Grid | Handsontable
angular:
  metaTitle: Text alignment - Angular Data Grid | Handsontable
vue:
  metaTitle: Text alignment - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell).

[[toc]]

Apply text alignment to cells using CSS class names or the `className` configuration option.

## Overview

You can set cell alignment in two ways:

| Configuration option<br>`className`/`cells` | Context menu<br>`alignment` item |
|---|---|
| Set programmatically, for the whole grid, a column, or individual cells | Set interactively, by the person using the grid |
| Requires no additional plugin | Requires the [`ContextMenu`](@/guides/accessories-and-menus/context-menu/context-menu.md) plugin, with the `alignment` item enabled |
| Not tracked by [`UndoRedo`](@/guides/accessories-and-menus/undo-redo/undo-redo.md) | Tracked by [`UndoRedo`](@/guides/accessories-and-menus/undo-redo/undo-redo.md) |

## To align a cell

To set alignment for individual cells, configure them using the [`cells`](@/api/options.md#cells) option or the [`cell`](@/api/options.md#cell) array. Available class names:

- Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`
- Vertical: `htTop`, `htMiddle`, `htBottom`

You can track alignment changes by using the [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta) hook.

## To align a column

To apply alignment globally or per column, provide the alignment details in the [`className`](@/api/options.md#classname) option, for example:

::: only-for javascript

```js
className: 'htCenter'
```

:::

::: only-for react

```jsx
className="htCenter"
```

:::

::: only-for angular

```ts
settings = { className: "htCenter" };
```

:::

::: only-for vue

```js
const hotSettings = {
  className: 'htCenter',
};
```

:::

## Align cells using the context menu

Let the person using the grid set alignment interactively, through the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

Enable the `ContextMenu` plugin and include the `alignment` item:

```js
contextMenu: ['alignment'],
```

Select one or more cells, right-click to open the context menu, and choose an option from the **Align** submenu:

- Horizontal: **Left**, **Center**, **Right**, **Justify**
- Vertical: **Top**, **Middle**, **Bottom**

Each option sets the matching CSS class name (`htLeft`, `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, `htBottom`) on the selected cells, and fires the [`beforeCellAlignment`](@/api/hooks.md#beforecellalignment) hook before applying the change.

### Undo and redo alignment changes

Alignment changes made through the context menu are tracked by the [`UndoRedo`](@/guides/accessories-and-menus/undo-redo/undo-redo.md) plugin. Press <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Z**</kbd> to undo an alignment change, and <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Y**</kbd> to redo it.

Alignment changes made through the `className` or `cells` configuration options aren't tracked by `UndoRedo`.

## Basic example

The following code sample configures the grid to use `htCenter` and configures individual cells to use different alignments.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/text-alignment/javascript/example1.js)
@[code](@/content/guides/cell-features/text-alignment/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/text-alignment/react/example1.jsx)
@[code](@/content/guides/cell-features/text-alignment/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/text-alignment/angular/example1.ts)
@[code](@/content/guides/cell-features/text-alignment/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/text-alignment/vue/example1.vue)

:::

:::

## Result

Cells display the configured horizontal or vertical alignment. Global settings apply to all cells, and per-cell settings take precedence over the global defaults.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [className](@/api/options.md#classname)
- [contextMenu](@/api/options.md#contextmenu)

</div>

**Hooks**

<div class="boxes-list">

- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeCellAlignment](@/api/hooks.md#beforecellalignment)

</div>

**Plugins**

<div class="boxes-list">

- [ContextMenu](@/api/contextMenu.md)
- [UndoRedo](@/api/undoRedo.md)

</div>
