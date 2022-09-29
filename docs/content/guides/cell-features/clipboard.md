---
title: Clipboard
metaTitle: Clipboard - JavaScript Data Grid | Handsontable
description: Copy data from selected cells to the clipboard, using the "Ctrl/Cmd + C" shortcut or the right-click context menu. Control the clipboard with Handsontable's API.
permalink: /basic-clipboard
canonicalUrl: /basic-clipboard
tags:
  - copy
  - cut
  - paste
react:
  metaTitle: Clipboard - React Data Grid | Handsontable
searchCategory: Guides
---

# Clipboard

[[toc]]

## Overview

The clipboard offers Copy & Cut and Paste functionality, enabling you to copy & cut cell data from Handsontable and paste it to the system clipboard. This can be achieved either via shortcut keys or by triggering a copy & cut or paste programmatically.

## Copy & Cut

Copy & Cut actions allow exporting data from Handsontable to the system clipboard. The [`CopyPaste`](@/api/copyPaste.md) plugin copies and cuts data as a `text/plain` and a `text/html` MIME-type.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd> - copies the content of the last cell in the selected range
- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**X**</kbd> - cuts the content of the last cell in the selected range

Available options in the browser's toolbar:

- `Edit > Copy` - copies the content of the last cell in the selected range
- `Edit > Cut` - cuts the content of the last cell in the selected range

### Context menu

When the context menu is enabled, it includes default items, including copy & cut options.

- Copy - as a predefined key `copy`
- Cut - as a predefined key `cut`

You can use them in the same way as the rest of the predefined items in the [context menu](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options). These operations are executed by `document.execCommand()`.


::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  contextMenu: ['copy', 'cut'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={Handsontable.helper.createSpreadsheetData(5, 5)}
      rowHeaders={true}
      colHeaders={true}
      contextMenu={['copy', 'cut']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


### Trigger copy & cut programmatically

::: only-for react
::: tip
To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [`Instance Methods`](@/guides/getting-started/react-methods.md) page.
:::
:::

First, select a cell range to copy or cut.

```js
hot.selectCell(1, 1);
```

Then use one of the following commands:

* `document.execCommand('copy')`
* `document.execCommand('cut')`

The **CopyPaste** plugin listens to the browser's `copy` and `cut` events. If triggered, our implementation will copy or cut the selected data to the system clipboard.


::: only-for javascript
::: example #example2 --html 1 --js 2
```html
<div id="example2"></div>
<div class="controls">
  <button id="copy">Select and copy cell B2</button>
  <button id="cut">Select and cut cell B2</button>
</div>
```

```js
const container = document.querySelector('#example2');
const copyBtn = document.querySelector('#copy');
const cutBtn = document.querySelector('#cut');

const hot = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  outsideClickDeselects: false,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

copyBtn.addEventListener('mousedown', function() {
  hot.selectCell(1, 1);
});

copyBtn.addEventListener('click', function() {
  document.execCommand('copy');
});

cutBtn.addEventListener('mousedown', function() {
  hot.selectCell(1, 1);
});

cutBtn.addEventListener('click', function() {
  document.execCommand('cut');
});
```
:::
:::

::: only-for react
::: example #example2 :react
```jsx
import { useEffect, useRef } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const copyBtnClickCallback = function() {
    document.execCommand('copy');
  };
  const cutBtnClickCallback = function() {
    document.execCommand('cut');
  };
  let copyBtnMousedownCallback;
  let cutBtnMousedownCallback;

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    copyBtnMousedownCallback = function() {
      hot.selectCell(1, 1);
    };
    cutBtnMousedownCallback = function() {
      hot.selectCell(1, 1);
    };
  });

  return (
    <>
      <HotTable
        ref={hotRef}
        rowHeaders={true}
        colHeaders={true}
        data={Handsontable.helper.createSpreadsheetData(5, 5)}
        outsideClickDeselects={false}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button
          id="copy"
          onMouseDown={(...args) => copyBtnMousedownCallback(...args)}
          onClick={(...args) => copyBtnClickCallback(...args)}
        >
          Select and copy cell B2
        </button>
        <button
          id="cut"
          onMouseDown={(...args) => cutBtnMousedownCallback(...args)}
          onClick={(...args) => cutBtnClickCallback(...args)}
        >
          Select and cut cell B2
        </button>
      </div>
    </>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
```
:::
:::


**Note:** Not all selection-related Handsontable methods result in it gaining focus. Make sure your table instance is focused by calling [isListening()](@/api/core.md#islistening) before copying or pasting data.


### Hooks

The [CopyPaste](@/api/copyPaste.md) plugin exposes the following hooks to manipulate data during copy or cut operations:

- [`beforeCopy`](@/api/hooks.md#beforecopy)
- [`afterCopy`](@/api/hooks.md#aftercopy)
- [`beforeCut`](@/api/hooks.md#beforecut)
- [`afterCut`](@/api/hooks.md#aftercut)

Examples of how to use them are provided in their descriptions.

## Paste

The Paste action allows the importing of data from external sources using the user's system clipboard. The **CopyPaste** firstly looks for `text/html` in the system clipboard, followed by `text/plain`.

### End-user usage

Available keyboard shortcuts:

- <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**V**</kbd> - paste the content into the last cell in the selected range

Available options in the browser's toolbar:

- `Edit > Paste` - paste the content into the last cell in the selected range

### Context menu

Due to security reasons, modern browsers disallow reading from the system clipboard. [Learn more](https://www.w3.org/TR/clipboard-apis/#privacy)

### Trigger paste programmatically

Due to security reasons, modern browsers disallow reading from the system clipboard. [Learn more](https://www.w3.org/TR/clipboard-apis/#privacy)

### Hooks

The [CopyPaste](@/api/copyPaste.md) plugin exposes the following hooks to manipulate data during the pasting operation:

- [`beforePaste`](@/api/hooks.md#beforepaste)
- [`afterPaste`](@/api/hooks.md#afterpaste)

Examples of how to use them are provided in their descriptions.

## Limitations

1.  The [`CopyPaste`](@/api/copyPaste.md) plugin doesn't copy, cut or paste cells' appearance.
2.  The data copied from Handsontable will always remain as plain text. For example, if you copy a checked checkbox, the input will be kept as a value of `'true'`.
3.  `document.execCommand` can be called only during an immediate-execute event, such as a `MouseEvent` or a `KeyboardEvent`.

## Related keyboard shortcuts

| Windows                                | macOS                                 | Action                                                          |  Excel  | Sheets  |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**X**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**C**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**V**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

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
