---
id: c757a3b3
title: "Recipe: Date picker flatpickr"
metaTitle: "Recipe: Date picker flatpickr - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using Flatpickr for a powerful, customizable date picker experience directly inside your data grid.
permalink: /recipes/flatpickr
canonicalUrl: /recipes/flatpickr
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 580a2104
  metaTitle: Custom builds - React Data Grid | Handsontable
angular:
  id: 8748f2d9
  metaTitle: Custom builds - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cells
---

# Flatpickr Date Picker Cell - Step-by-Step Guide

[[toc]]



## Overview

This guide shows how to create a custom date picker cell using [Flatpickr](https://flatpickr.js.org/), a powerful and flexible date picker library. This is more advanced than using native HTML5 date inputs, offering better cross-browser consistency and extensive customization options.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Libraries:** `flatpickr`, `date-fns`

## What You'll Build

A cell that:
- Displays formatted dates (e.g., "12/31/2024" or "31/12/2024")
- Opens a beautiful calendar picker when edited
- Supports per-column configuration (EU vs US date formats)
- Handles locale-specific settings (first day of week)
- Auto-closes and saves when a date is selected

## Prerequisites

```bash
npm install flatpickr date-fns
```

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-flatpickr/javascript/example1.js)
@[code](@/content/recipes/cells/guide-flatpickr/javascript/example1.ts)

:::

:::


## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { format, isDate } from 'date-fns';
import flatpickr from 'flatpickr';

registerAllModules();
```

**Why date-fns?**
- Lightweight, modular date formatting
- Better than native `toLocaleDateString()` for consistency
- Can be replaced with other libraries (moment, dayjs, etc.)
- We import `isDate` for validation

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = 'MM/dd/yyyy';
const DATE_FORMAT_EU = 'dd/MM/yyyy';
```

**Why constants?**
- Reusability across renderer and column configuration
- Single source of truth
- Easy to add more formats (ISO, custom, etc.)

## Step 3: Create the Renderer

The renderer displays the date in a human-readable format.

```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = format(new Date(value), cellProperties.renderFormat);

  return td;
})
```

**What's happening:**
- `value` is the raw date value (e.g., ISO string "2024-12-31")
- `cellProperties.renderFormat` is a custom property we'll set per column
- `format()` from date-fns converts to desired format
- Display the formatted date

**Why use `cellProperties`?**
- Allows different columns to display dates differently
- One cell definition, multiple configurations
- See Step 13 for usage

**Error handling for production:**
```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  if (!value) {
    td.innerText = '';

    return td;
  }

  try {
    td.innerText = format(new Date(value), cellProperties.renderFormat || 'MM/dd/yyyy');
  } catch (e) {
    td.innerText = 'Invalid date';
    td.style.color = 'red';
  }

  return td;
})
```

## Step 4: Create the Validator

```typescript
validator: (value, callback) => {
  callback(isDate(new Date(value)));
}
```

**What's happening:**
- Uses `isDate` from date-fns to validate the date
- `isDate` checks if the value is a valid Date object
- Returns `true` for valid dates, `false` for invalid ones

**Alternative validation approaches:**
```typescript
// Using native JavaScript
validator: (value, callback) => {
  const date = new Date(value);

  callback(!isNaN(date.getTime()));
}
```

## Step 5: Editor - Initialize (`init`)

Create the input element and initialize Flatpickr.

```typescript
init(editor) {
  // Create the input element on init. This is a text input that date picker will be attached to.
  editor.input = editor.hot.rootDocument.createElement('input') as HTMLInputElement;

  // Initialize Flatpickr
  editor.flatpickr = flatpickr(editor.input, {
    dateFormat: 'Y-m-d',
    enableTime: false,
    onChange: () => {
      editor.finishEditing();
    },
  });

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table.
   */
  editor.hot.rootDocument.addEventListener('mousedown', (event) => {
    if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
      event.stopPropagation();
    }
  });
}
```

**What's happening:**
1. Create an `input` element using `editor.hot.rootDocument.createElement()`
2. Initialize Flatpickr on the input with default settings
3. Set up `onChange` handler to finish editing when date is selected
4. Create event manager to prevent clicks on calendar from closing editor
5. The `editorFactory` helper handles container creation and DOM insertion

**Key concepts:**

### The `onChange` handler
```typescript
onChange: () => {
  editor.finishEditing();
}
```
- Called when user selects a date in Flatpickr
- Automatically saves the value and closes the editor
- Provides smooth UX - no need to press Enter

### The `Event Listener` pattern
This is crucial! Without it:
1. User clicks cell to edit
2. Flatpickr calendar opens
3. User clicks on calendar
4. Handsontable thinks user clicked "outside" the editor
5. Editor closes immediately!

**Solution:**
```typescript
editor.hot.rootDocument.addEventListener('mousedown', (event) => {
  if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
    event.stopPropagation(); // Tell Handsontable: "This click is part of editing!"
  }
});
```


## Step 6: Editor - Before Open Hook (`beforeOpen`)

Initialize the editor with the cell's current value and update Flatpickr settings.

```typescript
beforeOpen(editor, { originalValue, cellProperties }) {
  editor.setValue(originalValue);

  for (const key in cellProperties.flatpickrSettings) {
    editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
  }
}
```

**What's happening:**
1. Set the editor's value to the cell's current value
2. Update Flatpickr settings from `cellProperties.flatpickrSettings`
3. This allows per-column configuration (e.g., different locales, date formats)

**Key points:**
- `beforeOpen` is called before the editor opens
- `originalValue` is the cell's current date value
- `cellProperties.flatpickrSettings` contains column-specific Flatpickr configuration
- `flatpickr.set()` updates the existing Flatpickr instance with new settings

**Why update settings in `beforeOpen`?**
- Allows different columns to have different Flatpickr configurations
- Settings are applied just before opening, ensuring they're fresh
- More efficient than reinitializing Flatpickr each time

## Step 7: Editor - Get Value (`getValue`)

Return the current date value from the input.

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- Flatpickr automatically updates `input.value` in ISO format (e.g., "2024-12-31")
- Simply return the input's current value
- Called when Handsontable needs to save the cell value

## Step 8: Editor - Set Value (`setValue`)

Initialize the editor with the cell's current date value.

```typescript
setValue(editor, value) {
  editor.input.value = value;
  editor.flatpickr.setDate(new Date(value));
}
```

**What's happening:**
- Set the input's value to the provided date string
- Update Flatpickr's selected date using `setDate()`
- This ensures Flatpickr displays the correct date when opened
- Called to initialize the editor with the cell's current value

## Step 9: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  validator: (value, callback) => {
    callback(isDate(new Date(value)));
  },
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = format(new Date(value), cellProperties.renderFormat);

    return td;
  }),
  editor: editorFactory<{
    input: HTMLInputElement,
    flatpickr: flatpickr.Instance,
    flatpickrSettings: flatpickr.Options.Options
  }>({
    init(editor) {
      // Create the input element on init. This is a text input that date picker will be attached to.
      editor.input = editor.hot.rootDocument.createElement('input') as HTMLInputElement;
      editor.flatpickr = flatpickr(editor.input, {
        dateFormat: 'Y-m-d',
        enableTime: false,
        onChange: () => {
          editor.finishEditing();
        },
      });
      /**
       * Prevent recognizing clicking on datepicker as clicking outside of table.
       */
      editor.hot.rootDocument.addEventListener('mousedown', (event) => {
        if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
          event.stopPropagation();
        }
      });
    },
    beforeOpen(editor, { originalValue, cellProperties }) {
      editor.setValue(originalValue);

      for (const key in cellProperties.flatpickrSettings) {
        editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
      }
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
      editor.flatpickr.setDate(new Date(value));
    },
  }),
};
```

**What's happening:**
- **validator**: Ensures date is valid using `isDate` from date-fns
- **renderer**: Displays formatted date using `cellProperties.renderFormat`
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates input, initializes Flatpickr, sets up event manager
  - `beforeOpen`: Sets value and updates Flatpickr settings from column config
  - `getValue`: Returns the input's current value
  - `setValue`: Sets input value and updates Flatpickr date

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 10: Use in Handsontable with Different Formats

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: 'Lunar Core', restockDate: '2025-08-01' },
    { id: 2, itemName: 'Zero Thrusters', restockDate: '2025-09-15' },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Restock Date UE',
    'Restock Date US',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric', width: 150 },
    {
      data: 'itemName',
      type: 'text',
      width: 150,
    },
    // European format column
    {
      data: 'restockDate',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_EU, // Custom property for renderer
      flatpickrSettings: {           // Custom property for editor
        locale: {
          firstDayOfWeek: 1          // Monday
        }
      },
    },
    // US format column
    {
      data: 'restockDate',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US, // Custom property for renderer
      flatpickrSettings: {           // Custom property for editor
        locale: {
          firstDayOfWeek: 0          // Sunday
        }
      },
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Amazing feature:**
- Same data column (`restockDate`)
- Two different display formats (EU vs US)
- Two different calendar configurations (Monday vs Sunday first day)
- One cell definition!

## How It Works - Complete Flow

1. **Initial Load**: Cell displays formatted date ("31/12/2024" EU or "12/31/2024" US)
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **Before Open**: `beforeOpen` sets value and updates Flatpickr settings from column config
4. **Calendar Opens**: Flatpickr displays calendar with column-specific settings (Monday/Sunday first day)
5. **User Selects Date**: `onChange` handler fires, calls `finishEditing()`
6. **Validation**: Validator checks date is valid using `isDate`
7. **Save**: Value saved in ISO format ("2024-12-31")
8. **Editor Closes**: Container hidden, cell renderer displays new formatted date

## Advanced Enhancements

### 1. Time Picker

Add time selection:

```typescript
flatpickrSettings: {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  time_24hr: true
}

// Update renderer
renderFormat: 'dd/MM/yyyy HH:mm'
```

### 2. Date Range Restrictions

Limit selectable dates:

```typescript
flatpickrSettings: {
  minDate: '2024-01-01',
  maxDate: '2024-12-31',
  disable: [
    // Disable weekends
    function(date) {
      return (date.getDay() === 0 || date.getDay() === 6);
    }
  ]
}
```

### 3. Inline Calendar

Show calendar always visible:

```typescript
flatpickrSettings: {
  inline: true,
  static: true
}

// Adjust wrapper height in open()
editor.container.style.height = '300px';
```

### 4. Multiple Date Locales

Use Flatpickr locales:

```typescript
import { French } from 'flatpickr/dist/l10n/fr.js';

flatpickrSettings: {
  locale: French,
  dateFormat: 'd/m/Y'
}
```

### 5. Custom Date Ranges

Add shortcuts:

```typescript
// Requires flatpickr shortcutButtonsPlugin
import ShortcutButtonsPlugin from 'flatpickr/dist/plugins/shortcutButtons/shortcutButtons.js';

flatpickrSettings: {
  plugins: [
    ShortcutButtonsPlugin({
      button: [
        { label: 'Today' },
        { label: 'Next Week' },
      ],
      onClick: (index, fp) => {
        let date;

        if (index === 0) {
          date = new Date();

        } else if (index === 1) {
          date = new Date();
          date.setDate(date.getDate() + 7);
        }

        fp.setDate(date);
      }
    })
  ]
}
```

---

**Congratulations!** You've created a production-ready date picker with full localization support and advanced configuration.
