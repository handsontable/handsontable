---
type: reference
title: Sheets bar
metaTitle: Sheets bar - JavaScript Data Grid | Handsontable
description: Render a tab bar below the grid and let users switch between the sheets of a multi-sheet workbook.
permalink: /sheets-bar
canonicalUrl: /sheets-bar
tags:
  - tabs
  - workbook
  - multi-sheet
  - sheet switching
react:
  metaTitle: Sheets bar - React Data Grid | Handsontable
angular:
  metaTitle: Sheets bar - Angular Data Grid | Handsontable
vue:
  metaTitle: Sheets bar - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: new
---

Render a tab bar below the grid and let users switch between the sheets of a multi-sheet workbook.

[[toc]]

## Overview

The [`SheetsBar`](@/api/sheetsBar.md) plugin renders a tab bar below the grid. Each tab represents one sheet, and clicking a tab switches the grid to that sheet's data. Every sheet owns its own data, its own configuration overrides, and its own runtime view state, such as scroll position and selection.

The plugin is disabled by default. Enable it with the [`sheetsBar`](@/api/options.md#sheetsbar) option.

## Enable the sheets bar

Set `sheetsBar` to `true` to wrap the grid's existing data into a single sheet named `Sheet1`, or pass an object with a `sheets` array to define the workbook up front.

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

Click the **Budget** and **Notes** tabs to switch between the two sheets. Click the `+` control to add a new sheet.

## Configuration options

You can customize the sheets bar using available settings, such as defining the initial workbook, choosing the sheet that opens first, or showing and hiding the bar's controls.

Each entry in `sheets` describes one sheet: its tab label, its source data, and optional grid settings applied while that sheet is active. Settings a sheet does not declare keep their grid-level values.

You can configure the following options:
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
    // on initialization
    activeSheet: 0,
    // Show or hide the add-sheet and all-sheets menu controls
    controls: true,
    // Show or hide the tab-scrolling arrows that appear when tabs
    // overflow the bar's width
    paging: true,
    // Custom container where the sheets bar UI will be injected
    // (optional). When omitted, the bar renders below the grid, in
    // the `bottom` layout slot.
    uiContainer: null,
  }
};
```

Read more about where the bar renders in the [layout slots](@/guides/accessories-and-menus/layout-slots/layout-slots.md) guide.

## Managing sheets programmatically

Get the plugin instance with [`getPlugin()`](@/api/core.md#getplugin) and call its API methods.

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
```

`getSheets()` returns a [`SheetDescriptor`](@/api/sheetsBar.md) for each sheet: its `id`, its `name`, and whether it is the active sheet. `setActiveSheet()` and `addSheet()` return `false` (or `null` for `addSheet()`) when the operation is rejected -- for example, when a [`beforeSheetTabChange`](@/api/hooks.md#beforesheettabchange) listener cancels a switch. `moveSheetToIndex(id, index)` moves a sheet to a new tab-order index and returns `false` when the move is rejected. `renameSheet(id, name)` and `removeSheet(id)` return `false` when the rename or removal is rejected, and `duplicateSheet(id)` returns a `SheetDescriptor` for the copy, or `null` when the copy is rejected.

## Tab menus

Each tab has a menu with **Rename**, **Duplicate**, **Delete**, **Move left**, and **Move right** actions. Open it with the chevron on the active tab, or right-click any tab. On an inactive tab, the chevron first switches to that sheet -- click it again to open the menu. Double-click a tab to rename it inline.

The all-sheets menu -- opened from the `≡` control next to the add-sheet button -- lists every sheet and lets you jump to any of them, including sheets that are scrolled out of view.

You can also reorder sheets by dragging a tab along the bar. Deleting the active sheet activates its nearest remaining neighbor, and the last remaining sheet can't be deleted.

## Overflow paging

When the tabs no longer fit the bar's width, paging arrows appear at the end of the strip. Click an arrow to scroll the tabs by one page. Set `paging: false` to hide the arrows and let the tab strip overflow instead.

## Right-to-left layout

Under a [right-to-left](@/guides/internationalization/layout-direction/layout-direction.md) layout, the tab strip mirrors: the first sheet's tab renders on the right, and the paging arrows swap direction. The tab menu's **Move left** and **Move right** actions keep referring to the visual direction, not the underlying array order.

## Use sheets bar hooks

You can run your code before or after different sheet operations, using the following [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md). Every `before` hook can cancel its operation by returning `false`.

- [`beforeSheetTabChange()`](@/api/hooks.md#beforesheettabchange)
- [`afterSheetTabChange()`](@/api/hooks.md#aftersheettabchange)
- [`beforeSheetTabAdd()`](@/api/hooks.md#beforesheettabadd)
- [`afterSheetTabAdd()`](@/api/hooks.md#aftersheettabadd)
- [`beforeSheetTabRemove()`](@/api/hooks.md#beforesheettabremove)
- [`afterSheetTabRemove()`](@/api/hooks.md#aftersheettabremove)
- [`beforeSheetTabRename()`](@/api/hooks.md#beforesheettabrename)
- [`afterSheetTabRename()`](@/api/hooks.md#aftersheettabrename)
- [`beforeSheetTabMove()`](@/api/hooks.md#beforesheettabmove)
- [`afterSheetTabMove()`](@/api/hooks.md#aftersheettabmove)
- [`afterSheetTabStateCapture()`](@/api/hooks.md#aftersheettabstatecapture)
- [`afterSheetTabStateRestore()`](@/api/hooks.md#aftersheettabstaterestore)

::: only-for javascript
```js
const configurationOptions = {
  beforeSheetTabChange(oldSheetId, newSheetId) {
    // add your code here
    return false; // to block the sheet switch
  },
  afterSheetTabChange(oldSheetId, newSheetId) {
    // add your code here
  },
  beforeSheetTabRemove(sheetId) {
    // add your code here
    return false; // to block the removal
  },
  // ...
};
```
:::

::: only-for react
```jsx
<HotTable
  beforeSheetTabChange={(oldSheetId, newSheetId) => {
    // add your code here
    return false; // to block the sheet switch
  }}
  afterSheetTabChange={(oldSheetId, newSheetId) => {
    // add your code here
  }}
  beforeSheetTabRemove={(sheetId) => {
    // add your code here
    return false; // to block the removal
  }}
  // ...
/>
```
:::

::: only-for vue
```ts
const hotSettings = {
  beforeSheetTabChange(oldSheetId, newSheetId) {
    // add your code here
    return false; // to block the sheet switch
  },
  afterSheetTabChange(oldSheetId, newSheetId) {
    // add your code here
  },
  // ...
};
```
:::

## Per-sheet view state

Switching sheets captures the outgoing sheet's scroll position, selection, sort, filters, hidden and trimmed indexes, merged cells, custom borders, manual column widths and row heights, and any cell-meta changes you made while it was active. It restores that state the next time you switch back to it. A sheet you have not visited yet opens with a neutral view state, so it never inherits the previous sheet's filters or sizes. The [`afterSheetTabStateCapture`](@/api/hooks.md#aftersheettabstatecapture) and [`afterSheetTabStateRestore`](@/api/hooks.md#aftersheettabstaterestore) hooks fire after each capture and restore.

## Use formulas across sheets

A sheet can enable the [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin through its own `settings`, and its formulas recalculate within that sheet.

Formulas can also reference other sheets of the workbook. Share one [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md#initialize-hyperformula) instance across the sheets, and give each sheet its own `sheetName` within that instance:

```javascript
const engine = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

const configurationOptions = {
  sheetsBar: {
    sheets: [
      {
        name: 'Rates',
        data: [[0.23]],
        settings: { formulas: { engine, sheetName: 'Rates' } },
      },
      {
        name: 'Budget',
        data: [[100, '=A1*Rates!A1']],
        settings: { formulas: { engine, sheetName: 'Budget' } },
      },
    ],
  },
};
```

Editing a value on one sheet recalculates the formulas that reference it on the other sheets. In the demo below, switch to the **Rates** sheet, change the VAT rate, and return to **Budget**: the VAT and gross amounts recalculate.

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

One thing to keep in mind: pass a built engine instance (`HyperFormula.buildEmpty()`), not the `HyperFormula` class. The class builds a separate engine for each sheet, and separate engines can't see each other's data. The plugin warns in the console when a `sheetName` rides on the class.

## Known limitations

- Only one sheet's data and settings are loaded into the grid at a time.
- Passing a changed `sheetsBar` value through [`updateSettings()`](@/api/core.md#updatesettings) rebuilds the whole workbook, discarding any sheets you added at runtime with `addSheet()`. Re-passing the same value leaves the workbook untouched, so a framework wrapper that re-emits its full settings object on every render does not reset it.
- Switching sheets calls [`loadData()`](@/api/core.md#loaddata) internally, which clears the [`UndoRedo`](@/api/undoRedo.md) plugin's undo and redo stacks.

## Related keyboard shortcuts

Each tab is a single stop in the tab order.

| Windows | macOS | Action |
| --- | --- | --- |
| <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | Switch to the focused tab's sheet. On the active tab, open the tab's menu |
| Arrow keys | Arrow keys | Move the focus along the tab strip |
| <kbd>**Home**</kbd> / <kbd>**End**</kbd> | <kbd>**Home**</kbd> / <kbd>**End**</kbd> | Move the focus to the first or last tab |
| <kbd>**Escape**</kbd> | <kbd>**Escape**</kbd> | Close the open menu, cancel an inline rename, or cancel a drag in progress |

Use the menu's **Move left** and **Move right** actions to reorder sheets from the keyboard, and its **Rename** action to rename a sheet.

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
