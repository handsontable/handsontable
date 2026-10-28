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

Each tab of the [`SheetsBar`](@/api/sheetsBar.md) plugin is one sheet with its own data, settings, and view state.

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

Each entry in `sheets` is one sheet: a tab label, the source data, and optional grid settings that apply while the sheet is active.

When `sheets` declares a workbook, the grid-level [`data`](@/api/options.md#data) option is ignored, with a console warning. To change the active sheet's data, call [`loadData()`](@/api/core.md#loaddata). A `sheets` array that describes other sheets rebuilds the workbook.

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
    // Set the position, within your `sheets` array, of the sheet to
    // activate on initialization. To switch sheets later, call
    // `setActiveSheet()`
    activeSheet: 0,
    // Show or hide the add-sheet and all-sheets menu controls
    controls: true,
    // Show or hide the tab-scrolling arrows that appear when tabs
    // overflow the bar's width
    paging: true,
    // Render the bar above or below the grid
    position: 'bottom',
    // Render the bar in your own container. When omitted, the bar
    // renders on the grid edge that `position` names
    uiContainer: null,
    // Turn the tab animations on or off (see Tab animations)
    animation: true,
  }
};
```

::: only-for react

### Keep the `sheets` array stable

Pass `sheets` as a stable array, the same way you pass `data` to a grid: a constant declared outside the component, a `useState` value, or a `useMemo` result. The plugin writes renames, added sheets, and removals into that array. An inline array stops matching once the user renames, adds, or removes a sheet, or when a sheet's `data` array is recreated. The plugin then rebuilds the workbook, and the user's changes are lost.

```jsx
// Loses the user's changes after the user renames, adds, or removes a sheet
function App() {
  return <HotTable sheetsBar={{ sheets: [{ name: 'Budget', data: budgetData }] }} />;
}

// Keeps the workbook
const sheets = [{ name: 'Budget', data: budgetData }];

function App() {
  return <HotTable sheetsBar={{ sheets }} />;
}
```

The same applies to a function or a class instance in a sheet's `settings`, such as a `renderer` or a `cells` function: define it outside the component or memoize it. Don't copy the plugin's changes into your own state: your array already holds them.

:::

::: only-for vue

### Keep the `sheets` array stable

Pass `sheets` as a stable array, the same way you pass `data` to a grid: a `ref()`, a `data()` property, or a constant declared in the script. The plugin writes renames, added sheets, and removals into that array. An inline array stops matching once the user renames, adds, or removes a sheet, or when a sheet's `data` array is recreated. The plugin then rebuilds the workbook, and the user's changes are lost.

```vue
<script setup>
import { ref } from 'vue';

const sheets = ref([{ name: 'Budget', data: budgetData }]);
</script>

<template>
  <!-- Loses the user's changes after the user renames, adds, or removes a sheet -->
  <HotTable :sheetsBar="{ sheets: [{ name: 'Budget', data: budgetData }] }" />

  <!-- Keeps the workbook -->
  <HotTable :sheetsBar="{ sheets }" />
</template>
```

The same applies to a function or a class instance in a sheet's `settings`, such as a `renderer` or a `cells` function: define it in the script, not in the template. Don't copy the plugin's changes into your own state: your array already holds them.

:::

## Managing sheets programmatically

Get the plugin instance with [`getPlugin()`](@/api/core.md#getplugin) and call its API methods.

```js
const sheetsBar = hot.getPlugin('sheetsBar');

// list every sheet, in tab order
sheetsBar.getSheets();
// [{ id: 1, name: 'Budget', isActive: true }, { id: 2, name: 'Notes', isActive: false }]

// switch the active sheet, by id or by name
sheetsBar.setActiveSheet('Notes');

// append a new sheet, and keep its id
const { id } = sheetsBar.addSheet('Q3 Forecast', [['Category', 'Q3 2026']]);

// rename, copy, move, or remove a sheet, by id
sheetsBar.renameSheet(id, 'Q3 Plan');
sheetsBar.duplicateSheet(id);
sheetsBar.moveSheetToIndex(id, 0);
sheetsBar.removeSheet(id);

// change a sheet's own settings, by id or by name
// use this, not `updateSettings()`, while the sheets bar is on
sheetsBar.updateSheetSettings('Budget', { readOnly: true });
```

## Work with tabs

Right-click a tab, or click the chevron on the active tab, to open its menu: **Rename**, **Duplicate**, **Delete**, **Move left**, and **Move right**. On an inactive tab, the first click on the chevron switches sheets.

- Double-click a tab to rename it.
- Drag a tab to reorder sheets.
- Click the **+** button (Add sheet) to append a sheet.
- Click the list button (All sheets) to pick a sheet from a list.

## Per-sheet view state

Each sheet keeps its own:

- Scroll position and selection.
- Sort, filters, and row and column order.
- Hidden rows and columns, and trimmed rows.
- Collapsed column groups ([`CollapsibleColumns`](@/api/collapsibleColumns.md)).
- Rows checked with [`RowSelection`](@/api/rowSelection.md).
- Frozen rows and columns.
- Merged cells and custom borders.
- Manual column widths and row heights.
- Cell meta you set with [`setCellMeta()`](@/api/core.md#setcellmeta), such as `readOnly`, and invalid marks.
- Formula text display ([`showFormulas()`](@/api/formulas.md#showformulas)).
- [`Pagination`](@/api/pagination.md) page and page size.

A sheet you haven't opened yet opens with only what its own `settings` declare, on the configured [`initialPage`](@/api/options.md#pagination) and page size.

To capture and restore a view without the sheets bar, see [Save and restore the view state](@/guides/getting-started/view-state/view-state.md).

To run your code when a sheet's state is saved or restored, use the [`afterSheetTabStateCapture`](@/api/hooks.md#aftersheettabstatecapture) and [`afterSheetTabStateRestore`](@/api/hooks.md#aftersheettabstaterestore) hooks.

## Tab animations

Tab changes animate. The grid itself switches at once.

The timing follows the theme's [`--ht-table-transition`](@/guides/styling/theme-customization/theme-customization.md) token. The `classic` theme sets it to `0s`, so its tabs change instantly. With `prefers-reduced-motion: reduce`, tabs change instantly in every theme.

### Turn tab animations off

Use the `animation` option to turn the tab animations off. Set it to `false` to make every tab change instant:

```javascript
sheetsBar: {
  animation: false,
},
```

To turn off only some animations, pass an object. Each key controls one animation, and a key you leave out stays on:

- `switch`: the active tab marker's slide.
- `add`: the entrance of a new or duplicated tab.
- `remove`: the fade-out of a deleted tab, and the slide that closes the gap.
- `move`: the slide after a move from the tab menu or the API, and the slide of the tabs a drag pushes aside.

```javascript
sheetsBar: {
  // Keep every animation except the slide after a move
  animation: { switch: true, add: true, remove: true, move: false },
},
```

You can change `animation` later with [`updateSettings()`](@/api/core.md#updatesettings).

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

In React, Angular, or Vue, if you keep a grid-level `dataProvider`, pass the same object on every render, or it replaces the visible sheet's own.

How server sheets behave when you switch:

- A sheet fetches its rows the first time you open it.
- When you come back, the sheet shows the rows, sort, filters, and page it had when you left, without a new fetch. To refresh it, call [`fetchData()`](@/api/dataProvider.md#fetchdata).
- A fetch or a save that's still running when you switch away finishes for the sheet that started it.
- If a request fails while its sheet is hidden, [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) or [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires right away. The error notification appears when you return to the sheet.
- To change a sheet's `dataProvider`, call `updateSheetSettings()`. `dataProvider: null` turns the sheet into a local one.

With `refetchAfterCreate: false`, your [`onRowsCreate`](@/guides/getting-started/server-side-data/server-side-data-crud.md#onrowscreate) adds the new rows to the grid itself. The user can switch sheets while the request runs, so add the rows only when the sheet that owns this provider is still active:

```js
let ordersSheetId;

const ordersProvider = {
  refetchAfterCreate: false,
  onRowsCreate: async({ position, referenceRowId, rowsAmount }) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ position, referenceRowId, rowsAmount }),
    });
    const created = await response.json();

    const activeSheet = hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive);

    if (activeSheet?.id === ordersSheetId) {
      hot.updateData([...hot.getSourceData(), ...created]);
    }

    return created;
  },
  // fetchRows, onRowsUpdate, onRowsRemove...
};

// once the grid is created, keep the sheet's id: it survives a rename
ordersSheetId = hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.name === 'Orders').id;
```

If the sheet isn't active anymore, the plugin refetches it, so the new rows are there when you return.

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

Pass a built engine (`HyperFormula.buildEmpty()`), not the `HyperFormula` class. With the class, each sheet gets its own engine and can't read the other sheets' data.

A sheet added with the **Add sheet** button, or with `addSheet()` without `settings`, joins the shared engine, so other sheets can reference it right away.

Use each sheet's tab name as its `sheetName`. A tab rename then renames the engine sheet and rewrites the references to it, also in your `data` arrays. Inserting, removing, or moving rows or columns rewrites formula text in your `data` arrays too.

## Known limitations

- The grid holds one sheet at a time, so methods such as [`getData()`](@/api/core.md#getdata) and [`getDataAtCell()`](@/api/core.md#getdataatcell) read only the active sheet.
- The plugin doesn't watch your own edits of the `sheets` array or its entries. To change the workbook, call the plugin's methods.
- When the plugin loads new rows for a sheet that isn't shown (for example, a server response), your entry's `data` keeps the old array.
- Switching sheets clears the [`UndoRedo`](@/api/undoRedo.md) history.
- With formulas, a sheet that is sorted or has moved rows or columns doesn't see changes you make in place to its `data` while it's hidden. Pass a new `sheets` value instead, which rebuilds the workbook.
- After a rename, `getSettings().formulas.sheetName` keeps the old name. Read the current name from `hot.getPlugin('formulas').sheetName`.
- With formulas, a rename that rewrites references inside a frozen `data` array (for example, from Immer) writes them into a copy, not into your array, so update your store yourself. On the active sheet, this also clears the undo history.
- A sheet comes back with the invalid marks it had when you left it. A cell that becomes invalid while its sheet is hidden isn't marked until it's validated again, for example by an edit or [`validateCells()`](@/api/core.md#validatecells).
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
