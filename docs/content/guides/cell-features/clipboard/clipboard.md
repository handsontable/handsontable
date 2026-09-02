---
type: how-to
title: Clipboard
metaTitle: Clipboard - JavaScript Data Grid | Handsontable
description: Copy data from selected cells to the clipboard, using the "Ctrl/Cmd + C" shortcut or the context menu. Control the clipboard with Handsontable's API.
permalink: /basic-clipboard
canonicalUrl: /basic-clipboard
tags:
  - copy
  - cut
  - paste
react:
  metaTitle: Clipboard - React Data Grid | Handsontable
angular:
  metaTitle: Clipboard - Angular Data Grid | Handsontable
vue:
  metaTitle: Clipboard - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Copy data from selected cells to the system clipboard.

[[toc]]

Handsontable supports copy, cut, and paste via the browser clipboard API and keyboard shortcuts. Configure clipboard behavior to control what data users can copy or paste.

## Overview

You can copy or cut data from Handsontable to the system clipboard, either manually (using the context menu or the <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**C**</kbd>/<kbd>**X**</kbd> shortcuts) or programmatically (using Handsontable's API methods).

## Copy & cut

Copy & Cut actions allow exporting data from Handsontable to the system clipboard. The [`CopyPaste`](@/api/copyPaste.md) plugin copies and cuts data as a `text/plain` and a `text/html` MIME-type.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**C**</kbd> - copies the content of the last cell in the selected range
- <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**X**</kbd> - cuts the content of the last cell in the selected range

Available options in the browser's toolbar:

- `Edit > Copy` - copies the content of the last cell in the selected range
- `Edit > Cut` - cuts the content of the last cell in the selected range

To let the end user copy the contents of column headers, see the [Copy with headers](#copy-with-headers) section.

### Context menu

When the context menu is enabled, it includes default items, including copy & cut options.

- Copy - as a predefined key `copy`
- Cut - as a predefined key `cut`

You can use them in the same way as the rest of the predefined items in the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options). These operations are executed by `document.execCommand()`.

::: only-for javascript
::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/javascript/example1.js)
@[code](@/content/guides/cell-features/clipboard/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/react/example1.jsx)
@[code](@/content/guides/cell-features/clipboard/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clipboard/angular/example1.ts)
@[code](@/content/guides/cell-features/clipboard/angular/example1.html)

:::
:::

::: only-for vue
::: example #example1 :vue3

@[code](@/content/guides/cell-features/clipboard/vue/example1.vue)

:::
:::

### Trigger copy & cut programmatically

::: only-for react
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::
:::

::: only-for angular
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::
:::

::: only-for vue
::: tip

To use the Handsontable API, add a template `ref` on `<HotTable>` and read `hotTableRef.value?.hotInstance`.

:::
:::

First, select a cell range to copy or cut.

```js
hot.selectCell(1, 1);
```

Then use one of the following commands:

* `document.execCommand('copy')`
* `document.execCommand('cut')`

The [`CopyPaste`](@/api/copyPaste.md) plugin listens to the browser's `copy` and `cut` events. If triggered, our implementation will copy or cut the selected data to the system clipboard.

::: only-for javascript
::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/clipboard/javascript/example3.html)
@[code](@/content/guides/cell-features/clipboard/javascript/example3.js)
@[code](@/content/guides/cell-features/clipboard/javascript/example3.ts)

:::
:::

::: only-for react
::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/react/example3.jsx)
@[code](@/content/guides/cell-features/clipboard/react/example3.tsx)

:::
:::

::: only-for angular
::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clipboard/angular/example3.ts)
@[code](@/content/guides/cell-features/clipboard/angular/example3.html)

:::
:::

::: only-for vue
::: example #example3 :vue3

@[code](@/content/guides/cell-features/clipboard/vue/example3.vue)

:::
:::

Mind that some of Handsontable's selection-related methods don't set focus on your grid automatically. To make sure that your grid is focused, call [`isListening()`](@/api/core.md#islistening) before you copy, cut or paste data.

### Hooks

The [`CopyPaste`](@/api/copyPaste.md) plugin exposes the following hooks to manipulate data during copy or cut operations:

- [`beforeCopy`](@/api/hooks.md#beforecopy)
- [`afterCopy`](@/api/hooks.md#aftercopy)
- [`beforeCut`](@/api/hooks.md#beforecut)
- [`afterCut`](@/api/hooks.md#aftercut)

Examples of how to use them are provided in their descriptions.

### Copy with headers

You can let the end user copy the contents of column headers, by enabling additional [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) items:

<span class="img-light">

![copy_with_headers_light](/img/pages/clipboard/copy-with-headers-light.png)

</span>

<span class="img-dark">

![copy_with_headers_dark](/img/pages/clipboard/copy-with-headers-dark.png)

</span>

Right-click on a cell to try it out:

::: only-for javascript
::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/javascript/example2.js)
@[code](@/content/guides/cell-features/clipboard/javascript/example2.ts)

:::
:::

::: only-for react
::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/react/example2.jsx)
@[code](@/content/guides/cell-features/clipboard/react/example2.tsx)

:::
:::

::: only-for angular
::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clipboard/angular/example2.ts)
@[code](@/content/guides/cell-features/clipboard/angular/example2.html)

:::
:::

::: only-for vue
::: example #example2 :vue3

@[code](@/content/guides/cell-features/clipboard/vue/example2.vue)

:::
:::

To add the context menu items, configure the [`CopyPaste`](@/api/copyPaste.md) plugin with these options:

- [`copyColumnHeaders`](@/api/options.md#copypaste-additional-options)
- [`copyColumnGroupHeaders`](@/api/options.md#copypaste-additional-options)
- [`copyColumnHeadersOnly`](@/api/options.md#copypaste-additional-options)

```js
copyPaste: {
  copyColumnHeaders: true,
  copyColumnGroupHeaders: true,
  copyColumnHeadersOnly: true,
}
```

To copy column headers programmatically, call the [`copyPaste.copy()`](@/api/copyPaste.md#copy) method with these arguments:

- [`'with-column-headers'`](@/api/copyPaste.md#copy)
- [`'with-all-column-headers'`](@/api/copyPaste.md#copy)
- [`'column-headers-only'`](@/api/copyPaste.md#copy)

::: only-for react
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::
:::

::: only-for angular
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::
:::

::: only-for vue
::: tip

To use the Handsontable API, add a template `ref` on `<HotTable>` and read `hotTableRef.value?.hotInstance`.

:::
:::

```js
// access the `CopyPaste` plugin instance
const copyPastePlugin = hot.getPlugin('copyPaste');

// select some cells
hot.selectCell(1, 1);

// copy the selected cells along with their nearest column headers
copyPastePlugin.copy('with-column-headers');

// copy the selected cells along with all their related columns
// headers
copyPastePlugin.copy('with-all-column-headers');

// copy the column headers nearest to the selected cells
// (without copying the cells themselves)
copyPastePlugin.copy('column-headers-only');
```

## Paste

The `Paste` action allows the importing of data from external sources, using the user's system clipboard. The [`CopyPaste`](@/api/copyPaste.md) plugin firstly looks for `text/html` in the system clipboard, followed by `text/plain`.

### Rows of unequal length

Clipboard content does not always hold the same number of cells in every row. A row copied from a
text editor, or a table exported by another application, can be shorter than the one below it.

Handsontable pastes such content as wide as its **widest** row. A shorter row covers the same
columns as the widest one, and the cells it has no value for are emptied, the way a spreadsheet
application pastes them. Those cells hold `null`, the same value that clearing a cell writes.

When the pasted content repeats to fill a larger selection, it repeats on that same width. Pasting
two rows of three cells into a selection six columns wide writes the three cells twice per row.

A merged cell that reaches past the last column is trimmed to the columns that are there. A footer
row spanning a table wider than the pasted data lands in one row, without adding empty columns.

### Pasting wider than the grid

A paste that runs past the last column adds the columns it needs when the
[`data`](@/api/options.md#data) source is an array of arrays, you set no
[`columns`](@/api/options.md#columns) option, and
[`allowInsertColumn`](@/api/options.md#allowinsertcolumn) is left on.

In every other configuration the column count is fixed. With an array data source the values that
reach past the last column are still written, to the matching array index, so
[`getSourceData()`](@/api/core.md#getsourcedata) returns them while the grid never displays them.

An object data source takes its columns from the first row or from
[`dataSchema`](@/api/options.md#dataschema), and cannot grow. Handsontable therefore drops the
values that reach past the last column instead of writing them, and reports no
[`afterChange`](@/api/hooks.md#afterchange) entry for them. This keeps the paste from adding
properties your data schema does not declare, which no column could then display. To write a field
the grid shows no column for, use [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop).

The [`beforePaste`](@/api/hooks.md#beforepaste) and [`afterPaste`](@/api/hooks.md#afterpaste) hooks
receive the content already squared off to the widest row, so what they report matches what the grid
writes. To paste only the cells that were present, drop the empty ones in `beforePaste`.

### Extending paste behavior

The [`parsePastedValue`](@/api/options.md#parsepastedvalue) option controls how pasted content is written to cells when the user pastes from the clipboard into Handsontable (e.g. from another Handsontable instance or between cells in the same table). It does not affect how other applications read or process the clipboard.

By default (`parsePastedValue: false`), pasted content is written as plain strings. Non-scalar values such as objects are coerced to string (e.g. an object becomes `"[object Object]"`), which keeps the data model simple and avoids parsing clipboard text. Set `parsePastedValue: true` when you need to preserve JavaScript structures across paste: pasted text is then parsed (e.g. JSON-like content) and the resulting values are written to the data source, so you can copy and paste objects or arrays between cells or between instances. With parsing enabled, schema validation is relaxed so object-based values can be pasted into cells that would normally expect a scalar.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**V**</kbd> - paste the content into the last cell in the selected range

Available options in the browser's toolbar:

- `Edit > Paste` - paste the content into the last cell in the selected range

### Context menu

Due to security reasons, modern browsers disallow reading from the system clipboard. [Learn more](https://www.w3.org/TR/clipboard-apis/#privacy)

### Trigger paste programmatically

Due to security reasons, modern browsers disallow reading from the system clipboard. [Learn more](https://www.w3.org/TR/clipboard-apis/#privacy)

### Hooks

The [`CopyPaste`](@/api/copyPaste.md) plugin exposes the following hooks to manipulate data during the pasting operation:

- [`beforePaste`](@/api/hooks.md#beforepaste)
- [`afterPaste`](@/api/hooks.md#afterpaste)

Examples of how to use them are provided in their descriptions.

### Copy cell appearance on paste

The [`CopyPaste`](@/api/copyPaste.md) plugin copies cell values by default. To copy cell appearance, save each copied or cut cell's `className` metadata in [`afterCopy`](@/api/hooks.md#aftercopy) and [`afterCut`](@/api/hooks.md#aftercut), and then apply it to the pasted range in [`afterPaste`](@/api/hooks.md#afterpaste).

Copy or cut a styled range from the grid, and paste it into another range to copy the cell values and appearance.

::: only-for javascript
::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/javascript/example4.js)
@[code](@/content/guides/cell-features/clipboard/javascript/example4.ts)

:::
:::

::: only-for react
::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/react/example4.jsx)
@[code](@/content/guides/cell-features/clipboard/react/example4.tsx)

:::
:::

::: only-for angular
::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clipboard/angular/example4.ts)
@[code](@/content/guides/cell-features/clipboard/angular/example4.html)

:::
:::

::: only-for vue
::: example #example4 :vue3

@[code](@/content/guides/cell-features/clipboard/vue/example4.vue)

:::
:::

### Copy comments on paste

To copy cell comments, enable the [`Comments`](@/api/comments.md) plugin. Then use [`getCommentAtCell()`](@/api/comments.md#getcommentatcell) in [`afterCopy`](@/api/hooks.md#aftercopy) and [`afterCut`](@/api/hooks.md#aftercut), and [`setCommentAtCell()`](@/api/comments.md#setcommentatcell) in [`afterPaste`](@/api/hooks.md#afterpaste).

Copy or cut a commented range from the grid, and paste it into another range to copy the cell values and comments.

::: only-for javascript
::: example #example5 --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/javascript/example5.js)
@[code](@/content/guides/cell-features/clipboard/javascript/example5.ts)

:::
:::

::: only-for react
::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clipboard/react/example5.jsx)
@[code](@/content/guides/cell-features/clipboard/react/example5.tsx)

:::
:::

::: only-for angular
::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clipboard/angular/example5.ts)
@[code](@/content/guides/cell-features/clipboard/angular/example5.html)

:::
:::

::: only-for vue
::: example #example5 :vue3

@[code](@/content/guides/cell-features/clipboard/vue/example5.vue)

:::
:::

## Known limitations

1. The [`CopyPaste`](@/api/copyPaste.md) plugin doesn't copy, cut or paste cells' appearance by default. To copy a cell's `className` metadata, see [Copy cell appearance on paste](#copy-cell-appearance-on-paste).
2. The data copied from Handsontable will always remain as plain text. For example, if you copy a checked checkbox, the input will be kept as the value of `'true'`.
3. `document.execCommand` can be called only during an immediate-execute event, such as a `MouseEvent` or a `KeyboardEvent`.
4. Clipboard operations don’t work in Chrome 133+ with Handsontable 14.6.0, 14.6.1, or 15.0.0. Update to 14.6.2 or 15.0.1+. See the [incident announcement](https://handsontable.com/blog/incident-report-handsontable-14.6-15.0-clipboard-disruption-in-chrome-133) for details.

## Result

Users can copy, cut, and paste cell data using keyboard shortcuts or the context menu. Programmatic copy and cut operations work by calling `document.execCommand()` after selecting the target cells.

## Related keyboard shortcuts

| Windows                                | macOS                                 | Action                                                          |  Excel  | Sheets  |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**X**</kbd> | <kbd>⌘</kbd>+<kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**C**</kbd> | <kbd>⌘</kbd>+<kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**V**</kbd> | <kbd>⌘</kbd>+<kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 12.3.0: Copying cells with headers](https://handsontable.com/blog/handsontable-12-3-0-copying-cells-with-headers)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [copyPaste](@/api/options.md#copypaste)
- [copyable](@/api/options.md#copyable)
- [parsePastedValue](@/api/options.md#parsepastedvalue)
- [skipColumnOnPaste](@/api/options.md#skipcolumnonpaste)
- [skipRowOnPaste](@/api/options.md#skiprowonpaste)

</div>

**Core methods**

<div class="boxes-list">

- [getCopyableData()](@/api/core.md#getcopyabledata)
- [getCopyableText()](@/api/core.md#getcopyabletext)

</div>

**Hooks**

<div class="boxes-list">

- [afterCopy](@/api/hooks.md#aftercopy)
- [afterCopyLimit](@/api/hooks.md#aftercopylimit)
- [afterCut](@/api/hooks.md#aftercut)
- [afterPaste](@/api/hooks.md#afterpaste)
- [beforeCopy](@/api/hooks.md#beforecopy)
- [beforeCut](@/api/hooks.md#beforecut)
- [beforePaste](@/api/hooks.md#beforepaste)
- [modifyCopyableRange](@/api/hooks.md#modifycopyablerange)

</div>

**Plugins**

<div class="boxes-list">

- [CopyPaste](@/api/copyPaste.md)

</div>
