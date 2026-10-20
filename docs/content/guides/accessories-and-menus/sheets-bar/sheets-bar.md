---
type: reference
title: Sheets bar
metaTitle: Sheets bar | Handsontable DataGrid for JavaScript
description: Render a tab bar above or below the grid and let users switch between the sheets of a multi-sheet workbook.
permalink: /sheets-bar
canonicalUrl: /sheets-bar
tags:
  - tabs
  - workbook
  - multi-sheet
  - sheet switching
react:
  metaTitle: Sheets bar | Handsontable DataGrid for React
angular:
  metaTitle: Sheets bar | Handsontable DataGrid for Angular
vue:
  metaTitle: Sheets bar | Handsontable DataGrid for Vue
searchCategory: Guides
category: Accessories and menus
menuTag: new
addedIn: "19.0.0"
---

Render a tab bar above or below the grid and let users switch between the sheets of a multi-sheet workbook.

[[toc]]

## Overview

Each tab of the [`SheetsBar`](@/api/sheetsBar.md) plugin is one sheet, with its own data, settings overrides, and view state, such as the scroll position and the selection.

::: only-for javascript

::: example #example --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/javascript/example.js)
@[code](@/content/guides/accessories-and-menus/sheets-bar/javascript/example.ts)

:::

:::

::: only-for react

::: example #example :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/react/example.jsx)
@[code](@/content/guides/accessories-and-menus/sheets-bar/react/example.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/sheets-bar/angular/example1.html)

:::

:::

::: only-for vue

::: example #example :vue3

@[code](@/content/guides/accessories-and-menus/sheets-bar/vue/example.vue)

:::

:::

## Configuration options

Set [`sheetsBar`](@/api/options.md#sheetsbar) to `true` for one sheet with the grid's data, or pass an object to define the workbook, pick the sheet that opens first, and show or hide the bar's controls.

Each entry in `sheets` is one sheet: a tab label, the source data, and optional grid settings that apply while the sheet is active. A setting the sheet doesn't declare keeps its grid-level value.

```javascript
const configurationOptions = {
  sheetsBar: {
    // Define the initial workbook. When omitted, the grid's
    // own data becomes a single sheet named `Sheet1`.
    sheets: [
      {
        // Set the sheet's tab label. When omitted, the sheet gets
        // the next free `Sheet{n}` name.
        name: 'Budget',
        // Provide the sheet's source data
        data: [['Item', 'Cost'], ['Rent', 1200]],
        // Apply grid settings while this sheet is active
        // (for example, `columns` or `colWidths`)
        settings: { colWidths: 120 },
      },
      { name: 'Notes', data: [['Draft']] },
    ],
    // Set the index (within `sheets`) of the sheet to activate
    // on initialization. Passed later through `updateSettings()`
    // with a changed value, it switches the active sheet without
    // rebuilding the workbook
    activeSheet: 0,
    // Show or hide the add-sheet and all-sheets menu controls
    controls: true,
    // Show or hide the tab-scrolling arrows that appear when tabs
    // overflow the bar's width
    paging: true,
    // Render the bar above or below the grid
    position: 'bottom',
    // Custom container where the sheets bar UI will be injected
    // (optional). When omitted, the bar renders in the layout slot
    // the `position` option names.
    uiContainer: null,
  }
};
```

::: only-for react

### Keep sheet data stable

Pass each sheet's `data` as a stable reference: a constant declared outside the component, a `useState` value, or a `useMemo` result. The React wrapper sends the `sheetsBar` prop to the grid on every render. If a sheet's `data` is a new array, the plugin rebuilds the workbook and drops the user's edits, sort, filters, and any sheets added at runtime.

```jsx
// Rebuilds the workbook on every render
<HotTable sheetsBar={{ sheets: [{ name: 'Budget', data: [['Rent', 1200]] }] }} />

// Keeps the workbook
const budgetData = [['Rent', 1200]];

<HotTable sheetsBar={{ sheets: [{ name: 'Budget', data: budgetData }] }} />
```

A new `settings` object on each render keeps the workbook only when its values are equal. Functions and class instances, such as a renderer or a HyperFormula engine, are compared by reference, so define them outside the component or memoize them. For the exact rule, see [Known limitations](#known-limitations).

:::

## Managing sheets programmatically

Get the plugin instance with [`getPlugin()`](@/api/core.md#getplugin) and call its API methods. For more information, see the [`SheetsBar`](@/api/sheetsBar.md) API reference.

```js
const sheetsBar = hot.getPlugin('sheetsBar');

// list every sheet, in tab order
sheetsBar.getSheets();
// [{ id: 1, name: 'Budget', isActive: true }, { id: 2, name: 'Notes', isActive: false }]

// switch the active sheet, by id or by name
sheetsBar.setActiveSheet('Notes');

// append a new sheet
sheetsBar.addSheet('Q3 Forecast', [['Category', 'Q3 2026']]);

// rename, copy, or remove a sheet, by id
sheetsBar.renameSheet(2, 'Comments');
sheetsBar.duplicateSheet(1);
sheetsBar.removeSheet(2);

// move a sheet to another position in the tab order
sheetsBar.moveSheetToIndex(3, 0);
```

## Tab menus

Right-click a tab, or click the chevron on the active tab, to open its menu. On an inactive tab, the first click on the chevron switches sheets.

- Double-click a tab to rename it.
- Drag a tab to reorder sheets.

## Per-sheet view state

Each sheet keeps its own view state: scroll position, selection, sort, filters, row and column order, hidden rows and columns, trimmed rows, frozen rows and columns, merged cells, custom borders, manual column widths and row heights, cell meta (except the `valid` flag, which the next validation sets again), and the [`Pagination`](@/api/pagination.md) page and page size. A sheet you haven't opened yet doesn't inherit the previous sheet's sort, filters, sizes, or selection. It opens with only what its own `settings` declare, on the configured [`initialPage`](@/api/options.md#pagination) and page size.

To capture and restore a view without the sheets bar, see [Save and restore the view state](@/guides/getting-started/view-state/view-state.md).

A switch away from a sheet with a selection clears it before the next sheet loads, so [`afterDeselect`](@/api/hooks.md#afterdeselect) fires. Selection hooks such as [`afterSelection`](@/api/hooks.md#afterselection) fire when a saved selection comes back, and the page hooks fire when the switch changes the page.

To run your code when a sheet's state is saved or restored, use the [`afterSheetTabStateCapture`](@/api/hooks.md#aftersheettabstatecapture) and [`afterSheetTabStateRestore`](@/api/hooks.md#aftersheettabstaterestore) hooks.

## Server-backed sheets

While the sheets bar is on, a grid-level `dataProvider` is turned off and a console warning is logged. To load a sheet's rows from a server, set `dataProvider` in that sheet's `settings`. Other sheets keep local data:

```js
sheetsBar: {
  sheets: [
    { name: 'Orders', data: [], settings: { dataProvider: ordersProvider } },
    { name: 'Notes', data: notes },
  ],
},
```

If you still pass a grid-level `dataProvider`, pass the same object every time. While a server sheet is shown, a new grid-level object replaces that sheet's own `dataProvider`. A framework wrapper that creates a new object on each render does this on every render.

How server sheets behave when you switch:

- A sheet fetches its rows the first time you open it.
- When you come back, the sheet shows the rows, sort, filters, and page it had when you left, without a new fetch. To refresh it, call [`fetchData()`](@/api/dataProvider.md#fetchdata).
- A fetch or a save that's still running when you switch away finishes for the sheet that started it.
- If a request fails while its sheet is hidden, [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) or [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires right away. The error notification appears when you return to the sheet. `afterDataProviderFetchError` gets a third argument, `isVisible`, set to `false`.
- A duplicated sheet starts with a copy of the original's rows. If the original has already loaded rows, the copy doesn't fetch on its first visit.

For the `dataProvider` setup itself, see [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md).

## Use formulas across sheets

To reference other sheets in a formula, give each sheet the same [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods) engine instance and its own `sheetName`, in its `formulas` setting.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/sheets-bar/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/sheets-bar/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/sheets-bar/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/sheets-bar/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/sheets-bar/vue/example2.vue)

:::

:::

Pass a built engine (`HyperFormula.buildEmpty()`), not the `HyperFormula` class. With the class, each sheet gets its own engine and can't read the other sheets' data. The plugin logs a console warning when a sheet passes the class with a `sheetName`.

A sheet added at runtime, with the add button or with `addSheet()` without `settings`, joins the shared engine under its own name, so other sheets can reference it right away.

## Known limitations

- The grid holds one sheet at a time, so methods such as [`getData()`](@/api/core.md#getdata) and [`getDataAtCell()`](@/api/core.md#getdataatcell) read only the active sheet.
- Passing a changed `sheets` value to [`updateSettings()`](@/api/core.md#updatesettings) rebuilds the workbook and drops sheets added with `addSheet()`. A `sheets` value counts as unchanged when it has the same number of sheets, and each has the same `name`, `settings` with the same content (functions and class instances are compared by reference), and the same `data` array. In framework wrappers, keep your `data` arrays stable. Changing only `controls`, `paging`, or `position` never rebuilds the workbook.
- Switching sheets clears the [`UndoRedo`](@/api/undoRedo.md) history.
- If the window scrolls the grid (no [`height`](@/api/options.md#height) and no scrollable parent), the bar sits below the last row. To keep it in view, set `height`, or put the grid in a container with a fixed height and `overflow: auto`.

## Related keyboard shortcuts

Each tab is one stop in the tab order.

| Windows | macOS | Action |
| --- | --- | --- |
| <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | Switch to the focused tab's sheet. On the active tab, open the tab's menu |
| <kbd>**←**</kbd> / <kbd>**→**</kbd> | <kbd>**←**</kbd> / <kbd>**→**</kbd> | Move the focus along the tab strip |
| <kbd>**Home**</kbd> / <kbd>**End**</kbd> | <kbd>**Home**</kbd> / <kbd>**End**</kbd> | Move the focus to the first or last tab |
| <kbd>**Escape**</kbd> | <kbd>**Escape**</kbd> | Close the open menu, cancel an inline rename, or cancel a drag in progress |

To reorder or rename sheets from the keyboard, use **Move left**, **Move right**, and **Rename** in the tab menu.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [sheetsBar](@/api/options.md#sheetsbar)

</div>

**Hooks**

<div class="boxes-list">

- [afterSheetTabAdd](@/api/hooks.md#aftersheettabadd)
- [afterSheetTabChange](@/api/hooks.md#aftersheettabchange)
- [afterSheetTabMove](@/api/hooks.md#aftersheettabmove)
- [afterSheetTabRemove](@/api/hooks.md#aftersheettabremove)
- [afterSheetTabRename](@/api/hooks.md#aftersheettabrename)
- [afterSheetTabStateCapture](@/api/hooks.md#aftersheettabstatecapture)
- [afterSheetTabStateRestore](@/api/hooks.md#aftersheettabstaterestore)
- [beforeSheetTabAdd](@/api/hooks.md#beforesheettabadd)
- [beforeSheetTabChange](@/api/hooks.md#beforesheettabchange)
- [beforeSheetTabMove](@/api/hooks.md#beforesheettabmove)
- [beforeSheetTabRemove](@/api/hooks.md#beforesheettabremove)
- [beforeSheetTabRename](@/api/hooks.md#beforesheettabrename)

</div>

**Plugins**

<div class="boxes-list">

- [SheetsBar](@/api/sheetsBar.md)

</div>
