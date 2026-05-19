---
type: how-to
id: 1f21530e
title: Moment.js-based time
metaTitle: Moment.js Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom time cell type using the Moment.js library
permalink: /recipes/cell-types/moment-time
canonicalUrl: /recipes/cell-types/moment-time
tags:
  - guides
  - tutorial
  - recipes
  - moment.js
  - time
react:
  id: 1d23a45b
  metaTitle: Moment.js time Cell Type - React Data Grid | Handsontable
angular:
  id: 3c87f9e1
  metaTitle: Moment.js time Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to create a custom time cell type using Moment.js for validation and format auto-correction.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/moment-time/javascript/example1.js)
@[code](@/content/recipes/cell-types/moment-time/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2 --deps moment

@[code](@/content/recipes/cell-types/moment-time/react/example1.jsx)
@[code](@/content/recipes/cell-types/moment-time/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps moment

@[code](@/content/recipes/cell-types/moment-time/angular/example1.ts)
@[code](@/content/recipes/cell-types/moment-time/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom time cell type using the [Moment.js](https://momentjs.com/) library. Users can format times using the Moment.js API.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `moment`

## What You'll Build

A cell that:
- Displays time values as formatted text
- Accepts `timeFormat` options for customization (e.g., `HH:mm`, `h:mm:ss a`)
- Validates time input using Moment.js
- Auto-corrects time format when `correctFormat` is enabled

## Prerequisites

```bash
npm install moment
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';

registerAllModules();
```

**Why this matters:**
- `moment` handles time parsing, validation, and formatting
- `getRenderer('text')` and `getEditor('text')` reuse Handsontable's built-in text renderer and editor
- `registerCellType` registers the custom cell type for use in column config

## Step 2: Create the Renderer

The example reuses the built-in `text` renderer, which displays the time value as plain text:

```typescript
renderer: getRenderer('text')
```

## Step 3: Create the Validator

The validator parses the input using Moment.js and checks it against the configured `timeFormat`. It handles Unix timestamps, two-digit shorthand (e.g., `9` becomes `9:00`), and auto-correction:

```typescript
validator: function(value, callback) {
  const timeFormat = this.timeFormat ?? 'h:mm:ss a';
  let valid = true;

  if (value === null) {
    value = '';
  }

  value = /^\d{3,}$/.test(value) ? parseInt(value, 10) : value;

  const twoDigitValue = /^\d{1,2}$/.test(value);

  if (twoDigitValue) {
    value += ':00';
  }

  const date = moment(value, [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'X', // Unix timestamp
    'x' // Unix ms timestamp
  ], true).isValid() ?
    moment(value) : moment(value, timeFormat);
  let isValidTime = date.isValid();

  // is it in the specified format
  let isValidFormat = moment(value, timeFormat, true).isValid() && !twoDigitValue;

  if (this.allowEmpty && value === '') {
    isValidTime = true;
    isValidFormat = true;
  }
  if (!isValidTime) {
    valid = false;
  }
  if (!isValidTime && isValidFormat) {
    valid = true;
  }
  if (isValidTime && !isValidFormat) {
    if (this.correctFormat === true) {
      const correctedValue = date.format(timeFormat);

      this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'timeValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}
```

**What's happening:**
- Converts numeric-only input (3+ digits) to integers for Unix timestamp parsing
- Appends `:00` to 1-2 digit values (e.g., `9` becomes `9:00`)
- Tries ISO 8601 and Unix timestamp formats first, then falls back to the configured `timeFormat`
- If `correctFormat` is enabled, auto-corrects valid but misformatted times

## Step 4: Create the Editor

The example reuses the built-in `text` editor -- a text input for editing the time value:

```typescript
editor: getEditor('text')
```

## Step 5: Complete Cell Type Definition

Put all the pieces together and register the cell type:

```typescript
const cellTimeTypeDefinition = {
  renderer: getRenderer('text'),
  validator: function(value, callback) {
    // ... validator code from Step 3
  },
  editor: getEditor('text'),
};

registerCellType('moment-time', cellTimeTypeDefinition);
```

**What's happening:**
- **renderer**: Uses the built-in `text` renderer to display the time value
- **validator**: Custom validator that validates and optionally corrects time format using Moment.js
- **editor**: Uses the built-in `text` editor for text input
- **registerCellType**: Registers the `moment-time` cell type for use in column config

## Step 6: Use in Handsontable

```typescript
registerCellType('moment-time', cellTimeTypeDefinition);

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Arrival Time', 'Cost'],
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
      data: 'time',
      type: 'moment-time',
      width: 150,
      timeFormat: 'HH:mm',
      correctFormat: true,
    },
    {
      data: 'cost',
      type: 'numeric',
      width: 120,
      className: 'htRight',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US',
      },
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `type: 'moment-time'` - uses the custom cell type on the Arrival Time column
- `timeFormat: 'HH:mm'` - the Moment.js format string for 24-hour time
- `correctFormat: true` - automatically reformats valid times to the expected format
- `headerClassName: 'htLeft'` - left-aligns all column headers

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the time value as plain text using the `text` renderer
2. **User clicks cell**: The built-in text editor opens for editing
3. **User enters time**: Input like `9`, `14:30`, or a Unix timestamp is accepted
4. **Validation**: Moment.js checks the format and time validity; auto-corrects if `correctFormat` is enabled
5. **Save**: Valid values are saved to the cell; invalid values are rejected

## What you learned

You created a custom Moment.js-based time cell type in Handsontable. You used Moment.js to validate and auto-correct time values, reused the built-in text renderer and editor, and registered the result with `registerCellType` for use across columns.

## Next steps

- [Moment.js date](@/recipes/cell-types/moment-date/moment-date.md) - The same Moment.js pattern applied to date values, with a Pikaday calendar picker.
- [Numbro](@/recipes/cell-types/numbro/numbro.md) - A custom numeric cell type using the Numbro formatting library.
- [Flatpickr](@/recipes/cell-types/flatpickr/flatpickr.md) - A date picker using Flatpickr with dark theme support.
