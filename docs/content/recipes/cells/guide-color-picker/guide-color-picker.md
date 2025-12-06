---
id: 2d2b22ef
title: Color picker
metaTitle: Color Picker Cell - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom color picker cell using the Coloris library, supporting live preview, validation, and custom themes.
permalink: /recipes/color-picker
canonicalUrl: /recipes/color-picker
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 050bc847
  metaTitle: Color Picker Cell - React Data Grid | Handsontable
angular:
  id: a471c83c
  metaTitle: Color Picker Cell - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cells
---

# Color Picker Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom color picker cell using the [Coloris](https://github.com/melloware/coloris-npm) library. Users can click a cell to open a color picker, select a color, and see it rendered with a colored background.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Libraries:** `@melloware/coloris`

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-color-picker/javascript/example1.js)
@[code](@/content/recipes/cells/guide-color-picker/javascript/example1.ts)

:::

:::

## What You'll Build

A cell that:
- Displays the color value as text with a colored background
- Opens a color picker when edited
- Validates hex color format
- Saves the value when "Apply Colour" is clicked

## Prerequisites

```bash
npm install @melloware/coloris
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import "@melloware/coloris/dist/coloris.css";
import Coloris from '@melloware/coloris';

Coloris.init();
registerAllModules();
```

**Why this matters:**
- Coloris needs to be initialized once globally
- Import Coloris library for color picker functionality
- CSS import is commented out in example but should be included in production

## Step 2: Create the Renderer

The renderer controls how the cell looks when not being edited.

```typescript
renderer: Handsontable.renderers.factory(({ td, value }) => {
  td.style.backgroundColor = `${value}`;
  td.innerHTML = `<b>${value}</b>`;
  return td;
})
```

**What's happening:**
- `td` is the table cell DOM element
- `value` is the cell's current value (e.g., "#ff0000")
- We set the background color to the value
- We display the hex code in bold text
- We return `td` (optional but good practice)

**Customization ideas:**
- Add a color swatch: `td.innerHTML = '<span style="..."></span>' + value`
- Handle empty values: `if (!value) { td.innerText = 'No color'; }`
- Add contrast-aware text color based on background

## Step 3: Create the Validator

The validator ensures only valid hex colors are saved.

```typescript
validator: (value, callback) => {
  callback(value.length === 7 && value[0] == '#');
}
```

**What's happening:**
- Check if value is exactly 7 characters
- Check if it starts with '#'
- Call `callback(true)` for valid, `callback(false)` for invalid

**Improvements for production:**
- Use regex: `/^#[0-9A-Fa-f]{6}$/`
- Support short format: `#fff`
- Support RGB/RGBA values

## Step 4: Editor - Initialize (`init`)

Create the input element that Coloris will attach to.

```typescript
init(editor) {
  // Create the input element on init. This is a text input that color picker will be attached to.
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
  editor.input.setAttribute('data-coloris', '');
}
```

**What's happening:**
1. Create an `input` element using `editor.hot.rootDocument.createElement()`
2. Set `data-coloris` attribute to tell Coloris to attach to this input
3. The `Handsontable.editors.BaseEditor.factory` helper will handle container creation and DOM insertion

**Key points:**
- Use `editor.hot.rootDocument.createElement()` (not `document.createElement()`)
- This ensures compatibility with shadow DOM and iframes
- `data-coloris` attribute tells Coloris to activate on this input
- Container and DOM insertion are handled by `Handsontable.editors.BaseEditor.factory`

**Why not `document.createElement()`?**
- Handsontable might be in an iframe or shadow DOM
- `editor.hot.rootDocument` ensures correct document context

## Step 5: Editor - After Init Hook (`afterInit`)

Configure Coloris and set up the close event handler.

```typescript
afterInit(editor) {
  Coloris({
    el: editor.input, 
    closeButton: true, 
    closeLabel: "Apply Colour", 
    // We don't want alpha channel 
    alpha: false, 
    // Hide Coloris additional input UI
    wrap: false
  });
  editor.input.addEventListener('close', (event) => {
    editor.finishEditing(); // close the color picker and save value on pressing "Apply Colour"
  });
}
```

**What's happening:**
1. Configure Coloris for the input element
2. Enable close button with custom label "Apply Colour"
3. Disable alpha channel (no transparency)
4. Hide additional input UI wrapper
5. Listen for 'close' event to finish editing when user confirms

**Why `afterInit` instead of `init`?**
- `afterInit` runs after the input is added to the DOM
- Coloris needs the element to be in the DOM to attach properly
- Ensures proper initialization order

## Step 6: Editor - After Open Hook (`afterOpen`)

Trigger the color picker to open when the editor is opened.

```typescript
afterOpen(editor) {
  editor.input.click();
}
```

**What's happening:**
- Called after the editor container is positioned and shown
- Programmatically clicks the input to trigger Coloris color picker
- Coloris will open its picker UI when the input is clicked

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- Ensures the input is ready before triggering Coloris
- The `Handsontable.editors.BaseEditor.factory` helper handles positioning in `open`

## Step 7: Editor - Get Value (`getValue`)

Return the current color value from the input.

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- Called when Handsontable needs to save the cell value
- Returns the input's current value (hex color code)
- Coloris automatically updates `input.value` when color is selected

## Step 8: Editor - Set Value (`setValue`)

Initialize the editor with the cell's current color value.

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- Called to initialize the editor with the cell's current value
- Sets the input's value to the provided hex color
- Coloris will display this color when opened

## Step 9: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.style.backgroundColor = `${value}`;
    td.innerHTML = `<b>${value}</b>`;
    return td;
  }),
  validator: (value, callback) => {
    callback(value.length === 7 && value[0] == '#'); // validate color format
  },
  editor: Handsontable.editors.BaseEditor.factory<{input: HTMLInputElement}>({
    init(editor) {
      // create the input element on init. This is a text input that color picker will be attached to.
      editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
      editor.input.setAttribute('data-coloris', '');
    },
    afterInit(editor) {
      Coloris({el: editor.input, closeButton:true, closeLabel:"Apply Colour",  alpha: false, wrap: false});
      editor.input.addEventListener('close', (event) => {
        editor.finishEditing(); // close the color picker and save value on pressing "Apply Colour"
      });
    },
    afterOpen(editor) {
      editor.input.click();
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
  }),
};
```

**What's happening:**
- **renderer**: Displays hex color code with colored background
- **validator**: Ensures hex color format (# followed by 6 characters)
- **editor**: Uses `Handsontable.editors.BaseEditor.factory` helper with:
  - `init`: Creates input element and sets `data-coloris` attribute
  - `afterInit`: Configures Coloris and sets up close event handler
  - `afterOpen`: Triggers color picker to open
  - `getValue` and `setValue`: Standard value management

**Note:** The `Handsontable.editors.BaseEditor.factory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 10: Use in Handsontable

```typescript
const container = document.querySelector("#example1")!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: "Lunar Core", color: "#FF5733" },
    { id: 2, itemName: "Zero Thrusters", color: "#33FF57" },
    { id: 3, itemName: "EVA Suits", color: "#3357FF" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Item Color",
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: "id", type: "numeric" },
    { data: "itemName", type: "text" },
    {
      data: "color",
      ...cellDefinition,
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer, validator, and editor into the column config
- The validator ensures only valid hex colors are saved

## How It Works - Complete Flow

1. **Initial Render**: Cell displays hex color code with colored background
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **Color Picker Opens**: `afterOpen` triggers `input.click()`, Coloris picker appears
4. **User Selects Color**: Coloris updates input value as user picks color
5. **User Clicks "Apply Colour"**: `close` event fires, `finishEditing()` is called
6. **Validation**: Validator checks hex format (# followed by 6 characters)
7. **Save**: If valid, value is saved to cell; if invalid, editor may stay open
8. **Editor Closes**: Container hidden, cell renderer shows new color


## Enhancements

### 1. Add Color Swatches

Provide preset colors:

```typescript
Coloris({
  el: editor.input,
  swatches: [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff'
  ]
});
```

### 2. Support Alpha Channel

Allow transparency:

```typescript
Coloris({
  el: editor.input,
  alpha: true,
  format: 'rgba'
});

// Update validator
validator: (value, callback) => {
  const rgbaRegex = /^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)$/;
  callback(rgbaRegex.test(value));
}
```

### 3. Custom Color Theme

Match your design system:

```typescript
Coloris({
  theme: 'pill',
  themeMode: 'dark',
  formatToggle: true
});
```

### 4. Before Open Hook

Initialize the editor with the cell's current value before opening:

```typescript
beforeOpen(editor, { originalValue }) {
  editor.setValue(originalValue);
}
```

This ensures Coloris displays the current color when opened. The `Handsontable.editors.BaseEditor.factory` helper calls this automatically if not specified.

### 5. Custom Color Formats

Support RGB/RGBA or other formats:

```typescript
Coloris({
  el: editor.input,
  alpha: true,
  format: 'rgba'
});

// Update validator
validator: (value, callback) => {
  const rgbaRegex = /^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)$/;
  callback(rgbaRegex.test(value));
}
```


---

**Congratulations!** You've created a fully functional color picker cell using the Coloris library with the `Handsontable.editors.BaseEditor.factory` helper, providing an intuitive color selection experience in your data grid!


