---
id: 2vbt7ev0
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
  id: mlctr1ri
  metaTitle: Clipboard - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Clipboard

Copy data from selected cells to the system clipboard.

[[toc]]

## Overview

You can copy or cut data from Handsontable to the system clipboard, either manually (using the context menu or the <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>/<kbd>**X**</kbd> shortcuts) or programmatically (using Handsontable's API methods).

## Copy & Cut

Copy & Cut actions allow exporting data from Handsontable to the system clipboard. The [`CopyPaste`](@/api/copyPaste.md) plugin copies and cuts data as a `text/plain` and a `text/html` MIME-type.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd> - copies the content of the last cell in the selected range
- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**X**</kbd> - cuts the content of the last cell in the selected range

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

### Trigger copy & cut programmatically

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

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

<span class="img-invert">

| Context menu item         | Copied area                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| Copy with header       | ![copy_with_headers]({{$basePath}}/img/copy_with_headers.png)             |
| Copy with group header | ![copy_with_group_headers]({{$basePath}}/img/copy_with_group_headers.png) |
| Copy header only       | ![copy_headers_only]({{$basePath}}/img/copy_headers_only.png)             |

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

```js
// access the `CopyPaste` plugin instance
const copyPastePlugin = hot.getPlugin('copyPaste');

// select some cells
hot.selectCell(1, 1);

// copy the selected cells along with their nearest column headers
copyPastePlugin.copy('with-column-headers');

// copy the selected cells along with all their related columns headers
copyPastePlugin.copy('with-all-column-headers');

// copy the column headers nearest to the selected cells
// (without copying the cells themselves)
copyPastePlugin.copy('column-headers-only');
```

## Paste

The `Paste` action allows the importing of data from external sources, using the user's system clipboard. The [`CopyPaste`](@/api/copyPaste.md) plugin firstly looks for `text/html` in the system clipboard, followed by `text/plain`.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**V**</kbd> - paste the content into the last cell in the selected range

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

## Known limitations

1. The [`CopyPaste`](@/api/copyPaste.md) plugin doesn't copy, cut or paste cells' appearance.
2. The data copied from Handsontable will always remain as plain text. For example, if you copy a checked checkbox, the input will be kept as the value of `'true'`.
3. `document.execCommand` can be called only during an immediate-execute event, such as a `MouseEvent` or a `KeyboardEvent`.
4. Clipboard operations don’t work in Chrome 133+ with Handsontable 14.6.0, 14.6.1, or 15.0.0. Update to 14.6.2 or 15.0.1+. See the [incident announcement](https://handsontable.com/blog/incident-report-handsontable-14.6-15.0-clipboard-disruption-in-chrome-133) for details.

## Related keyboard shortcuts

| Windows                                | macOS                                 | Action                                                          |  Excel  | Sheets  |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**X**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**C**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**V**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

## Related API reference

- Configuration options:
  - [`copyPaste`](@/api/options.md#copypaste)
  - [`copyable`](@/api/options.md#copyable)
  - [`skipColumnOnPaste`](@/api/options.md#skipcolumnonpaste)
  - [`skipRowOnPaste`](@/api/options.md#skiprowonpaste)
- Core methods:
  - [`getCopyableData()`](@/api/core.md#getcopyabledata)
  - [`getCopyableText()`](@/api/core.md#getcopyabletext)
- Hooks:
  - [`afterCopy`](@/api/hooks.md#aftercopy)
  - [`afterCopyLimit`](@/api/hooks.md#aftercopylimit)
  - [`afterCut`](@/api/hooks.md#aftercut)
  - [`afterPaste`](@/api/hooks.md#afterpaste)
  - [`beforeCopy`](@/api/hooks.md#beforecopy)
  - [`beforeCut`](@/api/hooks.md#beforecut)
  - [`beforePaste`](@/api/hooks.md#beforepaste)
  - [`modifyCopyableRange`](@/api/hooks.md#modifycopyablerange)
- Plugins:
  - [`CopyPaste`](@/api/copyPaste.md)
