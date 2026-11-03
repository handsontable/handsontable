---
title: Auto-detect cell type
metaTitle: Auto-detect cell type | Handsontable DataGrid for JavaScript
description: Assign a text, numeric, or date cell type from the value a user enters, with opt-out controls, using the afterChange hook and cell meta.
permalink: /recipes/cell-types/auto-detect-cell-type
canonicalUrl: /recipes/cell-types/auto-detect-cell-type
tags:
  - recipes
  - cell-types
  - afterChange
  - cell-meta
react:
  metaTitle: Auto-detect cell type | Handsontable DataGrid for React
angular:
  metaTitle: Auto-detect cell type | Handsontable DataGrid for Angular
vue:
  metaTitle: Auto-detect cell type | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Cell Types
type: tutorial
menuTag: new
---

In this tutorial, you will build a grid that picks a cell's type from the value a user enters. Type `42` into a text cell and it becomes numeric. Type `2026-12-31` and it becomes a date. Clear the cell, or type text, and it goes back to text.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --html 3

@[code](@/content/recipes/cell-types/auto-detect-cell-type/javascript/example1.js)
@[code](@/content/recipes/cell-types/auto-detect-cell-type/javascript/example1.ts)
@[code](@/content/recipes/cell-types/auto-detect-cell-type/javascript/example1.html)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/cell-types/auto-detect-cell-type/react/example1.jsx)
@[code](@/content/recipes/cell-types/auto-detect-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cell-types/auto-detect-cell-type/angular/example1.ts)
@[code](@/content/recipes/cell-types/auto-detect-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/recipes/cell-types/auto-detect-cell-type/vue/example1.vue)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~20 minutes

Handsontable DataGrid assigns a [cell type](@/guides/cell-types/cell-type/cell-type.md) per column, cell, or grid. That works when you know the data ahead of time. It does not work for a blank sheet, a pasted import, or any grid where the user decides what a column holds.

The recipe uses only public API. An [`afterChange`](@/api/hooks.md#afterchange) hook reads the new value, a small function classifies it, and [`setCellMeta()`](@/api/core.md#setcellmeta) switches the cell's type. Nothing detects types unless you add the hook, so the behavior is opt-in.

[[toc]]

## What you'll build

A parts grid where every column starts as text, with two buttons:

- **Detect types** classifies every cell once. Use it for data that loads without types.
- **Reset to text** puts every cell back to text.

After that, each edit, paste, undo, and redo re-detects the type of the cells it touched. The **Part no.** column opts out, so `0042` keeps its leading zeros.

## Before you begin

Read the [cell type](@/guides/cell-types/cell-type/cell-type.md) guide, and the [date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md) and [numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) guides for the formats those types accept.

## Step 1 -- Classify a value

`detectCellType()` returns `text`, `numeric`, or `date`. It checks the numeric pattern first, then the date pattern, and falls back to `text`.

```ts
type DetectedType = 'text' | 'numeric' | 'date';

// Digits with at most one dot, an optional sign, and an optional exponent. No spaces.
const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function detectCellType(value: unknown, skipTypes: DetectedType[]): DetectedType {
  if (typeof value === 'number' && Number.isFinite(value) && !skipTypes.includes('numeric')) {
    return 'numeric';
  }

  if (typeof value === 'string') {
    if (!skipTypes.includes('numeric') && NUMERIC_PATTERN.test(value)) {
      return 'numeric';
    }

    if (!skipTypes.includes('date') && isDate(value)) {
      return 'date';
    }
  }

  return 'text';
}
```

The patterns follow these rules:

| Type | Matches | Stays text |
| --- | --- | --- |
| `numeric` | `0`, `42`, `-45.25`, `.75`, `3.5e2` | `1,000`, `1.2.3`, `n/a`, `50%`, `' 67'`, `'67 '` |
| `date` | `2026-12-31` (ISO 8601, `YYYY-MM-DD`) | `31/12/2026`, `2026-02-31` |
| `text` | Everything else, including an empty cell | |

A value with a leading or trailing space stays text, even though the numeric validator accepts it. The `date` cell type stores ISO 8601 strings and formats them for display with `Intl.DateTimeFormat`, so the detector accepts the same shape. `isDate()` also rejects dates that do not exist, such as `2026-02-31`.

To change what counts as a number or a date, edit the two patterns. To stop a type from ever being assigned, put it in `skipTypes`.

## Step 2 -- Switch a cell's type

Setting `type` through `setCellMeta()` copies the type's renderer, editor, and other type-specific settings into that cell's meta. A new type does not remove the settings that only the previous type defined. A date cell that turns into text would keep its date validator and its date formatter, and show `#bad-value#` for any text. After the recipe sets a type, it removes the leftovers with [`removeCellMeta()`](@/api/core.md#removecellmeta). Because `removeCellMeta()` drops only the settings that the cell owns, this works when the recipe set the type. It does not work when a column or the grid sets the type, because the column's validator and formatter still reach the cell through the cascade. Use the recipe on untyped columns, and set `autoDetect: false` on a column that has its own `type`, `validator`, or `valueFormatter`.

```ts
const LEFTOVER_KEYS: Record<DetectedType, string[]> = {
  text: ['validator', 'valueFormatter', 'valueSetter', 'dataType', 'sourceDataValidator', 'sourceDataWarningMessage'],
  numeric: ['sourceDataValidator', 'sourceDataWarningMessage'],
  date: ['valueSetter', 'dataType'],
};

const typeSettings: Record<DetectedType, Partial<CellProperties>> = {
  text: { type: 'text' },
  numeric: { type: 'numeric' },
  date: { type: 'date' },
};
```

`detectCell()` then does four things for one cell:

1. Skips the cell when `autoDetect` is `false`, or when the cell has a type other than text, numeric, or date.
2. Classifies the value.
3. Asks `beforeTypeChange()` for permission when the type would change.
4. Applies the new type's settings.

The numeric renderer also writes `htRight` and `htNumeric` into the cell's own `className` meta, and a failed numeric validation marks the cell invalid. Neither goes away when the cell stops being numeric, so `clearNumericResidue()` removes the cell's own `className`, which brings back the class names of the column and the grid, and clears the invalid mark of a cell that just left the numeric type. A class name that you set on the cell itself, such as `htRight`, is removed with it. Set class names on the column, or from a `cells` function.

## Step 3 -- Run it from the `afterChange` hook

The hook runs after each change. It handles five sources and ignores the rest:

```ts
// Edits, pastes, cuts, undo, and redo trigger detection, so a cell's type follows its value.
// Autofill and `loadData()` do not.
const DETECT_SOURCES = ['edit', 'CopyPaste.paste', 'CopyPaste.cut', 'UndoRedo.undo', 'UndoRedo.redo'];
```

`detectChanged()` loops over the changed cells, calls `detectCell()` for each, and renders once at the end.

::: only-for javascript

```ts
const hot = new Handsontable(container, {
  // ...
  afterChange(this: Handsontable, changes, source) {
    detectChanged(this, changes, source);
  },
});
```

:::

::: only-for react

```tsx
const handleAfterChange = useCallback((changes, source) => {
  const hot = hotRef.current?.hotInstance;

  if (hot) {
    detectChanged(hot, changes, source);
  }
}, []);

<HotTable ref={hotRef} afterChange={handleAfterChange} />;
```

:::

::: only-for angular

```ts
readonly gridSettings: GridSettings = {
  // ...
  afterChange(this: Handsontable, changes, source) {
    detectChanged(this, changes, source);
  },
};
```

:::

::: only-for vue

```ts
const hotSettings: GridSettings = {
  // ...
  afterChange(this: Handsontable, changes, source) {
    detectChanged(this, changes, source);
  },
};
```

:::

Undo and redo need a note. UndoRedo puts back a cell's `type`, but not the renderer, editor, and validator that came with it. When `source` starts with `UndoRedo`, `detectCell()` applies the restored type's settings again, so the cell renders and validates as the type says. This covers the cells an edit, paste, or cut changed. **Detect types** and **Reset to text** change only cell meta, so no `afterChange` fires when you undo them. The cells get their old `type` back but keep the renderer, validator, and class names of the type they had. A re-sync from `afterUndo` is no fix, because the meta writes it makes clear the redo stack.

## Step 4 -- Detect on demand

`detectAll()` runs `detectCell()` over every cell inside [`batch()`](@/api/core.md#batch). The **Detect types** button calls it. Call it yourself after you load untyped data. `batch()` does not render on its own, and `setCellMeta()` never renders, so the callback ends with one [`render()`](@/api/core.md#render). `detectCell()` reads cell meta with `getCellMetaTransient()`, so a cell that does not change stores no meta.

```ts
function detectAll(hot: Handsontable): void {
  // `batch()` does not render on its own, so render inside the callback.
  hot.batch(() => {
    for (let row = 0; row < hot.countRows(); row++) {
      for (let col = 0; col < hot.countCols(); col++) {
        detectCell(hot, row, col);
      }
    }

    hot.render();
  });
}
```

## Step 5 -- Block or limit detection

Three controls decide what detection may change:

- **`autoDetect: false`** opts a cell, a column, or the whole grid out. It is a custom cell meta option, so it follows the cascade from the cell to the column to the grid. The **Part no.** column uses it.
- **`skipTypes`** lists types that detection never assigns. With `skipTypes: ['date']`, `2026-12-31` stays text.
- **`beforeTypeChange(row, col, from, to, value)`** returns `false` to keep the cell's current type. The demo keeps a numeric cell numeric when someone types text into it, so the numeric validator marks the entry invalid. Clearing the cell still resets it to text.

```ts
const autoDetectConfig = {
  skipTypes: [] as DetectedType[],
  beforeTypeChange(_row: number, _col: number, from: string, to: DetectedType, value: unknown): boolean {
    return !(from === 'numeric' && to === 'text' && value !== '' && value !== null);
  },
};
```

## How it works -- complete flow

1. **A user edits a cell.** The previous type's validator checks the value first, as it always does.
2. **`afterChange` fires** with the source `edit`. Autofill and `loadData()` fire it with other sources, which the recipe ignores.
3. **`detectCell()` classifies the new value** and asks `beforeTypeChange()` when the type would change.
4. **`setCellMeta()` applies the new type**, and one `render()` repaints the changed cells.
5. **An undo or redo** puts the old type back and fires `afterChange` with an `UndoRedo` source, which applies the restored type's settings again.

## Things to know

- **Switching the type replaces the cell's renderer, editor, and validator.** A column with its own custom renderer, editor, or validator loses it on every cell that changes type, and on a cell an undo or redo touches. Set `autoDetect: false` on such columns.
- **Other types stay as they are.** A cell with the `dropdown`, `checkbox`, or any other type is never retyped.
- **A `cells` function wins.** If a [`cells`](@/api/options.md#cells) function returns `type`, `validator`, or `renderer`, it overrides the meta that the recipe sets on every read. Return those only for cells that detection should not handle, and set `autoDetect: false` for them.
- **A date cell edits through the date picker.** You cannot type text into it. Press <kbd>Delete</kbd> to clear the cell, and it returns to text.
- **Autofill does not retype.** A value that autofill copies into a cell keeps the cell's current type.
- **Detection does not convert stored values.** A cell that holds the string `'42'` becomes numeric and keeps the string. A later edit stores a number.
- **Percent signs stay text.** `50%` does not match the numeric pattern.
- **Detection runs after validation.** The cell's current validator checks a new value first, so a type switch happens after the edit is already in the grid.
- **Password cells.** Set `autoDetect: false` on a password column. Otherwise the hook replaces the type of a cell that holds a numeric-looking password.
- **Detect types and Reset to text skip hidden rows.** The loops walk visual rows, so rows that Filters or TrimRows hide keep their type. Run **Detect types** again after you clear the filter.
- **Undo does not fully revert Detect types.** See the note after the hook snippets. Reload the data, or run **Reset to text**, to start over.
- **Sorting follows the first row.** ColumnSorting picks its comparator from the cell meta of row 0, so a column with mixed detected types sorts by the type of that cell. A **Quantity** column with `12` on top sorts as numbers. With a text cell on top, it sorts `12`, `3.5e2`, and `8` as strings.
- **Class names.** The recipe removes the cell's own `className` when a cell stops being numeric. Set class names on the column, or from a `cells` function.

## What you learned

- How to read changed values in `afterChange` and switch a cell's type with `setCellMeta()`.
- Why a type switch leaves a renderer's class names and an old validator behind, and how to clean them up.
- Why undo and redo need the type's settings applied again.
- How to block detection per cell, column, and type, and with a callback.

## Next steps

- Read the [cell type](@/guides/cell-types/cell-type/cell-type.md) guide to see what a type sets.
- Read the [undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md) guide for how UndoRedo records changes.
- Build your own type with the [custom cells](@/guides/cell-functions/custom-cells/custom-cells.md) guide, and let detection assign it.
