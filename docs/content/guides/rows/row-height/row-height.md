---
type: how-to
title: Row heights
metaTitle: Row heights | Handsontable DataGrid for JavaScript
description: Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable DataGrid's interface.
permalink: /row-height
canonicalUrl: /row-height
tags:
  - resizing rows
  - wrap content
  - overflow
  - crop content
  - row size
  - height
  - max-height
  - min-height
  - row dimensions
  - manual resize
  - text truncation
  - line clamp
  - ellipsis
react:
  metaTitle: Row heights | Handsontable DataGrid for React
angular:
  metaTitle: Row heights | Handsontable DataGrid for Angular
vue:
  metaTitle: Row heights | Handsontable DataGrid for Vue
searchCategory: Guides
category: Rows
menuTag: updated
---
Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable DataGrid's interface.

[[toc]]

## Overview

The default row height is calculated based on the used theme's line height, vertical padding and cell border values and in the `main` theme it's 29px, in the `horizon` it's 37px and in the `classic` styles it's 26 px. Unless configured otherwise, Handsontable assumes that your cell contents fit in this default row height.

Two options set row heights, and they differ in what happens when the content doesn't fit:

| Option                                          | Row height                                       | Content taller than the row   |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| [`rowHeights`](@/api/options.md#rowheights)     | Exactly the height you set, even below default   | Clipped                       |
| [`minRowHeights`](@/api/options.md#minrowheights) | At least the height you set, never below default | Grows the row to fit          |

Both options accept a [number](#set-row-heights-to-a-number), an [array](#set-row-heights-with-an-array), or a [function](#set-row-heights-with-a-function). You can set both: `rowHeights` sets the rows it gives a height, and `minRowHeights` applies to the others. When you enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin, `rowHeights` is a minimum too, because the plugin lets each row grow to fit its content.

If your cell contents require heights greater than default (because you use multiline text, or [custom renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md), or custom styles), and you don't want them clipped, use one of the following configurations to avoid potential layout problems:
  - Configure your row heights in advance: set the [`minRowHeights`](@/api/options.md#minrowheights) option to a [number](#set-row-heights-to-a-number), or an [array](#set-row-heights-with-an-array), or a [function](#set-row-heights-with-a-function). This requires you to know the heights beforehand, but results in the best runtime performance.
  - Set the [`manualRowResize`](@/api/options.md#manualrowresize) option to an array, to configure initial row heights and let your users [adjust the row heights manually](#adjust-row-heights-manually).
  - Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin, by setting `autoRowSize: true`. This tells Handsontable to measure the actual row heights in the DOM. It impacts runtime performance but is accurate. Also enable `AutoRowSize` if you call [`scrollViewportTo()`](@/api/core.md#scrollviewportto) -- the method relies on accurate row height measurements to scroll to the correct position.

To make rows shorter than the default row height, for example to use empty rows as separators, set [`rowHeights`](@/api/options.md#rowheights) and leave `AutoRowSize` off. The [`ManualRowResize`](@/api/manualRowResize.md) plugin doesn't make a row shorter than the default row height. When it is enabled, a row that a `rowHeights` height covers stays at the height the user drags it to and clips its content, and a row that `rowHeights` gives no height grows to fit its content.

Content that doesn't fit an exact row stays in the DOM and screen readers read it, but it is cut off on the screen. A row doesn't grow when a user enlarges the text or overrides the text spacing, so leave room for it, or use `minRowHeights`.

## Set row heights to a number

We set the same height of `40px` for all rows across the entire grid in this example.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example1.js)
@[code](@/content/guides/rows/row-height/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example1.jsx)
@[code](@/content/guides/rows/row-height/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-height/angular/example1.ts)
@[code](@/content/guides/rows/row-height/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-height/vue/example1.vue)

:::

:::

## Set row heights with an array

In this example, the height is only set for the first rows. Each additional row would be automatically adjusted to the content.

The `rowHeights` and `minRowHeights` arrays and functions address rows by their physical index, so a height stays with its row when rows are moved with [`ManualRowMove`](@/api/manualRowMove.md), sorted, filtered, or collapsed with [`NestedRows`](@/api/nestedRows.md). The physical index doesn't change in any of those cases. A row that `NestedRows` moves by dragging or detaching takes a new physical index: an array entry follows the row, but a function is called with the new index. When you insert or remove rows, each height of an array stays with its row: a row inserted between others has no height of its own, and a row added after the last one takes the next entry. Handsontable never changes the array you pass. A function is called with the physical index the row has now, so after an insert or a removal it gets the index of the row's new position. To read the physical index of a row on the screen, use [`toPhysicalRow()`](@/api/core.md#tophysicalrow).

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example2.js)
@[code](@/content/guides/rows/row-height/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example2.jsx)
@[code](@/content/guides/rows/row-height/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-height/angular/example2.ts)
@[code](@/content/guides/rows/row-height/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/rows/row-height/vue/example2.vue)

:::

:::

## Set row heights with a function

The row height can be set using a function. In this example, the size of all rows is set using a function that takes a row's physical `index` (0, 1, 2 ...), adds one, and multiplies the result by `20px`, so the first row is `20px` high, the second `40px`, and so on.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example3.js)
@[code](@/content/guides/rows/row-height/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example3.jsx)
@[code](@/content/guides/rows/row-height/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-height/angular/example3.ts)
@[code](@/content/guides/rows/row-height/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/rows/row-height/vue/example3.vue)

:::

:::

## Adjust row heights manually

Set the option [`manualRowResize`](@/api/options.md#manualrowresize) to `true` to allow users to manually resize the row height by dragging the handle between the adjacent row headers. Don't forget to enable row headers by setting [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

You can adjust the size of one or multiple rows simultaneously, even if the selected rows are not placed next to each other.

::: tip

When you set a row height programmatically with [`ManualRowResize#setManualSize()`](@/api/manualRowResize.md#setmanualsize), call `hot.render()` after the method call to repaint the grid. Values below the theme's default row height are stored as the default row height.

:::

A row resized this way keeps its height, and that height wins over the [`rowHeights`](@/api/options.md#rowheights) option. To hand control back to the option, pass `rowHeights` to [`updateSettings()`](@/api/core.md#updatesettings). That re-declares the heights and discards the stored ones:

```js
// every row is 50px again, including the rows the user dragged
hot.updateSettings({ rowHeights: 50 });
```

To resize rows without discarding what the user dragged, leave `rowHeights` out of the call. To replace the stored heights with your own, pass [`manualRowResize`](@/api/options.md#manualrowresize) as an array. You can also clear them yourself with [`ManualRowResize#clearManualSize()`](@/api/manualRowResize.md#clearmanualsize) for one row, or [`clearManualSizes()`](@/api/manualRowResize.md#clearmanualsizes) for all of them, followed by `hot.render()`.

::: tip

These cases never discard the stored heights, so passing `rowHeights` does not reset anything:

- `rowHeights` set to a function. A function states no fixed height, so the stored heights are left alone.
- A grid whose [`manualRowResize`](@/api/options.md#manualrowresize) option is already a non-empty array. The plugin replays that array, so the stored heights stay.
- The React, Angular and Vue wrappers, where a `rowHeights` prop whose value did not change is not forwarded to `updateSettings()`. Re-applying the same value is not an update.

In each case, clear the heights explicitly.

:::

```js
hot.getPlugin('manualRowResize').clearManualSizes();
hot.render();
```

::: only-for javascript

Try it in the demo below: drag the bottom edge of a row header to resize a row, then select **Clear manual sizes**, which runs the snippet above.

::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/row-height/javascript/example4.html)
@[code](@/content/guides/rows/row-height/javascript/example4.js)
@[code](@/content/guides/rows/row-height/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example4.jsx)
@[code](@/content/guides/rows/row-height/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-height/angular/example4.ts)
@[code](@/content/guides/rows/row-height/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/rows/row-height/vue/example4.vue)

:::

:::

## Limit the number of lines in a cell

Long text makes a row taller. To keep rows compact, set the [`textEllipsis`](@/api/options.md#textellipsis) option to a number. Handsontable shows that many lines of text and ends the last visible line with an ellipsis (`…`). The row grows only up to that number of lines.

| `textEllipsis` value                | Result                                                |
| ----------------------------------- | ----------------------------------------------------- |
| `false` (default)                   | The text wraps and the row grows to fit all of it.    |
| `true` or `1`                       | The text stays on one line and ends with an ellipsis. |
| An integer of `2` or more           | The text wraps, but only that many lines are visible. |
| Any other number (`0`, `-1`, `2.5`) | Works like `false`.                                   |

The truncation only changes how the cell looks. The full text stays in the cell data and in copied data, and the cell editor opens with the full text.

You can set `textEllipsis` at the grid, column, and cell level, like other [cascading options](@/guides/configuration/configuration-option-levels/configuration-option-levels.md). To override a column for a single cell, return a different value from the [`cells`](@/api/options.md#cells) function.

The `autocomplete`, `dropdown`, and `handsontable` cell types set `textEllipsis: true` themselves, so a grid-level number does not reach their columns. To show a number of lines in them, set the number on the column (or in `cells`).

A number works in cells that render plain text, such as the `text`, `numeric`, `date`, `time`, `select`, `autocomplete`, and `dropdown` cell types. Cells with their own markup, such as cells that use the `html` renderer, can't clamp. For them a number works like `true`: the text stays on one line and ends with an ellipsis.

If you set [`wordWrap`](@/api/options.md#wordwrap) to `false`, the text can't wrap. The cell then keeps the text on one line and ends it with an ellipsis, whatever number you set.

In this example, the **Note** column shows two lines of each note. The rows stay compact, however long the text is. Without `textEllipsis`, the longest notes would make their rows five lines tall.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example5.js)
@[code](@/content/guides/rows/row-height/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example5.jsx)
@[code](@/content/guides/rows/row-height/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-height/angular/example5.ts)
@[code](@/content/guides/rows/row-height/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/rows/row-height/vue/example5.vue)

:::

:::

::: tip

When the [`AutoRowSize`](@/api/autoRowSize.md) plugin is enabled and you change `textEllipsis` with [`updateSettings()`](@/api/core.md#updatesettings), call [`recalculateAllRowsHeight()`](@/api/autoRowSize.md#recalculateallrowsheight) afterwards, so the rows get the new height.

:::

## Related API reference

**Configuration options**

<div class="boxes-list">

- [autoRowSize](@/api/options.md#autorowsize)
- [manualRowResize](@/api/options.md#manualrowresize)
- [minRowHeights](@/api/options.md#minRowHeights)
- [textEllipsis](@/api/options.md#textellipsis)
- [wordWrap](@/api/options.md#wordwrap)

</div>

**Core methods**

<div class="boxes-list">

- [getRowHeight()](@/api/core.md#getrowheight)
- [scrollViewportTo()](@/api/core.md#scrollviewportto)

</div>

**Hooks**

<div class="boxes-list">

- [afterRowResize](@/api/hooks.md#afterrowresize)
- [beforeRowResize](@/api/hooks.md#beforerowresize)
- [modifyRowHeight](@/api/hooks.md#modifyrowheight)

</div>

**Plugins**

<div class="boxes-list">

- [AutoRowSize](@/api/autoRowSize.md)
- [ManualRowResize](@/api/manualRowResize.md)

</div>
