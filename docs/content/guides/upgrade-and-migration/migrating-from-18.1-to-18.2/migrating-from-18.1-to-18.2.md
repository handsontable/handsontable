---
type: how-to
title: Migrating from 18.1 to 18.2
metaTitle: Migrating from 18.1 to 18.2 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.1 to Handsontable 18.2.
permalink: /migration-from-18.1-to-18.2
canonicalUrl: /migration-from-18.1-to-18.2
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.1 to 18.2 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.1 to 18.2 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.1 to 18.2 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.1 to Handsontable 18.2.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

Sections 1 and 2 concern the [`sanitizer`](@/api/options.md#sanitizer) option. If you do not set one, neither affects you. Section 3 concerns the [`Formulas`](@/api/formulas.md) plugin, and applies only if you use it. Section 4 concerns the [`beforeInit`](@/api/hooks.md#beforeinit) hook, and applies only if you pass one in your settings. Section 5 concerns what a cell editor writes when you confirm it without typing, and affects every grid.

## 1. Two `source` values your sanitizer receives have changed

### Nested header measurement: `'innerHTML'` becomes `'header'`

The offscreen pass that measures nested header widths called your sanitizer with `'innerHTML'`, while the rendered header called it with `'header'`. One label reached your sanitizer under two different names, so a context-aware sanitizer applied two different rule sets to it, and the measured width could not match what the user saw. Both now use `'header'`.

`'innerHTML'` is no longer passed by any part of the grid.

### Dialog content: `undefined` becomes `'dialog'`

[Dialog](@/api/dialog.md) content was passed to your sanitizer with **no second argument at all**, so `source` arrived as `undefined`. It is now `'dialog'`.

If your sanitizer routes on `source` with a `switch` or an `if/else` chain, dialog content moves out of whatever branch handled `undefined`, usually the default one, and into a `'dialog'` branch you may not have written. Add one if dialog content needs different treatment from your default.

### Who is affected

You are affected only if your sanitizer tests its second argument. A sanitizer that ignores it needs no change, and one that already routes unknown sources to a catch-all branch keeps working for dialogs.

### How to migrate

Delete the `'innerHTML'` branch. The `'header'` branch you already have now covers both passes.

**Before:**

```js
sanitizer: (content, source) => {
  if (source === 'header' || source === 'innerHTML') {
    return strict(content);
  }

  return loose(content);
},
```

**After:**

```js
sanitizer: (content, source) => {
  if (source === 'header') {
    return strict(content);
  }

  return loose(content);
},
```

## 2. Two surfaces that were skipping your sanitizer are fixed

These were bugs, not a change of contract. The `sanitizer` option is documented to cover the HTML that Handsontable writes on your behalf, and these two surfaces were writing HTML without consulting it. A grid that configured a sanitizer was not covered where it had every reason to expect it was. This release closes both.

Nothing here needs action to stay correct, and no code of yours stops working. The section exists because a sanitizer that does more than strip markup now sees content it never saw before, and in one case that has a consequence worth knowing about.

### `password` cells, under `'password'`

Cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type were written to the DOM without the sanitizer being consulted. They now go through it.

The rendered value is normally a run of `hashSymbol` characters with no markup in it, so most sanitizers will return it unchanged. Check this only if your sanitizer rewrites plain text, or if you produce the displayed value yourself with a custom `valueFormatter` or a `hashSymbol` that contains markup.

### Handsontable's own clipboard payload, under `'CopyPaste.paste.sourceData'`

When you copy between two Handsontable instances, the grid writes a second clipboard entry alongside `text/html`. It carries the source data behind the cells, which is what lets an object-valued cell arrive as an object rather than as its displayed text. That entry was parsed without passing through your sanitizer. Since any page can write the same clipboard type from its own copy handler, a crafted clipboard reached the parser unchecked even on a grid that had configured a sanitizer. It is now sanitized, which is the security fix in this release.

You are affected if you set a `sanitizer` **and** either set [`parsePastedValue`](@/api/options.md#parsepastedvalue) yourself, or use an `autocomplete`, `dropdown`, or `multiSelect` column. Those three cell types turn `parsePastedValue` on for you, so you can be affected without ever having written the option.

A sanitizer that strips unsafe markup, such as DOMPurify, leaves the payload's table intact and nothing changes. A sanitizer that escapes HTML instead turns that table into text, and the pasted cell then receives the displayed value rather than the original object.

If you escape rather than strip, and you want object-valued paste to keep working, pass that one source through:

```js
sanitizer: (content, source) => {
  if (source === 'CopyPaste.paste.sourceData') {
    return content;
  }

  return escapeHtml(content);
},
```

This is safe. The payload is parsed into an inert document that cannot load resources or run scripts, so passing it through does not expose you to injection from a crafted clipboard. It has its own source precisely so you can make this choice without weakening how you treat real pasted HTML.

Leaving it sanitized is also fine if none of your columns parse pasted values, and it means your sanitizer sees every clipboard payload, which matters if it does more than filter markup.

## 3. `date` cells reach the formula engine the same way on every data path

Unlike the two sections above, this one can change what your formulas return. The [`Formulas`](@/api/formulas.md) plugin has always protected a [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell's value from the calculation engine's own parsing when you type into the cell. It did not do the same when the value arrived through [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata), [`updateSettings()`](@/api/core.md#updatesettings), or [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell). The same cell held two different values in the engine depending on how it was filled.

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

## 4. A `beforeInit` callback in your settings now runs

Like section 2, this was a bug rather than a change of contract, but this one can stop the grid from
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

## 5. Confirming an editor without typing writes nothing

This one applies to every grid, whatever your configuration.

Opening a cell editor and pressing <kbd>**Enter**</kbd> without typing used to write the editor's value back over the cell. The editor holds a string, because that is what an input can display, so the cell received that string rather than the value it already held. A cell holding `null` was left holding `''`. So was one holding `undefined`. A `true` became `'true'`, and a number in a [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) column became a string.

The write also fired [`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange) each time, so opening a cell and closing it again reported an edit that never happened.

Such a confirm now writes nothing at all, and neither hook fires.

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
