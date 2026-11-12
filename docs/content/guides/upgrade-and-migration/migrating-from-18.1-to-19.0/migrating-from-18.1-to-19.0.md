---
type: how-to
title: Migrating from 18.1 to 19.0
metaTitle: Migrating from 18.1 to 19.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.1 to Handsontable 19.0.
permalink: /migration-from-18.1-to-19.0
canonicalUrl: /migration-from-18.1-to-19.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.1 to 19.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.1 to 19.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.1 to 19.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.1 to Handsontable 19.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

19.0 also adds the [`ImportFile`](@/api/importFile.md) plugin, which reads `.xlsx` files with the built-in XLSX engine that section 38 describes; see [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md). It is new, so nothing to migrate.

Section 1 concerns the [`Formulas`](@/api/formulas.md) plugin, and applies only if you use it. Section 2 concerns the [`beforeInit`](@/api/hooks.md#beforeinit) hook, and applies only if you pass one in your settings. Section 3 concerns what a cell editor writes when you confirm it without typing, and affects every grid. Sections 4 and 5 concern the [`sanitizer`](@/api/options.md#sanitizer) option, and do not affect you if you do not set one. Section 6 applies whether you set a sanitizer or not. Section 7 concerns custom context menu and column menu items, and applies only if you build one. Section 8 concerns what <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click does inside a selection, and affects every grid that keeps the default [`selectionMode`](@/api/options.md#selectionmode). Section 9 concerns two deprecated [`Formulas`](@/api/formulas.md) methods, and applies only if you call either of them. Section 10 concerns how many rows are removed with a parent row, and applies only if you use the [`NestedRows`](@/api/nestedRows.md) plugin. Section 11 concerns what a cell stores when you write a plain value into a column whose [`source`](@/api/options.md#source) is an array of `{ key, value }` objects, and applies only if you declare one that way. Section 12 concerns when a [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) column marks a value invalid, and applies only if you set [`strict`](@/api/options.md#strict) to `false` on such a column. Section 13 concerns which row you land on when you leave a merged cell horizontally, and applies only if you use the [`MergeCells`](@/api/mergeCells.md) plugin. Section 14 concerns `tr` elements moving with their rows on a vertical scroll, and applies whether or not you set [`renderMode`](@/api/options.md#rendermode). Section 15 concerns how [`autoColumnSize`](@/api/autoColumnSize.md) measures [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), and [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) columns, and applies only if you leave that plugin on for those cell types and do not pin them with a column `width` or with [`colWidths`](@/api/options.md#colwidths). Section 16 concerns the new single-line default for those same three cell types, and applies only if you use one of them. Section 17 concerns the [`width`](@/api/options.md#width) and [`height`](@/api/options.md#height) options, and applies if you set `height: 'auto'`, or pass a CSS keyword, a `var()`, or a container-query unit to either option. Section 18 concerns what [`getCopyableData()`](@/api/core.md#getcopyabledata) returns, and applies only if you call it or [`getCopyableSourceData()`](@/api/core.md#getcopyablesourcedata) yourself. Section 19 concerns where the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md), and [`multiselect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editors open their lists, and applies if you use one of those cell types. Section 20 concerns two deprecated [`Core`](@/api/core.md) methods, [`spliceCol()`](@/api/core.md#splicecol) and [`spliceRow()`](@/api/core.md#splicerow), and applies only if you call either of them. Section 21 concerns the right-alignment and `htNumeric` class name of a [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell, and applies only if such a cell can hold a non-numeric value. Section 22 concerns what [`colToProp()`](@/api/core.md#coltoprop) and [`propToCol()`](@/api/core.md#proptocol) return for a column that does not exist, and applies if you call either of them, call [`getDataAtProp()`](@/api/core.md#getdataatprop) with an index, or add a [`modifyData`](@/api/hooks.md#modifydata) hook. Section 23 concerns the TypeScript types of the [`filters`](@/api/options.md#filters) option, and applies only if you use TypeScript and set `filters` to an object. Section 24 concerns how undo and redo work, and applies if you keep the default [`undo`](@/api/options.md#undo) setting. Section 25 concerns the new [`maxLength`](@/api/options.md#maxlength) option, and applies only if you already keep a `maxLength` key in your cell settings. Section 26 concerns the narrowest width a column can be resized to, and applies if you enable [`dropdownMenu`](@/api/options.md#dropdownmenu) and let users resize columns with [`manualColumnResize`](@/api/options.md#manualcolumnresize), or call [`setManualSize()`](@/api/manualColumnResize.md#setmanualsize) or [`setManualSizes()`](@/api/manualColumnResize.md#setmanualsizes). Section 27 concerns icons rendering as `<i>` elements instead of CSS pseudo-elements, and applies if you style a built-in icon, query for one in a test, or use the [`icons`](@/guides/styling/themes/themes.md#icons) theme parameter. Section 28 concerns moving columns across the freeze line, and applies if you use [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) together with [`manualColumnMove`](@/api/options.md#manualcolumnmove), or if you listen to the column freeze and unfreeze hooks. Section 29 concerns entitlement license keys, and applies only if you pass one in another form than the one you received. Section 30 concerns what <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**←**</kbd> and <kbd>**→**</kbd> do on a row header, and applies only if you use the [`NestedRows`](@/api/nestedRows.md) plugin with [`navigableHeaders`](@/api/options.md#navigableheaders) enabled. Section 31 concerns the TypeScript props of the React `HotColumn` component, and applies only if you use TypeScript and pass a hook, such as `afterChange`, to `HotColumn`. Section 32 concerns [`editor: false`](@/api/options.md#editor), and applies only if you set it together with a column [`type`](@/api/options.md#type), or on a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) column. Section 33 concerns changing [`dataSchema`](@/api/options.md#dataschema) with [`updateSettings()`](@/api/core.md#updatesettings), and applies only if you change it after the grid is created without setting [`columns`](@/api/options.md#columns). Section 34 concerns the [`colWidths`](@/api/options.md#colwidths) option, and applies only if you set it to an array or a function and your columns can be moved, or you set it to an array and insert or remove columns. Section 35 concerns how wide an auto-sized column can get, and applies only if you leave [`autoColumnSize`](@/api/autoColumnSize.md) on and a column holds text wider than the grid. Section 36 concerns what `setValue()` receives in a custom editor that extends [`BaseEditor`](@/guides/cell-functions/cell-editor/cell-editor.md) directly, and applies only if you write one, or build one with the editor factory. Section 37 concerns how a string `rowId` in the [`dataProvider`](@/api/options.md#dataprovider) option reads a property with a dot in its name, and applies only if your rows have such a property, you rewrite the id with a `modifySourceData` hook, or you use TypeScript and read `dataProvider.rowId` back as a string. Section 38 concerns the XLSX format of the [`ExportFile`](@/api/exportFile.md) plugin, which no longer needs ExcelJS, and applies if you set the [`exportFile`](@/api/options.md#exportfile) option, call `supportsExportFormat('xlsx')`, or export to XLSX. Section 39 concerns [`removeCellMeta()`](@/api/core.md#removecellmeta) with an index outside the grid's range, and applies only if you make such a call. Section 40 concerns which columns a [`dataSchema`](@/api/options.md#dataschema) with non-`null` values creates, and applies only if you set `dataSchema` with such values and don't set [`columns`](@/api/options.md#columns). Section 41 concerns the TypeScript types of ten options, and applies only if you use TypeScript and set, read, or call one of them. Section 42 concerns a hook set to `null` through [`updateSettings()`](@/api/core.md#updatesettings), and applies only if you pass `null` for a hook, or clear or drop a hook prop in a framework wrapper, and expect the earlier callback to keep running. Section 43 concerns a `null` column width, and applies only if you set [`colWidths`](@/api/options.md#colwidths) or a column `width` to `null`, or check for `null` in a [`modifyColWidth`](@/api/hooks.md#modifycolwidth) callback. Section 44 concerns an [`afterRender`](@/api/hooks.md#afterrender) hook that writes to the HyperFormula engine, and applies only if you use the [`Formulas`](@/api/formulas.md) plugin and write to the engine from such a hook. Section 45 concerns the copy, cut, and paste shortcuts, which the `grid` shortcut context now lists, and applies only if you read or remove the <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, <kbd>**X**</kbd>, or <kbd>**V**</kbd> shortcut through the [`ShortcutManager`](@/api/shortcutManager.md). Section 46 concerns the Vue 3 wrapper's props. It applies if you type-check the props you pass to `HotTable` or `HotColumn`, and if you pass `handsontable` or `getValue` to either component. Section 47 concerns four deprecated [`MergedCellsCollection`](@/api/mergedCellsCollection.md) methods, and applies only if you call one of them. Section 48 concerns the [`Loading`](@/api/loading.md) plugin, and applies only if you register modules one by one and register `Loading` without the [`Dialog`](@/api/dialog.md) plugin. Section 49 concerns when plugins apply the settings the grid is built with, and applies only if a listener of a hook that work fires, such as [`afterColumnSort`](@/api/hooks.md#aftercolumnsort) or [`afterMergeCells`](@/api/hooks.md#aftermergecells), reads the drawn grid. Section 50 concerns the [`rowHeights`](@/api/options.md#rowheights) option, and applies if you set it to a height that is smaller than your cell content or smaller than the default row height, and you do not enable [`autoRowSize`](@/api/options.md#autorowsize). Section 51 concerns a change that waits for its cell's [`validator`](@/api/options.md#validator) when you call [`loadData()`](@/api/core.md#loaddata), and applies if your cells have validators, including `numeric`, `date`, and [`maxLength`](@/api/options.md#maxlength) cells, and you call `loadData()` while the user edits or right after your own `setDataAtCell()`. Section 52 concerns what the `SHEET()` formula function returns after a sheet is removed, and applies only if you use the [`Formulas`](@/api/formulas.md) plugin with an engine it creates, remove sheets, and read `SHEET()` results as positions. Section 53 concerns what [`updateSettings()`](@/api/core.md#updatesettings) does to the rows of a grid with a [`dataProvider`](@/api/options.md#dataprovider), and applies only if you pass it `data`, pass the same `dataProvider` object again to load the rows, or pass `pagination`, `columnSorting`, `filters`, or `columns` to a grid with a `dataProvider`. Section 54 concerns which settings the React and Angular wrappers pass to [`updateSettings()`](@/api/core.md#updatesettings), and applies only if you rely on a render or a `settings` change to reset a sort, filter, or page, or to put back a setting you changed through the instance. Section 55 concerns the `'non-commercial-and-evaluation'` license key, which no longer works, and applies if you pass it, or import the Angular wrapper's `NON_COMMERCIAL_LICENSE` constant. Section 56 concerns the minimum browser versions, and applies if your app must run in a browser older than Chrome or Edge 130, Firefox 132, or Safari 18.2. Section 57 concerns the APIs deprecated in 17.1 and 18.0 that 19.0 removes, and applies only if you call one of them or import one of the two type aliases. Section 58 concerns the [`rowHeights`](@/api/options.md#rowheights) and [`minRowHeights`](@/api/options.md#minrowheights) options, and applies only if you set one of them to an array or a function and your rows can be moved, sorted, filtered, trimmed, or collapsed, or you insert or remove rows. Section 59 concerns the [`Dialog`](@/api/dialog.md) plugin, which no longer stays enabled after you turn [`loading`](@/api/options.md#loading) off, and applies only if you use the `Dialog` plugin without setting [`dialog`](@/api/options.md#dialog). Section 60 concerns where a row lands when users drag it into a gap that holds hidden rows, and applies only if you use [`manualRowMove`](@/api/options.md#manualrowmove) together with [`hiddenRows`](@/api/options.md#hiddenrows).

## 1. `date` cells reach the formula engine the same way on every data path

This section can change what your formulas return. The [`Formulas`](@/api/formulas.md) plugin has always protected a [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell's value from the calculation engine's own parsing when you type into the cell. It did not do the same when the value arrived through [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata), [`updateSettings()`](@/api/core.md#updatesettings), or [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell). The same cell held two different values in the engine depending on how it was filled.

All of those paths now match the initial data load. That inconsistency was a defect, but closing it is still an observable change: a grid that relied on the engine coercing a non-ISO value in a `date` column gets a different result now. Check this section if you have such a column.

### Values that are not ISO dates stay text

A `date` column holds strings in your [`dateFormat`](@/api/options.md#dateformat). A value that does not parse as an ISO 8601 date used to reach the engine as whatever the engine made of it on its own: `'123'` became the number 123, `'12:30'` became a time fraction, and `'TRUE'` became a boolean. A formula reading that cell calculated on the converted value.

Those values now reach the engine as text, so a formula reading the cell sees the string you loaded.

### A `type` set through `cells()` now applies

If a `cells()` function is the only place a cell's `type` is declared, the plugin previously ignored that type on the data paths above. It now honors it, the same way it already did for a `type` set on the grid, on a column, or through the `cell` array.

### Your `cells()` function and meta hooks run on those paths

Honoring a `cells()`-provided type means calling that function. On the paths above, the plugin now reads each cell's meta through the same pipeline the rest of the grid uses, so your `cells()` function and your [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta) and [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta) listeners run once per non-formula text cell. The previous read invoked none of them.

`updateSettings()` is the path worth checking, because it runs on every call.

### Who is affected

You are affected only if you use the `Formulas` plugin, and then only in one of these three cases:

- You have a `date` column that can hold values that are not ISO 8601 dates, and a formula reads those cells.
- You declare a cell's `type` only through a `cells()` function.
- Your `cells()` function, `beforeGetCellMeta` listener, or `afterGetCellMeta` listener has side effects.

A grid whose configuration declares no `date` type and no [`preserveTextValue`](@/api/options.md#preservetextvalue) option skips the pass entirely, so none of the meta reads happen at all.

### How to migrate

The first two cases need no code change. The values and types are now what the plugin's documentation describes, so what to check is a formula that read one of these cells as a number.

Direct arithmetic and concatenation are unaffected, because the engine coerces a numeric string the way a spreadsheet does. What changes is every function that tells a number from text. With `'123'` loaded into a `date` cell as `A1`:

| Formula | Before | After |
| --- | --- | --- |
| `=A1+1` | `124` | `124` |
| `=A1&"x"` | `123x` | `123x` |
| `=SUM(A1:A1)` | `123` | `0` |
| `=COUNT(A1:A1)` | `1` | `0` |
| `=ISNUMBER(A1)` | `true` | `false` |

If a total has to keep counting those cells, convert them where you read them:

**Before:**

```js
'=SUM(A1:A10)'
```

**After:**

```js
'=SUMPRODUCT(VALUE(A1:A10))'
```

The better fix is to stop putting non-date values in a `date` column. A column whose cells hold plain numbers is a [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) column, and the engine has always read those as numbers.

For the third case, make the listener safe to call during a data load. A listener that calls `setDataAtCell()` or `updateSettings()` now has a path back into the grid it did not have before:

**Before:**

```js
cells(row, column) {
  this.setDataAtCell(row, column, computeSomething(row));

  return { type: 'date' };
},
```

**After:**

```js
cells(row, column) {
  return {
    type: 'date',
    valueGetter: value => value ?? computeSomething(row),
  };
},
```

## 2. A `beforeInit` callback in your settings now runs

This was a bug rather than a change of contract, but it can stop the grid from
loading, so read it if your settings object declares a `beforeInit` callback.

[`beforeInit`](@/api/hooks.md#beforeinit) has been a documented option for years, and passing it in the
settings object did nothing. Handsontable registered the callbacks from your settings only after it had
already fired the hook, so the listener always arrived too late. Such a callback now runs.

### Why a dormant callback can break the grid

Because the callback never ran, its body was never exercised. If it calls a method that reads the data,
it now throws, and nothing catches that. The grid never finishes building, so you get no grid at all.
In the wrappers the error comes out of the component's mount.

`beforeInit` fires before the data is loaded and before the table is rendered. Your settings are
readable through [`getSettings()`](@/api/core.md#getsettings), but
[`countRows()`](@/api/core.md#countrows), [`getData()`](@/api/core.md#getdata), and any method on
`hot.view` are not available yet.

### Who is affected

You are affected only if your settings object declares `beforeInit`. Callbacks registered with
`Handsontable.hooks.add('beforeInit', ...)` or with [`addHook()`](@/api/core.md#addhook) are unchanged,
because those always worked.

### How to migrate

Check what the callback does. If it only prepares your own state, it needs no change. If it touches the
grid, move that part to [`afterInit`](@/api/hooks.md#afterinit).

**Before:**

```js
const hot = new Handsontable(container, {
  data,
  beforeInit() {
    this.rowCount = this.countRows(); // Throws, the data is not loaded yet.
  },
});
```

**After:**

```js
const hot = new Handsontable(container, {
  data,
  afterInit() {
    this.rowCount = this.countRows();
  },
});
```

### Two hooks that still cannot be used as options

[`construct`](@/api/hooks.md#construct) and
[`afterPluginsInitialized`](@/api/hooks.md#afterpluginsinitialized) run before Handsontable reads the
callbacks from your settings, so declaring either as an option still does nothing. Register them
globally:

```js
Handsontable.hooks.add('construct', () => {
  // your code
});
```

## 3. Confirming an editor without typing writes nothing

This one applies to every grid, whatever your configuration.

Opening a cell editor and pressing <kbd>**Enter**</kbd> without typing used to write the editor's value back over the cell. The editor holds a string, because that is what an input can display, so the cell received that string rather than the value it already held. A cell holding `null` was left holding `''`. So was one holding `undefined`. A `true` became `'true'`, and a number in a [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) column became a string.

The write also fired [`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange) each time, so opening a cell and closing it again reported an edit that never happened.

Such a confirm now writes nothing at all, and neither hook fires. That includes an editor whose `getValue()` returns the cell value it was opened with. Section 36 names those editors.

### Validation is unchanged

A cell with a [`validator`](@/api/options.md#validator) is still validated on that confirm. [`allowInvalid: false`](@/api/options.md#allowinvalid) still holds the editor open on a value the validator rejects. The validator now runs against the value the cell already holds, which is the same value it would have been handed before.

### Who is affected

- You count `afterChange` events to drive a dirty flag, an autosave, or a change tracker. You will see fewer of them. The ones you lose are the ones that reported an edit the user did not make.
- You cancel changes by returning `false` from `beforeChange`, **and** you rely on that closing the editor. See below.

### An editor that `beforeChange` used to close

Returning `false` from `beforeChange` closes the open editor. That is still true of a real edit. It is no longer true of a confirm that changed nothing, because there is no change to cancel and the hook does not run.

On such a confirm the validator decides, as it does everywhere else. If the cell has no validator, or the value passes, the editor closes as before. If the validator rejects the value and `allowInvalid` is `false`, the editor stays open. That is the same thing it already did when `beforeChange` returned `true`, so the two now agree. <kbd>**Escape**</kbd> closes the editor and leaves the value alone.

### How to migrate

Nothing to change in most cases. A dirty flag that counts `afterChange` becomes more accurate on its own.

If you need to know that the user opened and closed an editor, regardless of whether anything changed, `afterChange` was never the right signal for it. Use [`afterBeginEditing`](@/api/hooks.md#afterbeginediting) to see the editor open.

### Related: choosing what an emptied cell stores

Handsontable stored two different values for an empty cell depending on how you emptied it: <kbd>**Delete**</kbd>, [`setDataAtCell()`](@/api/core.md#setdataatcell) and a fill stored `null`, while clearing the editor or pasting a blank cell stored `''`. The new [`emptyValue`](@/api/options.md#emptyvalue) option lets you pick one. It is opt-in and the default is unchanged, so it needs no action on upgrade. See [Empty cell values](@/guides/getting-started/binding-to-data/binding-to-data.md#empty-cell-values).

## 4. A sanitizer that returns a `TrustedHTML` skips paste normalization

If your sanitizer returns a string, nothing on the paste path has changed. Handsontable still hands
it the clipboard payload as the clipboard carried it, and still flattens the contents of each `<td>`
to text afterwards, so cell values stay free of markup apart from `<br>`.

The new case is a sanitizer that returns a [`TrustedHTML`](@/guides/security/security/security.md#trusted-types-and-csp),
which a page enforcing `require-trusted-types-for 'script'` has to do. That value reaches the parser
unchanged: it is never concatenated, re-tested, or turned back into a string, because any of those
strip the trust that makes the parser accept it. Flattening is a string rewrite, so it cannot run on
a `TrustedHTML` either, and Handsontable skips it.

The consequence is that a `TrustedHTML` sanitizer owns what lands in cells. Markup it permits inside
a `<td>` arrives in the cell value rather than being flattened away, where the
[`html`](@/guides/cell-types/cell-type/cell-type.md) cell type or a custom renderer will interpret
it. If your policy wraps a sanitizer that adds markup, restrict it to the pasted-HTML sources:

```js
sanitizer: (content, source) => {
  if (source.startsWith('CopyPaste.paste')) {
    return policy.createHTML(DOMPurify.sanitize(content));
  }

  return policy.createHTML(linkify(DOMPurify.sanitize(content)));
},
```

## 5. `toHTML()` puts headers through your sanitizer

[`toHTML()`](@/api/core.md#tohtml) interpolated column and row headers into its output without
sanitizing them, while [`toTableElement()`](@/api/core.md#totableelement) sanitized them. With
`colHeaders: ['<b>ID</b>']` and a sanitizer that removes markup, the two methods described the same
grid differently. Both now sanitize.

If you read `toHTML()` output expecting header markup to survive a stripping sanitizer, it no longer
does. Neither method emits the missing-sanitizer console warning any more: both are read-only, so
the warning named a write that never happened.

## 6. Character references in grid copy and cell text

This section applies whether or not you set a `sanitizer`.

Handsontable used to build several parts of its interface as HTML strings and assign them to
`innerHTML`, which made the browser's HTML parser decode any character references as a side effect.
Those surfaces now build DOM nodes and write text directly, so Handsontable resolves the references
itself against a fixed set of names.

It affects dialog titles and descriptions, empty-state copy, button labels, and the cell text
returned by [`toTableElement()`](@/api/core.md#totableelement). Numeric references such as `&#8212;`
and `&#x2014;` are unaffected, and so are the named references that appear in ordinary copy:
`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&nbsp;`, and the punctuation and currency names.

Two kinds of reference now render as written:

- A name outside the supported set. A title reading `a &hearts; b` displays `a &hearts; b` rather
  than `a ♥ b`.
- A name spelled in upper case. `&AMP;`, `&COPY;` and `&REG;` are valid HTML, and they are left as
  written. Use the lower-case spelling.

If either appears in your copy, write the character itself, or use a numeric reference.

## 7. `checked` is a reserved context menu item property

This section applies only if you build your own
[context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) or
[column menu](@/guides/accessories-and-menus/column-menu/column-menu.md) items.

Handsontable marks its own toggle items with a check mark: "Read only", "Read-only comment", and the
four border items. That mark used to be an HTML string built into the item's `name`, which a page
enforcing `require-trusted-types-for 'script'` rejected. Each item now declares its state in a
`checked` option, and Handsontable builds the mark as a DOM node.

`checked` is therefore read on every menu item. An item of your own that already carries a property
of that name, holding a boolean, the string `'mixed'`, or a function returning either, now does two
things it did not do before:

- it draws a mark before its label: a check mark when the value resolves to `true`, and a dash when
  it resolves to `'mixed'`
- it is announced to assistive technology as a checkbox with a state, rather than as a plain menu
  item

A property named `checked` holding anything else, such as any other string or a number, is ignored.

The built-in "Read only" and "Read-only comment" items use `'mixed'` when only some of the selected
cells are read-only. They show a dash there, where they used to show a check mark.

If you use a theme without icons, such as `ht-theme-main-no-icons.css`, draw both marks on their icon
elements. The check mark is an `<i class="ht-icon ht-icon-check">` inside `span.selected`, and the
dash is an `<i class="ht-icon ht-icon-collapse-off">` inside `span.htMixed`. Give each one a mask:

```css
.htItemWrapper .ht-icon-check {
  mask-image: url('/icons/check.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  background-color: currentColor;
}

.htItemWrapper .ht-icon-collapse-off {
  mask-image: url('/icons/dash.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  background-color: currentColor;
}
```

A rule for `span.selected::after` from 18.1 paints nothing in 19.0. The span keeps `font-size: 0`,
so a pseudo-element added to it inherits that size and renders no box. See
[Icons are rendered as `<i>` elements](#icons-are-rendered-as-i-elements).

If the property was your own bookkeeping and you want neither effect, rename it:

```js
// Before
{ name: 'Sync', checked: isSyncing, callback() { /* ... */ } }

// After
{ name: 'Sync', syncing: isSyncing, callback() { /* ... */ } }
```

If you drew the mark yourself inside `name`, use the option instead. An item that does both gets two
marks, because Handsontable adds its own in front of the label you built:

```js
// Before
{ name: () => `<span class="selected">&#10003;</span>My toggle`, checked: myState }

// After
{ name: 'My toggle', checked: () => myState }
```

The second form also needs no [`sanitizer`](@/api/options.md#sanitizer). A `name` containing markup
is written through `innerHTML`, so under Trusted Types it needs a policy-backed sanitizer; a plain
label does not.

## 8. <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click on a selected cell moves the highlight

This applies to every grid that keeps the default [`selectionMode`](@/api/options.md#selectionmode) of
`multiple`.

Since 16.0.0, <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + clicking a cell that was already part of the
selection removed it, wherever the highlight happened to be. The cell you just clicked therefore
stopped being selected, and the highlight fell back to another layer, so it appeared to jump to a cell
you clicked earlier. Moving the highlight around inside a multi-cell selection was not possible.

What the click does now depends on where the highlight is:

- The clicked cell does not hold the highlight: the highlight moves to it, and it stays selected. So
  does every other selected cell.
- The clicked cell already holds the highlight: the cell is deselected. Clicking the last remaining
  cell this way still clears the selection.

Two <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + clicks on the same cell therefore still deselect it. The
first moves the highlight there, and the second removes it. How quickly you click makes no
difference, so a <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + double-click does the same thing as those
two clicks: it moves the highlight onto the cell and then removes it.

### Who is affected

- You rely on a single <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click removing a cell from the
  selection without regard to the highlight. It now takes two clicks unless the cell is already
  highlighted.
- You count [`afterDeselect`](@/api/hooks.md#afterdeselect) events, or read
  [`getSelected()`](@/api/core.md#getselected) after such a click. A click that moves the highlight
  keeps the layer instead of dropping it, and no longer clears the selection.

A grid with `selectionMode` set to `single` or `range` is unaffected, because neither supports more
than one selection layer.

### How to migrate

Nothing to change in most cases, because the gesture now does what the highlight shows. If your own
code removed a selection layer in response to such a click, drop that workaround: the grid no longer
removes the layer for you.

## 9. Formulas shortcut methods

This applies only if you call [`registerShortcuts()`](@/api/formulas.md#registershortcuts) or
[`unregisterShortcuts()`](@/api/formulas.md#unregistershortcuts) on the
[`Formulas`](@/api/formulas.md) plugin.

The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut now, registered for
every grid, so the `Formulas` plugin has nothing left for either method to do. Both are deprecated
no-op methods since 19.0.0, and each prints a one-time console warning when called. They will be
removed in 20.0.0.

Nothing else about the shortcut changes: `Alt`+`Enter` still opens the link of the selected cell the
same way it always did.

### Who is affected

You are affected only if your code calls `hot.getPlugin('formulas').registerShortcuts()` or
`.unregisterShortcuts()` -- for example, to re-register the shortcut after disabling and
re-enabling the plugin.

### How to migrate

Remove the calls. The shortcut is available on every grid regardless of whether the `Formulas`
plugin is enabled, so there is nothing to replace them with.

**Before:**

```js
const formulas = hot.getPlugin('formulas');

formulas.disablePlugin();
formulas.enablePlugin();
formulas.registerShortcuts();
```

**After:**

```js
const formulas = hot.getPlugin('formulas');

formulas.disablePlugin();
formulas.enablePlugin();
```

## 10. Removing a parent row removes every row below it

This applies only if you use the [`NestedRows`](@/api/nestedRows.md) plugin.

Removing a parent row has always been documented as removing that row and all of its children. Up to
18.1, it removed the parent and its direct children only. On a tree three or more levels deep, the
grandchildren and everything below them stayed on screen as blank rows. Their data was already gone,
because removing the parent object takes its whole branch with it, so those rows had nothing behind
them and no further **Remove row** could clear them.

Take this tree:

```js
const data = [
  {
    name: 'father 1',
    __children: [
      {
        name: 'Child 1.1',
        __children: [
          {
            name: 'Child 1.1.1',
            __children: [{ name: 'Child 1.1.1.1' }],
          },
        ],
      },
    ],
  },
];
```

Removing row `0`:

|  | Rows removed | Rows left |
| --- | --- | --- |
| Up to 18.1 | 2 | 2 blank rows |
| From 19.0 | 4 | none |

### Who is affected

- You read the physical row indexes from
  [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) or
  [`afterRemoveRow`](@/api/hooks.md#afterremoverow). Both now receive every descendant. For the tree
  above, removing row `0` reported `[0, 1]` and now reports `[0, 1, 2, 3]`.
- You count the rows a removal affects, or use the `amount` argument to size your own bookkeeping.
  Read that number from [`afterRemoveRow`](@/api/hooks.md#afterremoverow), which reports the rows
  that were really removed. In [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow), `amount` is
  counted before the plugin adds the descendants, so it stays at the old value -- read the length of
  the row array that hook receives instead.
- You relied on the blank rows staying behind, for example by writing new values into them. They are
  gone.
- You undo a removal. From 19.0, undo restores the parent and its descendants. Up to 18.1 it put
  back one row and left the rest on screen with no data behind them.

A tree two levels deep is unaffected. There, the direct children and all descendants are the same
set, so the number of removed rows does not change.

### How to migrate

Nothing to change in most cases, because the rows that are now removed had no data behind them. If
your own code reacts to a row removal, read the row list from the hook argument rather than assuming
one parent plus its direct children.

## 11. A plain value written into a key/value `source` cell resolves to the matching object

This applies only to
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) columns whose
[`source`](@/api/options.md#source) is an array of `{ key, value }` objects. The `handsontable` cell
type is unaffected -- it stores whatever you write, and always did.

Such a cell stores the whole object, not the label shown for it. The cell editor already resolved a
label into that object, but no other way of writing to the cell did. Writing the label `'BMW'` into a
column whose source held `{ key: '1', value: 'BMW' }` stored one of two wrong values, depending on
what the cell held before:

- an empty cell stored the string `'BMW'`
- a cell that already held an object stored `{ key: 'BMW', value: 'BMW' }`, reusing the label as the key

The label is now looked up among the source objects, and the matching object is stored whole. Every
way of writing to the cell behaves like the editor:

- pasting text, including a paste from another application and a paste as plain text
  (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**V**</kbd>)
- [`setDataAtCell()`](@/api/core.md#setdataatcell) and
  [`populateFromArray()`](@/api/core.md#populatefromarray)
- autofill and undo

A value that matches no source object is stored as you wrote it, so a
[`strict`](@/api/options.md#strict) column still marks it invalid. A `source` of plain strings is
unaffected, and so is a `source` declared as a function, because its options are not known until the
function answers.

**Loading data does not resolve anything.** The [`data`](@/api/options.md#data) option,
[`loadData()`](@/api/core.md#loaddata) and [`updateData()`](@/api/core.md#updatedata) store what you
give them, so an existing dataset that holds plain labels keeps them until something writes to those
cells.

**Clearing a cell leaves it empty.** Emptying a cell that held an entry used to store
`{ key: null, value: null }`, so [`getSourceData()`](@/api/core.md#getsourcedata) handed back an
object for a cell the user had cleared, and [`emptyValue`](@/api/options.md#emptyvalue) never
applied to that column at all. Such a cell now stores the empty value, like every other column.

**Undo and redo restore what the cell held, exactly.** They resolve nothing, which is a fix in its
own right: undoing back to a plain label used to store `{ key: <label>, value: <label> }` whenever
the cell happened to hold an object at the time, so the restored cell carried a key that matched no
option and a [`strict`](@/api/options.md#strict) column marked it invalid. It now restores the plain
label you undid to.

### Who is affected

- You use a `strict` column, such as `dropdown`. Pasting a valid label used to mark the cell invalid.
  It is now accepted, so a cell you expected to fail validation may now pass.
- You use a non-strict `autocomplete` column and read
  [`getSourceData()`](@/api/core.md#getsourcedata) after a paste or a
  [`setDataAtCell()`](@/api/core.md#setdataatcell) call. Those cells now hold objects where some of
  them held plain strings, so the column no longer mixes the two shapes.
- You wrote code to repair the mixed shapes yourself, or to rebuild the `key` from the label.

### How to migrate

Nothing to change in most cases, because the column now stores one shape everywhere, which is the
shape the editor always produced. If your own code turned a stored string back into a source object
after a paste, drop that workaround. If you read these cells with
[`getSourceData()`](@/api/core.md#getsourcedata) and branched on whether the value was a string, that
branch is now dead for values that match an option -- read the `value` property instead.

## 12. A `dropdown` column with `strict: false` validates strictly

This applies only to
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) columns that set
[`strict`](@/api/options.md#strict) to `false`. The dropdown cell type is strict by definition, and
its documentation has always described it that way.

Such a column used to validate strictly only in the cells the user had clicked. A value outside the
[`source`](@/api/options.md#source) list was marked invalid when it was typed into the cell, but not
when it arrived any other way:

- pasting text
- [`setDataAtCell()`](@/api/core.md#setdataatcell) and
  [`populateFromArray()`](@/api/core.md#populatefromarray)
- autofill
- [`validateCells()`](@/api/core.md#validatecells)

Clicking a cell was what changed the result, because opening that cell's editor made that one cell
strict. An [`updateSettings()`](@/api/core.md#updatesettings) call carrying
[`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells) or
[`cell`](@/api/options.md#cell) made it lenient again, which the React wrapper does on every render
of a grid with `HotColumn` children.

Every path now gives the same result: a value that is not in the `source` list is invalid.

### Who is affected

- You declare a `dropdown` column with `strict: false`, and values outside its `source` list reach
  those cells by a paste, autofill, or an API call. Those cells are now marked invalid. With
  [`allowInvalid: false`](@/api/options.md#allowinvalid) the write is rejected, as it already was
  for a typed value.
- You call [`validateCells()`](@/api/core.md#validatecells) on such a grid and count the invalid
  cells, or act on the result.

### How to migrate

To keep accepting values outside the list, use an
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) column with
`strict: false`, which accepts custom values by design. The editor differs in one way: an
autocomplete column filters its list as you type, while a dropdown column sets
[`filter`](@/api/options.md#filter) to `false` and always shows the whole list.

To keep the dropdown and still store values outside the list, leave
[`allowInvalid`](@/api/options.md#allowinvalid) at its default of `true`. The value is stored, and
the cell is marked invalid.

## 13. Leaving a merged cell with a left or right arrow lands on its top row

This applies to every grid that uses [`mergeCells`](@/api/options.md#mergecells).

Before 19.0.0, moving the selection off a merged cell with a left or right arrow kept the row you
entered the merged cell on, so the result depended on the direction. Entering a three-row merged cell
from below (arrow up) and pressing left landed one row lower than entering it from above (arrow down)
and pressing left.

A merged cell is now addressed by its top-left corner: a left or right arrow that leaves it always
lands on its top row -- its topmost visible row when the top row is hidden -- whichever way you
entered. Vertical navigation still keeps the column you were moving along, and the
<kbd>**Tab**</kbd> and <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> keys still keep the row they cycle
along.

### Who is affected

- You read [`getSelected()`](@/api/core.md#getselected) or
  [`getSelectedRangeLast()`](@/api/core.md#getselectedrangelast) after a left or right arrow that
  leaves a merged cell entered on a row other than its first. The highlight now lands on the merged
  cell's top row rather than the entered row.

A grid without merged cells is unaffected.

### How to migrate

Nothing to change in most cases -- the landing is now consistent with a merged cell being a single
cell at its top-left corner. If your code compensated for the old direction-dependent landing, drop
that workaround.

## 14. Row elements move with their rows on a vertical scroll

This section applies whether or not you set [`renderMode`](@/api/options.md#rendermode).

Since 18.0, Handsontable kept every `tr` and `td` element at its DOM position during a scroll and wrote
the row that scrolled into it. In 19.0, a vertical scroll inside the grid's own scrollable area moves
the `tr` elements instead: a row that stays rendered keeps its element, and the rows that scrolled out
wrap to the other end of the `tbody` and take the rows that scrolled in. The DOM order still matches
the rendered order, so the first `tr` is still the first rendered row. The column axis is unchanged.

Handsontable does this on its own; there is no option. It applies when the grid scrolls inside its own
container on both axes. A grid that scrolls with the page keeps the elements in place, as before.

### Who is affected

- A `MutationObserver` on the `tbody` now sees `childList` records on every scroll step: the moved
  `tr` elements, removed and added again in one move. Nothing is created or dropped while the number
  of rendered rows is unchanged.
- Code that keeps a reference to a `tr` or `td` and expects it to show whatever row scrolled into
  that position now finds the same row it held before, as long as that row stays rendered. Read the
  row through [`getCell()`](@/api/core.md#getcell) or the element's position in the `tbody` instead.
- A host page with `:has()` selectors that reach the grid pays a style recalculation for a DOM move
  the same way it did for the 16.x re-insertion. Measured on a page with 30,000 nodes and three
  `:has()` rules, the cost stayed flat; if your page shows one, say so in an issue.
- The [`modifySinglePassLayout`](@/api/hooks.md#modifysinglepasslayout) hook no longer opts a grid out
  of this behavior. It still switches the layout model, and only that.

### How to migrate

Nothing changes for a renderer that writes the cell from the data it receives. A renderer that caches
per element now keeps its cache across a scroll, which is the point of the change.

A renderer whose output depends on where the rendered area starts or ends, for example one that reads
[`getFirstRenderedVisibleRow()`](@/api/core.md#getfirstrenderedvisiblerow), works as before under the
default `renderMode`. Under `renderMode: 'onChange'` such a cell is not repainted by a scroll, so set
`renderMode: 'always'` on that column or cell, or call
[`markCellChanged()`](@/api/core.md#markcellchanged) before you render.

## 15. AutoColumnSize includes the list-cell arrow in the column width

This applies only if you leave [`autoColumnSize`](@/api/autoColumnSize.md) on -- the default -- for
an [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md),
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), or
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) column, and
you do not pin those columns with a column [`width`](@/api/options.md#width) or with
[`colWidths`](@/api/options.md#colwidths).

A long value next to the list-cell arrow used to wrap the arrow onto a second line. AutoColumnSize
measured the text alone, so an autosized column was narrower than the value plus the arrow. The
arrow is now out of flow, and its width is reserved as trailing padding on the cell. AutoColumnSize
renders the real cell renderer off-DOM, so that padding is part of the measured width and the
column grows.

### Who is affected

You are affected if you use the default AutoColumnSize plugin on an autocomplete, dropdown, or
handsontable column. Those columns become wider on upgrade by the reserved arrow slot. A column
you pin with `width` or `colWidths` keeps the width you set.

### How to migrate

Nothing to change if the extra width is acceptable.

To keep the previous size on one column without turning AutoColumnSize off for the rest of the
grid, set that column's `width`:

**Before:**

```js
columns: [
  { type: 'autocomplete', source: countries },
  { type: 'text' },
],
```

**After:**

```js
columns: [
  { type: 'autocomplete', source: countries, width: 120 },
  { type: 'text' },
],
```

To pin every column, set `colWidths`. That option disables AutoColumnSize for the whole grid.

## 16. The list cell types default to a single line

This applies only to the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), and [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cell types, which render a dropdown arrow.

In a narrow column, the value in one of these cells used to wrap onto several lines and tangle with the arrow. Each of these three cell types now defaults [`textEllipsis`](@/api/options.md#textellipsis) to `true`, so the value stays on a single line and truncates with an ellipsis, clear of the arrow (the arrow's own space is reserved -- see the previous section).

This is a default, not a fixed rule -- [`textEllipsis`](@/api/options.md#textellipsis) and [`wordWrap`](@/api/options.md#wordwrap) still work, so you can turn wrapping back on. The default comes from the cell **type**, so it reaches a column that sets `type: 'autocomplete'` (or `'dropdown'` / `'handsontable'`); a column that only sets `renderer: 'autocomplete'` without the type keeps its previous wrapping.

This also changes [`autoRowSize`](@/api/options.md#autorowsize). It measures each row by rendering the real cell, so on such a column a long value used to wrap and grow the row. That value now stays on one line, so those rows size to a single line instead of growing to fit the wrapped text.

### Who is affected

You are affected only if you use `type: 'autocomplete'`, `'dropdown'`, or `'handsontable'` and relied on the value wrapping onto multiple lines within the cell. A value that carries its own line breaks -- a `<br>` or block-level HTML in an [`allowHtml`](@/api/options.md#allowhtml) cell -- can still render on more than one line.

### How to migrate

To turn wrapping back on for such a column, set [`textEllipsis`](@/api/options.md#textellipsis) to `false`:

**Before:**

```js
columns: [
  { type: 'autocomplete', source: countries },
],
```

**After:**

```js
columns: [
  { type: 'autocomplete', source: countries, textEllipsis: false },
],
```

Set it on the column, in [`cells`](@/api/options.md#cells), or with [`setCellMeta()`](@/api/core.md#setcellmeta) -- the layer that declares the `type`, or one below it. A grid-level `textEllipsis: false` does not reach a column that declares the type, because the type's own value shadows it.

## 17. `height: 'auto'` no longer clips the grid

`height: 'auto'` used to write `height: auto; overflow: clip;` on the grid's root element. The clip
made the root the element the grid scrolled in, so every row rendered at once, and a dropdown editor
on the last row was cut off at the grid's edge.

`height: 'auto'` now writes `height: auto` and nothing else. The grid behaves like a plain block
element: it grows to fit its rows, the nearest scrolling ancestor or the page scrolls it, and
off-screen rows stay virtualized.

### Who is affected

Anyone using `height: 'auto'`, in particular with:

- a fixed `width`, which now clips the horizontal axis only, so the grid scrolls its columns inside
  that width while the page scrolls its rows
- the [`EmptyDataState`](@/api/emptyDataState.md) or [`StretchColumns`](@/api/stretchColumns.md)
  plugins, which read where the grid scrolls
- code that reads `hot.view.isVerticallyScrollableByWindow()`, which now returns `true` for
  `height: 'auto'`

### How to migrate

For the common case, nothing. The grid still grows to fit its rows and the page still scrolls it.

To keep an internal vertical scrollbar, set a numeric `height`:

```js
// Before: the grid clipped itself and scrolled its rows inside.
height: 'auto',

// After: size the grid, and it scrolls its rows inside that box.
height: 500,
```

Or place the grid inside a parent with a fixed height and `overflow: auto`. Inside such a parent, a
grid with `height: 'auto'` fills the parent and scrolls inside it:

```html
<div style="height: 500px; overflow: auto;">
  <div id="grid"></div>
</div>
```

```js
new Handsontable(document.querySelector('#grid'), {
  height: 'auto',
  // ...
});
```

Three smaller changes ship with this one:

- A `width` or `height` value the browser cannot read as a size (`'abc'`, `-100`, `true`) is ignored
  with a one-time console warning, and so are these CSS keywords. It used to be written to the root
  element as it was.
  - `'inherit'`, `'initial'`, `'unset'`, `'revert'`, `'revert-layer'`, `'none'`, and `'normal'` do not
    set a size.
  - `'min-content'`, `'max-content'`, `'fit-content'`, and `fit-content()` size the grid to its full
    content, so it cannot scroll inside its box and renders every row or column.
  - `'stretch'`, `'-webkit-fill-available'`, and `'-moz-available'` fill the container but read as a
    fixed size, so the grid would clip the columns past the container with no scrollbar.

  If you used one of them, use `'auto'` or a length instead. For a grid that fills its container,
  use `'100%'` or `'auto'`.
- With a free height (`'auto'` or unset), a `width` that resolves against something outside the
  grid, such as a `var()` (`'var(--grid-width)'`) or a container-query unit (`'50cqw'`), is no longer
  clipped. It used to write `overflow-x: clip` like a fixed width, so the grid scrolled its columns
  inside that width. It now leaves the horizontal overflow to the page, the way `'100%'` does, so the
  page scrolls the columns. To keep the grid scrolling its own columns, give it a fixed width, such
  as a number or a `px` or `em` length. A sized `height` still clips both axes, whatever the width.
- `width: null` clears the inline width, the way `height: null` clears the height. It used to write
  `width: nullpx`. Both resets restore their own property only, so `height: null` no longer removes a
  `width` set through the option.

## 18. `getCopyableData()` returns a string

[`getCopyableData()`](@/api/core.md#getcopyabledata) was documented and typed as returning a string,
but it returned the cell value as stored: a number, a boolean, `null`, `undefined`, an array, or an
object. It now returns a string, as documented.

A value that is not already a string is converted. Numbers and booleans become their text form,
`null` and `undefined` become an empty string, and any other value goes through its `toString()`. A
cell with [`copyable`](@/api/options.md#copyable) set to `false` still returns an empty string.

The result can differ from the text copied to the clipboard for an object with its own `valueOf()`,
such as an instance of a date library. The clipboard reads that object through `valueOf()`, while
`getCopyableData()` uses `toString()`.

Copying, cutting, and autofill are unaffected. The [`beforeCopy`](@/api/hooks.md#beforecopy),
[`afterCopy`](@/api/hooks.md#aftercopy), [`beforeCut`](@/api/hooks.md#beforecut),
[`afterCut`](@/api/hooks.md#aftercut), and [`beforeAutofill`](@/api/hooks.md#beforeautofill) hooks
still receive the values as they are stored.

[`getCopyableSourceData()`](@/api/core.md#getcopyablesourcedata) behaves the same as before at run
time. It still returns the source value as it is stored, nested objects included. Its TypeScript
return type changes from `string` to `unknown`, which matches what it returns.

### Who is affected

- You compare the result of `getCopyableData()` with a value that is not a string, for example
  `hot.getCopyableData(0, 0) === 1`.
- You read a property or an item of the result, for example `hot.getCopyableData(0, 0).name` on a
  cell that holds an object. You now read it from a string, so you get `undefined` or a single
  character, and no error is thrown.
- You call `getCopyableSourceData()` from TypeScript and use its result as a string without checking
  its type first. That code no longer compiles.

### How to migrate

To keep reading the value as it is stored, call [`getDataAtCell()`](@/api/core.md#getdataatcell)
instead. Unlike `getCopyableData()`, it does not check the `copyable` option, so check it yourself if
your code relies on it.

**Before:**

```js
if (hot.getCopyableData(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}
```

**After:**

```js
if (hot.getCellMeta(0, 0).copyable && hot.getDataAtCell(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}
```

In TypeScript, narrow the result of `getCopyableSourceData()` before you use it as a string:

```ts
const value = hot.getCopyableSourceData(0, 0);

if (typeof value === 'string') {
  hot.setDataAtCell(0, 1, value.trim());
}
```

## 19. Dropdown editor lists are no longer confined to the grid

The lists of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md),
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md),
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md), and
[`multiselect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) cell types used to
be positioned inside the grid's root element. Whenever a `height`
was set, that root clipped its own content, so a list opened near the bottom row was cut off at the
grid's edge. The editor tried to compensate by trimming the list to the rows that fit the space left
inside the grid, which on a short grid left as few as two choices visible.

Those lists are now positioned against the viewport. The grid's edge no longer cuts them, and they
are no longer trimmed to fit inside it, so every choice that fits on screen is shown.

### Who is affected

Anyone rendering `autocomplete`, `dropdown`, `handsontable`, or `multiselect` cells, in particular:

- a grid with a set `height` whose last rows carry one of those editors
- a grid inside a parent with a fixed height and `overflow: auto` or `overflow: hidden`
- code or tests that read the list's position, or that assert it opens above the edited cell when the
  grid has no room below

### How to migrate

For the common case, nothing. The list opens in the same place and simply is not cut off.

What changed in detail:

- The list can now paint outside the grid's box. Whether it paints over what sits next to it
  depends on the page: the list still belongs to the grid's stacking context, so a host page that
  puts the grid inside its own layer keeps its own chrome on top. If the list has to stay inside a
  specific area, size that area rather than the grid.
- One ancestor property changes where the list is anchored, and the grid reads it for you. An
  element with any of these becomes the box the list is laid out in, instead of the browser
  window:

  - `transform`, `translate`, `rotate`, or `scale`
  - `perspective`
  - `filter` or `backdrop-filter`
  - `contain` set to `paint`, `layout`, `strict`, or `content`
  - `will-change` naming any of the above

  A centered modal written `transform: translate(-50%, -50%)` is the common case, but `scale: 0.9`
  and `contain: content` do it too. The list is placed and bounded against that element, so it
  cannot leave it, and a list taller than it is trimmed to fit and scrolls. Give such a container
  room if you want the whole list visible.

  A `container-type` does not do this, so a grid inside a container-query layout places its list
  against the browser window like any other grid.
- Whether the list opens above or below the cell is decided by the space left in the **viewport**,
  not the space left inside the grid. A list that used to flip above the cell to fit inside a short
  grid now opens downwards and overhangs the grid instead. Sideways placement is unchanged: it is
  still decided by the grid's own width.
- The list is no longer trimmed to the space inside the grid, so it can render more choices than
  before. [`visibleRows`](@/api/options.md#visiblerows) still caps it.

## 20. `spliceCol()` and `spliceRow()` are deprecated

This applies only if you call [`spliceCol()`](@/api/core.md#splicecol) or
[`spliceRow()`](@/api/core.md#splicerow) on the grid.

Both methods are deprecated since 19.0.0, and each prints a one-time console warning when called.
They still work exactly as before and will be removed in 20.0.0.

Nothing else changes yet: the `spliceCol` and `spliceRow` change sources that
[`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange)
report are unaffected in 19.x. They go away with the methods in 20.0.0, so do not build new code
on them.

### Who is affected

You are affected only if your code calls `hot.spliceCol(...)` or `hot.spliceRow(...)`.

### How to migrate

Change the data yourself and write it back with
[`populateFromArray()`](@/api/core.md#populatefromarray), or use
[`alter()`](@/api/core.md#alter) to add or remove whole rows and columns. Read the column, run
`Array.prototype.splice()` on it, and write the shifted tail back from the same row.

**Before:**

```js
// Remove the cell in column 1 at row 1, shifting the cells below it up.
hot.spliceCol(1, 1, 1);
```

**After:**

```js
// Remove the cell in column 1 at row 1, shifting the cells below it up.
const column = hot.getDataAtCol(1);
const shifted = column.slice(2);
shifted.push(null);
hot.populateFromArray(1, 1, shifted.map(value => [value]));
```

`spliceRow()` is the same, along the row. Its `populateFromArray()` form takes a single inner array:

**Before:**

```js
// Remove the cell in row 1 at column 1, shifting the cells to its right left.
hot.spliceRow(1, 1, 1);
```

**After:**

```js
// Remove the cell in row 1 at column 1, shifting the cells to its right left.
const row = hot.getSourceDataAtRow(1);
const shifted = row.slice(2);
shifted.push(null);
hot.populateFromArray(1, 1, [shifted]);
```

## 21. A `numeric` cell aligns itself by its type, not by its value

This applies only to a [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell
that can hold a value other than a number -- `null`, `undefined`, or text.

Such a cell used to look and align itself as a `numeric` cell only when its value actually parsed as a
number. A `numeric` column cell holding `null`, `undefined`, or text stayed left-aligned and carried
neither the `htRight` nor the `htNumeric` class name, even though
[`getCellMeta()`](@/api/core.md#getcellmeta) reported `type: 'numeric'` for it. Once a cell picked up
those classes -- for example while its value was briefly numeric during an edit -- they also never
went away again, so the same cell could look `numeric` or not depending on what it happened to hold in
the past rather than on its configured type.

A `numeric` cell now aligns to the right and carries `htNumeric` and `dir="ltr"` because it is
configured `numeric`, whatever value it holds. This also changes what
[`ExportFile`](@/api/exportFile.md) writes for the XLSX format: such a cell now exports with
right alignment too, matching what it now renders on screen.

### Who is affected

- You have a `numeric` column, or a cell set to `type: 'numeric'`, that can hold `null`,
  `undefined`, or text -- for example while a row is still loading, or before a value passes
  validation. Those cells are now right-aligned and carry `htNumeric` on screen, and export
  right-aligned to XLSX.
- You read the `className` cell meta or the cell's DOM class list to tell whether a `numeric` cell
  currently holds a number. It no longer tells you that -- check the value itself instead, for example
  with [`isNumeric()`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md).
- You style `numeric` cells that hold non-numeric values with a custom rule that assumed they stayed
  left-aligned. That rule may need updating to account for the new alignment.

### How to migrate

Nothing to change in most cases -- the new alignment matches the cell's configured type, and a cell
that only ever holds numbers renders the same as before.

If your own code or stylesheet relied on a `numeric` cell staying unstyled while it held a non-numeric
value, account for the `htRight`/`htNumeric` classes and the right alignment now always being present
on such a cell.

## 22. `colToProp()` and `propToCol()` return `null` for an unknown column

[`colToProp()`](@/api/core.md#coltoprop) and [`propToCol()`](@/api/core.md#proptocol) used to hand
your argument straight back when it named no column. They now return `null`, matching
[`toVisualColumn()`](@/api/core.md#tovisualcolumn) and the other index translators.

```js
// A grid with three columns.

// Before 19.0
hot.colToProp(999); // 999
hot.propToCol(999); // 999
hot.colToProp(-1); //  -1

// 19.0 and later
hot.colToProp(999); // null
hot.propToCol(999); // null
hot.colToProp(-1); //  null
```

### Why this changed

The old result could not be told apart from a real answer. On a grid whose data is an array of
arrays, `propToCol(3)` returning `3` might mean "column 3" or "there is no such column" — and where
the visual and physical column order had diverged, the number it returned named a *different*
column than the one you asked about. Code that used the result as an index read or wrote the wrong
cell, with nothing to signal it.

### Who is affected

You are affected if you call either method and use the result without checking it. You are not
affected if you only ever pass indexes you know are in range.

Two cases now return `null` that did not before:

| Call | Before | 19.0 |
| --- | --- | --- |
| An index past the last column, or negative | the argument | `null` |
| `propToCol()` for a column that is trimmed | the physical index | `null` |

A property name your data does not use is still handed back unchanged — only indexes resolve.

### How to migrate

Check the result before using it. Use `Number.isInteger()` for `propToCol()`, not a comparison
against [`countCols()`](@/api/core.md#countcols): `null` compares as `0`, so a `column < countCols()`
test lets it through as if it were the first column.

```js
// Before
const column = hot.propToCol(prop);

hot.selectCell(0, column);

// After
const column = hot.propToCol(prop);

if (Number.isInteger(column)) {
  hot.selectCell(0, column);
}
```

```js
// Before
const prop = hot.colToProp(column);

hot.setDataAtRowProp(0, prop, 'new value');

// After
const prop = hot.colToProp(column);

if (prop !== null) {
  hot.setDataAtRowProp(0, prop, 'new value');
}
```

### TypeScript

Both declarations widened, so TypeScript reports the sites that need a check:

```ts
// Before
propToCol(prop: string | number): number;
colToProp(column: number): string | number;

// 19.0 and later
propToCol(prop: string | number): number | null;
colToProp(column: number): string | number | null;
```

Under `strictNullChecks`, an assignment such as `const col: number = hot.propToCol(prop)` stops
compiling. Narrow it once and reuse the narrowed value:

```ts
const column = hot.propToCol(prop);

if (column !== null) {
  hot.selectCell(0, column); // `column` is `number` here
}
```

### Hooks: what did not change

The change is scoped to the two methods' own return values. Every hook that used to carry a resolved
column still carries the same value, so a listener you have today keeps working — with the one
exception in the next section.

- **`afterSelectionByProp` and `afterSelectionEndByProp`** still report `-1` for a selection that
  starts in the headers — a row selection, a column selection, or select-all. That `-1` is a
  selection sentinel, not an out-of-range column index, so it reaches the hook untouched.
- **`beforeChange` and `afterChange`.** A change addressed at a column index that names no column
  still reports that index in the changes array, not `null`.
- **`beforeValidate`, `afterValidate` and `postAfterValidate`**, and the `prop` on the cell
  properties every cell function receives. A cell whose column does not exist yet — auto column
  growth resolves the meta before creating the column — still reports the index.

### Other behavior that did not change

- **Auto column growth.** Writing past the last column with
  [`setDataAtCell()`](@/api/core.md#setdataatcell) still creates the missing columns when your data
  is an array of arrays with no `columns` setting.
- **Reading through [`getDataAtCell()`](@/api/core.md#getdataatcell)** and the copyable-data
  getters. An out-of-range index reads back what it did before.
- **Undo and redo** still replay a change that created a column.

### `getDataAtProp()` returns an empty array for an index that names no column

[`getDataAtProp()`](@/api/core.md#getdataatprop) built a column range from the resolved property.
When a *numeric* property named no column, both ends of that range collapsed to column `0`, so the
method handed back column 0's values for a column that does not exist. It now returns an empty
array.

```js
// A grid with three columns and 100 rows.

// Before 19.0
hot.getDataAtProp(99); // 100 entries, all null

// 19.0 and later
hot.getDataAtProp(99); // []
```

A property name your data set does not use is unaffected — it never resolved to an index, and it
still does not.

### One hook does change

[`modifyData`](@/api/hooks.md#modifydata) receives the resolved column as its second argument. When
the property is a *numeric* index that names no column, that argument is now `null` instead of the
index. A property name your data does not use still arrives unchanged.

```js
// Before
modifyData(row, column, valueHolder, ioMode) {
  // `column` was the index you passed, even when no such column existed.
}

// After
modifyData(row, column, valueHolder, ioMode) {
  if (column === null) {
    return; // no such column
  }
}
```

The TypeScript declaration widened to match, so a callback that annotates `column` as `number`
stops compiling:

```ts
// Before
modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;

// 19.0 and later
modifyData?: (row: number, column: number | null, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
```

## 23. The `filters` option is type-checked

Before 19.0, TypeScript typed the [`filters`](@/api/options.md#filters) option as `boolean | object`.
Any object compiled, so a misspelled key or a wrong value passed the compiler and was then ignored at
runtime. The option now has real types:

- At the grid level, the object accepts only `searchMode` (`'show'` or `'apply'`), `filterFixedRows`
  (a boolean), and `availableConditions`, which is new in 19.0. See
  [Choose the conditions the filter menu offers](@/guides/columns/column-filter/column-filter.md#choose-the-conditions-the-filter-menu-offers).
- Inside [`columns`](@/api/options.md#columns), `filters` is a boolean or an object that holds only
  `availableConditions`. Of the boolean values, only `false` has ever had an effect there.

Nothing changes at runtime. This section applies only if you use TypeScript.

### Who is affected

Your code stops compiling in one of these cases:

- The grid-level `filters` object has a key other than `searchMode`, `filterFixedRows`, or
  `availableConditions`. The grid ignored that key without a warning.
- `searchMode` holds a value other than `'show'` or `'apply'`. The grid ignored it and logged a
  warning.
- A column in `columns` sets `filters` to an object with a key other than `availableConditions`.
  The grid ignored the object and logged a warning.

In each case the setting already had no effect, so fixing the error does not change what your grid
does.

A valid setting can stop compiling too, when its value has a wider type than the option accepts.
This happens when `searchMode` comes from a variable typed `string`, for example a value read from
a configuration file, or when the whole `filters` object is typed `Record<string, unknown>`. Give the
value a narrower type:

```ts
// Before: `searchMode` is a `string`, which 19.0 rejects
const config = { searchMode: 'apply' };

// After: `as const` keeps the literal type `'apply'`
const config = { searchMode: 'apply' } as const;
```

### How to migrate

Correct or remove the key that the compiler rejects:

```ts
// Before: this compiled, and the misspelled key did nothing
filters: {
  searchmode: 'apply',
},

// After
filters: {
  searchMode: 'apply',
},
```

Move a per-column object to the grid level, where its options are read:

```ts
// Before: this compiled, but the grid ignored the object and logged a warning
columns: [
  { filters: { filterFixedRows: false } },
],

// After
filters: {
  filterFixedRows: false,
},
```

To type a settings object that you build separately, use the exported type:

```ts
import Handsontable from 'handsontable';

const filtersSettings: Handsontable.plugins.Filters.Settings = {
  searchMode: 'apply',
};
```

## 24. Undo and redo restore a recorded state

The [`UndoRedo`](@/api/undoRedo.md) plugin used to undo an action by running a reverse action: it removed the row an insert added, sorted the rows back, or re-applied the previous filter. Each reverse action recalculated the grid, so a row that had moved, a trimmed row, or a sorted order could send a value to the wrong row.

Now UndoRedo stores the grid state before and after each action, and a record of the values and the cell metadata the action changed. An undo puts back the state from before the action, and a redo puts back the state from after it. The action does not run again.

This changes the following:

- **With `undo: false`, nothing is recorded, so the plugin's [`undo()`](@/api/undoRedo.md#undo) and [`redo()`](@/api/undoRedo.md#redo) do nothing.** Before, the plugin recorded changes even with `undo: false`, and only its keyboard shortcuts were off, so an app could call `undo()` from its own buttons.
- More actions are undoable: hiding, showing, and trimming rows and columns, resizing, freezing, collapsing nested rows and column headers, custom borders, comments, the pagination page and page size, and cell metadata written with [`setCellMeta()`](@/api/core.md#setcellmeta). The full list is in [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md#what-undoredo-tracks).
- Changes your app makes through the API are recorded from the moment the grid exists, including the ones that set it up: a `setCellMeta()` call, hidden rows, a page, or a column width set after `new Handsontable()`. The first undo then reverts your setup.
- Every call inside [`batch()`](@/api/core.md#batch) or [`batchExecution()`](@/api/core.md#batchexecution) is one undo step, with the `'batch'` action type. The new [`runOperation()`](@/api/core.md#runoperation) method groups calls the same way.
- An undo or a redo writes values straight to the source data. [`beforeChange`](@/api/hooks.md#beforechange) and the cell's `valueSetter` do not run. [`afterChange`](@/api/hooks.md#afterchange) runs once, with the `UndoRedo.undo` or `UndoRedo.redo` source. The restored visible cells are validated again, and only their `valid` state changes.
- The action's own hooks do not run on an undo or a redo, so they cannot cancel it: for example [`beforeColumnSort`](@/api/hooks.md#beforecolumnsort), [`beforeFilter`](@/api/hooks.md#beforefilter), [`beforeRowMove`](@/api/hooks.md#beforerowmove), and [`beforeMoveCells`](@/api/hooks.md#beforemovecells). Returning `false` from `beforeMoveCells` no longer blocks the redo of a cell move.
- A `beforeMoveCells` listener that returns anything other than `undefined` or the range it received cancels the move, whether or not UndoRedo is on. Before, with the default `undo: true`, the UndoRedo plugin's own listener canceled such a move. With `undo: false`, only `false` did.
- A row or column hook that returns `false` during an undo, such as [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow), cancels the whole undo. The grid is put back as it was, and the step stays on its stack. [`beforeUndo`](@/api/hooks.md#beforeundo) has fired, and [`afterUndo`](@/api/hooks.md#afterundo) does not fire. The exception is a replayed removal that removes a different number of rows or columns than it recorded, for example because a listener removes more rows along with them: the undo stops there, and the rows that removal took are not put back.
- Returning `false` from `beforeUndo` keeps the step on the undo stack, the way returning `false` from [`beforeRedo`](@/api/hooks.md#beforeredo) keeps a step on the redo stack. Before, a canceled undo removed the step for good. The stack hooks, such as [`afterUndoStackChange`](@/api/hooks.md#afterundostackchange), no longer fire for a canceled undo.
- `beforeUndo` and `beforeRedo` fire before the stack hooks. So in `beforeUndo`, the plugin's `doneActions` array still holds the step. Before, the step was taken off the stack first.
- The undo hooks receive the step object that the stack holds, not a copy. A listener that changes it changes the stored step.
- The action hooks and the undo stacks hold plain step objects. A step no longer has `undo()` and `redo()` methods, and the internal properties are gone:
  - `'change'`: `countCols`, `countRows`, `countSourceRows`, `mergedCells`, `physicalRows`, and `props`.
  - `'remove_row'`: `fixedRowsTop`, `fixedRowsBottom`, `removedCellMetas`, `removedMergedCells`, `removedHiddenRows`, `rowIndexesSequence`, and the `nested...` properties.
  - `'remove_col'`: `columnPositions`, `rowPositions`, `fixedColumnsStart`, `removedCellMetas`, and `removedMergedCells`.
  - `'move_cells'`: `data`, `meta`, `fromRow`, `fromCol`, `toRow`, `toCol`, `sourceSnapshot`, and `targetSnapshot`. It has `sourceRange` and `targetRange` instead.
  - `'nested_rows_detach'`: `amount`, `rowPath`, `detachedRowPath`, `formulasUndoRedoSteps`, and `removeAction`.

  Every step recorded by the grid now has `source`, `operations`, and `sources`. A `cellRange`, `range`, or `ranges` field holds plain objects with the same coordinates, not [`CellRange`](@/api/cellRange.md) instances, so it has no methods.
- An edit that waits for an asynchronous validator is recorded when the validation finishes. When two edits overlap, the undo stack holds them in the order they finished.
- An action that changed the grid before it started to wait for a validator, such as a `batch()` that removes a row and then edits a validated cell, keeps the grid until the validation finishes. Anything changed in that time is part of its step, so one undo reverts both. A validator that throws an error ends the wait, and the step keeps what the action did before the error.
- While such an action waits for its validator, [`isUndoAvailable()`](@/api/undoRedo.md#isundoavailable) and [`isRedoAvailable()`](@/api/undoRedo.md#isredoavailable) return `false`, and `undo()` and `redo()` do nothing. An edit on its own does not block them.
- What a validator or an [`afterValidate`](@/api/hooks.md#aftervalidate) listener changes while an edit is validated is part of that edit's step: for example a value the validator corrects, or cell metadata the listener sets. Before, each such change was an undo step of its own, recorded after the edit.
- [`updateData()`](@/api/core.md#updatedata) clears both stacks when it brings other data, as [`loadData()`](@/api/core.md#loaddata) always did. It keeps them when the new data is what the grid shows: the same array, a copy of it (`rows.slice()`), or rows that hold the same values, such as an immutable row update gives. A wrapper passes `data` again on every render, so a render with the same rows keeps the history, as in 18.1. Rows added or removed in the array in place still clear it. Cells are compared with `===`, so a nested object that you copied counts as a different value. With [`NestedRows`](@/api/nestedRows.md), a copy of the array clears the history too. Reordering or replacing rows in the array in place clears the history, even when you pass a copy of it. Up to 1000 rows may be new objects with the same values. If more rows are, the data counts as other data. A value you change in place in a row, outside the grid, is not seen: the history stays, and an undo writes the old value back over it. Change values through the grid, or pass other data. Turning on or turning off a plugin that keeps its own index map at runtime clears them too: for example [`HiddenRows`](@/api/hiddenRows.md), [`HiddenColumns`](@/api/hiddenColumns.md), [`TrimRows`](@/api/trimRows.md), the sorting plugins, or [`Filters`](@/api/filters.md). The move plugins do not. The stack hooks announce each of these drops.
- A [`columns`](@/api/options.md#columns) settings update keeps the history. It drops a step that changed something on a column whose field changed or is gone -- a cell's metadata, a hidden or frozen column, a merge, or a filter -- together with every step that can only be undone or redone after it. Once `columns` is set, it also drops a step that inserted or removed columns. An edit is recorded by field, so a `columns` update never drops it on its own, only together with such a step. A column whose `data` is a function your app creates again on every render, such as an inline function in a React component, reads as a new field on every update, so each render drops the steps that changed something on that column. The stack hooks announce the drop.
- Switching [`colWidths`](@/api/options.md#colwidths) to or from an array, or passing a new `colWidths` array to [`updateSettings()`](@/api/core.md#updatesettings), clears both stacks, the way enabling a plugin does: the earlier steps hold the columns of the previous array. Passing the same array again keeps them. A framework wrapper forwards the prop only when it changed.
- Switching [`rowHeights`](@/api/options.md#rowheights) or [`minRowHeights`](@/api/options.md#minrowheights) to or from an array, or passing a new array of either to [`updateSettings()`](@/api/core.md#updatesettings), clears both stacks, the way enabling a plugin does: the earlier steps hold the rows of the previous array. Passing the same array again keeps them. A framework wrapper forwards the prop only when it changed.
- With the [`Formulas`](@/api/formulas.md) plugin, the grid no longer calls HyperFormula's `undo()` and `redo()`. The grid restores the formulas itself and updates the engine to match. When several grids share one engine, an undo also puts back the formulas that the step changed in the other grids' sheets and in named expressions. A formula edited since the step keeps its new text, and the grid logs a warning.

### Who is affected

Everyone who uses the [`UndoRedo`](@/api/undoRedo.md) plugin, and everyone who sets [`undo: false`](@/api/options.md#undo) but calls the plugin's `undo()` or `redo()`. The change to `beforeMoveCells` applies with `undo: false` too. Check your code if you:

- set `undo: false` to turn off the keyboard shortcuts, and undo from your own buttons
- change the grid through the API right after you create it
- use `beforeChange`, a `valueSetter`, or an action hook such as `beforeColumnSort` to change or block what an undo writes
- read a step's properties in `beforeUndo`, `afterUndo`, `beforeRedo`, `afterRedo`, or the stack hooks, or read `doneActions` or `undoneActions`
- call a `CellRange` method on a step's `cellRange`, `range`, or `ranges`
- register a change to the grid with [`done()`](@/api/undoRedo.md#done)
- call HyperFormula's `undo()` or `redo()` on an engine that a grid is connected to
- expect an undo to reach across `updateData()`
- run several changes in `batch()` or `batchExecution()` and expect each one to be undone separately

### How to migrate

- **Undo from your own buttons, without the keyboard shortcuts.** Keep `undo: true`, and remove the shortcuts you do not want:

  ```js
  const gridContext = hot.getShortcutManager().getContext('grid');

  gridContext.removeShortcutsByKeys(['Control/Meta', 'z']);
  gridContext.removeShortcutsByKeys(['Control/Meta', 'y']);
  gridContext.removeShortcutsByKeys(['Control/Meta', 'Shift', 'z']);
  ```

- **Setup calls.** Call `hot.getPlugin('undoRedo').clear()` after the code that sets the grid up, or move the setup into the grid's settings.
- **Blocking or changing an undo.** Move the logic from `beforeChange` or an action hook to [`beforeUndo`](@/api/hooks.md#beforeundo) and [`beforeRedo`](@/api/hooks.md#beforeredo). They receive the step, including its `actionType`, and return `false` to cancel it. To react to restored values, listen to `afterChange` and check for the `UndoRedo.undo` and `UndoRedo.redo` sources.
- **Reading step properties.** Use `actionType`, `source`, and the properties listed in [Hooks and stack lifecycle](@/guides/accessories-and-menus/undo-redo/undo-redo.md#hooks-and-stack-lifecycle). Do not call `undo()` or `redo()` on a step. Call the plugin's [`undo()`](@/api/undoRedo.md#undo) and [`redo()`](@/api/undoRedo.md#redo) instead. Treat the step as read-only. To read the stack after the step left it, listen to `afterUndoStackChange`.
- **Ranges.** Read the coordinates of a step's `cellRange`, `range`, or `ranges` directly, for example `step.cellRange.from.row` and `step.cellRange.to.col`.
- **Custom actions.** Remove `done()` calls that record a change to the grid, such as a `setCellMeta()` call. UndoRedo records the change already, so keeping the `done()` call makes the change take two undo steps. Keep `done()` for state outside the grid.
- **HyperFormula.** Remove calls to the engine's `undo()` and `redo()`, and call the grid's undo and redo instead.
- **Separate steps inside `batch()` or `batchExecution()`.** Move the calls you want to undo one by one out of the batch.
- **A long session.** To cap the memory the history uses, set `undo: { maxHistory: <number> }`. By default, the stack has no size limit, as before.

## 25. `maxLength` is a built-in cell option

Handsontable now reads the [`maxLength`](@/api/options.md#maxlength) option. A cell with a finite `maxLength` stops the user from typing or pasting more characters than the limit allows, and marks a longer value as invalid. Until now, Handsontable ignored a `maxLength` key and kept it in the cell settings like any other custom key. This section applies only if your app already uses that key.

### What changed

When a cell has a finite `maxLength`:

- The text editor, and any custom editor that extends it, stops typing and pasting at the limit. The `autocomplete`, `dropdown`, and `handsontable` editors cap what the user types in the same way, while the editors of the other cell types, such as numeric, date, and password, don't limit input.
- The cell validator marks a string value that is longer than the limit as invalid. The length check runs before your own [`validator`](@/api/options.md#validator), and your validator isn't called for a value that is too long.
- The limit counts the characters a reader sees (a flag or an emoji with a skin tone is one character), and it counts the value after [`trimWhitespace`](@/api/options.md#trimwhitespace) is applied.
- The cell has a validator, so every write to it is validated asynchronously. [`setDataAtCell()`](@/api/core.md#setdataatcell) applies the value after the validation finishes, and [`getDataAtCell()`](@/api/core.md#getdataatcell) returns the previous value until then.

### Who is affected

Apps that set `maxLength` on the grid, in [`columns`](@/api/options.md#columns), in [`cells`](@/api/options.md#cells) or [`cell`](@/api/options.md#cell), or with [`setCellMeta()`](@/api/core.md#setcellmeta), and read it in their own validator, editor, or renderer. A rule of your own that counts UTF-16 units, or that trims the value first, can now reject a value that it accepted before, because the built-in check runs first.

### How to migrate

- **Rename your key.** Use a name that Handsontable doesn't read, such as `maxChars`, in your settings and in the code that reads it, for example `this.maxChars` in a validator or `cellProperties.maxChars` in an editor or renderer.
- **Or use the built-in option.** Remove your own length validator and keep `maxLength`. Set [`allowInvalid`](@/api/options.md#allowinvalid) to `false` if the grid must reject a value that is too long.
- **Turn the built-in limit off for a cell.** Set `maxLength: Infinity` on that column or cell and keep your own limit under another key.

## 26. The narrowest column width depends on the theme

**This section can change the width a column ends up with.** A column resized by dragging or by [`setManualSize()`](@/api/manualColumnResize.md#setmanualsize) could be as narrow as `20px`. At that width the header's menu button didn't fit, so it hung over the neighboring header, and the label and the sort indicator pushed it out of its own cell.

### What changed

When the column headers render the menu button, which means the grid shows column headers (with [`colHeaders`](@/api/options.md#colheaders) or [`nestedHeaders`](@/api/options.md#nestedheaders)) and [`dropdownMenu`](@/api/options.md#dropdownmenu) is enabled, the narrowest width is now the room the header needs for that button: the icon size plus the horizontal cell padding on both sides (`--ht-icon-size + 2 × --ht-cell-horizontal-padding`). Any other grid has no button to protect and keeps the `20px` minimum.

| Theme   | Narrowest width before | Narrowest width now, with the menu button |
| ------- | ---------------------- | ----------------------------------------- |
| Main    | 20px                   | 32px                                      |
| Horizon | 20px                   | 40px                                      |
| Classic | 20px                   | 24px                                      |

The new minimum applies when you resize a column by dragging, when you double-click the resize handle to fit the column to its content, and when you call [`setManualSize()`](@/api/manualColumnResize.md#setmanualsize) or [`setManualSizes()`](@/api/manualColumnResize.md#setmanualsizes). The methods store the minimum for any smaller width, and `setManualSize()` returns it. A theme can declare the two values in any unit: Handsontable resolves them in the browser, so `rem`, `em`, and `calc()` count the same as `px`. The minimum is never less than `20px`, which is also what you get when the theme doesn't declare the values or the grid isn't rendered yet.

As a column gets narrow, its header now gives things up in a fixed order: the label text, then the sort indicator, and the menu button last. The sort indicator of a column that has a menu button is hidden below `2 × --ht-cell-horizontal-padding + 2 × --ht-icon-size + 6px`, which is 54px in Main, 62px in Horizon, and 42px in Classic. That is above the minimum width, so a sorted column of that width shows no arrow (and no sort order number with [`multiColumnSorting`](@/api/multiColumnSorting.md)) where it used to. The label gives up room to the menu button earlier still, as soon as the column can't hold both. The menu button stays inside its own header at every width the user can reach. At the minimum width the label is gone, so a click on the header text can't sort the column. You can still sort with the [`sort()`](@/api/columnSorting.md#sort) method, or with <kbd>**Enter**</kbd> on the header when [`navigableHeaders`](@/api/options.md#navigableheaders) is enabled.

These widths don't change:

- A width you declare in the [`manualColumnResize`](@/api/options.md#manualcolumnresize) array, in [`colWidths`](@/api/options.md#colwidths), or in a column's `width`. Handsontable doesn't clamp them.
- A width that [`autoColumnSize`](@/api/autoColumnSize.md) or column stretching calculates. The exception is the double-click on the resize handle, which stores the fitted width as a manual width, so it can't go below the minimum.
- A width that is already stored. Handsontable applies the minimum when it writes a width, not when it reads one, so a theme change never rewrites stored widths. Writing a stored width back through `setManualSizes()` applies the minimum again. The [`sheetsBar`](@/api/sheetsBar.md) plugin does that when you switch sheets, so a width below the minimum that came from the `manualColumnResize` array comes back as the minimum after you leave a sheet and return.

### Who is affected

- Apps with the dropdown menu enabled where users resize columns and rely on a column getting as narrow as `20px`. A grid without column headers or without the menu isn't affected, so a narrow spacer or icon column in such a grid keeps working.
- Apps with the dropdown menu enabled that call `setManualSize()` or `setManualSizes()` with a width below the new minimum, and apps that restore saved widths through `setManualSizes()`. They now store the minimum.
- Apps and tests that read `getManualSize()` or the rendered header width after such a call and expect `20`.
- Apps with their own CSS for the header layout, which targets `.colHeader.columnSorting.sortAction` or the `column-gap` of `.relative.has-header-button`. The built-in rules now shrink those in a narrow header.

### How to migrate

- **Update the expected width.** Read the minimum from the theme instead of hard-coding it: `parseFloat(style.getPropertyValue('--ht-icon-size')) + 2 * parseFloat(style.getPropertyValue('--ht-cell-horizontal-padding'))`, where `style` is the computed style of the grid's root element.
- **Keep saved widths.** You don't need to migrate them. A saved width that you restore through `setManualSizes()` is stored as the minimum when it's below it, and unchanged when it's at or above it.
- **Need a narrower column anyway?** Turn the dropdown menu off, or declare the width in the `manualColumnResize` array or in `colWidths`. These widths aren't clamped, but the header can't fit the menu button in a column narrower than the minimum.

## 27. Icons are rendered as `<i>` elements

Every built-in icon used to be a CSS `::before`/`::after` pseudo-element, generated from an `iconsMap` stylesheet. It's now a real DOM element: `<i class="ht-icon ht-icon-<name>" aria-hidden="true"></i>`, inserted into the cell, header, or menu item it belongs to. The glyph still comes from a `--ht-icon-<name>` CSS variable, applied by an unscoped `.ht-icon-<name>` rule.

### Who is affected

- You style a built-in icon with a `::before` or `::after` selector, such as `.changeType::before` or `.ht-page-next::before`.
- Your tests assert on the DOM structure of a cell, header, or menu item that contains an icon -- for example, counting child elements, or using `:first-child`.
- Your own CSS has a bare `i` rule, or a selector such as `td.querySelector('i')`, that could now match a Handsontable icon it wasn't written for.
- You use `.ht-multi-select-editor-search-icon` to style the multi-select editor's search icon. In 18.1 the icon was a `<div>` with that class, already painted from a mask. It's now an `<i class="ht-icon ht-icon-search">` element that keeps the class as a legacy hook. A selector that names the `div` no longer matches. To change the glyph, override `--ht-icon-search`.
- You build your own markup that reuses one of Handsontable's own input classes for its styling -- `htUIRadio` or `htCheckboxRendererInput` are the two that carried a glyph. Both used to get that glyph from CSS alone (a pseudo-element on the input); now the glyph is a separate `<i class="ht-icon ht-icon-<name>">` element, inserted as the input's next sibling only by Handsontable's own components. Markup you build by hand -- for example, a custom cell renderer that copies these classes for their look -- renders the input with no glyph and nothing tells you why: no error, no console warning, only a missing dot or check mark. Add the icon element yourself, as a sibling immediately after the input, to get it back.
- You select or style the elements inside a `checkbox` cell. The input and its tick now share a wrapper: `span.htCheckboxRendererBox > input.htCheckboxRendererInput + i.ht-icon.ht-icon-checkbox`. The wrapper sits where the bare input used to be, before or after the label, so the cell has the same number of children as in 18.1. `td.querySelector('input')` and `input + .ht-icon` selectors still match. Code that treats the cell's first child as the input gets the wrapper instead -- use `querySelector('input')`. If a custom renderer hides the input, hide the wrapper too (or the icon, through `.htCheckboxRendererInput + .ht-icon`), or the tick stays visible on its own.
- You compare screenshots of the multi-select editor's option list. The gap between a checkbox and its label is now one `--ht-gap-size`, on the label's inline-start side, in both LTR and RTL. In 18.1 the list set a physical left padding, so an RTL list had no gap at all.
- You read or select the Filters condition dropdown's caption by its own text content. The caption's text now lives in a `<span class="htUISelectCaptionLabel">` child; see [The Filters caption text moved into a child element](#the-filters-caption-text-moved-into-a-child-element) below.
- You pass a string icon value through the Theme API's `icons` parameter. In 18.1, every string was a glyph, wrapped in `url(...)`. In 19.0, a string can also be a class list for an icon font. Markup, `data:`/`http(s):`/`blob:` URLs, absolute and `./`/`../` paths, `url(...)`, and a file name with an image extension (a query string or fragment included, such as `icons/check.svg?v=2`) are still glyphs. A relative path with no file extension, such as `icons/check`, is now a class list and paints nothing -- start it with `./` or wrap it in `url(...)`. See [How a string value is read](@/guides/styling/themes/themes.md#how-a-string-value-is-read).
- You import `iconsMap` from `handsontable/themes/static/variables/helpers/iconsMap` to generate icon CSS for a custom theme. The pseudo-element selectors it generated no longer exist, so it's deprecated and will be removed in 20.0.0. Until then, it logs a one-time warning and returns the `iconStyles()` output: the `--ht-icon-*` variables and the `.ht-icon-<name>` rules that paint the icon elements. Switch to `iconStyles(icons, scopeSelector)` from `handsontable/themes/static/variables/helpers/iconStyles`, which takes a full scope selector (such as `.ht-theme-main`) instead of a theme class prefix.
- You render a grid whose `layoutDirection` disagrees with the page's `dir` attribute. Mirrored icons (pagination and sheets bar arrows, the submenu arrow) now follow the grid's own direction. Before, the pagination arrows followed any `dir="rtl"` ancestor of the icon, through the `[dir="rtl"]` prefix in the icon stylesheet, so an LTR grid on an RTL page mirrored them. That was a defect, and it no longer happens.
- You mirror icons for RTL yourself, or compare RTL screenshots pixel by pixel. The RTL submenu arrow used to be flipped with `rotate(180deg)`, which also flipped it vertically. It now mirrors with `scaleX(-1)`, which flips only horizontally, so it sits about 0.5px higher than in 18.1. The RTL pagination arrows used to swap to the opposite glyph. They now mirror the same glyph with `scaleX(-1)`, which can move them by a fraction of a pixel. No Filters arrow is mirrored. The hidden-column carets still turn with `rotate(180deg)`.
- You add an `afterGetColHeader` or `afterGetRowHeader` hook that rewrites the header cell through `TH.innerHTML`. The hidden-column and hidden-row carets are now children of the header cell, and your hook runs after the plugin's, so rewriting the whole cell removes them. The `beforeHiddenColumn`/`afterHiddenColumn` (and `beforeHiddenRow`/`afterHiddenRow`) classes stay on the cell. Write into the header's `.colHeader` label instead of the whole cell to keep the carets.
- You load a `-no-icons` theme bundle and render `checkbox` cells. The checkbox used to fall back to a native checkbox there. It now renders the theme's styled box with no tick, because its `appearance: none` moved into the base stylesheet. The Filters "Filter by value" list changes the same way. Load the matching icon file to get the tick back: `ht-icons-main.css` for the main and classic themes, `ht-icons-horizon.css` for horizon.
- You load a `-no-icons` theme bundle and use pagination or the sheets bar. Their buttons now hold an empty `.ht-icon` element, and the base `.ht-icon` rule in `handsontable.css` sizes it to `--ht-icon-size` (16px by default). So an icon-less button keeps the size it has with icons, instead of collapsing to its padding, as the pagination buttons did in 18.1.
- **Your TypeScript code reads the theme's `icons` config. This is a type-level breaking change.** A value in `getThemeConfig().icons` is now typed `string | IconRenderer` (a renderer callback is a valid value), so code that passes it where a `string` is expected stops compiling -- narrow it with `typeof value === 'string'` first. `IconKey` also gained `chipClose`, `search`, `plus`, and `menuList`, so an exhaustive `switch` over `IconKey` needs four more cases.

### The Filters caption text moved into a child element

The Filters condition dropdown's caption (`.htUISelectCaption`) used to hold its text directly. It now holds a `<span class="htUISelectCaptionLabel">` with the text, followed by the caret icon element. This is a DOM-structure change that ships with the icon change because the caret became a child of the caption: writing the caption's text through `textContent` would have removed the icon on every condition change.

Code that reads the caption through `textContent` still gets only the text when the caret is a built-in mask glyph, because the icon element holds no text. An icon mapped to a ligature font or a renderer callback that writes text adds its characters to the caption's `textContent`. To read the label alone, read `.htUISelectCaptionLabel`. Code that assumes the caption has no child elements, or that reads its first text node, needs to target `.htUISelectCaptionLabel` instead.

### The new element can collide with your own selectors

Icons are inserted into cells and headers, and in some renderers they are inserted **before** the existing content. A selector written before this change, when a cell or header held no extra child element, can now resolve to a Handsontable icon instead of what you meant:

- `td.querySelector('i')` can return the icon instead of your own `<i>` element.
- A bare `i { ... }` rule in your stylesheet now also styles every icon.
- `:first-child`, or an index-based child selector, can point at the icon instead of your content.

Exclude icons from such a selector, or scope it to the element you actually mean:

```css
/* Before: also matches Handsontable's own icons. */
td i {
  color: red;
}

/* After: excludes them. */
td i:not(.ht-icon) {
  color: red;
}
```

### How to migrate

Replace a pseudo-element selector with the matching `.ht-icon-<name>` class, or override the icon's `--ht-icon-<name>` CSS variable to change only its glyph. Both are documented in [Icons](@/guides/styling/themes/themes.md#icons) in the Themes guide.

The table below lists every selector the old `iconsMap` stylesheet generated and its replacement. A `[dir="rtl"]`-prefixed selector used to point at a different, mirrored icon; that pairing no longer exists; the single new class mirrors itself when the grid's `layoutDirection` is RTL.

| Old selector | New selector |
| --- | --- |
| `.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after`, `.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after`, `.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after` | `.ht-icon-arrow-right` |
| `.ht-page-size-section__select-wrapper::after` | `.ht-icon-arrow-down` |
| `.changeType::before` | `.ht-icon-menu` |
| `.htUISelectCaption::after`, `.htAutocompleteArrow::after` | `.ht-icon-select-arrow` |
| `.columnSorting.sortAction.ascending::before` | `.ht-icon-arrow-narrow-up` |
| `.columnSorting.sortAction.descending::before` | `.ht-icon-arrow-narrow-down` |
| `.ht-page-navigation-section .ht-page-first::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-left-with-bar` |
| `.ht-page-navigation-section .ht-page-prev::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-left` |
| `.ht-page-navigation-section .ht-page-next::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-right` |
| `.ht-page-navigation-section .ht-page-last::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-right-with-bar` |
| `.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after`, `.htContextMenu table tbody tr td .htItemWrapper span.selected::after`, `.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after` | `.ht-icon-check` |
| `.htCheckboxRendererInput::after` | `.ht-icon-checkbox` |
| `th.beforeHiddenColumn::after` | `.ht-icon-caret-hidden-left` |
| `th.afterHiddenColumn::before` | `.ht-icon-caret-hidden-right` |
| `th.beforeHiddenRow::after` | `.ht-icon-caret-hidden-up` |
| `th.afterHiddenRow::before` | `.ht-icon-caret-hidden-down` |
| `.collapsibleIndicator::before`, `.ht_nestingButton::before` | `.ht-icon-collapse-off` |
| `.collapsibleIndicator.collapsed::before`, `.ht_nestingButton.ht_nestingExpand::before` | `.ht-icon-collapse-on` |
| `.htUIRadio > input[type="radio"]::after` | `.ht-icon-radio` |
| `.ht-multi-select-chip-remove::before` | `.ht-icon-chip-close` |
| `.ht-notification__close::before` | `.ht-icon-chip-close` |
| `.ht-multi-select-editor-item-selected input::after` | `.ht-icon-checkbox` |
| `.ht-multi-select-editor-search-icon` (a class on the search icon's own element, not a pseudo-element; kept on the new element as a legacy class) | `.ht-icon-search` |

The sheets bar and the mixed-state menu mark are new in 19.0, so no 18.1 selector exists for them. Their icons use the same classes: `.ht-icon-plus` (add sheet), `.ht-icon-menu-list` (all sheets), `.ht-icon-select-arrow` (tab chevron), `.ht-icon-arrow-left` and `.ht-icon-arrow-right` (tab paging), `.ht-icon-check` (the selected sheet), and `.ht-icon-collapse-off` (a mixed-state menu item).

For example, a rule that used to read:

```css
.changeType::before {
  background-color: blue;
}
```

now targets the icon element directly:

```css
.changeType .ht-icon-menu {
  background-color: blue;
}
```

The descendant form works here because the menu icon is a child of the `.changeType` button. Not every icon is a descendant of the element its old pseudo-element hung on. The sort arrow is a following sibling of the `.colHeader` label, so target it with `~`, as in `.columnSorting.sortAction ~ .ht-icon`. The checkbox, radio, and multi-select editor ticks are the next sibling of their input, so target them with `+`, as in `.htCheckboxRendererInput + .ht-icon`. An input can't hold children, so a descendant selector such as `.htCheckboxRendererInput .ht-icon` never matches.

To change only the glyph and keep the built-in color and mask behavior, override the CSS variable instead, scoped to the theme class:

```css
.ht-theme-main .changeType .ht-icon-menu {
  --ht-icon-menu: url("/icons/menu.svg");
}
```

## 28. Frozen columns can be dragged, and the unfreeze hooks get a target

This applies if you use [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) together with [`manualColumnMove`](@/api/options.md#manualcolumnmove), if you listen to the column freeze and unfreeze hooks, or if you assert on the arguments of the unfreeze hooks in your tests.

### Frozen columns can be dragged

Once a column had been frozen with the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin, the plugin refused two kinds of moves: dropping a column in front of the frozen columns, and moving a frozen column. A grid configured with [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) never refused them, so the same drag worked or failed depending on how the columns got frozen.

The plugin no longer refuses either move. Freezing works by position, as it does with `fixedColumnsStart`: the first `fixedColumnsStart` columns are frozen, whichever columns they are. When you drop a column in front of a frozen column, the dropped column becomes frozen, and the last frozen column becomes scrollable. When you drag a frozen column out of the frozen area, the next column becomes frozen. The number of frozen columns stays the same.

If you used `manualColumnFreeze` to pin a key column in place, users can now drag it out, and drop other columns in front of it.

To keep the old lock, reject those moves in the [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) hook. Return `false` to reject a move, and return nothing otherwise, because any other value is passed on to the next `beforeColumnMove` handler:

```js
beforeColumnMove: function(movedColumns, finalIndex) {
  const frozenCount = this.getSettings().fixedColumnsStart ?? 0;

  if (finalIndex < frozenCount || movedColumns.some((column) => column < frozenCount)) {
    return false;
  }
},
```

### A drag changes the frozen columns without firing the freeze hooks

Dragging a column across the freeze line changes which columns are frozen, but it fires the [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks, not the column freeze and unfreeze hooks. If you track the frozen columns through [`afterColumnFreeze`](@/api/hooks.md#aftercolumnfreeze) and [`afterColumnUnfreeze`](@/api/hooks.md#aftercolumnunfreeze), also read them in `afterColumnMove`. The number of frozen columns is `getSettings().fixedColumnsStart`, and the order is in `getColHeader()` or the [column index mapper](@/guides/columns/column-moving/column-moving.md).

### The unfreeze hooks get a third argument

[`beforeColumnUnfreeze`](@/api/hooks.md#beforecolumnunfreeze) and [`afterColumnUnfreeze`](@/api/hooks.md#aftercolumnunfreeze) now receive `finalIndex`, the visual index the column moves to. It is the position right after the remaining frozen columns, or the restored position when you set the new `restoreColumnPosition` option of `manualColumnFreeze`. When nothing is unfrozen, it equals the column index.

A listener that declares two parameters keeps working. Two things notice the new argument:

- A test that asserts the exact arguments, such as `toHaveBeenCalledWith(column, performed)`, now needs the third one.
- TypeScript code that calls a stored unfreeze callback with two arguments, such as `getSettings().beforeColumnUnfreeze?.(column, true)`, fails with `TS2554`, because `finalIndex` is declared as required.

### The new `restoreColumnPosition` option

[`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) now accepts an object. Set `restoreColumnPosition` to `true` to move an unfrozen column back to its place in the data source order. The default placement, right after the frozen columns, does not change. Read more in the [column freezing](@/guides/columns/column-freezing/column-freezing.md#restore-the-column-position-on-unfreeze) guide.

## 29. License keys are checked more strictly

Handsontable 19.0 checks an entitlement license key more strictly than Handsontable 18.1. A key that 18.1 accepts in a shortened or changed form can read as invalid in 19.0, and an invalid key shows the lock screen over the grid.

### Who is affected

You are affected only if you use an [entitlement license key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys) (plain-English text followed by a bracketed block) and you pass it in another form than the one you received. For example:

- You pass only the bracketed block, without the text in front of it.
- You changed the text of the key.
- Something follows the bracketed block, such as an email signature or a closing quote.

Keys in the 25-character format are not affected, except `'ht68e-1f2b7-47158-70b05-0842f'`. That key and the `'non-commercial-and-evaluation'` key read as invalid in 19.0 for another reason: see section 55.

### How to migrate

Before you upgrade, check the [`licenseKey`](@/api/options.md#licensekey) value you pass. Pass the whole key, exactly as you received it - the text and the bracketed block, with nothing after the block. Spaces and line breaks in the key are ignored, so a key that an email client wrapped across lines keeps working. For where to keep the key, see [License key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys).

## 30. <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + arrow keys on a row header expand and collapse row groups

You are affected only if you use the [`NestedRows`](@/api/nestedRows.md) plugin with [`navigableHeaders`](@/api/options.md#navigableheaders) enabled.

Before 19.0, <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**←**</kbd> and <kbd>**→**</kbd> on a focused row header moved the focus to the first or last cell of the row, as they do anywhere else in the grid.

Since 19.0, those shortcuts are the [row group keys](@/guides/rows/row-parent-child/row-parent-child.md#keyboard-shortcuts) whenever a row header holds the focus:

- <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**→**</kbd> expands a collapsed parent row.
- <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**←**</kbd> collapses an expanded parent row, or moves the focus to the header of the parent row.

When there is nothing to expand, collapse, or move to, they do nothing. In a right-to-left layout, the two arrows swap. From a cell, both shortcuts still move to the first or last cell of the row.

While an overlay covers the grid body - for example, the loading overlay during a data fetch, or the empty data state - the row group keys do nothing. That includes <kbd>**Enter**</kbd> on a row header, which before 19.0 expanded or collapsed the row group under the overlay.

### How to migrate

Nothing to change in your code. To reach the last cell of a row from its row header, press <kbd>**→**</kbd> to move into the row, then <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**→**</kbd>, or press <kbd>**End**</kbd>. If you document keyboard shortcuts for your users, update that documentation.

## 31. `HotColumn` no longer types hook props

In 18.1, the TypeScript props of the React `HotColumn` component listed every grid hook, such as [`afterChange`](@/api/hooks.md#afterchange) and [`beforeKeyDown`](@/api/hooks.md#beforekeydown). Hooks run at the grid level only, so a hook that you passed to `HotColumn` never ran. In 19.0, the `HotColumn` props leave the hooks out, and your IDE no longer suggests them.

Nothing changes at runtime. This section applies only if you use TypeScript.

### Who is affected

You are affected only if you pass a hook to `HotColumn` and compile with `noImplicitAny` (part of `strict`). A hook that you pass now has no contextual type, so its parameters are implicitly `any` and the compiler reports error TS7006. Without `noImplicitAny`, your code still compiles.

Because the hook never ran, removing it does not change what your grid does.

### How to migrate

Move the hook to `HotTable`, where hooks run:

```tsx
// Before: this compiled, but `afterChange` never ran
<HotTable data={data}>
  <HotColumn data="price" afterChange={(changes, source) => {}} />
</HotTable>

// After
<HotTable
  data={data}
  afterChange={(changes, source) => {
    // Check `changes` to react to a specific column.
  }}
>
  <HotColumn data="price" />
</HotTable>
```

For more information, see [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md).

## 32. `editor: false` is honored by typed and checkbox columns

Handsontable 19.0 fixes two cases where [`editor: false`](@/api/options.md#editor) had no effect. Each fix is still an observable change: a cell that you could edit in 18.1 is non-editable in 19.0.

### A column `type` no longer re-enables editing

A [`type`](@/api/options.md#type) sets the [`editor`](@/api/options.md#editor), [`renderer`](@/api/options.md#renderer), and [`validator`](@/api/options.md#validator) options at once. In 18.1, a `type` set on a column replaced an `editor: false` set at a higher configuration level, so the column stayed editable. In 19.0, the `type` still applies its renderer and validator, but not its editor:

```js
editor: false,
columns: [
  { type: 'text' },
  // 18.1: editable. 19.0: non-editable, still rendered and validated as numeric.
  { type: 'numeric' }
]
```

### A checkbox cell with no editor can't be toggled

A [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) has no separate editing gesture: clicking the box is the edit. In 18.1, `editor: false` didn't stop a click or the <kbd>**Space**</kbd> key from toggling the box. In 19.0, a checkbox cell with `editor: false` or `editor: null` renders a disabled checkbox, and neither a click nor <kbd>**Space**</kbd> changes its value. You can still select the cell.

The two changes combine. A grid-level `editor: false` now also reaches a `checkbox` column, because the column's `type` no longer supplies the checkbox editor. A common setup affected by this is a non-editable grid with a checkbox column for selecting rows:

```js
editor: false,
columns: [
  { data: 'name' },
  // 18.1: toggleable. 19.0: a disabled checkbox.
  { data: 'selected', type: 'checkbox' }
]
```

### Who is affected

- You set `editor: false` on the grid, on a column, or through [`cells`](@/api/options.md#cells), and a lower configuration level sets a `type` on the same cells.
- You set `editor: false` or `editor: null` on a `checkbox` column and expect users to toggle it.
- You set `editor: false` on the grid and have a `checkbox` column that users toggle, for example to select rows.

### How to migrate

To keep a typed column editable under a grid-level `editor: false`, give the column an `editor` of its own, at the same configuration level as its `type`. Set `editor: true` to keep the editor the `type` provides, or name an editor:

```js
editor: false,
columns: [
  { type: 'text' },
  { type: 'numeric', editor: true },
  { type: 'numeric', editor: 'numeric' }
]
```

A custom cell type that declares `editor: false` isn't affected. Its `editor: false` is the type's default, so a column with a `type` of its own still replaces it, as in 18.1.

To keep a checkbox column toggleable, remove `editor: false` from it, or set `editor: true` or `editor: 'checkbox'` on the column. Under a grid-level `editor: false`, setting one of those on the column is the only option. To make it non-toggleable, prefer [`readOnly`](@/api/options.md#readonly), which also announces the cell as read-only to screen readers.

## 33. Changing `dataSchema` resets the grid's index state

If you don't set [`columns`](@/api/options.md#columns), the [`dataSchema`](@/api/options.md#dataschema) option decides how many columns the grid has and which property each one reads. In 18.1, an [`updateSettings()`](@/api/core.md#updatesettings) call that changed `dataSchema` and carried no [`data`](@/api/options.md#data) and no `columns` didn't update either of them. The grid kept the old column count and the old column-to-property mapping.

In 19.0, such a call compares the columns the new schema defines with the columns the grid has. If the number of columns or the property of any column differs, the grid re-creates the data map and re-initializes the row and column index mappers, the way a changed `columns` option already does. The grid then resolves the column count and the properties from the new schema.

Re-initializing the index mappers resets everything that is stored per index:

- The order of columns and rows that users or the API changed, for example with [`ManualColumnMove`](@/api/manualColumnMove.md) or [`ManualRowMove`](@/api/manualRowMove.md).
- Sorting and filtering.
- Rows and columns hidden or trimmed through the API or the UI.
- Row heights and column widths that users set by dragging.

Options that you declare in your settings, such as `hiddenColumns: { columns: [1] }`, apply again after the reset.

### What counts as a change

- A schema with another number of columns, other property names, or the same names in another order is a change. The columns follow the key order of the schema.
- A schema that only changes the default value of a property, such as `status: 'new'` to `status: 'open'`, isn't a change.
- A function is called to read the columns it returns, so a new function that returns the same columns isn't a change.
- Setting `dataSchema` to `undefined` makes the grid read its columns from the data, which is a change when those columns differ.
- A call that sends `dataSchema` together with `data` resets the state in the same way, when the columns changed. A call that sends `data` alone keeps the state, as in 18.1.
- A call that sends `dataSchema` together with `columns`, and a grid that has a `columns` option, behave as before.

### Who is affected

You are affected only if you change the columns that `dataSchema` defines after the grid is created, you don't set `columns`, and your users or your code rely on index state, such as a sort order or a moved column, surviving that change.

### How to migrate

If you need the state to survive, read it before the update and apply it again after it. For example, store the sort configuration with [`getSortConfig()`](@/api/columnSorting.md#getsortconfig) and pass it back to [`sort()`](@/api/columnSorting.md#sort) once `updateSettings()` returns.

## 34. `colWidths` addresses columns by physical index

Handsontable 19.0 applies the array and the function form of [`colWidths`](@/api/options.md#colwidths) by the physical column index. In 18.1, they used the visual column index, so a width stayed at its screen position when the user moved a column with [`manualColumnMove`](@/api/options.md#manualcolumnmove). In 19.0, a width moves with its column.

A number or a string `colWidths` applies one width to every column, so it isn't affected.

```js
const hot = new Handsontable(container, {
  data: [['Ted', 'Right', 31]],
  colHeaders: ['First name', 'Last name', 'Age'],
  manualColumnMove: true,
  colWidths: [100, 120, 60],
});

// the user moves the `Age` column to the first position
// 18.1: `Age` is 100px wide, because the first position keeps the first width.
// 19.0: `Age` is 60px wide, because the width belongs to the `Age` column.
```

The same applies to the function form. In 19.0, Handsontable calls the function with the physical index:

```js
colWidths(physicalColumnIndex) {
  return physicalColumnIndex * 10;
},
```

The physical index of a column doesn't change when the user moves or hides columns. When you insert or remove a column with [`alter()`](@/api/core.md#alter), each width stays with its column, and undo brings back the width of a removed column. A column added after the last one takes the next width in the array. A column inserted between others has no width of its own, and neither has a column inserted after a column the user moved to the end. Handsontable never changes the array: [`getSettings()`](@/api/core.md#getsettings) returns the array you passed, and [`updateSettings()`](@/api/core.md#updatesettings) applies a new array to the columns as they are. Switching `colWidths` to or from an array, or passing a new array, clears the undo history, the way enabling a plugin does, because the earlier steps hold the columns of the previous array. [`loadData()`](@/api/core.md#loaddata) with data the grid hasn't shown, a copy of the current data included, declares the array again, so it applies from the first column. A data array the grid showed earlier, and that still has as many columns, gets back the alignment it had when the grid left it, so the widths stay on columns you inserted or removed there; the sheets bar relies on this when it shows a sheet again. If you change the columns of such an array while the grid shows other data, pass a new `colWidths` array before you load it, so the widths apply from the first column. Only the last array you replaced while the same data was shown is kept for it. `loadData()` with the array the grid already shows, and [`updateData()`](@/api/core.md#updatedata), which a new `data` passed to `updateSettings()` also uses, keep each width on its column, and a column they add after the last one takes the next width in the array. The widths that a user sets by dragging a column border aren't affected, because [`ManualColumnResize`](@/api/manualColumnResize.md) already stores them by physical index.

The [`exportFile`](@/api/exportFile.md) plugin and [`autoColumnSize`](@/api/autoColumnSize.md) read `colWidths` the same way. The [`modifyColWidth`](@/api/hooks.md#modifycolwidth) hook and [`getColWidth()`](@/api/core.md#getcolwidth) still take a visual column index. The [`rowHeights`](@/api/options.md#rowheights) option moves to the physical row index too, as section 58 describes.

### Who is affected

- You set `colWidths` to an array or a function, and you enable [`manualColumnMove`](@/api/options.md#manualcolumnmove), call [`moveColumn()`](@/api/columnMoving.md#movecolumn), or load a saved column order. The widths now follow the columns.
- You call [`freezeColumn()`](@/api/manualColumnFreeze.md#freezecolumn) or [`unfreezeColumn()`](@/api/manualColumnFreeze.md#unfreezecolumn), which move the column. Its width now goes with it.
- Your `colWidths` function reads the index as a position on the screen, for example to give the first visible column a wider width, or it looks the column up through a visual-index API such as `hot.getColHeader(index)`. It now receives a physical index, so it widens another column, with no error.
- You work around the old behavior with an [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hook that rebuilds the `colWidths` array. After the migration, that code applies the order twice, so remove it.
- You set `colWidths` to an array and insert or remove columns. In 18.1, the array kept its order, so an inserted column took the width listed for its position, and every width after it moved one column over. Now each width stays with its column: a column inserted between others has no width of its own, a removed column takes its width with it, and undo puts it back.
- You keep a `colWidths` array in step with [`alter()`](@/api/core.md#alter) yourself, for example with `colWidths.splice(1, 0, 80)` after inserting a column, and pass the same array to `updateSettings()`. Handsontable already moves each width with its column, so the widths now move twice. Remove that code, or pass a new array to declare the widths again.

If your columns are never moved and you never insert or remove columns, nothing changes: the visual and physical indexes are the same, and each width stays where you declared it.

### How to migrate

To keep the 18.1 behavior, where a width belongs to a screen position, translate the physical index to the visual one in a function:

```js
const widthsByPosition = [100, 120, 60];
// the physical index of the column at each visual position, for example a saved column order
const initialOrder = [0, 1, 2];
let hot;

hot = new Handsontable(container, {
  manualColumnMove: initialOrder,
  colWidths(physicalColumnIndex) {
    // while the constructor runs, `hot` isn't assigned yet and the columns are in their initial order
    const visualColumnIndex = hot ?
      hot.toVisualColumn(physicalColumnIndex) : initialOrder.indexOf(physicalColumnIndex);

    return widthsByPosition[visualColumnIndex];
  },
});
```

In the React, Angular, and Vue wrappers, get the instance from the component instead of a variable: `hotRef.current?.hotInstance` in React, the `hotInstance` property of the `HotTableComponent` in Angular, and `hotTable.value?.hotInstance` in Vue. The callback gets no `this`.

To adopt the new behavior, list the widths in the order of the columns in your `data` or [`columns`](@/api/options.md#columns) option, not the order you expect on the screen.

To fix the width of a single column and keep it independent of the column order, you can also set `width` in the [`columns`](@/api/options.md#columns) option.

## 35. An auto-sized column is no longer capped at the width of the grid

This applies only if you leave [`autoColumnSize`](@/api/autoColumnSize.md) on -- the default -- and a column holds text that is wider than the grid.

In 18.1, the width of the grid's root element limited the width of an auto-sized column. A column whose widest value was longer than the grid stopped at the grid's width, its text wrapped, and its rows grew taller. The measured width also followed the size of the root at the moment of measuring: a grid whose container collapsed to a few pixels and came back kept narrow, wrapped columns.

Handsontable 19.0 measures a column at the width of its widest value, whatever the size of the grid. The text stays on one line, the rows keep their default height, and the grid scrolls horizontally. This is the behavior that Handsontable had before 16.2.0.

To keep a column from growing past a limit, cap it in the [`modifyColWidth`](@/api/hooks.md#modifycolwidth) hook, or set its `width` in the [`columns`](@/api/options.md#columns) option. For an example, see [Set a dynamic maximum column width](@/guides/columns/column-width/column-width.md#set-a-dynamic-maximum-column-width).

## 36. A custom editor's `setValue()` receives the cell value

In 18.1, [`beginEditing()`](@/guides/cell-functions/cell-editor/cell-editor.md#common-methods) turned the cell value into a string before it called `setValue()`. An array such as `[[1, 2], [3, 4]]` arrived as `"1,2,3,4"`, an object arrived as `"[object Object]"`, and a number arrived as a string of digits. In 19.0, `setValue()` receives the cell value after the value getter.

The built-in text editors still show a string. `TextEditor`, and the editors that extend it, stringify inside `setValue()`. That covers `autocomplete`, `dropdown`, `numeric`, `date`, `time`, `password`, `handsontable`, and the intl date, time, and datetime editors. [`SelectEditor`](@/guides/cell-functions/cell-editor/cell-editor.md) still converts its argument to a string. The checkbox editor and the multiselect editor ignore the value passed to `setValue()`.

### Who is affected

You are affected if your editor extends `BaseEditor` directly, or you built it with `editorFactory`, and `setValue()` treats its argument as a string. You are also affected if you extend `TextEditor` and override `setValue()` without calling `super.setValue()`. `super.setValue()` stringifies for you.

A React editor built with `useHotEditor` or `EditorComponent`, and an Angular editor that extends `HotCellEditorComponent`, receive this value even when you do not write `setValue()` yourself. The value is a number, an object, or `null`. In React, `<input value={value}>` warns on an empty cell, because `value` is `null`. Pass `value == null ? '' : String(value)` to the input.

A factory editor that does not define `setValue` stores the cell value and returns it from `getValue()`. The rating recipe is one. Confirming that editor without a change writes nothing. Section 3 describes that confirm for every grid.

### How to migrate

Before, in 18.1, `setValue()` could assign its argument straight to an input:

```js
class MyEditor extends Handsontable.editors.BaseEditor {
  setValue(value) {
    this.input.value = value;
  }

  getValue() {
    return this.input.value;
  }
}
```

In 19.0, turn the value into a string yourself when the editor needs one:

```js
import Handsontable from 'handsontable/base';

class MyEditor extends Handsontable.editors.BaseEditor {
  setValue(value) {
    this.input.value = value == null ? '' : String(value);
  }

  getValue() {
    return this.input.value;
  }
}
```

`handsontable/base` leaves `Handsontable.helper` empty, so `Handsontable.helper.stringify` throws there. `value == null ? '' : String(value)` works in that build and in a script-tag project.

A factory editor does the same inside the `setValue` function you pass to `editorFactory`. See the [cell editor guide](@/guides/cell-functions/cell-editor/cell-editor.md).

## 37. A string `dataProvider.rowId` reads a property with a dot in its name

In 18.1, a string `rowId` in the [`dataProvider`](@/api/options.md#dataprovider) option always split on dots and read a nested property. `'meta.id'` read `row.meta.id`, even when the row had its own `'meta.id'` key, which a column with `data: 'meta.id'` shows. The row id could then differ from the value in the cell.

In 19.0, a property named exactly as the string wins, dots included. `{ 'meta.id': 'SKU-4821' }` has the id `'SKU-4821'`. A row without such a property still reads the nested one, whatever [`dataDotNotation`](@/api/options.md#datadotnotation) is set to. The new [`rowId`](@/api/options.md#rowid) option reads ids the same way. See [Row identity](@/guides/rows/row-identity/row-identity.md).

Handsontable also reads the id from the source row itself, not from a copy of it. A function `rowId` receives that row, and a [`modifySourceData`](@/api/hooks.md#modifysourcedata) hook no longer changes the id.

### Who is affected

You are affected only if one of these is true:

- Your rows have a key with a dot in its name that matches `dataProvider.rowId`, next to a nested object at the same path. The id is now the value under the dotted key, the one the cell shows.
- `dataProvider.rowId` is a function that reads a nested object, and your rows keep that value under a key with a dot in its name. In 18.1, the function received a copy in which [`dataDotNotation`](@/api/options.md#datadotnotation) had turned the dotted key into a nested object. It now receives the row itself, where the nested object does not exist. A function that throws there is read as a missing id: an edit is reverted and reported through `afterRowsMutationError`, and removing the row raises the missing row id error.
- A `modifySourceData` hook of yours changes the value `dataProvider.rowId` reads. The id is now the stored value.
- You use TypeScript, and your code reads `dataProvider.rowId` back as a string, for example `const key: string = hot.getSettings().dataProvider.rowId`. The type of `rowId` in `DataProviderConfig` was `string`, and it is now a string or a function, which the plugin already accepted. Code that sets `rowId` is not affected.

### How to migrate

If your code reads `dataProvider.rowId` back as a string, narrow it first:

```ts
const rowId = hot.getSettings().dataProvider?.rowId;

if (typeof rowId === 'string') {
  // Use the string key.
}
```

Before, in 18.1, a string key read the nested value even when the row also had the dotted key:

```js
// row: { 'meta.id': 'SKU-4821', meta: { id: 'legacy-17' } }
dataProvider: {
  rowId: 'meta.id', // 18.1: 'legacy-17'; 19.0: 'SKU-4821'
  // ...
},
```

In 19.0, to keep reading the nested value, pass a function. Guard the nested object, so a row without it, such as a new row, has no id instead of throwing:

```js
dataProvider: {
  rowId: (row) => row.meta?.id ?? null,
  // ...
},
```

A function that reads a dotted key reads it by name:

```js
dataProvider: {
  rowId: (row) => row['meta.id'] ?? null,
  // ...
},
```

## 38. XLSX export no longer needs ExcelJS

This is not a breaking change. Every configuration that exported an XLSX file in 18.1 still exports
one in 19.0, and `exportFile: { engines: { xlsx: ExcelJS } }` keeps ExcelJS as the engine. The file
differs from the 18.1 one only by the bug fixes described below.

Handsontable 18.1 required ExcelJS for an XLSX export. You passed it as
`exportFile: { engines: { xlsx: ExcelJS } }`, and without that entry the plugin refused the format.
Handsontable 19.0 ships its own XLSX engine, so the format works with no engine configured. Three
behaviors of the [`ExportFile`](@/api/exportFile.md) plugin you could rely on in 18.1 changed with it,
and several bug fixes change what the exported file holds. Paths that refused the format now serve
it. The exception is an `engines.xlsx` value that is not an engine module:
`supportsExportFormat('xlsx')` now answers `false` for it and the "To Excel" item is hidden, as
covered below.

This section applies if you set the [`exportFile`](@/api/options.md#exportfile) option, because the
context menu change reaches grids that never export to XLSX, and if you call
`supportsExportFormat('xlsx')` or export to XLSX, with or without that option.

### `supportsExportFormat('xlsx')` now answers `true` with no engine configured

[`supportsExportFormat()`](@/api/exportFile.md#supportsexportformat) returned `false` for `'xlsx'`
unless `engines.xlsx` named a module. It now returns `true`, because the built-in engine can write
the format. It returns `false` for any format other than `'csv'` and `'xlsx'`, and when
`engines.xlsx` holds a value that is not a supported engine module, such as `{}`, `'exceljs'`, or
`true`. For those values the answer flipped: 18.1 checked only that the value was truthy and
answered `true`, although every XLSX export then rejected with `Missing or invalid ExcelJS engine`.

### The "To Excel" context menu item shows with no engine configured

The `export_file:xlsx` sub-item of the export context menu item is hidden whenever
`supportsExportFormat('xlsx')` answers `false`. In 18.1 that was every grid with no engine, so such
a grid showed "To CSV" alone. In 19.0 `supportsExportFormat('xlsx')` answers `true` for that grid,
so "To Excel" appears next to "To CSV" whenever the `exportFile` option is set. The sub-item is
hidden only when `engines.xlsx` holds a value that is not a supported engine module. 18.1 showed it
for such a value, because the check only asked whether the value was truthy.

### An XLSX export with no engine configured now succeeds

[`downloadFileAsync('xlsx')`](@/api/exportFile.md#downloadfileasync) and its siblings rejected with
`Missing or invalid ExcelJS engine` when no engine was configured. They now write the file through
the built-in engine. A value that is not a supported engine module still rejects, with
`Invalid xlsx engine module.`

### Bug fixes that change the exported file

These are bug fixes, not breaking changes. They apply to both engines, but they change what an
18.1 export wrote, so check them if another tool reads the file or if you compare files byte by
byte.

#### An empty checkbox exports as an empty cell

What changed: in 18.1, a `checkbox` cell with no value (`null`, `undefined`, or `''`) exported as
`FALSE`. It now exports as an empty cell, the same "no value" state the grid shows, so a round trip
does not turn it into an unchecked box. A value that matches `checkedTemplate` still exports as
`TRUE`, and one that matches `uncheckedTemplate` still exports as `FALSE`. A value matches a template
the way the grid matches it, ignoring letter case, so with `uncheckedTemplate: ''` an empty value is
drawn unchecked and exports as `FALSE`.

What to do: if a consumer of the file expects `TRUE` or `FALSE` in every checkbox cell, fill the
empty cells with your `uncheckedTemplate` value (`false` by default) before you export. If your
data stores an unchecked box as `''`, set `uncheckedTemplate: ''` on the column, and `''` exports
as `FALSE` again.

#### The frozen pane counts only exported rows and columns

What changed: in 18.1, the sheet's frozen pane used the
[`fixedRowsTop`](@/api/options.md#fixedrowstop) and
[`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) counts as they were. When the export
skipped a hidden row or column inside the frozen band, or the `range` option started inside it, the
file froze more rows or columns than the grid does. The pane now counts only the frozen rows and
columns that the file contains.

What to do: to freeze the same number of rows and columns as in 18.1, export the hidden ones with
`exportHiddenRows: true` and `exportHiddenColumns: true`, and start the `range` at the first row
and column.

#### `NaN` and infinite numbers export as text

What changed: in 18.1, a `numeric` cell holding `NaN`, `Infinity`, or `-Infinity` exported as a
number cell with that value, such as `<v>NaN</v>`. That is not a legal number in the file, so Excel
showed a repair dialog when it opened the file. The cell now exports as a text cell with the same
text the grid shows (`NaN`, `Infinity`, or `-Infinity`), and Excel opens the file without a repair.
The same applies to the cached result of a
[`ColumnSummary`](@/api/columnSummary.md) cell, such as a `sum` over a column that holds `Infinity`.

What to do: if a consumer of the file expects a number in every `numeric` cell, replace the
non-finite values in your data, for example with `null`, before you export.

#### A cleared `numeric` cell exports as an empty cell

What changed: in 18.1, a `numeric` cell holding `''` or a whitespace-only string exported as `0`.
The editor stores `''` when a user clears a numeric cell and confirms it, so the grid showed an
empty cell while the spreadsheet showed `0`, and `AVERAGE` and `COUNT` counted it. Such a cell now
exports as an empty cell, the same as one holding `null`.

What to do: if a consumer of the file expects `0` in those cells, write `0` into them before you
export.

#### Functions added after Excel 2007 carry Excel's stored prefix

What changed: with `exportFormulas: true`, a formula such as `=IFS(…)`, `=STDEV.S(…)`, `=CONCAT(…)`,
`=TEXTJOIN(…)`, or `=XLOOKUP(…)` is now written as Excel stores it, with the `_xlfn.` prefix
(`<f>_xlfn.IFS(…)</f>`). In 18.1, Excel showed `#NAME?` for such a cell until you entered it again.
`NETWORKDAYS.INTL`, `WORKDAY.INTL`, `ISO.CEILING`, and `ECMA.CEILING` keep no prefix, as in 18.1,
because Excel stores them without one. The parameter names of a `LET` or `LAMBDA` call are written
with Excel's `_xlpm.` prefix, such as `<f>_xlfn.LET(_xlpm.x,1,_xlpm.x+1)</f>`.

What to do: nothing, unless a tool reads the raw `<f>` text. Such a tool sees the prefix now.

#### A formula is exported with the row it belongs to

What changed: with `exportFormulas: true`, each cell is now written with the formula of the row it
shows. In 18.1, a grid whose rows were sorted, moved, trimmed, or filtered wrote another row's formula
into the cell, next to this row's cached value. Excel and LibreOffice recalculate on open, so the file
showed wrong numbers with no warning. With the Formulas plugin on, when rows are trimmed or filtered out,
the references below them now point at the rows they name in the file, as they already did for hidden
rows left out of the export.
This applies to both engines.

What to do: nothing.

#### A formula keeps its references when columns are moved and hidden

What changed: with `exportFormulas: true` and `exportHiddenColumns: false`, a formula's references
now point at the columns they name in the file when columns were moved with `manualColumnMove`. In
18.1, the export left out the wrong column when it moved the references past the hidden ones, so a
formula was written one column off, next to the right cached value. Excel and LibreOffice recalculate
on open, so the file showed wrong numbers with no warning.
This applies to both engines.

What to do: nothing.

#### A formula error is stored as an error cell

What changed: with `exportFormulas: true`, a formula whose result is an error (`#DIV/0!`, `#N/A`, `#NAME?`,
`#NUM!`, `#REF!`, or `#VALUE!`) now stores that result as an Excel error cell. In 18.1, it was stored as
text, so an application that does not recalculate, such as Apache POI, openpyxl, or SheetJS, read a string.
The error is stored under Excel's English code even when a HyperFormula `language` translates what the
grid shows: with `plPL` the grid shows `#DZIEL/0!` and the file stores `#DIV/0!`, where 18.1 stored the
translated text. A formula that returns the text `"#N/A"` stays a text cell. A HyperFormula error that
Excel has no code for (`#CYCLE!`, `#ERROR!`, `#LIC!`, or `#SPILL!`) is still stored as the text the grid
shows. This applies to both engines.

With the Formulas plugin on, a cell whose value is an error is stored as an error cell too, with or
without `exportFormulas`: an error you typed, such as `#N/A`, and a formula exported as its value. In
18.1, both were stored as text. Without the Formulas plugin, an error is stored as text, as in 18.1.

What to do: nothing, unless a tool reads the cached results or the values as text. Such a tool now
gets an error value.

#### A number or `TRUE`/`FALSE` the Formulas plugin computed keeps its type

What changed: with the Formulas plugin on, a number or a `TRUE`/`FALSE` value that the plugin
computed is now stored as a number or a boolean, even in a `text` column and without
`exportFormulas`. This covers the cells an array formula spills, such as the cells below
`=SEQUENCE(3)`, and a formula exported as its value. In 18.1, such a cell in a `text` column was
stored as text, so an application that reads the stored values without recalculating, such as Apple
Numbers, left it out of `SUM()`. A value you typed into a `text` column is still stored as text. This
applies to both engines.

What to do: nothing, unless a tool expects text in those cells. Such a tool now gets a number or a
boolean.

#### An array formula is written as an array

What changed: with `exportFormulas: true`, a formula whose result spills, such as `=SEQUENCE(3)`,
and a formula that is one `ARRAYFORMULA` call, such as `=ARRAYFORMULA(A1:A2*2)`, are now written
as array formulas over the cells of the result. The built-in engine writes a spilling formula as a
dynamic array, which Excel spills and resizes as it recalculates. The ExcelJS engine writes both as
legacy arrays: Excel shows them in braces, and the range stays fixed. In 18.1, both went out as plain
formulas, which Excel opened with an `@` (`=@SEQUENCE(3)`) and showed as one value.

What to do: nothing with the built-in engine. With ExcelJS, re-enter such a formula in Excel to make
it a dynamic array, or export with the built-in engine.

#### Range arithmetic is written as a one-cell array

What changed: with `exportFormulas: true` and HyperFormula's `useArrayArithmetic` on, which is the
Formulas plugin's default, a formula that applies an operator to a range, such as
`=SUM(A1:A2*B1:B2)`, is now written as a one-cell array. So is a formula that is one call to a
function that can return an array, such as `=SEQUENCE(1)`. In 18.1, both went out as plain
formulas, and Excel opened them with an `@`, so `=SUM(@A1:A2*@B1:B2)` computed one row instead of
the whole range. The built-in engine writes a one-cell dynamic array, and ExcelJS a one-cell legacy
array. Excel computes the same value from both.

What to do: nothing.

#### A decimal comma is written as a dot

What changed: with `exportFormulas: true` and a HyperFormula `decimalSeparator` of `,`, the decimal
separator of a number in a formula is now written as `.`. A formula typed as `=SUM(A1;1,5)` goes out
as `SUM(A1,1.5)`. In 18.1, only the argument separator was changed, so the file held `SUM(A1,1,5)`,
which Excel and LibreOffice read as three arguments (`7` instead of `2.5` when A1 holds 1). This
applies to both engines.

What to do: nothing.

#### A formula over a name the file cannot hold is written as its value

What changed: with `exportFormulas: true`, the Formulas plugin's named expressions are now written as
defined names. A name the engine cannot write is left out, and a formula over it is written as its
value instead. With the ExcelJS engine, that is every name that is not one workbook-scoped range,
such as a constant: `=TaxRate*100` over `TaxRate = 0.07` goes out as the value `7`. In 18.1, no name
was written, and the formula went out as it was, so Excel and LibreOffice showed `#NAME?`.

What to do: nothing, unless the formula must stay live. Export with the built-in engine, which writes
constants, sheet-scoped names, and names over several ranges.

#### Values past Excel's limits are written at Excel's maximum

What changed: a column wider than Excel stores is written 260 units wide, a row taller than Excel
stores is written 409.5 points tall, and a text longer than 32,767 characters is cut to 32,767. In
18.1, ExcelJS wrote the values as they were, and Excel repaired or truncated them when it opened the
file. Each clamp is listed in the console warning about dropped features
(`columnWidth:clamped`, `rowHeight:clamped`, `cellText:truncated`), which the ExcelJS engine logs
now too.

What to do: nothing. To keep a long text whole, split it across cells before you export.

#### A control character is removed from a sheet name

What changed: the export now removes the characters Excel forbids in a sheet name, such as `:`
and `/`, and control characters, such as a tab, on both engines, because Excel refuses a name
that holds one. In 18.1, a name with a forbidden character made the export reject with ExcelJS's
own error. A sheet that becomes a duplicate of another is numbered, as before.
For example, `sheets: [{ instance: a, name: 'Q1\tSales' }, { instance: b, name: 'Q1Sales' }]`
writes `Q1Sales` and `Q1Sales1`. In 18.1, ExcelJS wrote `Q1<tab>Sales` as it was, and the second
sheet kept its name.

What to do: pass sheet names without control characters if a consumer of the file looks a sheet up
by name.

#### A cell a merge covers keeps its own formatting

What changed: the cells a merge covers are written with formatting, so a merged block's border and
fill reach every edge in every spreadsheet application. A covered cell with no formatting of its
own takes the master cell's formatting. A covered cell with formatting of its own keeps its number
format, its lock, and its own border sides, and takes the master's fill and the master's border
sides on top. In 18.1, the ExcelJS engine replaced a covered cell's own style with the master's. The
covered cell lost its number format, its lock, and its own border sides, so with a box border
around a merge, LibreOffice drew the block without its right edge.

The ExcelJS engine writes two more differences. A merge of a single cell is no longer written as a
`<mergeCell>`, because it merges nothing. A merge whose first cell holds no value and no formatting now
gives that cell a style index of its own (an `s` attribute and one more `cellXfs` entry), so Apple Numbers and Quick
Look place the cells after it in the right columns.

What to do: nothing, unless a tool compares the raw XML of the files.

#### A currency symbol is written in quotes

What changed: a `numeric` column whose `numericFormat` shows a currency symbol longer than one
character, such as `USD`, `CHF`, or `zł`, is now written with the symbol in quotes, as
`"USD"#,##0.00` or `#,##0.00"zł"`. In 18.1, the symbol was written without quotes, such as
`#,##0.00USD`. Excel for the web repaired such a file when it opened it, and other spreadsheet
applications dropped the number format. A one-character symbol other than `$`, such as `€` or `£`,
is now quoted too, as `#,##0.00"€"`, because Apple Numbers and Quick Look misread it bare. A lone `$`
is written as before. A symbol that several currencies share, such as `kr`, `¥`, or `￥`, is now written as an
Excel locale token that names the currency's home locale, such as `#,##0.00[$kr-41D]` for the Swedish
krona or `[$¥-411]#,##0.00` for the yen. A file 18.1 wrote for a Norwegian krone column imports as the
Swedish krona. A currency other than the US dollar that shows as `$`, such as the Australian,
Canadian, or New Zealand dollar or the Mexican peso, is now written with the token of its home locale,
such as `[$$-C09]#,##0.00` for the Australian dollar. In 18.1, it was written as a bare `$`, which imports
as the US dollar. A symbol that would import as another currency, or as none, such as `₪` for the Israeli
new shekel or `R` for the South African rand, is now written as the quoted ISO 4217 code, such as
`#,##0.00"ILS"`, so the column keeps its currency on import. A `minimumIntegerDigits` value is now written as that many zeros, such as `00000`.
In 18.1, it was dropped and the zeros were lost. This applies to both engines.

What to do: nothing, unless a tool reads the raw number format. Such a tool sees the quotes now.

#### A date Excel cannot store exports as text

What changed: a `date` cell before 1900, which an Excel date serial cannot hold, or a date that does not
exist, such as `2023-02-29` or `2024-04-31`, is now written as a text cell with the value the cell holds.
In 18.1, such a cell was written as a wrong date serial, so the file showed another date. This applies to
both engines.

What to do: nothing, unless a consumer of the file expects a date serial in every `date` cell. Correct
the values in your data before you export.

#### The dropdown list sheet is hidden instead of very hidden

What changed: the export writes the lists of `dropdown` and `autocomplete` columns to a helper sheet
named `_HotValidation`. In 18.1, that sheet was very hidden, and Apple Numbers dropped every
dropdown that pointed at it. The sheet is now hidden, so Numbers keeps the dropdowns. Excel lists
the sheet under **Unhide**.

What to do: nothing. Do not delete the `_HotValidation` sheet in the file, or the dropdowns lose
their lists.

#### A grid on a right-to-left page exports a right-to-left sheet

What changed: a grid that renders right to left because its page is right-to-left (the default
`layoutDirection: 'inherit'` on a page with `dir="rtl"`) now exports a right-to-left sheet. In 18.1,
only `layoutDirection: 'rtl'` exported one, and such a grid exported a left-to-right sheet.

What to do: nothing.

#### A malformed conditional formatting rule is skipped

What changed: with the ExcelJS engine, a `conditionalFormatting` rule that is not a rule object, an
`expression` rule with no `formulae`, or a `colorScale`, `dataBar`, or `iconSet` rule with no `cfvo`
thresholds (or a `colorScale` with no `color`) made the export reject with a `TypeError` in 18.1. Both engines now skip such a rule,
report it in the console warning about dropped features, and write the rest of the file.

What to do: nothing. To keep the rule, fix its shape.

#### A carriage return is stored as `_x000D_`

What changed: the built-in engine stores a carriage return (`\r`) in a text cell as `_x000D_`, the
escape Excel itself writes, so the character survives the file. In 18.1, ExcelJS wrote the raw
character, and an XML parser turns a raw carriage return into a line feed (`\n`), so a `\r\n` pair
came back as `\n`. Excel and Handsontable's import, on either engine, read `_x000D_` back as a
carriage return. openpyxl, and pandas with its
default `openpyxl` engine, show it as the literal text `_x000D_`.

What to do: if a Python tool reads the file, read it with `pandas.read_excel(..., engine='calamine')`,
or replace the escape after you read it, with `.str.replace('_x000D_', '\r')`. To keep the 18.1 output,
replace `\r\n` and `\r` with `\n` in your data before you export, or keep ExcelJS as the engine.

### Who is affected

- You call `supportsExportFormat('xlsx')` and use the answer to decide whether to render your own
  export button, menu entry, or toolbar item. That affordance is now rendered unless `engines.xlsx`
  holds a value that is not an engine module.
- You set `exportFile` without an `engines` entry and counted on the "To Excel" item staying out of
  the context menu. It now shows.
- You catch the rejection of an XLSX export as a way to detect that no engine is configured.
- You compare the rejection message against `Missing or invalid ExcelJS engine`.
- You pass an `engines.xlsx` value that is not an engine module (for example `{}`, `'exceljs'`, or
  `true`), and gate an export button on `supportsExportFormat('xlsx')`. The method now answers
  `false` for that grid, and "To Excel" no longer shows.

### How to migrate

To keep ExcelJS as the engine, keep the `engines` entry you already pass. Nothing about that
configuration changed, and a grid that passes it exports through ExcelJS, with the bug fixes listed
above:

```js
exportFile: {
  engines: { xlsx: ExcelJS },
},
```

To keep the "To Excel" item out of the context menu, remove the `export_file:xlsx` sub-item in the
[`beforeContextMenuSetItems`](@/api/hooks.md#beforecontextmenusetitems) hook. The rest of the
menu, including the **Export** item and its "To CSV" sub-item, stays as it is:

```js
beforeContextMenuSetItems(menuItems) {
  const exportItem = menuItems.find(({ key }) => key === 'export_file');

  if (exportItem) {
    exportItem.submenu.items = exportItem.submenu.items
      .filter(({ key }) => key !== 'export_file:xlsx');
  }
},
```

To gate your own export affordance, check `supportsExportFormat('xlsx')` still asks the question you
mean. It now answers "can this grid write the format", which is `true` for every grid whose
`engines.xlsx` is absent, `null`, or a supported engine module. If you meant "is ExcelJS
configured", read the setting instead:

```js
const usesExcelJs = Boolean(hot.getSettings().exportFile?.engines?.xlsx);
```

To detect a failed export, match on the current message or read `error.cause`. Do not match on
`Missing or invalid ExcelJS engine`, which is no longer produced.

The built-in engine needs the [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API),
which every browser Handsontable supports provides. See
[XLSX engines: Compare the engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#compare-the-engines)
for what each engine writes.

## 39. `removeCellMeta()` accepts an index past the grid's range

This is a bug fix, not a breaking change. It applies only if you call
[`removeCellMeta()`](@/api/core.md#removecellmeta) with a row or column index that lies outside the
grid's current range.

In 18.1, such a call threw `Assertion failed: Expecting an unsigned number`, while
[`setCellMeta()`](@/api/core.md#setcellmeta) accepted the same index. Now `removeCellMeta()` matches
`setCellMeta()`: it uses the index as the physical index as it is, and removes the key from the cell
meta stored there. A coordinate you captured before the data shrank, for example through
[`updateData()`](@/api/core.md#updatedata), which keeps the cell meta, still addresses the record
you wrote it to.

### Who is affected

- You call `removeCellMeta()` with an index past the last row or column and catch the error.
- You trim rows or columns, through [`trimRows`](@/api/options.md#trimrows) or a filter, and call
  `removeCellMeta()` with an index past the visible range. That index now names a physical record:
  a trimmed record that is still live, or a row the grid shows at a different visual index (when
  the trimmed rows sit above it). In 18.1 the call threw; now it removes the key from that record
  without an error.

### How to migrate

Pass the visual index of a cell the grid shows. To skip an index that lies outside the grid, check it
against [`countRows()`](@/api/core.md#countrows) and [`countCols()`](@/api/core.md#countcols) before
the call:

```js
if (row < hot.countRows() && column < hot.countCols()) {
  hot.removeCellMeta(row, column, 'className');
}
```

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::

## 40. A `dataSchema` with non-`null` values creates a column for each value

If you don't set [`columns`](@/api/options.md#columns), the [`dataSchema`](@/api/options.md#dataschema) option decides which property each column reads. In 18.1, only a schema value of `null` created a property for a column. A column for any other value, such as `0`, `'x'`, or `false`, had no property. It read `null` and rendered blank, although the data held a value.

In 19.0, every schema value except an array, a function, and an object that isn't a plain object, such as a `Date` or a `Map`, creates a column property, whatever its default. The columns follow the key order of the schema, so a schema that mixes `null` and non-`null` values has its columns in a new order.

```js
// 18.1: column 0 is `id`, column 1 is `name`, column 2 has no property and renders blank
// 19.0: column 0 is `isNew`, column 1 is `id`, column 2 is `name`
const hot = new Handsontable(container, {
  data: [{ isNew: true, id: 1, name: 'Ted' }],
  dataSchema: { isNew: true, id: null, name: null },
});
```

### Who is affected

You are affected if you set a `dataSchema` with a value that isn't `null`, you don't set `columns`, and any setting or call addresses a column by its index. Examples are [`colHeaders`](@/api/options.md#colheaders) as an array, [`hiddenColumns`](@/api/options.md#hiddencolumns), [`colWidths`](@/api/options.md#colwidths), [`cell`](@/api/options.md#cell), and [`getDataAtCol()`](@/api/core.md#getdataatcol).

### How to migrate

Set [`columns`](@/api/options.md#columns) and name each property in `data`, so the order no longer depends on the schema:

```js
const hot = new Handsontable(container, {
  data: [{ isNew: true, id: 1, name: 'Ted' }],
  dataSchema: { isNew: true, id: null, name: null },
  columns: [{ data: 'id' }, { data: 'name' }],
});
```

Or use `null` for each value in the schema, as the grid does when it reads the schema from your data.

## 41. Ten options are type-checked

Before 19.0, TypeScript typed ten documented options as `any`. They fell into the `[key: string]: any`
index signature of `GridSettings`, so any value compiled, a wrong one included. Each option now has its
real type:

| Option | Type |
| ------ | ---- |
| [`enterCommits`](@/api/options.md#entercommits) | `boolean` |
| [`filterSelectedItems`](@/api/options.md#filterselecteditems) | `boolean` |
| [`searchInput`](@/api/options.md#searchinput) | `boolean` |
| [`injectCoreCss`](@/api/options.md#injectcorecss) | `boolean` |
| [`parsePastedValue`](@/api/options.md#parsepastedvalue) | `boolean` |
| [`maxSelections`](@/api/options.md#maxselections) | `number` |
| [`notification`](@/api/options.md#notification) | `boolean`, or an object with `stackLimit` and `animation` |
| [`theme`](@/api/options.md#theme) | A theme name, a theme config object, or a `ThemeBuilder` |
| [`valueParser`](@/api/options.md#valueparser) | A function that takes the editor value and the cell properties |
| [`sourceSortFunction`](@/api/options.md#sourcesortfunction) | A function that takes an array of list entries and returns one |

Nothing changes at runtime. This section applies only if you use TypeScript.

### Who is affected

Your code stops compiling in one of these cases:

- A `boolean` option holds another type, such as `0` or `'true'`, or `maxSelections` holds a
  numeric string.
- The `notification` object has a key other than `stackLimit` or `animation`. The plugin reads only those two.
- `theme` holds a value that is neither a string nor an object.
- One of the options holds `null`, as in `updateSettings({ notification: null })`. The grid treats `null`
  as unset, but the types do not accept it. Pass `undefined` instead.
- Your code reads one of these options back, from `getSettings()`, `getCellMeta()`, or a custom
  editor's `cellProperties`, and uses it as a definite value. Each option is optional, so TypeScript
  now reports a possibly `undefined` value.
- Your code calls a `ThemeBuilder` method on `getSettings().theme`. The type is `string | object`, because
  `object` absorbs `ThemeBuilder`, so a `typeof` check narrows only to `object`. Check with
  `instanceof ThemeBuilder` or cast the value.
- You use `Required<GridSettings>`, or a mapped type over its keys. All ten options become required
  there, so an object typed that way is missing them (TS2740).
- Your code calls `valueParser` with one argument. The function now declares both of its
  parameters: the value and the cell properties.

A callback you write for `valueParser` or `sourceSortFunction` still compiles, whether it annotates its
parameters or leaves TypeScript to infer them.

### How to migrate

Give the option a value of its type:

```ts
// Before: a string compiled
maxSelections: '3',

// After
maxSelections: 3,
```

Remove a `notification` key the plugin does not read. Set a toast's duration where you show the message:

```ts
// Before: the plugin read `stackLimit` and left `duration` alone
notification: {
  stackLimit: 5,
  duration: 3000,
},

// After
notification: {
  stackLimit: 5,
},
```

When you read an option back, handle the `undefined` case:

```ts
// Before: `getSettings().valueParser` was `any`
const parsed = hot.getSettings().valueParser(value, cellProperties);

// After
const parsed = hot.getSettings().valueParser?.(value, cellProperties);
```

If a value comes from a source that TypeScript cannot check, such as a configuration file, convert
it where you read it:

```ts
import type { GridSettings } from 'handsontable';

const settings: GridSettings = {
  maxSelections: Number(config.maxSelections),
};
```

## 42. A hook set to `null` through `updateSettings()` is removed

In 18.1, a hook you passed in the settings could not be removed:
[`updateSettings()`](@/api/core.md#updatesettings) with the hook set to `null` did nothing, the
callback kept running, and [`getSettings()`](@/api/core.md#getsettings) still returned it. In 19.0,
`null` removes every callback that settings passed for that hook, including the callbacks of an array
passed earlier, and `getSettings()` returns `null` for it. A listener you added with
[`addHook()`](@/api/core.md#addhook) is never removed this way, even when it is the same function, and
`undefined` still leaves the hook as it is. In TypeScript, the settings object of `updateSettings()`
accepts `null` for every hook.

```js
const hot = new Handsontable(container, {
  afterChange: logChange,
});

// 18.1: `logChange` keeps running
// 19.0: `logChange` is removed
hot.updateSettings({ afterChange: null });
```

### Who is affected

- You pass `null` for a hook in `updateSettings()` and expect the earlier callback to keep running.
- You use a framework wrapper and set a hook prop to `null` or `undefined`, or stop passing it, for
  example `afterChange={isTracking ? logChange : null}` in React. The callback is now removed. In
  Angular, this applies to a hook that a new `settings` object sets to `null` or `undefined`, or
  leaves out.
- You use TypeScript with the React `HotTable` component. Its hook props now also accept `null`, so
  code that reads a hook prop back must handle `null`.

### How to migrate

To keep the callback, leave the hook out of the `updateSettings()` call, or pass the callback again.
In a framework wrapper, keep passing the callback in the prop (in Angular, in the `settings` object).

## 43. `colWidths: null` sizes columns like `undefined`

In 18.1, [`colWidths: null`](@/api/options.md#colwidths) was passed on as a width:
[`getColWidth()`](@/api/core.md#getcolwidth) returned `null` for every column, and every column was
drawn at the default 50px width, although the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin
reported itself enabled. In 19.0, `colWidths: null` sets no width, the same as `undefined`, and
AutoColumnSize sizes the columns.

A `null` entry in a `colWidths` array, or a `colWidths` function returning `null`, also sets no width
now: `getColWidth()` returns the default width instead of `null`, and the
[`modifyColWidth`](@/api/hooks.md#modifycolwidth) hook receives `undefined` for that column.
AutoColumnSize stays off there, because any other `colWidths` value turns it off, so those columns
keep the 50px width. A column `width: null` behaves like `undefined` and falls back to `colWidths`.

### Who is affected

- You set `colWidths: null` and rely on 50px columns.
- Your `modifyColWidth` callback checks `width === null`, or your code expects `getColWidth()` to
  return `null`.

### How to migrate

To keep fixed 50px columns, set `colWidths: 50`. In a `modifyColWidth` callback, check for
`width === undefined` (or `width == null`) instead of `width === null`.

## 44. An `afterRender` hook that writes to the engine loops

In 18.1, the [`Formulas`](@/api/formulas.md) plugin did not repaint the grid when something other
than the grid changed the HyperFormula engine, for example `setCellContents()` on an external or
shared engine. In 19.0, every such write repaints the grids that use the engine. An
[`afterRender`](@/api/hooks.md#afterrender) hook that writes to the engine on every call now triggers
a repaint, which calls the hook again. The grid repaints until the call stack overflows, and `Formulas`
logs a warning that the grid failed to repaint.

### Who is affected

- Your `afterRender` hook calls `setCellContents()` or another engine write without checking whether the value changed.

### How to migrate

Write only when the value differs. Wrapping the write in `engine.batch()` does not stop the loop.

**Before:**

```js
afterRender() {
  engine.setCellContents({ sheet: 0, row: 0, col: 1 }, total);
}
```

**After:**

```js
afterRender() {
  const address = { sheet: 0, row: 0, col: 1 };

  if (engine.getCellValue(address) !== total) {
    engine.setCellContents(address, total);
  }
}
```

Outside a hook, `engine.batch()` still makes several writes repaint the grid once instead of once per write.

## 45. The copy, cut, and paste shortcuts are registered in the `grid` context

In 18.1, the `grid` [shortcut context](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts)
had no entry for <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, <kbd>**X**</kbd>, and
<kbd>**V**</kbd>. The browser ran the action, and Handsontable did not list it. In 19.0, the `grid`
context registers all three as default shortcuts, in the `gridClipboard` group. The entries do nothing
on their own, and the browser still runs the action.

Because they are real entries, two things change:

- [`hasShortcut()`](@/api/shortcutContext.md#hasshortcut) returns `true` for these keys, and
  [`getShortcuts()`](@/api/shortcutContext.md#getshortcuts) returns the default entry.
- [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) on one of these keys
  removes the default entry, and the [`CopyPaste`](@/api/copyPaste.md) plugin then cancels that key
  combination. <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, <kbd>**X**</kbd>, or
  <kbd>**V**</kbd> no longer copies, cuts, or pastes. The context menu items and the
  [`copy()`](@/api/copyPaste.md#copy), [`cut()`](@/api/copyPaste.md#cut), and
  [`paste()`](@/api/copyPaste.md#paste) methods keep working.

For the complete behavior of the removal, see
[Remove the copy, cut, and paste shortcuts](@/guides/navigation/custom-shortcuts/custom-shortcuts.md#remove-the-copy-cut-and-paste-shortcuts).

### Who is affected

- You add your own <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, <kbd>**X**</kbd>, or
  <kbd>**V**</kbd> shortcut, and later remove it with `removeShortcutsByKeys()` to get the native
  behavior back. The call now also removes the default entry, so keyboard copy, cut, or paste stops
  working.
- You call `getShortcuts()` or `hasShortcut()` for one of these keys and expect an empty list or
  `false`.

### How to migrate

Remove your own entry by its `group`, with
[`removeShortcutsByGroup()`](@/api/shortcutContext.md#removeshortcutsbygroup), instead of by its keys.
The call leaves the default entry in place, because it belongs to another group.

**Before:**

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcuts([{
  keys: [['control/meta', 'v']],
  callback: () => customPaste(),
  group: 'myPaste',
}]);

// Later, to get the native paste back
gridContext.removeShortcutsByKeys(['control/meta', 'v']);
```

**After:**

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcuts([{
  keys: [['control/meta', 'v']],
  callback: () => customPaste(),
  group: 'myPaste',
}]);

// Later, to get the native paste back
gridContext.removeShortcutsByGroup('myPaste');
```

If your code reads these keys, ignore the default entry by its group. `getShortcuts()` returns each
entry with its `group`:

```js
// Before: an empty list meant that nobody had registered the key
const hasOwnCopy = gridContext.getShortcuts(['control/meta', 'c']).length > 0;

// After
const hasOwnCopy = gridContext
  .getShortcuts(['control/meta', 'c'])
  .some(({ group }) => group !== 'gridClipboard');
```

To turn off keyboard copy, cut, or paste on purpose, keep using `removeShortcutsByKeys()`.

## 46. The Vue 3 wrapper props are type-checked

Before 19.0, `HotTable` and `HotColumn` declared every prop as `any`. A type check of your templates
accepted any value for any option, a wrong one included. Each prop now has the type of the option it
sets. `HotTable` takes the types of [`updateSettings()`](@/api/core.md#updatesettings), so a hook prop
may be `null`, which removes its callback. `HotColumn` takes the types of the column settings, where
`data` is a property name or a getter instead of an array of rows. Hooks run from the grid-level settings
only, and core reads `getValue` from the table settings only, so `HotColumn`
has neither.

One thing changes at runtime. `handsontable` is now a prop of `HotTable` and `HotColumn`, and `getValue`
is now a prop of `HotTable`. In 18.1, `<HotColumn :handsontable="...">` never reached the column
settings, and `<HotTable :handsontable="...">` and `<HotTable :getValue="...">` fell through as
attributes on the root `div`. They now reach the grid settings, so a template that passed one of them and
relied on it being ignored behaves differently. A `getValue` on a `HotColumn` still has no effect.

Apart from those props, this section applies only if you type-check your templates with `vue-tsc`, or your
`h()` calls with `tsc`.

### Who is affected

Your code stops compiling in one of these cases:

- A prop holds a value of another type, such as `:readOnly="'yes'"` or `:sheetsBar="42"`.
- `HotTable` gets `:data="null"`, as in `:data="isLoaded ? rows : null"`. Pass `undefined`, or an empty
  array.
- `HotColumn` gets a hook, such as `:afterChange="onChange"`, or `:getValue`. Both type-check in a
  template only without `strictTemplates`, and in an `h()` call they fail. Move the hook to `HotTable`.
  It never ran on a column.
- A `getter` column passes `:data="(row, value) => ..."` with a required second parameter. The type
  takes a function that also works with one argument, so write `(row, value?) => ...`.
- You turned on `strictTemplates` in `vueCompilerOptions`, and a template passes a prop that is not an
  option, such as a custom cell meta key. Without `strictTemplates`, such a prop still compiles. A
  `class`, a `style`, and an `aria-` attribute compile either way.

A prop that you leave out is still optional.

### Boolean attributes without a value

A bare attribute, such as `<HotTable readOnly>`, passes the type check, but it does not set the option
to `true`. The wrapper does not cast attributes to booleans, so the grid gets an empty string, which is
falsy. This was already the case in 18.1. Write the value instead:

```vue
<!-- Before: compiles, and does nothing -->
<HotTable readOnly rowHeaders />

<!-- After -->
<HotTable :readOnly="true" :rowHeaders="true" />
```

### How to migrate

Fix the value, or cast it when a type is wrong for your case:

```vue
<!-- Before: compiled, and failed at runtime -->
<HotTable :sheetsBar="42" :readOnly="'yes'" />

<!-- After -->
<HotTable :sheetsBar="{ sheets }" :readOnly="true" />

<!-- A value your own types cannot narrow -->
<HotTable :readOnly="(isLocked as boolean)" />
```

## 47. Four `MergedCellsCollection` methods are deprecated

This applies only if you call one of these methods of the
[`MergedCellsCollection`](@/api/mergedCellsCollection.md) that the `MergeCells` plugin keeps
(`hot.getPlugin('mergeCells').mergedCellsCollection`):

- `getStartMostColumnIndex()`
- `getEndMostColumnIndex()`
- `getTopMostRowIndex()`
- `getBottomMostRowIndex()`

The selection now steps over merged cells by itself, so Handsontable no longer calls these methods.
They still return what they did, and each prints a one-time console warning when called. They will
be removed in 20.0.0.

The answers change in one case only: a merged cell whose rows a filter or `trimRows` hides is left
out, because its coordinates point at the rows that took its place.

### Who is affected

You are affected only if your code calls one of the four methods.

### How to migrate

There is no replacement. Remove the call: keyboard and mouse selection already cover every merged
cell they touch.

## 48. The `Loading` plugin needs the `Dialog` plugin registered

The [`Loading`](@/api/loading.md) plugin shows its overlay through the [`Dialog`](@/api/dialog.md)
plugin. In 18.1, a grid that registered `Loading` without `Dialog` was created, but the overlay never
appeared: [`show()`](@/api/loading.md#show) did nothing, and no error or warning said why. In 19.0,
`new Handsontable()` throws an error when `Loading` is registered and `Dialog` is not:

```text
The Loading plugin requires the following modules:
 - Dialog (plugin)

You have to import and register them manually.
```

### Who is affected

You register modules one by one with `registerPlugin()`, and you register `Loading` without `Dialog`.
The full `handsontable` package and `registerAllModules()` register both, so they are not affected.

### How to migrate

Register the `Dialog` plugin next to the `Loading` plugin:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, Dialog, Loading } from 'handsontable/plugins';

registerPlugin(Dialog);
registerPlugin(Loading);
```

## 49. Plugins apply their settings before the first render

In 18.1, several plugins applied the settings the grid was built with after its first render, and
then rendered the grid again. In 19.0, they apply them before the [`init`](@/api/hooks.md#init) hook
and before the first render, so the first render already shows the result, and the grid renders once
(twice when [`customBorders`](@/api/options.md#customborders) declares borders). The hooks this work
fires run earlier too:

- [`afterColumnSort`](@/api/hooks.md#aftercolumnsort), for the `initialConfig` sort of
  [`columnSorting`](@/api/options.md#columnsorting) or `multiColumnSorting`
- [`afterMergeCells`](@/api/hooks.md#aftermergecells) and the merges' `afterChange` call, for
  [`mergeCells`](@/api/options.md#mergecells)
- the summaries' `afterChange` call, for [`columnSummary`](@/api/options.md#columnsummary)
- [`afterEmptyDataStateShow`](@/api/hooks.md#afteremptydatastateshow), for
  [`emptyDataState`](@/api/options.md#emptydatastate)
- [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) and the first `fetchRows` call,
  for [`dataProvider`](@/api/options.md#dataprovider)

When the grid is built, these hooks now run before it is drawn: [`getCell()`](@/api/core.md#getcell)
returns `null` inside them, and the merges' and summaries' `afterChange` calls come before the
`afterChange` call of the initial data load.

Two related changes come with it:

- `enablePlugin()` of one of these plugins, called on a grid that is already drawn, now applies the
  plugin's settings. For `dataProvider`, it fetches the data from the server.
- An `updateSettings()` call that changes `columnSummary` writes the summaries after its
  [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) listeners. A listener there reads the
  previous summaries and, when the call also passes `columns`, a summary cell that is not read-only
  yet. The grid draws the new summaries.

### Who is affected

- A listener of one of the hooks above reads the rendered grid when the grid is built, for example
  with `getCell()`.
- Your code relies on these hooks running after the `init` hook, or on the order of the `afterChange`
  calls when the grid is built.
- You call `enablePlugin()` on a drawn grid and do not expect it to apply the plugin's settings.
- An `afterUpdateSettings` listener reads the summaries that the same `updateSettings()` call writes.

### How to migrate

Read the rendered grid in [`afterInit`](@/api/hooks.md#afterinit), which runs after the first
render, and skip the work in the hook when `getCell()` returns `null`:

**Before:**

```js
const hot = new Handsontable(container, {
  columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
  afterColumnSort() {
    markFirstRow(this.getCell(0, 0));
  },
});
```

**After:**

```js
const hot = new Handsontable(container, {
  columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
  afterColumnSort() {
    const cell = this.getCell(0, 0);

    if (cell) {
      markFirstRow(cell);
    }
  },
  afterInit() {
    markFirstRow(this.getCell(0, 0));
  },
});
```

Read the new summaries after `updateSettings()` returns, or in an
[`afterRender`](@/api/hooks.md#afterrender) hook.

## 50. `rowHeights` sets an exact row height

The [`rowHeights`](@/api/options.md#rowheights) option now sets the exact height of a row. Before, it
set a minimum. Handsontable raised a value below the default row height to the default, and a row
grew to fit content taller than the value.

Now a row renders at the height you set, and the content that doesn't fit is clipped, as in Excel.
This makes rows as thin as you want, for example to use empty rows as separators. The
[`getRowHeight()`](@/api/core.md#getrowheight) method returns the height you set, too.

| Setting                                    | Before                              | Now                                   |
| ------------------------------------------ | ----------------------------------- | ------------------------------------- |
| `rowHeights` below the default row height  | The row has the default height      | The row has the height you set        |
| `rowHeights` below the content's height    | The row grows to fit the content    | The row keeps its height and clips the content |
| `rowHeights` of `0` or `undefined`         | The row has the default height      | The same, or the `minRowHeights` height if you set it |
| `rowHeights` with `autoRowSize` enabled    | A minimum, the row grows to fit     | The same                              |
| [`minRowHeights`](@/api/options.md#minrowheights) | A minimum, the row grows to fit | The same                              |

The [`minRowHeights`](@/api/options.md#minrowheights) option is not an alias of `rowHeights` any
more. It keeps the behavior `rowHeights` had before. You can set both options: `rowHeights` sets the rows it gives a height, and `minRowHeights` applies to the others.

### Who is affected

You are affected if you set `rowHeights`, leave [`autoRowSize`](@/api/options.md#autorowsize) off,
and a row's content is taller than the height you set. That happens with multiline text, a
[custom renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md), or custom cell styles.
Those rows kept their height before, and now they clip.

You are also affected if you set `rowHeights` to the default row height, because the first row of a
grid without column headers draws its top border inside the height you set. It was 1 px taller than
the other rows before.

You are not affected if you use `minRowHeights`, if you enable `autoRowSize`, or if your rows
already fit their `rowHeights`.

Clipped content stays in the DOM and screen readers still read it. A user who enlarges the text, or
overrides the text spacing, no longer makes your rows taller, so test your grid with larger text if
you set `rowHeights` below your content's height.

Two plugins read row heights too. The [`ImportFile`](@/api/importFile.md) plugin applies the row
heights of an imported workbook through `minRowHeights`, so an imported row keeps the default row
height when the workbook's height is smaller, as before. The [`ExportFile`](@/api/exportFile.md)
plugin writes the heights [`getRowHeight()`](@/api/core.md#getrowheight) returns, so a row you set
below the default exports at that height. It writes the height of a hidden row from `rowHeights` or
`minRowHeights`, whichever you set.

### How to migrate

To keep rows that grow to fit their content, rename the option to `minRowHeights`:

```js
// Before
rowHeights: 50,

// After
minRowHeights: 50,
```

To let Handsontable measure the rows, enable [`autoRowSize`](@/api/autoRowSize.md). With it,
`rowHeights` stays a minimum.

To keep the clipping, raise the height to fit your content, or shorten the content.

The [`ManualRowResize`](@/api/manualRowResize.md) plugin is not part of this change. Dragging a row
border, or calling [`setManualSize()`](@/api/manualRowResize.md#setmanualsize), still doesn't make
a row shorter than the default row height.

With [`manualRowResize`](@/api/options.md#manualrowresize) enabled, a row that a `rowHeights` height covers stays at the height the user drags it to and clips its content. A row that `rowHeights` gives no height grows to fit its content, as before.

## 51. `loadData()` drops a change that waits for its validator

A change to a cell with a [`validator`](@/api/options.md#validator) is written into the data only after
the validator answers, and validators always answer after the call that made the change returns. That
holds for a synchronous validator too, and for the built-in validators of `numeric`, `date`, and
[`maxLength`](@/api/options.md#maxlength) cells.

Before 19.0, when [`loadData()`](@/api/core.md#loaddata) replaced the data in that window, the change
was written into the new data at the same row and column, usually a different record. Now the change is
dropped:

- It isn't written into the new data, also when the new data holds the same records.
- [`beforeChange`](@/api/hooks.md#beforechange) and [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell)
  still fire for it, and [`afterChange`](@/api/hooks.md#afterchange) doesn't.
- A correction that the validator writes for it is dropped too.
- An open editor that waits for the validator closes without saving.

[`updateData()`](@/api/core.md#updatedata) drops nothing.

The [`DataProvider`](@/api/dataProvider.md) plugin is the exception for its own refetch after a save: it writes such an
edit again into the record that has the same row ID, so the edit is validated and saved as usual.

### Who is affected

You are affected if your cells have validators and you call `loadData()` right after
[`setDataAtCell()`](@/api/core.md#setdataatcell), in the same function, or while the user confirms an
edit, for example to reset the grid's states over the array it already holds.

You are also affected if you mark data as unsaved in `beforeChange` and mark it saved in `afterChange`:
for a dropped change, `afterChange` never comes.

### How to migrate

To keep the change, call `loadData()` after the validator answered, for example from
[`afterChange`](@/api/hooks.md#afterchange), or use [`updateData()`](@/api/core.md#updatedata), which
keeps the change and the grid's states:

```js
// Before: the change reached the loaded data
hot.setDataAtCell(0, 0, 42);
hot.loadData(rows);

// After: write the value into the array you load
rows[0][0] = 42;
hot.loadData(rows);

// Or keep the states and the change
hot.setDataAtCell(0, 0, 42);
hot.updateData(rows);
```

## 52. `SHEET()` keeps a sheet's number after an earlier sheet is removed

When the [`Formulas`](@/api/formulas.md) plugin creates the HyperFormula engine (you pass the
`HyperFormula` class in the `engine` option), `SHEET()` now returns the sheet's number in the engine.
Before, removing a sheet renumbered the sheets after it, so `SHEET()` returned the sheet's position.

The plugin used to rebuild the whole engine whenever a sheet was added or removed. That rebuild
turned every spilled array, such as the result of `=SEQUENCE(3)`, into `#SPILL!`, for example when a
second Handsontable instance connected to the same engine. With HyperFormula 3.1.1 or later the
plugin no longer rebuilds the engine, so spilled arrays keep their values, and sheets keep their
numbers.

For a workbook with the sheets `S1`, `S2`, and `S3`, after you remove `S2`:

| Formula         | Before | Now |
| --------------- | ------ | --- |
| `=SHEET("S3")`  | `2`    | `3` |
| `=SHEETS()`     | `2`    | `2` |

An engine instance that you create and pass to the plugin already numbered sheets this way, and it is
not affected.

### Who is affected

You are affected if you use HyperFormula 3.1.1 or later, let the plugin create the engine, remove a
sheet that is not the last one, and use `SHEET()` as a position, for example as an index in `INDEX()`
or `CHOOSE()`.

### How to migrate

To get a sheet's position, count the sheets before it yourself, or keep the sheets you remove at the
end of the workbook. To keep the old numbering, call `rebuildAndRecalculate()` on the engine after you
remove a sheet. That also turns spilled arrays into `#SPILL!`, as before.

```js
const engine = hot.getPlugin('formulas').engine;

engine.removeSheet(engine.getSheetId('S2'));
// Before: SHEET("S3") returns 2. Now: SHEET("S3") returns 3.
```

## 53. `updateSettings()` keeps the rows of a server-backed grid

This applies only if you set the [`dataProvider`](@/api/options.md#dataprovider) option.

In 18.1, [`updateSettings()`](@/api/core.md#updatesettings) emptied a server-backed grid whenever its
payload included `data`, and nothing fetched the rows again. Passing the same `dataProvider` object
again also emptied the grid and fetched the rows anew, so a React app did that on every render.

In 19.0, `data` is ignored with the console warning it already printed, and the grid keeps its rows.
The same `dataProvider` object passed again keeps the rows and sends no request, even when you
changed a member inside that object or the last fetch failed. Passing another `dataProvider` object
still reloads the rows, and so does a call that also passes `pagination`, `columnSorting`, `filters`,
or `columns`.

A call that passes `pagination`, `columnSorting`, `filters`, or `columns` without `dataProvider` now
fetches the rows again too. In 18.1 it sent no request, so the pager, the sort, or the filters it reset
no longer matched the rows on screen. A new `columns` value clears the sort, as it does on a grid
without `dataProvider`.

```js
// 18.1: the grid is empty until something else fetches
// 19.0: the rows stay
hot.updateSettings({ data: [] });

dataProvider.fetchRows = fetchFromNewEndpoint;

// 18.1: the rows are fetched again with `fetchFromNewEndpoint`
// 19.0: nothing is fetched; the next request uses `fetchFromNewEndpoint`
hot.updateSettings({ dataProvider });
```

### Who is affected

- You call `updateSettings({ data: [] })` to clear a server-backed grid.
- You change a member of your `dataProvider` object and pass the same object to `updateSettings()`
  to load the rows again, or pass it again to retry a failed fetch.
- You call `updateSettings()` with `pagination`, `columnSorting`, `filters`, or `columns` on a grid
  with a `dataProvider` and expect no request.

### How to migrate

To load the rows again, call [`fetchData()`](@/api/dataProvider.md#fetchdata):
`hot.getPlugin('dataProvider').fetchData()`. To leave server-backed loading, set `dataProvider` to
`null`.

## 54. The React and Angular wrappers pass only the settings that changed

This applies only if you use `@handsontable/react-wrapper` or `@handsontable/angular-wrapper`.

In 18.1, the React wrapper passed every prop to [`updateSettings()`](@/api/core.md#updatesettings) on
each render, and the Angular wrapper passed every key of the `settings` input whenever it changed. A
setting passed again re-applied the plugin it names, which could reset the state the user gave that
plugin, such as the filter conditions or the page.

In 19.0, both wrappers leave out a setting whose value is the same as the value they passed last
time. Objects and arrays are compared by content with a copy of that value, so an object or array you
change in place is still passed. Functions are compared by reference, and `sheetsBar` too. `data` is
passed every time, as before: React's `data` prop, a `data` key in Angular's `settings` input, and
Angular's `data` input, which still calls `updateData()` when it changes. A render that passes the same
rows, or rows with the same values, keeps the undo and redo history. A render that passes other
values replaces the dataset and clears it.

### Who is affected

- You rely on a render or a `settings` change to reset a sort, filter, or page that the grid's
  settings did not change.
- You change a setting through the instance (`hot.updateSettings()`) and rely on the next render to
  put the prop's unchanged value back. The wrapper now leaves that prop out.

### How to migrate

Reset the state through the plugin, for example `hot.getPlugin('columnSorting').clearSort()`, or pass
a setting with another value. To put a prop's value back after a change made through the instance,
call `hot.updateSettings()` with that value.

## 55. The `non-commercial-and-evaluation` license key no longer works

Handsontable 19.0 no longer recognizes the `'non-commercial-and-evaluation'` key. It reads as an
invalid key: a lock screen covers the grid, and the console shows "The license key for Handsontable
is invalid." The `'ht68e-1f2b7-47158-70b05-0842f'` key, which 18.1 treated the same way, is invalid
too. Handsontable 18.1 and older keep accepting both keys.

The Angular wrapper's `NON_COMMERCIAL_LICENSE` constant, which holds that key, is deprecated and
will be removed in 20.0. An import of it still compiles, but a grid configured with it shows the lock
screen.

### Who is affected

- You pass `'non-commercial-and-evaluation'` (in any letter case) or `'ht68e-1f2b7-47158-70b05-0842f'`
  as the [`licenseKey`](@/api/options.md#licensekey) option.
- You import `NON_COMMERCIAL_LICENSE` from `@handsontable/angular-wrapper`.

### How to migrate

Before you upgrade, get a license key and pass it instead:

- To evaluate Handsontable, get a trial key at [handsontable.com/pricing](https://handsontable.com/pricing/).
- For non-commercial use (education, research, study, and personal projects), apply for a sponsored
  license: a regular license key that we issue free of charge, at our discretion.
- For commercial use, buy a commercial license.

See [Get a license key](@/guides/getting-started/license-key/license-key.md#get-a-license-key).

```javascript
// Before
const hot = new Handsontable(container, {
  data,
  licenseKey: 'non-commercial-and-evaluation',
});

// After
const hot = new Handsontable(container, {
  data,
  licenseKey: 'your-license-key',
});
```

In the Angular wrapper, stop using the deprecated `NON_COMMERCIAL_LICENSE` constant and pass your key in
`HOT_GLOBAL_CONFIG`:

```typescript
// Before
import { HOT_GLOBAL_CONFIG, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } }];

// After
import { HOT_GLOBAL_CONFIG } from '@handsontable/angular-wrapper';

providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: 'your-license-key' } }];
```

## 56. The minimum browser versions are higher

Handsontable 19.0 is built to run on Chrome and Edge 130, Firefox 132, and Safari 18.2 on macOS and iOS. Handsontable 18.1 is built to run on Chrome 110, Firefox 110, and Safari 14.1. In a browser older than the 19.0 minimum, the grid can throw errors or render without parts of its theme.

The theme stylesheets use CSS nesting, logical properties, and the `light-dark()` color function. To support older browsers, the 18.1 build rewrote them into older CSS. That rewrite dropped some theme icons, and in right-to-left grids it drew rounded corners on the wrong cells. The 19.0 build targets browsers that support these features, so it no longer rewrites them. The JavaScript is built for the same browsers, so Handsontable 19.0 can use JavaScript built-in methods up to ES2024. For details, see [#13232](https://github.com/handsontable/handsontable/pull/13232).

### Who is affected

You are affected if your app must run in a browser older than the 19.0 minimum, on desktop or on an iPhone or iPad. Handsontable 19.0 isn't tested in those versions.

### How to migrate

Before you upgrade:

1. Check which browser versions your users run, for example in your analytics.
2. If your app declares the browsers it supports, for example in a Browserslist config, raise those versions to at least the 19.0 minimum.
3. If you must keep supporting older browsers, stay on Handsontable 18.1 until you can drop them. Polyfills do not cover the theme stylesheets, and rewriting them for older browsers yourself brings back the bugs this change fixes.

For example, in a `.browserslistrc` file:

```text
# Before
Chrome >= 110
Firefox >= 110
Safari >= 14.1

# After
Chrome >= 130
Edge >= 130
Firefox >= 132
Safari >= 18.2
iOS >= 18.2
```

For the minimum versions of both releases, see [Supported browsers](@/guides/technical-specification/supported-browsers/supported-browsers.md#minimum-versions).

## 57. Removed deprecated APIs

Handsontable 19.0 removes the APIs that 17.1 and 18.0 deprecated. The methods and the
`columnHeaders` option printed a one-time console warning in 18.x. The type aliases only showed as
deprecated in your editor. Calling a removed method now throws `TypeError: ... is not a function`.
Passing `columnHeaders` is ignored, with a one-time console warning that names `colHeaders`.
Importing a removed type alias is a TypeScript error.

| Removed | Deprecated in | Replacement |
| ------- | ------------- | ----------- |
| `saveManualColumnWidths()` and `loadManualColumnWidths()` ([`ManualColumnResize`](@/api/manualColumnResize.md)) | 18.0 | None. Both do nothing and log a deprecation warning. |
| `saveManualRowHeights()` and `loadManualRowHeights()` ([`ManualRowResize`](@/api/manualRowResize.md)) | 18.0 | None. Both do nothing and log a deprecation warning. |
| `Handsontable.helper.sanitize()` | 18.0 | The [`sanitizer`](@/api/options.md#sanitizer) option. |
| `columnHeaders` (export options of the [`ExportFile`](@/api/exportFile.md) plugin) | 17.1 | `colHeaders` |
| `Settings` type (`handsontable/plugins/exportFile`) | 18.0 | `ExportFileSettings` |
| `DataProviderOptions` type (`handsontable/plugins/dataProvider`) | 18.0 | `DataProviderFetchOptions` |

### Who is affected

You are affected if your code does any of the following:

- calls one of the four resize-state methods on the `manualColumnResize` or `manualRowResize` plugin
- calls `Handsontable.helper.sanitize()`
- passes `columnHeaders` in the options of [`exportAsString()`](@/api/exportFile.md#exportasstring),
  [`exportAsBlob()`](@/api/exportFile.md#exportasblob), [`downloadFile()`](@/api/exportFile.md#downloadfile),
  their asynchronous forms, or a `sheets` entry of an XLSX export
- imports the `Settings` type from `handsontable/plugins/exportFile` or the `DataProviderOptions` type
  from `handsontable/plugins/dataProvider`

### How to migrate

Remove the calls to the resize-state methods. They do nothing and log a deprecation warning in
18.x, and 19.0 removes them. To persist column widths or row heights, collect them in the
[`afterColumnResize`](@/api/hooks.md#aftercolumnresize) or [`afterRowResize`](@/api/hooks.md#afterrowresize)
hook, and restore them by passing an array to [`manualColumnResize`](@/api/options.md#manualcolumnresize)
or [`manualRowResize`](@/api/options.md#manualrowresize). The hooks receive the new size of the
resized column or row, so read the whole array from the grid:

```js
// Save
const hot = new Handsontable(container, {
  manualColumnResize: true,
  manualRowResize: true,
  afterColumnResize() {
    const widths = Array.from({ length: hot.countCols() }, (_, col) => hot.getColWidth(col));

    localStorage.setItem('colWidths', JSON.stringify(widths));
  },
  afterRowResize() {
    const heights = Array.from({ length: hot.countRows() }, (_, row) => hot.getRowHeight(row));

    localStorage.setItem('rowHeights', JSON.stringify(heights));
  },
});

// Restore
const hot = new Handsontable(container, {
  manualColumnResize: JSON.parse(localStorage.getItem('colWidths')) ?? true,
  manualRowResize: JSON.parse(localStorage.getItem('rowHeights')) ?? true,
});
```

See [Migrate from 17.1 to 18.0 -> Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#stop-calling-deprecated-resize-state-methods).

Remove the call to `Handsontable.helper.sanitize()` and use its argument directly. The helper
returned its input unchanged since 18.0, so the output does not change. To sanitize the HTML the
grid renders, set the [`sanitizer`](@/api/options.md#sanitizer) option.

Rename the `columnHeaders` export option to `colHeaders`. The value keeps its meaning. An export
that still passes `columnHeaders` writes no header row and warns once in the console:

```js
// Before
hot.getPlugin('exportFile').downloadFile('csv', { columnHeaders: true });

// After
hot.getPlugin('exportFile').downloadFile('csv', { colHeaders: true });
```

Rename the two type imports:

```ts
// Before
import type { Settings } from 'handsontable/plugins/exportFile';
import type { DataProviderOptions } from 'handsontable/plugins/dataProvider';

// After
import type { ExportFileSettings } from 'handsontable/plugins/exportFile';
import type { DataProviderFetchOptions } from 'handsontable/plugins/dataProvider';
```

## 58. `rowHeights` and `minRowHeights` address rows by physical index

Handsontable 19.0 applies the array and the function form of [`rowHeights`](@/api/options.md#rowheights) and [`minRowHeights`](@/api/options.md#minrowheights) by the physical row index, the same way section 34 describes for `colWidths`. In 18.1, they used the visual row index, so a height stayed at its screen position. When rows above it were collapsed, filtered, trimmed, sorted, or moved, the height went to whichever row took that position. In 19.0, a height moves with its row.

A number or a string `rowHeights` applies one height to every row, so it isn't affected.

```js
const hot = new Handsontable(container, {
  data: [
    { name: 'Engineering', __children: [{ name: 'Ana García' }, { name: 'Li Wei' }] },
    { name: 'Marketing' },
  ],
  nestedRows: true,
  rowHeights: [100, 50, 50, 70],
});

// the user collapses the `Engineering` row
// 18.1: `Marketing` is 50px tall, because the second position keeps the second height.
// 19.0: `Marketing` is 70px tall, because the height belongs to the `Marketing` row.
```

The same applies to the function form. In 19.0, Handsontable calls the function with the physical index:

```js
rowHeights(physicalRowIndex) {
  return physicalRowIndex * 10;
},
```

The physical index of a row doesn't change when rows are moved with [`ManualRowMove`](@/api/manualRowMove.md), sorted, filtered, trimmed, or collapsed. A row that [`NestedRows`](@/api/nestedRows.md) moves by dragging or detaching takes a new physical index: an array entry follows the row, but a function is called with the new index. Handsontable never changes the array you pass. It keeps track of which entry belongs to which row, so when you insert or remove rows, with [`alter()`](@/api/core.md#alter) or with the [`NestedRows`](@/api/nestedRows.md) plugin, every height stays with its row. A row inserted between others has no height of its own, and a row added after the last one takes the next entry of the array. Undo and redo put the heights back, the height of a removed row included. An entry you change in your own array applies to the row it belongs to. To declare the heights again, for example after loading data with more rows, pass a new array to [`updateSettings()`](@/api/core.md#updatesettings). Switching `rowHeights` or `minRowHeights` to or from an array, or passing a new array, clears the undo history, the way enabling a plugin does, because the earlier steps hold the rows of the previous array. [`loadData()`](@/api/core.md#loaddata) with data the grid hasn't shown, a copy of the current data included, declares the array again, so it applies from the first row. `loadData()` with the array the grid already shows, and [`updateData()`](@/api/core.md#updatedata), keep each height on its row. A data array the grid showed earlier, and that still has as many rows, gets back the alignment it had when the grid left it, so the heights stay on rows you inserted or removed there; the sheets bar relies on this when it shows a sheet again. If you change the rows of such an array while the grid shows other data, pass a new `rowHeights` array before you load it, so the heights apply from the first row. Only the last array you replaced while the same data was shown is kept for it. The heights that a user sets by dragging a row border aren't affected, because [`ManualRowResize`](@/api/manualRowResize.md) already stores them by physical index.

The [`modifyRowHeight`](@/api/hooks.md#modifyrowheight) hook and [`getRowHeight()`](@/api/core.md#getrowheight) still take a visual row index.

### Who is affected

- You set `rowHeights` or `minRowHeights` to an array or a function, and you collapse rows with [`NestedRows`](@/api/nestedRows.md), filter with [`Filters`](@/api/filters.md), trim with [`TrimRows`](@/api/trimRows.md), sort with [`ColumnSorting`](@/api/columnSorting.md) or [`MultiColumnSorting`](@/api/multiColumnSorting.md), move rows with [`ManualRowMove`](@/api/manualRowMove.md), or load a saved row order. The heights now follow the rows.
- Your `rowHeights` or `minRowHeights` function reads the index as a position on the screen, for example to give the first visible row a taller height, or it looks the row up through a visual-index API such as `hot.getDataAtRow(index)`. It now receives a physical index, so it sizes another row, with no error. Use [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) to read a row by its physical index.
- You set `rowHeights` or `minRowHeights` to an array and insert or remove rows. A row inserted between others has no height of its own, so it takes the default height instead of the height listed for its position, and the heights after it move with their rows. Undo and redo put a removed row's height back.
- You keep a `rowHeights` or `minRowHeights` array in step with [`alter()`](@/api/core.md#alter) yourself, for example with `rowHeights.splice(1, 0, 40)` after inserting a row, and pass the same array to `updateSettings()`. Handsontable already moves each height with its row, so the heights now move twice. Remove that code, or pass a new array to declare the heights again.
- You work around the old behavior with a hook that rebuilds the `rowHeights` array, such as [`afterColumnSort`](@/api/hooks.md#aftercolumnsort), [`afterFilter`](@/api/hooks.md#afterfilter), [`afterRowMove`](@/api/hooks.md#afterrowmove), or [`afterRowCollapse`](@/api/hooks.md#afterrowcollapse). After the migration, that code applies the order twice, so remove it.

If your rows are never moved, sorted, filtered, trimmed, or collapsed, and you never insert or remove rows, nothing changes: the visual and physical indexes are the same.

### How to migrate

To keep the 18.1 behavior, where a height belongs to a screen position, translate the physical index to the visual one in a function:

```js
const heightsByPosition = [100, 50, 50, 70];
// the physical index of the row at each visual position, for example a saved row order
const initialOrder = [0, 1, 2, 3];
let hot;

hot = new Handsontable(container, {
  manualRowMove: initialOrder,
  rowHeights(physicalRowIndex) {
    // while the constructor runs, `hot` isn't assigned yet and the rows are in their initial order
    const visualRowIndex = hot ?
      hot.toVisualRow(physicalRowIndex) : initialOrder.indexOf(physicalRowIndex);

    return heightsByPosition[visualRowIndex];
  },
});
```

In the React, Angular, and Vue wrappers, get the instance from the component instead of a variable: `hotRef.current?.hotInstance` in React, the `hotInstance` property of the `HotTableComponent` in Angular, and `hotTable.value?.hotInstance` in Vue. The callback gets no `this`.

To adopt the new behavior, list the heights in the order of the rows in your `data`, not the order you expect on the screen.

## 59. Turning `loading` off turns the `Dialog` plugin off

The [`Loading`](@/api/loading.md) plugin shows its overlay through the [`Dialog`](@/api/dialog.md)
plugin, so enabling [`loading`](@/api/options.md#loading) turns the `Dialog` plugin on. In 18.1, it
did that by setting the [`dialog`](@/api/options.md#dialog) option to `true`. The `Dialog` plugin then
stayed enabled after you turned `loading` off, and a later `dialog: false` did not turn it off.

In 19.0, `loading` turns the `Dialog` plugin on without changing the `dialog` option. The `Dialog`
plugin is enabled while `dialog` is set or `loading` is on, and disabled when neither holds:

| Settings | `Dialog` plugin in 18.1 | `Dialog` plugin in 19.0 |
| --- | --- | --- |
| `loading: true` | Enabled, `getSettings().dialog` is `true` | Enabled, `getSettings().dialog` is `false` |
| `loading: true`, then `loading: false` | Enabled | Disabled |
| `loading: true`, then `loading: false`, then `dialog: false` | Enabled | Disabled |
| `dialog: true` and `loading: true`, then `loading: false` | Enabled | Enabled |

### Who is affected

You set `loading` without `dialog`, turn `loading` off, and then use the `Dialog` plugin yourself:

- You call [`show()`](@/api/dialog.md#show), [`showAlert()`](@/api/dialog.md#showalert), or
  [`showConfirm()`](@/api/dialog.md#showconfirm). With the `Dialog` plugin disabled, the call shows
  nothing.
- You call [`downloadFileAsync()`](@/api/exportFile.md#downloadfileasync) and expect its progress
  dialog. The file still downloads, without the dialog.
- You read `getSettings().dialog` to check whether the `Dialog` plugin is enabled.

### How to migrate

Set `dialog: true` next to `loading`:

```js
const hot = new Handsontable(container, {
  // ... other options
  loading: true,
  dialog: true,
});

hot.updateSettings({ loading: false });

// the Dialog plugin is still enabled
hot.getPlugin('dialog').showConfirm('Delete this row?');
```

To check whether the `Dialog` plugin is enabled, read `hot.getPlugin('dialog').enabled`.

## 60. A row dragged into a gap with hidden rows lands after them

When some rows are hidden with the [`HiddenRows`](@/api/hiddenRows.md) plugin or with another hiding index map, such as the one [`Pagination`](@/api/pagination.md) uses, the gap between two visible rows has two places to drop a row: the lower half of the row above the hidden rows, and the upper half of the row below them. Both look the same on the screen.

In 18.1, the two drops put the moved row on different sides of the hidden rows. The lower half put it in front of the hidden rows. The upper half put it after them. The visible order was the same, but the order of all rows, which you see when you show the hidden rows again, depended on where the pointer was.

In 19.0, both drops put the moved row after the hidden rows, right before the next visible row. This is where a row already lands next to trimmed rows, and where a column already lands next to hidden columns.

For example, take six rows with the rows 2 and 3 hidden. You drag row 0 into the gap between row 1 and row 4:

```js
// Drop on the lower half of row 1
// 18.1: hot.rowIndexMapper.getIndexesSequence() returns [1, 0, 2, 3, 4, 5]
// 19.0: hot.rowIndexMapper.getIndexesSequence() returns [1, 2, 3, 0, 4, 5]

// Drop on the upper half of row 4
// 18.1 and 19.0: hot.rowIndexMapper.getIndexesSequence() returns [1, 2, 3, 0, 4, 5]
```

The [`beforeRowMove`](@/api/hooks.md#beforerowmove) and [`afterRowMove`](@/api/hooks.md#afterrowmove) hooks report the drop that Handsontable resolved. A lower-half drop above hidden rows now reports the visual index of the next visible row as `dropIndex` (`4` in the example, not `2`), and the matching `finalIndex` (`3`, not `1`).

A drag that ends right before the moved row itself changes too. Drag row 4 up to the lower half of row 1: in 18.1, `getIndexesSequence()` returned `[0, 1, 4, 2, 3, 5]` and `afterRowMove` reported `orderChanged: true`. In 19.0, `dropIndex` is `4`, `orderChanged` is `false`, and nothing moves. Check `orderChanged` in your `afterRowMove` listener with this in mind.

The exceptions: a row dropped on its own lower half stays where it is, so a row right above the hidden rows does not jump over them with that drop. The upper half of the row below the hidden rows still moves it after them, as it did in 18.1. The drop index also stays as it was when landing after the hidden rows would cross the edge of the fixed rows at the top or at the bottom, when it would split a merged cell, and when the [`NestedRows`](@/api/nestedRows.md) plugin is enabled.

The [`moveRows()`](@/api/manualRowMove.md#moverows), [`moveRow()`](@/api/manualRowMove.md#moverow), [`dragRows()`](@/api/manualRowMove.md#dragrows), and [`dragRow()`](@/api/manualRowMove.md#dragrow) methods are not affected. They use the index you pass, so `dragRow(0, 2)` still puts the row in front of the hidden rows, and `dragRow(0, 3)` puts it between the two hidden rows of the example.

### Who is affected

- You use [`manualRowMove`](@/api/options.md#manualrowmove) together with [`hiddenRows`](@/api/options.md#hiddenrows), and users drag rows next to hidden ones. After they show the hidden rows, a moved row can sit on the other side of them than in 18.1.
- You save or compare the order of the rows, for example the result of `getIndexesSequence()`, after a user drag in a grid with hidden rows.
- Your `beforeRowMove` or `afterRowMove` hook reads `dropIndex` or `finalIndex` and expects the index of a hidden row.

If you don't hide rows, or you hide them and move rows with the API only, nothing changes.

### How to migrate

You don't need to change anything to keep the same visible order.

To put a row in front of the hidden rows, as 18.1 did for a lower-half drop, call [`dragRows()`](@/api/manualRowMove.md#dragrows) with the visual index of the first hidden row.
