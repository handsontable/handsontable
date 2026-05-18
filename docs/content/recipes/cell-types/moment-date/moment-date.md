---
type: how-to
id: 9f21530e
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
  id: 7d23a45b
  metaTitle: Moment.js date Cell Type - React Data Grid | Handsontable
angular:
  id: 3d23a45b
  metaTitle: Moment.js date Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to create a custom date cell type using Moment.js and the Pikaday calendar picker, with format auto-correction and per-column configuration.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/moment-date/javascript/example1.js)
@[code](@/content/recipes/cell-types/moment-date/javascript/example1.ts)
@[code](@/content/recipes/cell-types/moment-date/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/moment-date/react/example1.css)
@[code](@/content/recipes/cell-types/moment-date/react/example1.jsx)
@[code](@/content/recipes/cell-types/moment-date/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/moment-date/angular/example1.ts)
@[code](@/content/recipes/cell-types/moment-date/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom date cell type using the [Moment.js](https://momentjs.com/) library. Users can format dates using the Moment.js API.

**Difficulty:** Beginner
**Time:** ~25 minutes
**Libraries:** `moment`, `@handsontable/pikaday`

## What You'll Build

A cell that:
- Displays dates with a dropdown arrow indicator
- Opens a Pikaday calendar picker when edited
- Validates and corrects date formats using Moment.js
- Supports custom `dateFormat` options per column
- Disables weekend selection via `datePickerConfig`

## Prerequisites

```bash
npm install moment @handsontable/pikaday
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';

registerAllModules();
```

**Why this matters:**
- `moment` handles date parsing, validation, and formatting
- `Pikaday` provides the calendar date picker UI
- `editorFactory` creates a portal-based editor that overlays the cell
- `registerCellType` registers the custom cell type for use in column config

## Step 2: Create the Date Format Helper

This helper corrects user input to match the expected date format:

```typescript
const correctFormat = (value, dateFormat) => {
  const dateFromDate = moment(value);
  const dateFromMoment = moment(value, dateFormat);
  const isAlphanumeric = value.search(/[A-Za-z]/g) > -1;
  let date;

  if ((dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x')) ||
      !dateFromMoment.isValid() ||
      isAlphanumeric) {
    date = dateFromDate;
  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
}
```

**What's happening:**
- Tries to parse the value both as a native date and using Moment.js with the given format
- Picks the best interpretation and reformats it to the target `dateFormat`

## Step 3: Create the Renderer

The example reuses the built-in `autocomplete` renderer, which displays a dropdown arrow icon indicating the cell has a picker:

```typescript
renderer: getRenderer('autocomplete')
```

## Step 4: Create the Validator

The validator checks whether the entered value is a valid date and optionally auto-corrects the format:

```typescript
validator: function(value, callback) {
  let valid = true;

  if (value === null || value === undefined) {
    value = '';
  }

  let isValidFormat = moment(value, this.dateFormat, true).isValid();
  let isValidDate = moment(new Date(value)).isValid() || isValidFormat;

  if (this.allowEmpty && value === '') {
    isValidDate = true;
    isValidFormat = true;
  }
  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) {
      const correctedValue = correctFormat(value, this.dateFormat);

      this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}
```

**What's happening:**
- Validates the date value against the configured `dateFormat` using Moment.js
- If `correctFormat` is enabled, auto-corrects misformatted but valid dates
- Empty values pass validation when `allowEmpty` is set

## Step 5: Create the Editor

The editor uses `editorFactory` with `position: 'portal'` to overlay a Pikaday calendar on the cell. Arrow keys navigate days/weeks in the calendar:

```typescript
editor: editorFactory({
  position: 'portal',
  shortcuts: [
    {
      keys: [['ArrowLeft']],
      callback: (editor, _event) => {
        editor.pikaday.adjustDate('subtract', 1);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowRight']],
      callback: (editor, _event) => {
        editor.pikaday.adjustDate('add', 1);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowUp']],
      callback: (editor, _event) => {
        editor.pikaday.adjustDate('subtract', 7);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowDown']],
      callback: (editor, _event) => {
        editor.pikaday.adjustDate('add', 7);
        _event.preventDefault();
      },
    },
  ],
  init(editor) {
    editor.parentDestroyed = false;
    editor.input = editor.hot.rootDocument.createElement('input');
    editor.datePicker = editor.container;

    editor.hot.rootDocument.addEventListener('mousedown', (event) => {
      if (event.target && event.target.classList.contains('pika-day')) {
        editor.hideDatepicker(editor);
      }
    });
  },
  afterOpen(editor, event) {
    const cellRect = editor.TD.getBoundingClientRect();

    editor.input.style.width = `${cellRect.width}px`;
    editor.input.style.height = `${cellRect.height}px`;
    editor.showDatepicker(editor, event);
  },
  afterClose(editor) {
    if (editor.pikaday.destroy) {
      editor.pikaday.destroy();
    }
  },
  getValue(editor) {
    return editor.input.value;
  },
  setValue(editor, value) {
    editor.input.value = value;
  },
  getDateFormat(editor) {
    return editor.cellProperties.dateFormat ?? 'DD/MM/YYYY';
  },
  // ... getDatePickerConfig, showDatepicker, hideDatepicker
  // (see the full example above for complete implementation)
}),
```

**What's happening:**
- `init` creates the input element and binds the Pikaday container
- `afterOpen` sizes the input to match the cell dimensions, then opens the date picker
- `afterClose` destroys the Pikaday instance to prevent memory leaks
- Arrow key shortcuts navigate the calendar (left/right = day, up/down = week)

## Step 6: Style the Editor Input

The editor input needs CSS to match Handsontable's native editor appearance. Without this, the input shows default browser borders and focus styles:

```css
.ht_editor_visible > input {
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  outline: none;
  margin-top: -1px;
  margin-left: -1px;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent) !important;
  background-color: var(--ht-cell-editor-background-color, #ffffff) !important;
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px) !important;
  border: none !important;
  font-family: inherit;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
}
.ht_editor_visible > input:focus-visible {
  border: none !important;
  outline: none !important;
}
```

**Key styling:**
- `margin-top: -1px` and `margin-left: -1px` align the editor precisely over the cell border
- Uses Handsontable's CSS custom properties (`--ht-cell-editor-*`) to match the theme
- `inset box-shadow` replaces the default border for a consistent editor highlight
- `border: none` and `outline: none` remove default browser focus styles

## Step 7: Register and Use in Handsontable

```typescript
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
      dateFormat: 'YYYY-MM-DD',
      correctFormat: true,
      datePickerConfig: {
        firstDay: 0,
        showWeekNumber: true,
        disableDayFn(date) {
          return date.getDay() === 0 || date.getDay() === 6;
        },
      },
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
- `type: 'moment-date'` - uses the custom cell type on the Restock Date column
- `dateFormat: 'YYYY-MM-DD'` - the Moment.js format string for parsing and display
- `correctFormat: true` - automatically reformats valid dates to the expected format
- `datePickerConfig` - passed directly to Pikaday (e.g., disable weekends with `disableDayFn`)

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the date value with a dropdown arrow (autocomplete renderer)
2. **User clicks cell**: The portal editor opens with an input sized to the cell and a Pikaday calendar below it
3. **Date selection**: User picks a date from the calendar or types a value; arrow keys navigate the picker
4. **Validation**: Moment.js checks the format and date validity; auto-corrects if `correctFormat` is enabled
5. **Save**: Valid values are saved to the cell; invalid values are rejected

## What you learned

You created a custom Moment.js-based date cell type in Handsontable. You used `editorFactory` with `position: 'portal'` to overlay a Pikaday calendar, Moment.js for date validation and format auto-correction, and `registerCellType` to make the cell type reusable across columns.

## Next steps

- [Pikaday](@/recipes/cell-types/pikaday/pikaday.md) - A standalone Pikaday date picker recipe that also serves as a migration path from the built-in date cell type.
- [Moment.js time](@/recipes/cell-types/moment-time/moment-time.md) - The same Moment.js pattern applied to time values.
- [Flatpickr](@/recipes/cell-types/flatpickr/flatpickr.md) - An alternative date picker using the Flatpickr library with dark theme support.
