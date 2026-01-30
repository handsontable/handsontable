---
id: cf4e768b
title: Numbro
metaTitle: Numbro Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom numbro cell type using the Numbro library
permalink: /recipes/cell-types/numbro
canonicalUrl: /recipes/cell-types/numbro
tags:
  - guides
  - tutorial
  - recipes
  - numbro
react:
  id: 9f2d530e
  metaTitle: Numbro Cell Type - React Data Grid | Handsontable
angular:
  id: 1e23a45b
  metaTitle: Numbro Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

# Numbro Cell Type - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom numbro cell type using the [Numbro](https://numbrojs.com/) library. Users can format numbers using the Numbro API.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `numbro`

## Complete Example

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cell-types/numbro/javascript/example1.js)
@[code](@/content/recipes/cell-types/numbro/javascript/example1.ts)

:::

## What You'll Build

A cell that:
- Displays the number value as text with a formatted value
- Cell that accepts `numericFormat` options for cell formatting customization
- Validates number format

## Prerequisites

```bash
npm install numbro
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory, getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { getValidator } from 'handsontable/validators';
import { registerCellType } from 'handsontable/cellTypes';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import numbro from 'numbro';

registerAllModules();
```

**Why this matters:**
- Import numbro library for number formatting functionality

## Step 2: Create the Renderer

The renderer controls how the cell looks when not being edited.

```typescript
renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }) => {
  if (isNumeric(value)) {
    let classArr = [];

    if (Array.isArray(cellProperties.className)) {
      classArr = cellProperties.className;
    } else {
      const className = cellProperties.className ?? '';

      if (className.length) {
        classArr = className.split(' ');
      }
    }

    const numericFormat = cellProperties.numericFormat;
    const cellCulture = numericFormat && numericFormat.culture || 'en-US';
    const cellFormatPattern = numericFormat && numericFormat.pattern;

    // Register the language if it's not already registered
    if (cellCulture && !numbro.languages()[cellCulture]) {
      const shortTag = cellCulture.replace('-', '');
      const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

      if (langData) {
        numbro.registerLanguage(langData);
      }
    }

    numbro.setLanguage(cellCulture);

    value = numbro(value).format(cellFormatPattern ?? '0');

    if (
      classArr.indexOf('htLeft') < 0 &&
      classArr.indexOf('htCenter') < 0 &&
      classArr.indexOf('htRight') < 0 &&
      classArr.indexOf('htJustify') < 0
    ) {
      classArr.push('htRight');
    }

    if (classArr.indexOf('htNumeric') < 0) {
      classArr.push('htNumeric');
    }

    cellProperties.className = classArr.join(' ');
    td.dir = 'ltr';
  }

  getRenderer('text')(hotInstance, td, row, col, prop, value, cellProperties);
})
```

**What's happening:**
- `isNumeric` checks if the value is a number-like value. If true, we format the value.
- `td` is the table cell DOM element
- `value` is the cell's current value (e.g., "1000.234")
- We format the value using the `numbro` library
- We set the `dir` attribute to `ltr` to ensure the value is displayed correctly in RTL languages
- We use the `getRenderer('text')` method to render the cell as text and to make sure that other properties like `className` are applied correctly

## Step 3: Complete Cell Type Definition

Put it all together:

```typescript
function isNumeric(value: any): boolean {
  const type = typeof value;

  if (type === 'number') {
    return !isNaN(value) && isFinite(value);

  } else if (type === 'string') {
    if (value.length === 0) {
      return false;

    } else if (value.length === 1) {
      return /\d/.test(value);
    }

    const delimiter = Array.from(new Set(['.']))
      .map(d => `\\${d}`)
      .join('|');

    return new RegExp(`^[+-]?(((${delimiter})?\\d+((${delimiter})\\d+)?(e[+-]?\\d+)?)|(0x[a-f\\d]+))$`, 'i')
      .test(value.trim());

  } else if (type === 'object') {
    return !!value && typeof value.valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}

const cellTypeDefinition = {
  renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }) => {
    if (isNumeric(value)) {
      let classArr = [];

      if (Array.isArray(cellProperties.className)) {
        classArr = cellProperties.className;
      } else {
        const className = cellProperties.className ?? '';

        if (className.length) {
          classArr = className.split(' ');
        }
      }

      const numericFormat = cellProperties.numericFormat;
      const cellCulture = numericFormat && numericFormat.culture || 'en-US';
      const cellFormatPattern = numericFormat && numericFormat.pattern;

      // Register the language if it's not already registered
      if (cellCulture && !numbro.languages()[cellCulture]) {
        const shortTag = cellCulture.replace('-', '');
        const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

        if (langData) {
          numbro.registerLanguage(langData);
        }
      }

      numbro.setLanguage(cellCulture);

      value = numbro(value).format(cellFormatPattern ?? '0');

      if (
        classArr.indexOf('htLeft') < 0 &&
        classArr.indexOf('htCenter') < 0 &&
        classArr.indexOf('htRight') < 0 &&
        classArr.indexOf('htJustify') < 0
      ) {
        classArr.push('htRight');
      }

      if (classArr.indexOf('htNumeric') < 0) {
        classArr.push('htNumeric');
      }

      cellProperties.className = classArr.join(' ');
      td.dir = 'ltr';
    }

    getRenderer('text')(hotInstance, td, row, col, prop, value, cellProperties);
  }),
  validator: getValidator('numeric'), // let's use the built-in numeric validator',
  editor: getEditor('numeric'), // let's use the built-in numeric editor',
};

registerCellType('numbro', cellTypeDefinition);
```

**What's happening:**
- **renderer**: Displays the number value as text with a formatted value using the `numbro` library
- **validator**: Uses the built-in numeric validator
- **editor**: Uses the built-in numeric editor
- **registerCellType**: Registers a new cell type called `numbro` ready to be used in the Handsontable grid

## Step 4: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;
const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: 'Lunar Core', cost: 1000.234 },
    { id: 2, itemName: 'Zero Thrusters', cost: 1000.234 },
    { id: 3, itemName: 'EVA Suits', cost: 1000.234 },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Item Cost',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'itemName', type: 'text' },
    {
      data: 'cost',
      type: 'numbro', // a new cell type
      numericFormat: { // numbro formatting options
        pattern: '$0,0.00',
        culture: 'en-US',
      },
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `type` - sets the cell type to `numbro`
- `numericFormat` - any options passed to the `numericFormat` property will be passed to the `numbro` library for formatting the number

## How It Works - Complete Flow

1. **Initial Render**: Cell displays example value with formatted value using the `numbro` library
2. **User enters number**: Number is validated and saved to cell
3. **Validation**: Validator checks if the value is a number
4. **Save**: If valid, value is saved to cell; if invalid, editor may stay open

---

**Congratulations!** You've created a fully functional numbro cell type using the `numbro` library, providing a formatted number display experience in your data grid!
