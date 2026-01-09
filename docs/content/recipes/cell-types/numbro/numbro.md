---
id: 2d2b22ef
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
  id: 050bc847
  metaTitle: Numbro Cell Type - React Data Grid | Handsontable
angular:
  id: a471c83c
  metaTitle: Numbro Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

# Numbro Cell Type - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom numbro cell type using the [Numbro](https://github.com/numbrojs/numbro) library. Users can format numbers using the Numbro API.

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
renderer: rendererFactory(({ td, value, cellProperties }) => {
  const numericFormat = cellProperties.numericFormat;
  const cellCulture = numericFormat && numericFormat.culture ?? 'en-US';
  const cellFormatPattern = numericFormat && numericFormat.pattern;

  if (cellCulture && !numbro.languages()[cellCulture]) {
    const shortTag = cellCulture.replace('-', '');
    const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

    if (langData) {
      numbro.registerLanguage(langData);
    }
  }

  numbro.setLanguage(cellCulture);

  value = numbro(value).format(cellFormatPattern ?? '0');

  td.classList.add('htNumeric');
  td.classList.add('htRight');
  td.innerText = value;
  td.dir = 'ltr';
})
```

**What's happening:**
- `td` is the table cell DOM element
- `value` is the cell's current value (e.g., "1000.234")
- We format the value using the `numbro` library
- We add the `htNumeric` and `htRight` classes to the cell
- We set the `dir` attribute to `ltr` to ensure the value is displayed correctly

## Step 3: Complete Cell Type Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    const numericFormat = cellProperties.numericFormat;
    const cellCulture = numericFormat && numericFormat.culture ?? 'en-US';
    const cellFormatPattern = numericFormat && numericFormat.pattern;

    if (cellCulture && !numbro.languages()[cellCulture]) {
      const shortTag = cellCulture.replace('-', '');
      const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

      if (langData) {
        numbro.registerLanguage(langData);
      }
    }

    numbro.setLanguage(cellCulture);

    value = numbro(value).format(cellFormatPattern ?? '0');

    td.classList.add('htNumeric');
    td.classList.add('htRight');
    td.innerText = value;
    td.dir = 'ltr';
  }),
  validator: 'numeric' // let's use the built-in numeric validator',
  editor: 'numeric', // let's use the built-in numeric editor',
};
```

**What's happening:**
- **renderer**: Displays the number value as text with a formatted value using the `numbro` library
- **validator**: Uses the built-in numeric validator
- **editor**: Uses the built-in numeric editor

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
      ...cellDefinition,
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer, validator, and editor into the column config
- The validator ensures only valid numbers are saved

## How It Works - Complete Flow

1. **Initial Render**: Cell displays example value with formatted value using the `numbro` library
2. **User enters number**: Number is validated and saved to cell
3. **Validation**: Validator checks if the value is a number
4. **Save**: If valid, value is saved to cell; if invalid, editor may stay open

---

**Congratulations!** You've created a fully functional numbro cell type using the `numbro` library, providing a formatted number display experience in your data grid!
