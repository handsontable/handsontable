---
id: cfc4de9c
title: "Recipe: Native HTML5 Date Input"
metaTitle: Native HTML5 Date Input Cell - JavaScript Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using the native HTML5 date input, with step-by-step instructions for formatting, editing, and validation.
permalink: /recipes/input-date
canonicalUrl: /recipes/input-date
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 01f39a58
  metaTitle: Native HTML5 Date Input Cell - React Data Grid | Handsontable
angular:
  id: ee7d79a2
  metaTitle: Native HTML5 Date Input Cell - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cells
---

# Native HTML5 Date Input Cell - Step-by-Step Guide

[[toc]]


## Overview

This guide shows how to create a custom date cell using the native HTML5 `<input type="date">`. This is the simplest approach for date selection, requiring no external libraries while providing native mobile support and accessibility.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Libraries:** `date-fns` (for formatting only)

## What You'll Build

A cell that:
- Displays formatted dates
- Opens native browser date picker
- Uses device's native UI (especially useful on mobile)
- Works without external dependencies
- Has zero JavaScript library overhead

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-input-date/javascript/example1.js)
@[code](@/content/recipes/cells/guide-input-date/javascript/example1.ts)

:::

:::

## Prerequisites

```bash
npm install date-fns
```

Note: `date-fns` is only used for rendering. The editor uses native browser functionality.

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { format } from 'date-fns';

registerAllModules();
```

**Why date-fns?**
- Consistent date display across browsers
- Native date input returns ISO format ("2024-12-31")
- We want to show user-friendly format ("12/31/2024")

## Step 2: Create the Renderer

```typescript
renderer: Handsontable.renderers.factory(({ td, value }) => {
  td.innerText = format(new Date(value), "MM/dd/yyyy");
  return td;
})
```

**What's happening:**
- `value` is in ISO format from native input: "2024-12-31"
- `format()` converts to readable format: "12/31/2024"
- Display the formatted date

**Customization:**
```typescript
// European format
td.innerText = format(new Date(value), "dd/MM/yyyy"); // "31/12/2024"

// Long format
td.innerText = format(new Date(value), "MMMM dd, yyyy"); // "December 31, 2024"

// With day name
td.innerText = format(new Date(value), "EEE, MMM dd, yyyy"); // "Tue, Dec 31, 2024"
```

**Error handling:**
```typescript
renderer: Handsontable.renderers.factory(({ td, value }) => {
  if (!value) {
    td.innerText = '';
    td.style.color = '#999';
    return td;
  }
  
  try {
    td.innerText = format(new Date(value), "MM/dd/yyyy");
    td.style.color = '';
  } catch (e) {
    td.innerText = 'Invalid date';
    td.style.color = 'red';
  }
  
  return td;
})
```

## Step 3: Create the Validator (Optional)

The implementation doesn't include a validator, but you can add one if needed:

**Basic validation:**
```typescript
validator: (value, callback) => {
  if (!value) {
    callback(false);
    return;
  }
  
  const date = new Date(value);
  callback(!isNaN(date.getTime()));
}
```

**With date range validation:**
```typescript
validator: (value, callback) => {
  if (!value) {
    callback(false);
    return;
  }
  
  const date = new Date(value);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    callback(false);
    return;
  }
  
  // Check range (optional)
  const minDate = new Date('1900-01-01');
  const maxDate = new Date('2099-12-31');
  
  callback(date >= minDate && date <= maxDate);
}
```

**Check that date is after another date:**
```typescript
import { isAfter } from 'date-fns';

validator: (value, callback) => {    
  const result = isAfter(new Date(value), new Date(2001, 1, 11));
  callback(result);
}
```

## Step 4: Editor - Initialize (`init`)

Create the date input element and set up event listeners.

```typescript
init(editor) {
  editor.input = document.createElement("INPUT") as HTMLInputElement;      
  editor.input.setAttribute('type', 'date');
  
  editor.input.addEventListener('keyup', () => {
    // This fires when picker is closed without selecting a date
    editor.close();
  });
  
  editor.input.addEventListener('change', () => {
    editor.finishEditing();
  });
  
  editor.value = editor.input.value;
}
```

**What's happening:**
1. Create an `<input>` element using `document.createElement()`
2. Set `type="date"` attribute to enable native date picker
3. Add `keyup` event listener to close editor when picker is dismissed
4. Add `change` event listener to finish editing when date is selected
5. Initialize editor value from input value
6. The `editorFactory` helper handles container creation and DOM insertion

**Key concepts:**

### `type="date"` attribute
```typescript
editor.input.setAttribute('type', 'date');
```
- Tells browser to use native date picker
- On mobile: Shows native date selection UI
- On desktop: Browser-specific date picker
- Returns value in ISO format: "YYYY-MM-DD"

### Event Listeners

**`keyup` event:**
```typescript
editor.input.addEventListener('keyup', () => {
  editor.close();
});
```
- Fires when user closes the picker without selecting a date (e.g., pressing Escape)
- Closes the editor to return to cell view

**`change` event:**
```typescript
editor.input.addEventListener('change', () => {
  editor.finishEditing();
}
```
- Fires when user selects a date in the picker
- Automatically saves the value and closes the editor
- Provides smooth UX - no need to press Enter

## Step 5: Editor - After Open Hook (`afterOpen`)

Open the native date picker when the editor opens.

```typescript
afterOpen(editor) {
  editor.input.showPicker();
}
```

**What's happening:**
- Called after the editor container is positioned and shown
- Programmatically opens the native date picker
- User can immediately start selecting a date

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- Ensures the input element is ready before opening picker
- The `editorFactory` helper handles positioning in `open`

**The `showPicker()` method:**
- Modern Web API method
- Programmatically opens the native date picker
- Like the user clicking on the input
- Must be called after the input is visible, which `afterOpen` ensures

**Note:** The `editorFactory` helper automatically positions the editor container over the cell, so we only need to open the picker.

## Step 6: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.innerText = format(new Date(value), 'MM/dd/yyyy');
    return td;
  }),
  editor: editorFactory<{input: HTMLInputElement}>({
    init(editor) {
      editor.input = document.createElement("INPUT") as HTMLInputElement;      
      editor.input.setAttribute('type', 'date');
      editor.input.addEventListener('keyup', () => {
        // This fires when picker is closed without selecting a date
        editor.close();
      });
      editor.input.addEventListener('change', () => {
        editor.finishEditing();
      });
      editor.value = editor.input.value;
    },
    afterOpen(editor) {
      editor.input.showPicker();
    },
  })
};
```

**What's happening:**
- **renderer**: Displays formatted date using `date-fns` format function
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates input element, sets type to date, adds event listeners
  - `afterOpen`: Opens the native date picker using `showPicker()`

**Note:** The `editorFactory` helper handles container creation, positioning, `getValue`, `setValue`, `focus`, and `close` automatically.

## Step 7: Use in Handsontable

```typescript
const container = document.querySelector("#example1")!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: "Lunar Core", restockDate: "2025-08-01" },
    { id: 2, itemName: "Zero Thrusters", restockDate: "2025-09-15" },
    { id: 3, itemName: "EVA Suits", restockDate: "2025-10-05" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Restock Date",
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: "id", type: "numeric" },
    {
      data: "itemName",
      type: "text",
    },
    {
      data: "restockDate",
      allowInvalid: false,
      ...cellDefinition,
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `allowInvalid: false` - Rejects invalid dates
- `...cellDefinition` - Spreads renderer and editor
- `autoRowSize: true` - Rows resize if needed

## How It Works - Complete Flow

1. **Initial Render**: Cell displays formatted date (e.g., "08/01/2025")
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **After Open**: `afterOpen` opens the native date picker automatically
4. **User Selects Date**: Native picker handles selection
5. **Change Event**: `change` event fires, calls `finishEditing()`
6. **Validation**: Validator runs (optional, if defined)
7. **Save**: Value saved in ISO format (e.g., "2025-08-01")
8. **Editor Closes**: Container hidden, cell renderer displays new formatted date

**Alternative flow if user cancels:**
- **User Presses Escape**: `keyup` event fires, calls `close()`
- **Editor Closes**: Returns to cell view without saving

## Browser-Specific Behavior

### Chrome/Edge
- Calendar popup with month/year dropdowns
- Clean, modern UI
- Fast selection

### Firefox
- Similar to Chrome
- Slightly different styling
- Good keyboard support

### Safari
- Native macOS/iOS picker
- Excellent mobile experience
- Integrates with system

### Mobile Browsers
- **iOS Safari**: Beautiful native wheel picker
- **Android Chrome**: Full calendar view
- **Best UX**: Users get familiar interface


## Enhancements

### 1. Add Min/Max Dates

You can do this natively without using `validator` 

Restrict date range:

```typescript
init(editor) {
  // ... existing code ...
  editor.input.setAttribute('min', '2024-01-01');
  editor.input.setAttribute('max', '2024-12-31');
}
```

### 2. Dynamic Min/Max from Cell Properties

Per-column date ranges:

```typescript
beforeOpen(editor, { cellProperties }) {
  if (cellProperties.minDate) {
    editor.input.setAttribute('min', cellProperties.minDate);
  }
  if (cellProperties.maxDate) {
    editor.input.setAttribute('max', cellProperties.maxDate);
  }
}

// Usage
columns: [{
  data: 'futureDate',
  ...cellDefinition,
  minDate: new Date().toISOString().split('T')[0], // Today or later
}]
```

### 3. Add Step Attribute

Jump by days, weeks, or months:

```typescript
editor.input.setAttribute('step', '7'); // Week increments
```

### 4. Handle Change Event

Auto-save on selection is already implemented in the example:

```typescript
init(editor) {
  // ... existing code ...
  editor.input.addEventListener('change', () => {
    editor.finishEditing();
  });
}
```

This is included in the basic implementation - when a date is selected, the editor automatically finishes editing and saves the value.

### 5. Different Display Formats per Column

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    const displayFormat = cellProperties.dateFormat || "MM/dd/yyyy";
    td.innerText = format(new Date(value), displayFormat);
    return td;
  }),
  // ... rest of definition
};

// Usage
columns: [
  { 
    data: 'dateUS',
    ...cellDefinition,
    dateFormat: "MM/dd/yyyy"
  },
  {
    data: 'dateEU',
    ...cellDefinition,
    dateFormat: "dd/MM/yyyy"
  }
]
```

---

**Congratulations!** You've created a zero-dependency date picker with native browser support and excellent mobile UX in under 60 lines of code.

