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

A sheet's options object never keeps values another sheet set. Keys it leaves out take the grid-level value or the default, depending on the option.

When `sheets` declares a workbook, the grid-level [`data`](@/api/options.md#data) option is ignored, with a console warning. To change the active sheet's data, call [`loadData()`](@/api/core.md#loaddata). A `sheets` array that describes other sheets rebuilds the workbook.

With `sheetsBar: true`, a new [`data`](@/api/options.md#data) array replaces the data of the sheet created from it, even when that sheet is hidden. After that sheet is removed, a new `data` is ignored with a console warning. Sheets a user adds exist only in the plugin. Read them with [`getSheetData()`](@/api/sheetsBar.md#getsheetdata).

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

::: tip

Wrap large `data` arrays and a HyperFormula engine in `markRaw()`. Vue watches the `sheetsBar` prop deeply, so on every change it walks each sheet's rows and the engine's internals, which slows down every edit.

:::

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

// read a sheet's data without switching to it, by id or by name
sheetsBar.getSheetData('Notes');

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

A sheet's id never changes, and no other sheet gets it later, even after you pass a new `sheets` value.

### Sheet names and new sheets

The same rules apply to names typed in the bar and names passed to the API:

- A name is trimmed and cut to 50 characters.
- A name with no visible character counts as no name in [`addSheet()`](@/api/sheetsBar.md#addsheet), which then uses the default name. [`renameSheet()`](@/api/sheetsBar.md#renamesheet) and a rename in the bar refuse it and keep the old name.
- Names are compared without regard to letter case, so `Budget` and `budget` are the same name.
- [`addSheet()`](@/api/sheetsBar.md#addsheet) and [`duplicateSheet()`](@/api/sheetsBar.md#duplicatesheet) number a name that is taken: `Budget` becomes `Budget (2)`. [`renameSheet()`](@/api/sheetsBar.md#renamesheet) refuses a taken name and returns `false`.
- A sheet added without a name gets a default name in the grid's [language](@/guides/internationalization/language/language.md), `Sheet{n}` in English. `n` counts the sheets the workbook has added or duplicated, so the fourth sheet is `Sheet4`, and a name freed by a removed sheet is not reused. A number another sheet already uses is skipped.
- A sheet added without data starts with 1000 empty rows and 26 empty columns. With [`NestedRows`](@/api/nestedRows.md) on, it starts with 1000 empty object rows instead.

## Work with tabs

Right-click a tab, or click the chevron on the active tab, to open its menu: **Rename**, **Duplicate**, **Delete**, **Move left**, and **Move right**. On an inactive tab, the first click on the chevron switches sheets.

- Double-click a tab to rename it.
- Drag a tab to reorder sheets.
- On a touch screen, swipe the tab strip to scroll it. To reorder sheets, press and hold a tab until it lifts, then drag it. To open a tab's menu, press and hold the tab, then lift your finger without moving it.
- Click the **+** button (Add sheet) to append a sheet.
- Click the list button (All sheets) to pick a sheet from a list.

A sheet you add with the **+** button uses the grid-level settings. To keep an option such as [`nestedRows`](@/api/options.md#nestedrows) or [`columns`](@/api/options.md#columns) to one sheet, set it in that sheet's own `settings`.

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

To reference other sheets in a formula, pass a [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods) instance that holds your sheets in the `formulas` setting, and set `sheetsBar: true`. The bar shows one tab per engine sheet. If you also set `data`, it becomes one more tab. Every tab uses the grid-level settings. To give a sheet settings of its own, declare `sheets` instead. Removing a tab removes its engine sheet.

The example below also turns on the [formula builder](@/guides/formulas/formula-builder/formula-builder.md), which adds a formula bar and an inline editor with colored references and autocomplete. Set `editor: 'formula'` and `formulaBuilder` at the grid level, so every sheet uses them. Select a cell in column **C** of the **Budget** sheet to see its `Rates!B1` reference in the formula bar.

::: only-for react

The React wrapper reserves the `editor` prop for React component editors, so pass the `formula` editor in the `hotEditor` prop.

:::

You can type a reference to another sheet, such as `Rates!B1`, in the formula bar or the cell editor. Reference picking with the mouse or the arrow keys works only on the active sheet, so type references to other sheets by hand.

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

Pass a built engine, such as one from `HyperFormula.buildFromSheets()`, not the `HyperFormula` class. With the class, each sheet gets its own engine and can't read the other sheets' data.

A sheet added with the **Add sheet** button, or with `addSheet()` without `settings`, joins the shared engine, so other sheets can reference it right away.

If you declare `sheets`, give each sheet the same engine and use its tab name as its `sheetName`. A tab rename then renames the engine sheet and rewrites the references to it, also in your `data` arrays. Inserting, removing, or moving rows or columns rewrites formula text in your `data` arrays too.

## Import and export

An import with the [`ImportFile`](@/api/importFile.md) plugin changes the active sheet only: its data, layout, and cell styles. The imported layout becomes part of that sheet's settings, so change it with [`updateSheetSettings()`](@/api/sheetsBar.md#updatesheetsettings).

The [`ExportFile`](@/api/exportFile.md) plugin exports the active sheet only, as a worksheet named `Sheet1`. To use the tab's name instead, pass the grid in the `sheets` option:

```js
const activeSheet = hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive);

await hot.getPlugin('exportFile').downloadFileAsync('xlsx', {
  sheets: [{ instance: hot, name: activeSheet.name }],
});
```

With `exportFormulas: true`, a formula that references another sheet keeps that reference. The file doesn't contain the other sheet, so the reference breaks.

## Known limitations

- The grid holds one sheet at a time, so methods such as [`getData()`](@/api/core.md#getdata) and [`getDataAtCell()`](@/api/core.md#getdataatcell) read only the active sheet.
- The plugin doesn't watch your own edits of the `sheets` array or its entries. To change the workbook, call the plugin's methods.
- When the plugin loads new rows for a sheet that isn't shown (for example, a server response), your entry's `data` keeps the old array.
- Switching sheets clears the [`UndoRedo`](@/api/undoRedo.md) history.
- With formulas, a sheet that is sorted or has moved rows or columns doesn't see changes you make in place to its `data` while it's hidden. Pass a new `sheets` value instead, which rebuilds the workbook.
- Tabs created from a HyperFormula instance are read once, when the bar is enabled. Sheets you add, remove, or rename in the engine yourself after that don't change the tabs, and a different engine passed later through [`updateSettings()`](@/api/core.md#updatesettings) doesn't rebuild them.
- If you create the grid with a HyperFormula instance and no `data`, and turn the sheets bar on later, the bar also shows the empty sheet the grid added to the engine when you created it. Set `sheetsBar` when you create the grid to avoid it.
- Once the bar builds its tabs from a HyperFormula instance, a later grid-level `formulas` change, such as `formulas: false`, has no effect.
- A value you write into the engine directly, for a sheet that isn't shown, is replaced when you switch to its tab. Change cells through the grid instead.
- After a rename, `getSettings().formulas.sheetName` keeps the old name. Read the current name from `hot.getPlugin('formulas').sheetName`.
- With formulas, a rename that rewrites references inside a frozen `data` array (for example, from Immer) writes them into a copy, not into your array, so update your store yourself. On the active sheet, this also clears the undo history.
- A sheet comes back with the invalid marks it had when you left it. A cell that becomes invalid while its sheet is hidden isn't marked until it's validated again, for example by an edit or [`validateCells()`](@/api/core.md#validatecells).
- If the window scrolls the grid (no [`height`](@/api/options.md#height) and no scrollable parent), the bar sits below the last row. To keep it in view, set `height`, or put the grid in a container with a fixed height and `overflow: auto`.

## Related keyboard shortcuts

The tab strip is one stop in the tab order: <kbd>**Tab**</kbd> moves the focus to the active tab, and the arrow keys move it along the strip.

Screen readers name the grid after the active sheet. To give the grid a name of your own, set `aria-label` or `aria-labelledby` on `hot.rootElement`, and the sheets bar keeps your name.

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
