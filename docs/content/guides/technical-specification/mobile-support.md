---
id: da14qoxl
title: Mobile support
metaTitle: Mobile support - JavaScript Data Grid | Handsontable
description: Although Handsontable is designed primarily for desktop, many of its features work on mobile as well.
permalink: /mobile-support
canonicalUrl: /mobile-support
tags:
  - mobile
  - device
  - tablet
  - ios
  - android
  - iphone
  - ipad
react:
  id: 6z0c6tlj
  metaTitle: Mobile support - React Data Grid | Handsontable
searchCategory: Guides
---

# Mobile support

Although Handsontable is designed primarily for desktop, many of its features work on mobile as well.

[[toc]]

## Use Handsontable on mobile

Learn how to use Handsontable's UI on a mobile device.

| How to...                                             | Usage                                            | Android |   iOS   |
| ----------------------------------------------------- | ------------------------------------------------ | :-----: | :-----: |
| Select a cell                                         | Tap a cell                                       | &check; | &check; |
| Edit a cell                                           | Double-tap a cell                                | &check; | &check; |
| Sort the data                                         | Tap a column name                                | &check; | &check; |
| Select a range of cells                               | Drag the [selection handles](#selection-handles) | &check; | &check; |
| Scroll vertically                                     | Swipe up or down                                 | &check; | &check; |
| Scroll horizontally                                   | Swipe left or right                              | &check; | &check; |
| Change to portrait or landscape mode                  | Rotate the screen                                | &check; | &check; |
| Open the column menu                                  | In a column header, tap &#9660;                  | &check; | &check; |
| Open the context menu[<sup>*</sup>](#troubleshooting) | Long-press a cell                                | &check; | &cross; |
| Interact with menus                                   | Tap a menu item                                  | &check; | &check; |

#### Selection handles

To select a range of cells, drag the selection handles. They display only on mobile.

![Selection handles]({{$basePath}}/img/selection_handles.png)

## Features supported on mobile

See the following table for the list of features that work
on the [supported mobile browsers](@/guides/technical-specification/supported-browsers.md#supported-mobile-browsers).

As desktop is our priority, we test only selected Handsontable functionalities on mobile.
Features not mentioned in the table may well work properly, but we don't test them on mobile devices.

| Feature                                                                                        | Android (Chrome) | iOS (Chrome) | iOS (Safari) |
| ---------------------------------------------------------------------------------------------- | :--------------: | :----------: | :----------: |
| All the built-in [cell types](@/guides/cell-types/cell-type.md)                                |     &check;      |   &check;    |   &check;    |
| Insert rows                                                                                    |     &check;      |   &check;    |   &check;    |
| Insert columns                                                                                 |     &check;      |   &check;    |   &check;    |
| Remove rows                                                                                    |     &check;      |   &check;    |   &check;    |
| Remove columns                                                                                 |     &check;      |   &check;    |   &check;    |
| [Column headers](@/guides/columns/column-header.md)                                            |     &check;      |   &check;    |   &check;    |
| [Column groups](@/guides/columns/column-groups.md)                                             |     &check;      |   &check;    |   &check;    |
| [Column hiding](@/guides/columns/column-hiding.md)                                             |     &check;      |   &check;    |   &check;    |
| [Column summary](@/guides/columns/column-summary.md)                                           |     &check;      |   &check;    |   &check;    |
| [Column virtualization](@/guides/columns/column-virtualization.md)                             |     &check;      |   &check;    |   &check;    |
| [Column menu](@/guides/columns/column-menu.md)                                                 |     &check;      |   &check;    |   &check;    |
| [Column filter](@/guides/columns/column-filter.md)                                             |     &check;      |   &check;    |   &check;    |
| [Row headers](@/guides/rows/row-header.md)                                                     |     &check;      |   &check;    |   &check;    |
| [Row parent-child](@/guides/rows/row-parent-child.md)                                          |     &check;      |   &check;    |   &check;    |
| [Row hiding](@/guides/rows/row-hiding.md)                                                      |     &check;      |   &check;    |   &check;    |
| [Row virtualization](@/guides/rows/row-virtualization.md)                                      |     &check;      |   &check;    |   &check;    |
| [Rows sorting](@/guides/rows/row-sorting.md)                                                   |     &check;      |   &check;    |   &check;    |
| [Row trimming](@/guides/rows/row-trimming.md)                                                  |     &check;      |   &check;    |   &check;    |
| [Clipboard](@/guides/cell-features/clipboard.md)                                               |     &check;      |   &check;    |   &check;    |
| [Merge cells](@/guides/cell-features/merge-cells.md)                                           |     &check;      |   &check;    |   &check;    |
| [Conditional formatting](@/guides/cell-features/conditional-formatting.md)                     |     &check;      |   &check;    |   &check;    |
| [Text alignment](@/guides/cell-features/text-alignment.md)                                     |     &check;      |   &check;    |   &check;    |
| [Disabled cells](@/guides/cell-features/disabled-cells.md)                                     |     &check;      |   &check;    |   &check;    |
| [Formula calculation](@/guides/formulas/formula-calculation.md)                                |     &check;      |   &check;    |   &check;    |
| [Context menu](@/guides/accessories-and-menus/context-menu.md)[<sup>*</sup>](#troubleshooting) |     &check;      |   &cross;    |   &cross;    |
| [Undo and redo](@/guides/accessories-and-menus/undo-redo.md)                                   |     &check;      |   &check;    |   &check;    |
| [Searching values](@/guides/accessories-and-menus/searching-values.md)                         |     &check;      |   &check;    |   &check;    |

<sup>*</sup>Although the context menu is not supported on iOS,
you can easily assign all of its actions to the [column menu](@/guides/columns/column-menu.md).

## Troubleshooting

Didn't find what you need? Try this:

- View [GitHub issues](https://github.com/handsontable/handsontable/issues?q=is%3Aissue+is%3Aopen+mobile+label%3Abug+label%3AMobile) related to mobile support.
- Report a [new GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose).
- Ask a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/handsontable).
- Ask a question on [Handsontable's forum](https://forum.handsontable.com/c/getting-help/questions).
- Contact Handsontable's [technical support](https://handsontable.com/contact?category=technical_support).