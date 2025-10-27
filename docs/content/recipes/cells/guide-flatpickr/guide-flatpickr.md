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
  - recipies
react:
  id: 580a2104
  metaTitle: Custom builds - React Data Grid | Handsontable
angular:
  id: 8748f2d9
  metaTitle: Custom builds - Angular Data Grid | Handsontable
searchCategory: Recepies
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
import Handsontable from "handsontable";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

// Date formatting
import { format, isDate } from "date-fns";

// Flatpickr
import flatpickr from "flatpickr";

// Register all Handsontable's modules
registerAllModules();
```

**Why date-fns?**
- Lightweight, modular date formatting
- Better than native `toLocaleDateString()` for consistency
- Can be replaced with other libraries (moment, dayjs, etc.)
- We import `isDate` for validation

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = "MM/dd/yyyy";
const DATE_FORMAT_EU = "dd/MM/yyyy";
```

**Why constants?**
- Reusability across renderer and column configuration
- Single source of truth
- Easy to add more formats (ISO, custom, etc.)

## Step 3: Create the Renderer

The renderer displays the date in a human-readable format.

```typescript
renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
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
renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
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

**With date range validation:**
```typescript
validator: (value, callback) => {
  const date = new Date(value);
  if (!isDate(date)) {
    callback(false);
    return;
  }
  
  // Optional: check date range
  const minDate = new Date('2000-01-01');
  const maxDate = new Date('2099-12-31');
  callback(date >= minDate && date <= maxDate);
}
```

## Step 5: Editor - Define Types

Define the custom properties your editor needs:

```typescript
editor: Handsontable.editors.BaseEditor.factory<{
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  flatpickr: flatpickr.Instance;
  eventManager: Handsontable.EventManager;
  flatpickrSettings: flatpickr.Options.Options;
}>({
  // ... methods
})
```

**Type breakdown:**
- `wrapper` - Container div for positioning
- `input` - The input element Flatpickr attaches to
- `flatpickr` - Flatpickr instance for controlling the picker
- `eventManager` - Handsontable's event manager for proper cleanup
- `flatpickrSettings` - Per-cell Flatpickr configuration

## Step 6: Editor - Initialize (`init`)

Create the DOM structure and initial Flatpickr instance.

```typescript
init(editor) {
  // Create wrapper div
  editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.wrapper.style.display = "none";
  editor.wrapper.classList.add("htSelectEditor");
  
  // Create input inside wrapper
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;        
  editor.input.style = 'width: 100%; padding: 0; opacity: 0';
  
  // Assemble DOM
  editor.wrapper.appendChild(editor.input);
  editor.hot.rootElement.appendChild(editor.wrapper);
  
  // Initialize Flatpickr
  editor.flatpickr = flatpickr(editor.input, {
    dateFormat: "Y-m-d",
    enableTime: false,
  });
  
  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table.
   */
  editor.eventManager = new Handsontable.EventManager(editor.wrapper);
  editor.eventManager.addEventListener(document.body, 'mousedown', (event) => {             
    if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
      event.stopPropagation();
    }        
  });
}
```

**Key concepts:**

### Why a wrapper div?
- Allows positioning without affecting input dimensions
- Can add styling, borders, shadows
- Better control over z-index

### Why `opacity: 0` on input?
- Flatpickr shows its own UI elements
- Input still needs to be there for Flatpickr to work
- We make it invisible but functional

### The `eventManager` pattern
This is crucial! Without it:
1. User clicks cell to edit
2. Flatpickr calendar opens
3. User clicks on calendar
4. Handsontable thinks user clicked "outside" the editor
5. Editor closes immediately!

**Solution:**
```typescript
editor.eventManager.addEventListener(document.body, 'mousedown', (event) => {
  if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
    event.stopPropagation(); // Tell Handsontable: "This click is part of editing!"
  }
});
```

**Why use `Handsontable.EventManager`?**
- Proper cleanup when editor is destroyed
- Consistent with Handsontable's event handling
- Prevents memory leaks

## Step 7: Editor - Get Value (`getValue`)

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**Simple and effective:**
- Flatpickr automatically updates `input.value` in ISO format
- We just read it and return

## Step 8: Editor - Set Value (`setValue`)

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- Set the input's value
- Flatpickr will parse and display it correctly
- Called by Handsontable's `beginEditing()` method

## Step 9: Editor - Prepare (`prepare`)

This is where per-cell configuration happens!

```typescript
prepare(editor, _row, _col, _prop, _td, originalValue, cellProperties) {
  editor.input.value = originalValue;
  editor.flatpickrSettings = cellProperties.flatpickrSettings;
}
```

**What's happening:**
- `prepare()` is called every time a cell is selected
- `originalValue` is the cell's current value
- `cellProperties.flatpickrSettings` contains column-specific Flatpickr config
- Store settings for use in `open()`
- Unused parameters are prefixed with `_` (TypeScript convention)

**Why not set Flatpickr settings here?**
- `prepare()` is called even when not editing
- Better performance to defer until `open()`
- Allows dynamic configuration based on cell state

**Advanced: Dynamic configuration**
```typescript
prepare(editor, row, _col, _prop, _td, originalValue, cellProperties) {
  editor.input.value = originalValue;
  
  // Different settings based on row data
  const rowData = editor.hot.getDataAtRow(row);
  if (rowData.isPastDate) {
    editor.flatpickrSettings = {
      ...cellProperties.flatpickrSettings,
      maxDate: 'today'
    };
  } else {
    editor.flatpickrSettings = cellProperties.flatpickrSettings;
  }
}
```

## Step 10: Editor - Open (`open`)

Position the editor and reinitialize Flatpickr with settings.

```typescript
open(editor) {
  const rect = editor.getEditedCellRect()!;
  editor.wrapper.style = `
    display: block;
    border: none;
    box-sizing: border-box;
    margin: 0;
    padding: 0 4px;
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.start}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
  `;
  
  // Reinitialize Flatpickr with cell-specific settings
  editor.flatpickr = flatpickr(editor.input, {
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr, instance) => {
      editor.finishEditing();
    },
    ...(editor.flatpickrSettings || {})
  });
}
```

**Key points:**

### Why reinitialize Flatpickr in `open()`?
- Allows per-cell configuration
- Different columns can have different settings
- Settings from `prepare()` are applied here

### The `onChange` handler
```typescript
onChange: (selectedDates, dateStr, instance) => {
  editor.finishEditing();
}
```
- Called when user selects a date
- `finishEditing()` saves the value and closes the editor
- Provides smooth UX - no need to press Enter

### Spread operator for settings
```typescript
...(editor.flatpickrSettings || {})
```
- Merges column-specific settings
- Falls back to empty object if undefined
- Overrides default settings

### The `!` assertion
```typescript
const rect = editor.getEditedCellRect()!;
```
- TypeScript assertion that rect is not undefined
- Safe because `open()` is only called when a cell is being edited

## Step 11: Editor - Focus and Close

```typescript
focus(editor) {
  editor.input.focus();
}

close(editor) {
  editor.wrapper.style.display = 'none';
}
```

**Focus method:**
- Called when editor needs to regain focus
- Happens when validation fails

**Close method:**
- Hide the wrapper
- Flatpickr automatically closes its calendar
- No need to manually destroy Flatpickr

## Step 12: Complete Cell Definition

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
    td.innerText = format(new Date(value), cellProperties.renderFormat);
    return td;
  }),
  
  validator: (value, callback) => {    
    const date = new Date(value);
    callback(!isNaN(date.getTime()));
  },
  
  editor: Handsontable.editors.BaseEditor.factory<{
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
    flatpickr: flatpickr.Instance;
    eventManager: Handsontable.EventManager;
    flatpickrSettings: flatpickr.Options.Options;
  }>({
    init(editor) { /* ... from Step 6 ... */ },
    getValue(editor) { return editor.input.value; },
    setValue(editor, value) { editor.input.value = value; },
    prepare(editor, _row, _col, _prop, _td, _originalValue, _cellProperties) {
      editor.input.value = originalValue;
      editor.flatpickrSettings = cellProperties.flatpickrSettings;
    },
    open(editor) { /* ... from Step 10 ... */ },
    focus(editor) { editor.input.focus(); },
    close(editor) { editor.wrapper.style.display = 'none'; }
  }),
};
```

## Step 13: Use in Handsontable with Different Formats

```typescript
const hot = new Handsontable(container, {
  data: [
    { id: 1, itemName: "Item 1", restockDate: "2024-12-31" },
    { id: 2, itemName: "Item 2", restockDate: "2024-06-15" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Restock Date EU",
    "Restock Date US",
  ],
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    { data: "itemName", type: "text", width: 150 },
    
    // European format column
    {
      data: "restockDate",
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
      data: "restockDate",
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
  licenseKey: "non-commercial-and-evaluation",
});
```

**Amazing feature:**
- Same data column (`restockDate`)
- Two different display formats
- Two different calendar configurations
- One cell definition!

## How It Works - Complete Flow

1. **Initial Load**: Renderer shows "31/12/2024" (EU) or "12/31/2024" (US)
2. **Cell Selection**: `prepare()` is called, stores `flatpickrSettings`
3. **Edit Start**: User double-clicks, `open()` is called
4. **Editor Opens**: Wrapper positioned, Flatpickr initialized with settings
5. **Calendar Shows**: Flatpickr displays calendar (Monday/Sunday first day based on column)
6. **User Clicks Date**: `onChange` fires, calls `finishEditing()`
7. **Validation**: Validator checks date is valid
8. **Save**: Value saved in ISO format ("2024-12-31")
9. **Render**: Renderer displays in localized format
10. **Close**: Editor hidden, ready for next edit

## Advanced Enhancements

### 1. Time Picker

Add time selection:

```typescript
flatpickrSettings: {
  enableTime: true,
  dateFormat: "Y-m-d H:i",
  time_24hr: true
}

// Update renderer
renderFormat: "dd/MM/yyyy HH:mm"
```

### 2. Date Range Restrictions

Limit selectable dates:

```typescript
flatpickrSettings: {
  minDate: "2024-01-01",
  maxDate: "2024-12-31",
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
editor.wrapper.style.height = '300px';
```

### 4. Multiple Date Locales

Use Flatpickr locales:

```typescript
import { French } from "flatpickr/dist/l10n/fr.js";

flatpickrSettings: {
  locale: French,
  dateFormat: "d/m/Y"
}
```

### 5. Custom Date Ranges

Add shortcuts:

```typescript
// Requires flatpickr shortcutButtonsPlugin
import ShortcutButtonsPlugin from "flatpickr/dist/plugins/shortcutButtons/shortcutButtons.js";

flatpickrSettings: {
  plugins: [
    ShortcutButtonsPlugin({
      button: [
        { label: "Today" },
        { label: "Next Week" },
      ],
      onClick: (index, fp) => {
        let date;
        if (index === 0) date = new Date();
        if (index === 1) {
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

