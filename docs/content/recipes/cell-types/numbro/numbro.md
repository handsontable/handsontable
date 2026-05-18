---
type: how-to
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

This tutorial shows you how to create a custom numeric cell type using the Numbro library for locale-aware number formatting.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --deps numbro

@[code](@/content/recipes/cell-types/numbro/javascript/example1.js)
@[code](@/content/recipes/cell-types/numbro/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2 --deps numbro

@[code](@/content/recipes/cell-types/numbro/react/example1.jsx)
@[code](@/content/recipes/cell-types/numbro/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps numbro

@[code](@/content/recipes/cell-types/numbro/angular/example1.ts)
@[code](@/content/recipes/cell-types/numbro/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom numbro cell type using the [Numbro](https://numbrojs.com/) library. Users can format numbers using the Numbro API.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `numbro`

## What You'll Build

A cell that:
- Displays numbers with locale-aware formatting via Numbro (e.g., `$350,000.00`)
- Accepts `numericFormat` options for per-column formatting customization
- Validates input using Handsontable's built-in numeric validator
- Automatically right-aligns numeric values

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
import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';

registerAllModules();

Object.values(languages).forEach((language) => numbro.registerLanguage(language));
```

**Why this matters:**
- `numbro` handles locale-aware number formatting (currencies, decimals, thousands separators)
- `rendererFactory` creates a custom renderer that formats values with Numbro before displaying
- Registering all Numbro languages upfront enables any `culture` to be used in `numericFormat`

## Step 2: Create the Numeric Helper

This helper determines whether a value should be treated as a number:

```typescript
function isNumeric(value) {
  const type = typeof value;

  if (type === 'number') {
    return !isNaN(value) && isFinite(value);
  } else if (type === 'string') {
    if (value.length === 0) return false;
    if (value.length === 1) return /\d/.test(value);

    const delimiter = Array.from(new Set(['.']))
      .map(d => `\\${d}`)
      .join('|');

    return new RegExp(
      `^[+-]?(((${delimiter})?\\d+((${delimiter})\\d+)?(e[+-]?\\d+)?)|(0x[a-f\\d]+))$`, 'i'
    ).test(value.trim());
  } else if (type === 'object') {
    return !!value && typeof value.valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}
```

## Step 3: Create the Renderer

The renderer formats numeric values using Numbro and delegates to the built-in `text` renderer:

```typescript
renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }) => {
  if (isNumeric(value)) {
    const numericFormat = cellProperties.numericFormat;
    const cellCulture = numericFormat && numericFormat.culture || 'en-US';
    const cellFormatPattern = numericFormat && numericFormat.pattern;

    numbro.setLanguage(cellCulture);
    value = numbro(value).format(cellFormatPattern ?? '0');

    // Auto-apply htRight alignment for numeric cells
    td.dir = 'ltr';
  }

  getRenderer('text')(hotInstance, td, row, col, prop, value, cellProperties);
})
```

**What's happening:**
- Reads `numericFormat.culture` and `numericFormat.pattern` from cell properties
- Formats the raw number using `numbro(value).format(pattern)`
- Auto-applies `htRight` alignment unless another alignment class is set
- Sets `td.dir = 'ltr'` for correct display in RTL layouts
- Delegates to the `text` renderer for final DOM output

## Step 4: Complete Cell Type Definition

Put all the pieces together and register the cell type:

```typescript
const cellTypeDefinition = {
  renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }) => {
    // ... renderer code from Step 3 (see full example above)
  }),
  validator: getValidator('numeric'),
  editor: getEditor('numeric'),
};

registerCellType('numbro', cellTypeDefinition);
```

**What's happening:**
- **renderer**: Formats numbers with Numbro and renders as right-aligned text
- **validator**: Uses the built-in numeric validator to reject non-numeric input
- **editor**: Uses the built-in numeric editor for input
- **registerCellType**: Registers the `numbro` cell type for use in column config

## Step 5: Use in Handsontable

```typescript
registerCellType('numbro', cellTypeDefinition);

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Quantity', 'Cost'],
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
      data: 'quantity',
      type: 'numbro',
      width: 150,
      className: 'htRight',
      numericFormat: {
        pattern: '0,0',
        culture: 'en-US',
      },
    },
    {
      data: 'cost',
      type: 'numbro',
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
- `type: 'numbro'` - uses the custom cell type on Quantity and Cost columns
- `numericFormat.pattern` - the Numbro format string (e.g., `'$0,0.00'` for currency, `'0,0'` for integers)
- `numericFormat.culture` - the locale for formatting (e.g., `'en-US'`, `'de-DE'`)
- `headerClassName: 'htLeft'` - left-aligns all column headers

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the raw number formatted by Numbro (e.g., `350000` becomes `$350,000.00`)
2. **User clicks cell**: The built-in numeric editor opens for editing
3. **User enters number**: Input is validated against the numeric validator
4. **Validation**: Non-numeric values are rejected; valid numbers are accepted
5. **Save**: The value is stored as a raw number and re-rendered with Numbro formatting

## What you learned

You created a custom Numbro-based numeric cell type in Handsontable. You used `rendererFactory` to format numbers with Numbro before display, registered all Numbro language packs for locale support, and composed the cell type from a custom renderer with the built-in numeric validator and editor.

## Next steps

- [Moment.js date](@/recipes/cell-types/moment-date/moment-date.md) - A custom cell type using another third-party library for date formatting.
- [Moment.js time](@/recipes/cell-types/moment-time/moment-time.md) - A custom cell type using Moment.js for time validation.
- [Pikaday](@/recipes/cell-types/pikaday/pikaday.md) - A date picker cell type using Pikaday and Moment.js.
