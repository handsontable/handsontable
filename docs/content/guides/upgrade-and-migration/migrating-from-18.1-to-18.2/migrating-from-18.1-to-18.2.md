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

Section 1 concerns the [`Formulas`](@/api/formulas.md) plugin, and applies only if you use it. Section 2 concerns the [`beforeInit`](@/api/hooks.md#beforeinit) hook, and applies only if you pass one in your settings. Section 3 concerns what a cell editor writes when you confirm it without typing, and affects every grid. Sections 4 and 5 concern the [`sanitizer`](@/api/options.md#sanitizer) option, and do not affect you if you do not set one. Section 6 applies whether you set a sanitizer or not. Section 7 concerns custom context menu and column menu items, and applies only if you build one. Section 8 concerns what <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click does inside a selection, and affects every grid that keeps the default [`selectionMode`](@/api/options.md#selectionmode). Section 9 concerns two deprecated [`Formulas`](@/api/formulas.md) methods, and applies only if you call either of them. Section 10 concerns how many rows are removed with a parent row, and applies only if you use the [`NestedRows`](@/api/nestedRows.md) plugin. Section 11 concerns what a cell stores when you write a plain value into a column whose [`source`](@/api/options.md#source) is an array of `{ key, value }` objects, and applies only if you declare one that way.

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
of that name, holding a boolean or a function returning one, now does two things it did not do
before:

- it draws a check mark before its label whenever the value resolves to `true`
- it is announced to assistive technology as a checkbox with a state, rather than as a plain menu
  item

A property named `checked` holding anything else, such as a string or a number, is ignored.

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
no-op methods since 18.2.0, and each prints a one-time console warning when called. They will be
removed in 19.0.0.

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
| From 18.2 | 4 | none |

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
- You undo a removal. Undo does not restore a nested parent's subtree: it puts back one row and
  leaves the rest on screen with no data behind them. This is not new in 18.2 -- the state you end up
  with after the undo is the same as in 18.1 -- but the removal itself is clean now, so the undo is
  where you first see it.

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
