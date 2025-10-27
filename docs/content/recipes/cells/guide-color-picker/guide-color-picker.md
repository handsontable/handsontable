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

::: example #example1 :hot-recipe --js 1

@[code](@/content/recipes/cells/guide-color-picker/javascript/example1.js)

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
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";

// Import the color picker library
import "@melloware/coloris/dist/coloris.css";
import Coloris from "@melloware/coloris";

// Initialize Coloris globally
Coloris.init();

registerAllModules();
```

**Why this matters:**
- Coloris needs to be initialized once globally
- We import both the factory functions we'll use

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

## Step 4: Create the Editor - Define Types

First, define what custom properties your editor needs:

```typescript
editor: Handsontable.editors.BaseEditor.factory<{
  wrapper: HTMLDivElement,
  input: HTMLInputElement
}>({
  // ... methods will go here
})
```

**What's happening:**
- TypeScript generic defines custom properties
- `wrapper` will hold a container `<div>` for positioning
- `input` will hold the `<input>` element that Coloris attaches to

## Step 5: Editor - Initialize (`init`)

The `init` method runs once when the editor is first created.

```typescript
init(editor) {
  // Create the wrapper and input element on init. This is a text input that color picker will be attached to.
  editor.wrapper = editor.hot.rootDocument.createElement('DIV') as HTMLDivElement;

  // Hide it initially
  editor.wrapper.style.display = 'none';
  editor.wrapper.classList.add('htSelectEditor');
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
  
  // Tell Coloris to attach to this input
  editor.input.setAttribute('data-coloris', '');
  editor.input.style = 'width: 100%; height: 100%; padding: 0;margin: 0;border: none; opacity: 0;';

  // Add to DOM
  editor.hot.rootElement.appendChild(editor.wrapper);
  editor.wrapper.appendChild(editor.input);
  
  // Configure Coloris for this input
  Coloris({
    el: editor.input, 
    closeButton:true, 
    closeLabel:"Apply Colour", 
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

**Key points:**
- Use `editor.hot.rootDocument.createElement()` (not `document.createElement()`)
- This ensures compatibility with shadow DOM and iframes
- `data-coloris` attribute tells Coloris to activate on this input
- The `close` event is triggered when user confirms their selection
- `editor.finishEditing()` saves the value and closes the editor

**Why not `document.createElement()`?**
- Handsontable might be in an iframe or shadow DOM
- `editor.hot.rootDocument` ensures correct document context

## Step 6: Editor - Get Value (`getValue`)

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- This is called when Handsontable needs to save the cell value
- Simply return the input's current value
- Coloris automatically updates `input.value` when color is selected

## Step 7: Editor - Set Value (`setValue`)

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- This is called to initialize the editor with the cell's current value
- Set the input's value to the provided value
- Coloris will display this color when opened

## Step 8: Editor - Open (`open`)

```typescript
open(editor) {
  const rect = editor.getEditedCellRect();
  editor.wrapper.style = `
    display: block;
    border: none;
    padding: 0;
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.start}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
  `;
  editor.input.click(); // Trigger Coloris to open
}
```

**What's happening:**
- `getEditedCellRect()` returns the cell's position and dimensions
- Position the input absolutely over the cell
- Show the input wrapper (`display: block`)
- Programmatically click it to open Coloris

**Why position over the cell?**
- Visual continuity - editor appears where the cell was
- User knows what they're editing

## Step 9: Editor - Focus (`focus`)

```typescript
focus(editor) {
  editor.input.focus();
}
```

**What's happening:**
- Called when the editor needs to regain focus
- Happens when validation fails and `allowInvalid: false`

## Step 10: Editor - Close (`close`)

```typescript
close(editor) {
  editor.wrapper.style.display = 'none';
}
```

**What's happening:**
- Hide the input when editing is done
- Coloris will automatically close its picker

## Step 11: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.style.backgroundColor = `${value}`;
    td.innerHTML = `<b>${value}</b>`;
    return td;
  }),
  validator: (value, callback) => {
    callback(value.length === 7 && value[0] == '#'); 
  },
  editor: Handsontable.editors.BaseEditor.factory<{wrapper: HTMLDivElement, input: HTMLInputElement}>({
    init(editor) {
      editor.wrapper = editor.hot.rootDocument.createElement('DIV') as HTMLDivElement;
      editor.wrapper.style.display = 'none';
      editor.wrapper.classList.add('htSelectEditor');
      editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
      editor.input.setAttribute('data-coloris', '');
      editor.input.style = 'width: 100%; height: 100%; padding: 0;margin: 0;border: none; opacity: 0;';
      editor.hot.rootElement.appendChild(editor.wrapper);
      editor.wrapper.appendChild(editor.input);
      Coloris({el: editor.input, closeButton:true, closeLabel:"Apply Colour", alpha: false, wrap: false});
      editor.input.addEventListener('close', (event) => {
        editor.finishEditing(); 
      });
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
    open(editor) {
      const rect = editor.getEditedCellRect();
      editor.wrapper.style = `display: block; border:none; padding:0; position: absolute; top: ${rect.top}px; left: ${rect.start}px; width: ${rect.width}px; height: ${rect.height}px;`;
      editor.input.click(); 
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
    { id: 1, itemName: "Apple", color: "#ff0000" },
    { id: 2, itemName: "Banana", color: "#ffff00" },
    { id: 3, itemName: "Grape", color: "#800080" },
  ],
  colHeaders: ["ID", "Item Name", "Color"],
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    { data: "itemName", type: "text", width: 150 },
    { 
      data: "color",
      width: 150,
      allowInvalid: false, // Reject invalid colors
      ...cellDefinition, // Spread our custom cell definition
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
});
```

**Key configuration:**
- `allowInvalid: false` - Prevents saving invalid colors
- `...cellDefinition` - Spreads renderer, validator, and editor into the column config

## How It Works

1. **Initial Render**: Renderer shows the hex color with colored background
2. **User Double-Clicks Cell**: Handsontable calls `open()`
3. **Editor Opens**: Input appears over cell, Coloris picker opens
4. **User Selects Color**: Coloris updates input value
5. **User Clicks "Apply Colour"**: `close` event fires, `finishEditing()` is called
6. **Validation**: Validator checks the hex format
7. **Save**: If valid, value is saved; if invalid and `allowInvalid: false`, editor stays open
8. **Close**: Editor closes, renderer shows new color

## Troubleshooting

### Color picker not opening
- Ensure `Coloris.init()` is called before creating Handsontable
- Check that `data-coloris` attribute is set
- Verify `editor.input.click()` is called in `open()`

### Value not saving
- Check that `'close'` event listener is attached
- Verify `editor.finishEditing()` is called
- Check validator is returning `true`

### Input not positioned correctly
- Ensure `getEditedCellRect()` is called
- Check CSS positioning is `position: absolute`
- Verify `top`, `left`, `width`, `height` are set

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

### 4. Inline Editing

Show picker immediately on cell selection:

```typescript
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  // Could auto-open picker here
  // But might be annoying for keyboard navigation
}
```


---

**Congratulations!** You've created a fully functional color picker cell in under 100 lines of code.


