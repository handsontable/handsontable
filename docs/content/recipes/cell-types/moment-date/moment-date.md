---
type: tutorial
title: Moment.js-based date
metaTitle: Moment.js Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom date cell type using the Moment.js library
permalink: /recipes/cell-types/moment-date
canonicalUrl: /recipes/cell-types/moment-date
tags:
  - guides
  - tutorial
  - recipes
  - moment.js
  - date
react:
  metaTitle: Moment.js date Cell Type - React Data Grid | Handsontable
angular:
  metaTitle: Moment.js date Cell Type - Angular Data Grid | Handsontable
vue:
  metaTitle: Moment.js date Cell Type - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
menuTag: updated
---

This tutorial shows you how to layer Moment.js on top of Handsontable's built-in `date` cell type, so a column keeps its own display format and still accepts loosely written dates.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --deps moment

@[code](@/content/recipes/cell-types/moment-date/javascript/example1.js)
@[code](@/content/recipes/cell-types/moment-date/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2 --deps moment

@[code](@/content/recipes/cell-types/moment-date/react/example1.jsx)
@[code](@/content/recipes/cell-types/moment-date/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps moment

@[code](@/content/recipes/cell-types/moment-date/angular/example1.ts)
@[code](@/content/recipes/cell-types/moment-date/angular/example1.html)

:::

:::

## Overview

This guide shows how to build a custom date cell type on top of the built-in `date` cell type using the [Moment.js](https://momentjs.com/) library. The built-in type supplies the editor -- a native date input -- along with ISO validation. Moment.js adds two things it does not do: a per-column display format, and correction of dates written in another format.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `moment`

## What You'll Build

A cell that:
- Stores dates in the ISO 8601 format (`YYYY-MM-DD`), as the built-in `date` cell type requires
- Displays them in a per-column Moment.js format, such as `MMM D, YYYY`
- Opens the browser's native date picker when edited
- Rewrites pasted dates such as `03/14/2025` into ISO
- Rejects values that are not dates at all

## Prerequisites

```bash
npm install moment
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';
import moment from 'moment';

registerAllModules();
```

**Why this matters:**
- `DateCellType` is the built-in `date` cell type: a native date input, an ISO validator, and a source-data check
- `moment` handles date parsing and formatting
- `registerCellType` registers the composed cell type for use in column config

## Step 2: Create the ISO Conversion Helper

The built-in cell type stores every value as an ISO date string. This helper turns a loosely written date into that format:

```typescript
const ISO_FORMAT = 'YYYY-MM-DD';

const toISODate = (value: string, inputFormat: string): string => {
  const fromInputFormat = moment(value, inputFormat, true);

  if (fromInputFormat.isValid()) {
    return fromInputFormat.format(ISO_FORMAT);
  }

  const nativeDate = new Date(value);

  return Number.isNaN(nativeDate.getTime()) ? value : moment(nativeDate).format(ISO_FORMAT);
};
```

**What's happening:**
- Parses strictly against the column's `inputFormat` first, so a near-miss does not silently shift the date
- Falls back to the browser's own parsing for values that format cannot describe, such as `March 14, 2025`
- Returns the value untouched when neither reading produces a date, so the validator can reject it

Hand the fallback a `Date` rather than the raw string. `moment('03/14/2025')` logs a deprecation warning for any input that is not RFC2822 or ISO; `moment(new Date('03/14/2025'))` does not.

## Step 3: Format the Display Value

`valueFormatter` converts the stored ISO value into the format the column displays:

```typescript
valueFormatter: (value, cellProperties) => {
  if (typeof value !== 'string' || value === '') {
    return value;
  }

  const date = moment(value, ISO_FORMAT, true);

  return date.isValid() ? date.format(cellProperties.renderFormat ?? ISO_FORMAT) : value;
},
```

**Why `valueFormatter` and not a renderer?**

Handsontable applies `valueFormatter` **before** the renderer and hands the renderer the formatted result. A custom renderer that ran `moment()` on its `value` would receive the already-formatted string and parse the wrong thing. Formatting here lets the cell type keep the inherited renderer untouched.

The editor is unaffected: it reads the raw source data, so the native date input always receives an ISO value no matter how the cell displays it.

## Step 4: Correct Loosely Written Values in `beforeChange`

The native date input can only produce ISO values, so anything typed in the editor is already correct. Pasted values and programmatic writes never reach the editor, and that is where a `MM/DD/YYYY` string arrives. Correct it in `beforeChange`:

```typescript
function correctDatesBeforeChange(changes) {
  changes.forEach((change) => {
    if (!change) {
      return;
    }

    const [visualRow, prop, , newValue] = change;
    const cellMeta = this.getCellMetaTransient(visualRow, this.propToCol(prop));

    if (
      cellMeta.type !== 'moment-date' ||
      cellMeta.correctFormat !== true ||
      typeof newValue !== 'string' ||
      newValue === ''
    ) {
      return;
    }

    if (!moment(newValue, ISO_FORMAT, true).isValid()) {
      change[3] = toISODate(newValue, cellMeta.inputFormat ?? ISO_FORMAT);
    }
  });
}
```

Pass it as the grid's `beforeChange` handler.

**Why `beforeChange` and not the validator?**

`beforeChange` runs before both the editor and the validator, so the corrected ISO value is the only value the rest of the grid ever sees. Correcting later -- inside a validator, with `setDataAtCell` -- also works, but the built-in editor receives the raw value first and logs `DateEditor: value must be in ISO date format`. Rewriting the change up front avoids that entirely, and it leaves the inherited ISO validator untouched, so a value Moment.js cannot read is still flagged.

`getCellMetaTransient` reads the resolved cell configuration without permanently materializing meta for the cell, which is what you want for a per-change read inside a hook.

::: tip
The correction lives on the grid rather than inside the cell type, because a cell type cannot register hooks. Wire `beforeChange` on every grid that needs lenient input; the `moment-date` type itself stays reusable as-is.
:::

## Step 5: Compose and Register the Cell Type

Spread the built-in cell type, then override the two pieces Moment.js owns:

```typescript
const cellDateTypeDefinition = {
  ...DateCellType,
  valueFormatter: /* from Step 3 */,
};

registerCellType('moment-date', cellDateTypeDefinition);

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'itemName', type: 'text', width: 130 },
    { data: 'category', type: 'text', width: 120 },
    { data: 'leadEngineer', type: 'text', width: 150 },
    {
      data: 'restockDate',
      type: 'moment-date',
      width: 150,
      renderFormat: 'MMM D, YYYY',
      inputFormat: 'MM/DD/YYYY',
      correctFormat: true,
    },
    {
      data: 'cost',
      type: 'numeric',
      width: 120,
      className: 'htRight',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
  beforeChange: correctDatesBeforeChange,
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `type: 'moment-date'` - uses the composed cell type on the Restock Date column
- `renderFormat: 'MMM D, YYYY'` - the Moment.js format the cell displays
- `inputFormat: 'MM/DD/YYYY'` - the format tried first when correcting a pasted value
- `correctFormat: true` - opts the column into that correction

Spreading `DateCellType` copies its `CELL_TYPE` value, `'date'`, into the object. Handsontable ignores that key when expanding a cell type, so registering the result under a different name is safe.

::: tip
Two options the built-in `date` cell type does **not** support: `datePickerConfig`, which is specific to the Pikaday picker Handsontable used before 18.0 and now triggers a console warning, and `dateFormat` as a Moment.js format string, which the built-in renderer expects to be an `Intl.DateTimeFormatOptions` object. That is why this recipe uses its own `renderFormat` and `inputFormat` properties.

For a picker with configurable first day of week, week numbers, or disabled days, see the [Pikaday](@/recipes/cell-types/pikaday/pikaday.md) and [Flatpickr](@/recipes/cell-types/flatpickr/flatpickr.md) recipes.
:::

## How It Works - Complete Flow

1. **Initial Render**: the cell holds an ISO date; `valueFormatter` converts it to `renderFormat` for display
2. **User clicks cell**: the built-in editor opens the browser's native date picker, populated from the raw ISO source value
3. **Date selection**: the native input always yields an ISO value, so it is stored as-is
4. **Paste**: `beforeChange` rewrites a pasted non-ISO value to ISO when `correctFormat` is set
5. **Save**: values that are not dates fail the built-in ISO validator and are flagged

## What you learned

You built a custom cell type by composing the built-in `date` cell type with Moment.js. You used `valueFormatter` for per-column display formatting, corrected loosely written values in `beforeChange` so the ISO-only editor never sees them, and registered the result with `registerCellType`.

## Next steps

- [Pikaday](@/recipes/cell-types/pikaday/pikaday.md) - A standalone Pikaday date picker recipe that also serves as a migration path from the built-in date cell type.
- [Moment.js time](@/recipes/cell-types/moment-time/moment-time.md) - The same Moment.js pattern applied to time values.
- [Flatpickr](@/recipes/cell-types/flatpickr/flatpickr.md) - An alternative date picker using the Flatpickr library with dark theme support.
