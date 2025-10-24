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

## Demo

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
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";
import { format } from "date-fns";

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

## Step 3: Create the Validator

```typescript
validator: (value, callback) => {    
  value = parseInt(value);
  callback(true);
}
```

**Current implementation:**
- Always returns `true`
- The `parseInt` doesn't make sense for dates

**Better implementation:**
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

Check that date is after another date 

```typescript
validator: (value, callback) => {    
  const result = isAfter(new Date(value), new Date(2001, 1, 11))
  callback(result);
}
```


## Step 4: Editor - Define Types

```typescript
editor: Handsontable.editors.BaseEditor.factory<{
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
}>({
  // ... methods
})
```

**Type breakdown:**
- `wrapper` - Container div for positioning and styling
- `input` - The native `<input type="date">` element

**Why a wrapper?**
- Better positioning control
- Can add borders, shadows, padding
- Separation of concerns (layout vs input)

## Step 5: Editor - Initialize (`init`)

Create the DOM structure once.

```typescript
init(editor) {
  // Create wrapper div
  editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.wrapper.style.display = "none";
  editor.wrapper.classList.add("htSelectEditor");
  
  // Create date input
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;      
  editor.input.setAttribute('type', 'date');
  editor.input.style = 'width: 100%; padding: 0;';
  
  // Assemble DOM
  editor.wrapper.appendChild(editor.input);
  editor.hot.rootElement.appendChild(editor.wrapper);      
}
```

**Key points:**

### `type="date"` attribute
```typescript
editor.input.setAttribute('type', 'date');
```
- Tells browser to use native date picker
- On mobile: Shows native date selection UI
- On desktop: Browser-specific date picker
- Returns value in ISO format: "YYYY-MM-DD"

### Why `editor.hot.rootDocument`?
- Handles shadow DOM and iframe contexts
- More robust than `document.createElement()`
- Ensures element is created in correct document

### Style: `width: 100%`
- Makes input fill the wrapper
- Wrapper will be sized to match cell

### Why `padding: 0`?
- Removes default input padding
- Makes input align perfectly with cell
- You can adjust based on your needs

## Step 6: Editor - Get Value (`getValue`)

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- Native date input automatically stores value in ISO format
- Return exactly what the browser gives us
- Handsontable will save this to the data source

**Example:**
- User selects: December 31, 2024 (via UI)
- `input.value`: "2024-12-31"
- Returned value: "2024-12-31"

## Step 7: Editor - Set Value (`setValue`)

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- Called when editor opens to show current cell value
- Native input expects ISO format
- If your data is already in ISO format, this just works!

**If your data is in different format:**
```typescript
setValue(editor, value) {
  // If value is a Date object
  if (value instanceof Date) {
    editor.input.value = value.toISOString().split('T')[0];
    return;
  }
  
  // If value is in US format: "12/31/2024"
  if (typeof value === 'string' && value.includes('/')) {
    const [month, day, year] = value.split('/');
    editor.input.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return;
  }
  
  // Otherwise assume ISO format
  editor.input.value = value;
}
```

## Step 8: Editor - Open (`open`)

Position the editor and trigger the native picker.

```typescript
open(editor) {
  const rect = editor.getEditedCellRect();
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
  
  requestAnimationFrame(() => {
    editor.input.showPicker();
  });
}
```

**Key concepts:**

### Positioning
```typescript
const rect = editor.getEditedCellRect();
```
- Gets cell's exact position and size
- Positions editor over the cell
- Creates visual continuity

### CSS Properties
```css
box-sizing: border-box;  // Include padding in width/height
margin: 0;               // No margin
padding: 0 4px;          // Small horizontal padding for comfort
```

### `showPicker()` method
```typescript
requestAnimationFrame(() => {
  editor.input.showPicker();
});
```

**What is `showPicker()`?**
- Modern Web API method
- Programmatically opens the native date picker
- Like the user clicking on the input
- Must be called in next frame otherwise it won't be position properlly. 

**Why `requestAnimationFrame()`?**
- Ensures DOM has fully updated before opening picker
- Without it, picker might not open on some browsers
- Small delay ensures everything is ready

## Step 9: Editor - Focus (`focus`)

```typescript
focus(editor) {
  editor.input.focus();
}
```

**When is this called?**
- When validation fails and `allowInvalid: false`
- When editor needs to regain focus
- When user presses certain keys

## Step 10: Editor - Close (`close`)

```typescript
close(editor) {
  editor.wrapper.style.display = 'none';
}
```

**What's happening:**
- Hide the wrapper
- Native picker automatically closes
- Editor is ready for next use

**Don't destroy elements:**
- Elements are reused (singleton pattern)
- Just hide, don't remove from DOM
- Better performance

## Step 11: Complete Cell Definition

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.innerText = format(new Date(value), "MM/dd/yyyy");
    return td;
  }),
  
  validator: (value, callback) => {    
    const date = new Date(value);
    callback(!isNaN(date.getTime()));
  },
  
  editor: Handsontable.editors.BaseEditor.factory<{
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
  }>({
    init(editor) {
      editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
      editor.wrapper.style.display = "none";
      editor.wrapper.classList.add("htSelectEditor");
      
      editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;      
      editor.input.setAttribute('type', 'date');
      editor.input.style = 'width: 100%; padding: 0;';
      
      editor.wrapper.appendChild(editor.input);
      editor.hot.rootElement.appendChild(editor.wrapper);      
    },
    
    getValue(editor) {
      return editor.input.value;
    },
    
    setValue(editor, value) {
      editor.input.value = value;
    },
    
    open(editor) {
      const rect = editor.getEditedCellRect();
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
      requestAnimationFrame(() => {
        editor.input.showPicker();
      });
    },
    
    focus(editor) {
      editor.input.focus();
    },
    
    close(editor) {
      editor.wrapper.style.display = 'none';
    }
  }),
};
```

## Step 12: Use in Handsontable

```typescript
const container = document.querySelector("#handsontable-grid")!;

new Handsontable(container, {
  data: [
    { id: 1, itemName: "Item 1", restockDate: "2024-12-31" },
    { id: 2, itemName: "Item 2", restockDate: "2024-06-15" },
    { id: 3, itemName: "Item 3", restockDate: "2024-03-20" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Restock Date",
  ],
  autoRowSize: true,
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    { data: "itemName", type: "text", width: 150 },
    {
      data: "restockDate",
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
});
```

**Key configuration:**
- `allowInvalid: false` - Rejects invalid dates
- `...cellDefinition` - Spreads renderer, validator, editor
- `autoRowSize: true` - Rows resize if needed

## How It Works - Complete Flow

1. **Initial Render**: Renderer shows "12/31/2024"
2. **User Double-Clicks**: Handsontable calls `open()`
3. **Editor Opens**: Wrapper positioned over cell
4. **Picker Shows**: `showPicker()` opens native date picker
5. **User Selects Date**: Native picker handles selection
6. **Input Updates**: `input.value` set to ISO format
7. **User Confirms**: Blur event or Enter key triggers save
8. **Validation**: Validator checks date is valid
9. **Save**: If valid, value saved to data
10. **Re-render**: Renderer shows new formatted date
11. **Editor Closes**: Wrapper hidden

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

## Troubleshooting

### Date format wrong in input
- **Problem**: Input shows ISO format instead of localized
- **Solution**: This is normal! Input stores ISO, picker shows localized
- **Note**: Renderer handles display format

### Value not saving
- **Problem**: Validator rejecting value
- **Solution**: Check validator logic, ensure ISO format accepted

### Input positioned wrong
- **Problem**: CSS conflicts
- **Solution**: Check `getEditedCellRect()` is called in `open()`

## Native Date Input Limitations

### What you CAN'T do:
❌ Customize picker appearance  
❌ Add time selection (use `<input type="datetime-local">`)  
❌ Show calendar inline  
❌ Add custom date shortcuts  
❌ Control first day of week reliably  
❌ Block specific dates easily  

### What you CAN do:
✅ Set min/max dates  
✅ Use browser's localization  
✅ Zero dependencies  
✅ Excellent mobile UX  
✅ Full accessibility  
✅ Fast performance  

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
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
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

Auto-save on selection:

```typescript
init(editor) {
  // ... existing code ...
  editor.input.addEventListener('change', () => {
    editor.finishEditing();
  });
}
```

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

## When to Use Native vs Library

### Use Native `<input type="date">` when:
- ✅ Building mobile-first applications
- ✅ Want zero dependencies
- ✅ Need accessibility out of the box
- ✅ Simple date selection is sufficient
- ✅ Trust browser's localization

### Use Flatpickr or similar when:
- ✅ Need consistent UX across browsers
- ✅ Require time selection
- ✅ Want custom styling
- ✅ Need advanced features (ranges, shortcuts)
- ✅ Building desktop-first applications

---

**Congratulations!** You've created a zero-dependency date picker with native browser support and excellent mobile UX in under 60 lines of code.

