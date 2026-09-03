---
type: how-to
title: Migrating from 18.2 to 19.0
metaTitle: Migrating from 18.2 to 19.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.2 to Handsontable 19.0.
permalink: /migration-from-18.2-to-19.0
canonicalUrl: /migration-from-18.2-to-19.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.2 to 19.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.2 to 19.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.2 to 19.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrating from 18.2 to 19.0

[[toc]]

Migrate from Handsontable 18.2 to Handsontable 19.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

## 1. `colToProp()` and `propToCol()` return `null` for an unknown column

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

::: only-for javascript

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

:::

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
