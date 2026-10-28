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

Each entry in `sheets` is one sheet: a tab label, the source data, and optional grid settings that apply while the sheet is active. A setting the sheet doesn't declare keeps its grid-level value. A sheet's own settings always win over the grid-level ones. A value you set later with [`updateSettings()`](@/api/core.md#updatesettings) is a grid-level value: it applies to every sheet that doesn't declare the setting, and it stays on the grid when you turn the bar off. While the active sheet declares the setting, the sheet keeps its own value, and the new value reaches the other sheets. To change a sheet's own settings, call [`updateSheetSettings()`](@/api/sheetsBar.md#updatesheetsettings).

The plugin works on your `sheets` array the way the grid works on your [`data`](@/api/options.md#data) array: it writes into it. A rename changes the entry's `name`, a sheet the user adds or duplicates is appended to the array with its own `data`, and a removed sheet's entry is spliced out. Moving a tab changes only the tab order, not the array. So your array lists every sheet with its current name, sheets added at runtime included. It doesn't follow the tab order or the settings you change with [`updateSheetSettings()`](@/api/sheetsBar.md#updatesheetsettings). Keep the array, its entries, and their `data` mutable. On a frozen array or entry (for example, from Immer), a rename, an add, a duplicate, or a removal is refused with a console warning before it changes anything, whether it comes from the bar or from the API.

Each sheet brings its own data, so the grid-level [`data`](@/api/options.md#data) option is ignored when `sheets` declares a workbook, both on initialization and in `updateSettings()`. The console shows a warning the first time. To change a sheet's data, pass a new `sheets` value or call [`loadData()`](@/api/core.md#loaddata) while the sheet is active.

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
    // activate on initialization. Passed later through
    // `updateSettings()` with a changed value, it switches the
    // active sheet without rebuilding the workbook
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
    // Turn the tab animations on or off, all at once or one by one
    animation: true,
  }
};
```

::: only-for react

### Keep the `sheets` array stable

Pass `sheets` as a stable array, the same way you pass `data` to a grid: a constant declared outside the component, a `useState` value, or a `useMemo` result. The React wrapper sends the `sheetsBar` prop to the grid on every render, and the plugin writes the user's renames, added sheets, and removed sheets into that array. An array written inline is a new one on every render, without those changes, so the plugin reads it as another workbook and rebuilds it: the user's renames, added sheets, sort, filters, and edits are gone.

```jsx
// Loses the user's changes on the next render
<HotTable sheetsBar={{ sheets: [{ name: 'Budget', data: budgetData }] }} />

// Keeps the workbook
const sheets = [{ name: 'Budget', data: [['Rent', 1200]] }];

<HotTable sheetsBar={{ sheets }} />
```

The same applies to a function or a class instance in a sheet's `settings`, such as a `renderer` or a `cells` function: define it outside the component or memoize it. Don't copy the plugin's changes into your own state: your array already holds them. For the exact rule, see [Known limitations](#known-limitations).

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

// change a sheet's own settings, by id or by name
sheetsBar.updateSheetSettings('Budget', { readOnly: true });
```

`renameSheet()`, `addSheet()`, `duplicateSheet()`, and `removeSheet()` write their change into your `sheets` array. `moveSheetToIndex()` changes only the tab order. `updateSheetSettings()` keeps the sheet's new settings with the plugin and leaves the entry's `settings` as you declared them. It doesn't take `data`, because a sheet's rows are its `data` in your array. On a sheet that isn't shown, the new settings apply when the user opens the sheet, in place of what the sheet kept for them from the last visit, such as its sort, hidden columns, or frozen columns.

## Tab menus

Right-click a tab, or click the chevron on the active tab, to open its menu. On an inactive tab, the first click on the chevron switches sheets.

- Double-click a tab to rename it.
- Drag a tab to reorder sheets.

## Per-sheet view state

Each sheet keeps its own view state: scroll position, selection, sort, filters, row and column order, hidden rows and columns, trimmed rows, frozen rows and columns, merged cells, custom borders, manual column widths and row heights, cell meta (including the invalid mark of a cell whose validation failed), whether formula text is shown ([`showFormulas()`](@/api/formulas.md#showformulas)), and the [`Pagination`](@/api/pagination.md) page and page size. A sheet you haven't opened yet doesn't inherit the previous sheet's sort, filters, sizes, or selection. It opens with only what its own `settings` declare, on the configured [`initialPage`](@/api/options.md#pagination) and page size.

To capture and restore a view without the sheets bar, see [Save and restore the view state](@/guides/getting-started/view-state/view-state.md).

A switch away from a sheet with a selection clears it before the next sheet loads, so [`afterDeselect`](@/api/hooks.md#afterdeselect) fires. Selection hooks such as [`afterSelection`](@/api/hooks.md#afterselection) fire when a saved selection comes back, and the page hooks fire when the switch changes the page.

To run your code when a sheet's state is saved or restored, use the [`afterSheetTabStateCapture`](@/api/hooks.md#aftersheettabstatecapture) and [`afterSheetTabStateRestore`](@/api/hooks.md#aftersheettabstaterestore) hooks.

## Tab animations

When you switch sheets, the active tab marker slides from the old tab to the new one. A tab you create or duplicate slides into the strip. When you move a sheet with the tab menu or the API, the tabs slide to their new places. A tab you delete fades out, and the tabs after it slide over to close the gap. When you hover a tab, its text color fades in and out. The grid itself switches at once.

The timing follows the theme's [`--ht-table-transition`](@/guides/styling/theme-customization/theme-customization.md) token. The `main` and `horizon` themes animate the tabs. The `classic` theme sets the token to `0s`, so its tabs change instantly. If the user's system sets `prefers-reduced-motion: reduce`, the tabs change instantly in every theme. Switches, moves, deletions, and new tabs made while the grid initializes are instant, until the browser has painted the grid once.

The animations are visual only. They don't change the data, the selection, or the order of the hooks.

### Turn tab animations off

Use the `animation` option to turn the tab animations off. Set it to `false` to make every tab change instant:

```javascript
sheetsBar: {
  animation: false,
},
```

To turn off only some animations, pass an object. Each key controls one animation, and a key you leave out stays on:

- `switch`: the active tab marker's slide when you switch sheets
- `add`: the entrance of a tab you create or duplicate
- `remove`: the fade-out of a deleted tab, and the slide of the tabs that close the gap
- `move`: the slide of the tabs to their new places after a move from the tab menu or the API, and the slide of the tabs a drag pushes aside

```javascript
sheetsBar: {
  // Keep every animation except the slide after a move
  animation: { switch: true, add: true, remove: true, move: false },
},
```

You can change the option later through [`updateSettings()`](@/api/core.md#updatesettings). The workbook stays as it is, and the new value applies from the next tab change. An animation that is running when you turn it off jumps to its end.

The option can only turn animations off. With `prefers-reduced-motion: reduce`, or with a theme that sets `--ht-table-transition` to `0s` (like `classic`), every tab change is instant, whatever the option says.

The hover color fade is CSS only, so the `animation` option doesn't affect it. To remove it and keep the tab slides, set `transition-property: transform` on `.handsontable.ht-sheets-bar .ht-sheets-bar__tabs .ht-sheets-bar__tab`. Use the full selector: Handsontable adds its own stylesheet after yours, so a shorter selector loses to the bar's own rule.

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
- A fetch or a save that's still running when you switch away finishes for the sheet that started it. A create on a sheet with `refetchAfterCreate: false` that finishes while its sheet is hidden refetches that sheet anyway, because there's no grid showing it to add the rows to.
- If a request fails while its sheet is hidden, [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) or [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires right away. The error notification appears when you return to the sheet. `afterDataProviderFetchError` gets a third argument, `isVisible`, set to `false`.
- A duplicated sheet starts with a copy of the original's rows. If the original has already loaded rows, the copy doesn't fetch on its first visit.
- A `dataProvider` you pass through `updateSettings()` while a server sheet is shown becomes that sheet's own, and so does `dataProvider: null`, which turns the sheet into a local one, unless the same call also passes `sheetsBar`. A React `dataProvider={null}` prop arrives beside `sheetsBar` on every render, so it doesn't turn a server sheet local. Your declared `sheets` value isn't changed.

With `refetchAfterCreate: false`, your [`onRowsCreate`](@/guides/getting-started/server-side-data/server-side-data-crud.md#onrowscreate) adds the new rows to the grid itself. The grid shows the active sheet, which can change while the request runs, so add the rows only when the sheet that owns this provider is still active. Compare against the sheet the provider belongs to, not the sheet that was active when `onRowsCreate` started: a create queued behind another save starts after the user may have switched.

```js
const isSheetActive = name => hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive)?.name === name;

const ordersProvider = {
  refetchAfterCreate: false,
  onRowsCreate: async({ position, referenceRowId, rowsAmount }) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ position, referenceRowId, rowsAmount }),
    });
    const created = await response.json();

    if (isSheetActive('Orders')) {
      hot.updateData([...hot.getSourceData(), ...created]);
    }

    return created;
  },
  // fetchRows, onRowsUpdate, onRowsRemove...
};
```

When the sheet isn't active anymore, the plugin refetches it, so the new rows are there when you return.

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
- Passing the same `sheets` array to [`updateSettings()`](@/api/core.md#updatesettings) again keeps the workbook. The plugin doesn't watch your own edits of that array or its entries: to change the workbook, call the plugin's methods. Passing another array rebuilds the workbook, unless the array matches the workbook as the plugin last wrote it: the same number of sheets, in the same order, each with the same `name`, `settings` with the same content (dates are compared by their value, functions and other class instances by reference), and the same `data` array. In framework wrappers, keep your `sheets` array stable. Changing only `controls`, `paging`, or `position` never rebuilds the workbook.
- `activeSheet` is a position in your `sheets` array. The plugin compares a value you pass with the one you passed last, so passing the same number again changes nothing, also after a removal. A new number counts in your array as it is after the removal, so after [`afterSheetTabRemove`](@/api/hooks.md#aftersheettabremove), recompute the position you keep in your own state before you change it. With `sheetsBar: true`, which declares no array, `activeSheet` counts in the tab order.
- A sheet's `data` that the plugin replaces with a new array, for example a server response for a sheet that isn't shown, isn't written into your entry.
- Switching sheets clears the [`UndoRedo`](@/api/undoRedo.md) history.
- Some plugin options, for example `autoLink`, merge: when two sheets set such an option as an object, the second sheet's object is merged into the first one's, the way two [`updateSettings()`](@/api/core.md#updatesettings) calls merge it. Keys the second sheet leaves out keep the first sheet's values. To give each sheet its own options, list every key you rely on in each sheet's object. A sheet that sets the option to `true` gets the defaults.
- A sorted sheet, or a sheet with moved rows or columns, comes back with the formulas HyperFormula holds for it, so an in-place change to its `data` while it isn't shown isn't seen. To change it, pass a new `sheets` value, which rebuilds the workbook.
- After a rename, `getSettings().formulas.sheetName` keeps the old name. The grid stays bound to the renamed sheet.
- Renaming a sheet, or inserting, removing, or moving rows or columns, rewrites formula text in your `data` arrays.
- A frozen `data` array (for example, from Immer) isn't written. The sheets bar uses a copy, so update your store yourself. On the active sheet, such a rename also clears the undo history.
- A sheet comes back with the invalid marks it had when you left it. A cell that becomes invalid while its sheet is hidden isn't marked until it's validated again, for example by an edit or [`validateCells()`](@/api/core.md#validatecells). Validating the whole sheet on every switch would make switching slow.
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
