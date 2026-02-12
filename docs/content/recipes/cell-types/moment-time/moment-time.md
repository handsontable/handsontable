---
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

# Moment.js date Cell Type - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom time cell type using the [Moment.js](https://momentjs.com/) library. Users can format times using the Moment.js API.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `moment`

## Complete Example

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cell-types/moment-time/javascript/example1.js)
@[code](@/content/recipes/cell-types/moment-time/javascript/example1.ts)

:::

## What You'll Build

A cell that:
- Displays the time value as text with a formatted value
- Cell that accepts `timeFormat` options for cell formatting customization
- Validates time format
- Corrects time format if needed

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
- Import moment library for date formatting and validation functionality

## Step 2: Create the Renderer

The renderer controls how the cell looks when not being edited. We use the `getRenderer` helper to get already built-in called `text` renderer.

```typescript
renderer: getRenderer('text')
```

## Step 3: Create the Validator

The validator controls how the cell is validated when the user is editing a cell. We use the `moment` library to validate the time format and the time itself. We also allow the user to correct the time format if needed.

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
- We check if the value is null or undefined and set it to an empty string if it is
- We validate the time format using the `moment` library
- We validate the time itself using the `moment` library
- We allow the user to correct the time format if needed
- We call the callback with the validation result

## Step 4: Create the Editor

The editor controls how the cell is edited when the user is editing a cell. We use the `getEditor` helper to get already built-in called `text` editor.

```typescript
editor: getEditor('text')
```

**What's happening:**
- We use the `getEditor` helper to get already built-in called `text` editor. It is a simple text input that allows the user to edit the time value.

## Step 5: Complete Cell Type Definition

Put all the pieces together:

```typescript
const cellTimeTypeDefinition = {
  renderer: getRenderer('text'),
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
  },
  editor: getEditor('text'),
};

registerCellType('moment-time', cellTimeTypeDefinition);
```

**What's happening:**
- **renderer**: Uses the build-in `text` renderer to display the time value as text
- **validator**: Creates a custom validator that validates the time format and the time itself using the `moment` library
- **editor**: Uses the build-in `text` editor to allow the user to edit the time value
- **registerCellType**: Registers a new cell type called `moment-time` ready to be used in the Handsontable grid

## Step 6: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;
const hotOptions: Handsontable.GridSettings = {
  data: [
    { id: 1, itemName: 'Lunar Core', time: '09:30' },
    { id: 2, itemName: 'Zero Thrusters', time: '14:15' },
    { id: 3, itemName: 'EVA Suits', time: '08:00' },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Arrival Time',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'itemName', type: 'text' },
    {
      data: 'cost',
      type: 'moment-time', // a new cell type
      timeFormat: 'HH:mm',
      correctFormat: true,
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `type` - sets the cell type to `moment-time`
- `timeFormat` - the time format to use for the cell. Defaults to `HH:mm`
- `correctFormat` - whether to correct the time format if it is not valid.

## How It Works - Complete Flow

1. **Initial Render**: Cell displays example value with formatted value using the `moment` library
2. **User enters time**: Time is validated and saved to cell
3. **Validation**: Validator checks if the time format and the time itself are valid
4. **Save**: If valid, value is saved to cell; if invalid, editor may stay open
