---
title: Copy & Paste
permalink: /copy-paste
canonicalUrl: /copy-paste
---

# {{ $frontmatter.title }}

[[toc]]

## Copy & Cut

Copy & Cut actions allows exporting data from Handsontable into the system clipboard. The _CopyPaste_ plugin copies and cuts data as a `text/plain` and a `text/html` mime-type.

### End-user usage

Available keyboard shortcuts:

* <kbd>CTRL/CMD + C</kbd> - copies the content of the last selected cells range
* <kbd>CTRL/CMD + X</kbd> - cuts the content of the last selected cells range

Available options in the browser's toolbar:

* `Edit > Copy` - copies the content of the last selected cells range
* `Edit > Cut` - cuts the content of the last selected cells range

### Context menu

When the context menu is enabled, it includes default items among which you will find copy and cut options.

* Copy - as a predefined key `copy`
* Cut - as a predefined key `cut`

[You can use them in the same way as the rest of the predefined items](context-menu.md#page-custom). These operations are executed by `document.execCommand()`.

::: example #example2
```js
var container2 = document.getElementById('example2');
var hot2 = new Handsontable(container2, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  contextMenu: ['copy', 'cut'],
});
```
:::

### Trigger copy & cut programmatically

Firstly, you need to select a cell range to copy or cut.

```js
hot.selectCell(1, 1);
```

Then you can use one of the following commands:

* `document.execCommand('copy')`
* `document.execCommand('cut')`

The _CopyPaste_ plugin listens to the browser's `cop` and `cut` events, so if they are triggered, our implementation will copy or cut the selected data into the system clipboard.

<button id="copy">Select and copy cell B2</button>
<button id="cut">Select and cut cell B2</button>

::: example #example1
```js
var container = document.getElementById('example1');
var copyBtn = document.getElementById('copy');
var cutBtn = document.getElementById('cut');

var hot = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  outsideClickDeselects: false,
});

Handsontable.dom.addEvent(copyBtn, 'mousedown', function () {
  hot.selectCell(1, 1);
});

Handsontable.dom.addEvent(copyBtn, 'click', function () {
  document.execCommand('copy');
});

Handsontable.dom.addEvent(cutBtn, 'mousedown', function () {
  hot.selectCell(1, 1);
});

Handsontable.dom.addEvent(cutBtn, 'click', function () {
  document.execCommand('cut');
});
```
:::

**Note:** Not all selection-related Handsontable methods result in it gaining focus. Make sure your table instance is focused by calling [`hot.isListening();`](api/core.md#isListening) before copying or pasting data.

### Hooks

The _CopyPaste_ plugin exposes following hooks to manipulate data during copy or cut operations:

* [_beforeCopy_](api/pluginHooks.md#beforecopy)
* [_afterCopy_](api/pluginHooks.md#aftercopy)
* [_beforeCut_](api/pluginHooks.md#beforecut)
* [_afterCut_](api/pluginHooks.md#aftercut)

In their descriptions, you can find examples of how to use them.

## Paste

Paste action allows importing data from external sources using the user's system clipboard. The _CopyPaste_ firstly looks for `text/html` in the system clipboard, otherwise it looks for `text/plain`.

### End-user usage

Available keyboard shortcuts:

* <kbd>CTRL/CMD + V</kbd> - paste the content into the last selected cell range

Available options in the browser's toolbar:

* `Edit > Paste` - paste the content into the last selected cell range

### Context menu

[Due to security reason, modern browsers disallow to read from the system clipboard.](https://www.w3.org/TR/clipboard-apis/#privacy)

### Trigger paste programmatically

[Due to security reason, modern browsers disallow to read from the system clipboard.](https://www.w3.org/TR/clipboard-apis/#privacy)

### Hooks

The _CopyPaste_ plugin exposes following hooks to manipulate data during the pasting operation:

* [_beforePaste_](api/pluginHooks.md#beforepaste)
* [_afterPaste_](api/pluginHooks.md#afterpaste)

In their descriptions, you can find examples of how to use them.

## Limitations

1.  The _CopyPaste_ plugin doesn't copy, cut or paste cells' appearance.
2.  The data copied from Handsontable will always be kept as plain text. For instance, if you copy a checked checkbox, the input will be kept as a value of `"true"`.
3.  `document.execCommand` can be called only during an immediate-execute event, such as a `MouseEvent` or a `KeyboardEvent`.
4.  Internet Explorer supports only `Text` mime-type - what is an equivalent of `text/plain`.
5.  Internet Explorer prompts a confirm window to allow/disallow at the first time user tries to call `document.execCommand`. Unfortunately, if user disallows access to the system clipboard, no exceptions will be thrown and `copy` and `cut` actions will be disabled for end-user. You can read more about this behavior of the browser [here](https://github.com/zenorocha/clipboard.js/issues/77)
