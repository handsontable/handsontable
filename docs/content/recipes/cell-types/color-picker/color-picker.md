---
id: 2d2b22ef
title: Color picker
metaTitle: Color Picker Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom color picker cell using the Coloris library, supporting live preview, validation, and custom themes.
permalink: /recipes/cell-types/color-picker
canonicalUrl: /recipes/cell-types/color-picker
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 050bc847
  metaTitle: Color Picker Cell Type - React Data Grid | Handsontable
angular:
  id: a471c83c
  metaTitle: Color Picker Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

# Color Picker Cell Type - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom color picker cell using the [Coloris](https://github.com/melloware/coloris-npm) library. Users can click a cell to open a color picker, select a color, and see it rendered with a colored background.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `@melloware/coloris`

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps @melloware/coloris

@[code](@/content/recipes/cell-types/color-picker/javascript/example1.js)
@[code](@/content/recipes/cell-types/color-picker/javascript/example1.ts)
@[code](@/content/recipes/cell-types/color-picker/javascript/example1.css)

:::

:::

## What You'll Build

A cell that:
- Displays a colored circle swatch in the cell
- Opens a color picker with dark mode support when edited
- Shows a styled editor input with Handsontable's native blue border
- Validates hex color format
- Saves the value when "Apply Colour" is clicked
- Closes the picker on Tab or Escape

## Prerequisites

```bash
npm install @melloware/coloris
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';
import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';

Coloris.init();
registerAllModules();
```

**Why this matters:**
- `editorFactory` and `rendererFactory` are Handsontable helpers for creating custom editors and renderers
- Coloris needs to be initialized once globally
- Import Coloris CSS for the color picker UI styling

## Step 2: Add CSS Styling

Create a separate CSS file for the cell and editor styles. This uses Handsontable CSS custom properties (tokens) to match the native editor appearance.

```css
.color-picker-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-picker-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.color-picker-editor {
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  outline: none;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  color: var(--ht-cell-editor-foreground-color);
  padding: var(--ht-cell-vertical-padding, 4px) var(--ht-cell-horizontal-padding, 8px);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.color-picker-editor:focus {
  outline: none;
}
```

**What's happening:**
- `.color-picker-cell` centers the circle swatch inside the cell
- `.color-picker-swatch` renders a small circle with `border-radius: 50%`
- `.color-picker-editor` mirrors Handsontable's native text editor styling using CSS tokens like `--ht-cell-editor-border-color` and `--ht-cell-editor-border-width`, so the editor automatically adapts to custom themes

## Step 3: Create the Renderer

The renderer controls how the cell looks when not being edited. It displays a colored circle swatch.

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = `<span class="color-picker-cell">` +
    `<span class="color-picker-swatch" style="background:${value}"></span>` +
  `</span>`;
})
```

**What's happening:**
- `td` is the table cell DOM element
- `value` is the cell's current value (e.g., "#ff0000")
- We render a circle swatch with the color as its background
- The swatch is centered inside the cell via CSS flexbox

## Step 4: Create the Validator

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

## Step 5: Editor - Initialize (`init`)

Create the input element that Coloris will attach to, and apply the editor CSS class.

```typescript
init(editor) {
  editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
  editor.input.setAttribute('data-coloris', '');
  editor.input.classList.add('color-picker-editor');
}
```

**What's happening:**
1. Create an `input` element using `editor.hot.rootDocument.createElement()`
2. Set `data-coloris` attribute to tell Coloris to attach to this input
3. Add the `color-picker-editor` CSS class for the blue border styling
4. The `editorFactory` helper will handle container creation and DOM insertion

**Key points:**
- Use `editor.hot.rootDocument.createElement()` (not `document.createElement()`) for iframe/shadow DOM compatibility
- `data-coloris` attribute tells Coloris to activate on this input
- The CSS class applies Handsontable's native editor border style via CSS tokens

## Step 6: Editor - After Init Hook (`afterInit`)

Configure Coloris and set up the close event handler.

```typescript
afterInit(editor) {
  Coloris({
    el: editor.input,
    closeButton: true,
    closeLabel: 'Apply Colour',
    alpha: false,
    wrap: false
  });
  editor.input.addEventListener('close', () => {
    editor.finishEditing();
  });
}
```

**What's happening:**
1. Configure Coloris for the input element
2. Enable close button with custom label "Apply Colour"
3. Disable alpha channel (no transparency)
4. Hide additional input UI wrapper
5. Listen for `close` event to finish editing when user clicks "Apply Colour"

**Why `afterInit` instead of `init`?**
- `afterInit` runs after the input is added to the DOM
- Coloris needs the element to be in the DOM to attach properly

## Step 7: Editor - After Open Hook (`afterOpen`)

Trigger the color picker to open and detect dark mode.

```typescript
afterOpen(editor) {
  const isDark = editor.hot.rootDocument.documentElement
    .getAttribute('data-theme') === 'dark';

  Coloris({ themeMode: isDark ? 'dark' : 'light' });
  editor.input.click();
}
```

**What's happening:**
- Detects the current theme by reading the `data-theme` attribute on `<html>`
- Sets Coloris `themeMode` to `'dark'` or `'light'` accordingly
- Programmatically clicks the input to trigger the Coloris picker

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- The `editorFactory` helper handles positioning in `open`

## Step 8: Editor - After Close Hook (`afterClose`)

Ensure the Coloris popup is hidden when the editor closes.

```typescript
afterClose() {
  Coloris.close();
}
```

**What's happening:**
- Called when the editor is closed (by Tab, Escape, clicking outside, etc.)
- Programmatically closes the Coloris picker popup via `Coloris.close()`
- Without this, the picker popup could remain visible after the editor closes

## Step 9: Editor - Get Value / Set Value

Standard value management hooks.

```typescript
getValue(editor) {
  return editor.input.value;
}
```

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- `getValue` returns the input's current value (hex color code) when Handsontable saves the cell
- `setValue` initializes the editor with the cell's current color value
- Coloris automatically updates `input.value` when a color is selected

## Step 10: Editor - Keyboard Shortcuts

Add a Tab shortcut to close the editor.

```typescript
shortcuts: [
  {
    keys: [['Tab']],
    callback: (editor) => {
      editor.finishEditing();
    },
  },
]
```

**What's happening:**
- Pressing Tab closes the editor and saves the current value
- Uses the `editorFactory` shortcuts API to register key bindings
- Combined with `afterClose`, this also hides the Coloris picker popup

## Step 11: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = `<span class="color-picker-cell">` +
      `<span class="color-picker-swatch" style="background:${value}"></span>` +
    `</span>`;
  }),
  validator: (value, callback) => {
    callback(value.length === 7 && value[0] == '#');
  },
  editor: editorFactory<{ input: HTMLInputElement }>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
      editor.input.setAttribute('data-coloris', '');
      editor.input.classList.add('color-picker-editor');
    },
    afterInit(editor) {
      Coloris({ el: editor.input, closeButton: true, closeLabel: 'Apply Colour', alpha: false, wrap: false });
      editor.input.addEventListener('close', () => {
        editor.finishEditing();
      });
    },
    afterOpen(editor) {
      const isDark = editor.hot.rootDocument.documentElement
        .getAttribute('data-theme') === 'dark';

      Coloris({ themeMode: isDark ? 'dark' : 'light' });
      editor.input.click();
    },
    afterClose() {
      Coloris.close();
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
    shortcuts: [
      {
        keys: [['Tab']],
        callback: (editor) => {
          editor.finishEditing();
        },
      },
    ],
  }),
};
```

**What's happening:**
- **renderer**: Displays a colored circle swatch centered in the cell
- **validator**: Ensures hex color format (# followed by 6 characters)
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates styled input element with `data-coloris` attribute
  - `afterInit`: Configures Coloris and sets up close event handler
  - `afterOpen`: Detects dark mode and triggers the color picker
  - `afterClose`: Hides the Coloris popup when editor closes
  - `shortcuts`: Tab key closes the editor
  - `getValue` / `setValue`: Standard value management

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 12: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data: [
    { id: 1, itemName: 'Lunar Core', color: '#FF5733' },
    { id: 2, itemName: 'Zero Thrusters', color: '#33FF57' },
    { id: 3, itemName: 'EVA Suits', color: '#3357FF' },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Item Color',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'itemName', type: 'text' },
    {
      data: 'color',
      ...cellDefinition,
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer, validator, and editor into the column config
- The validator ensures only valid hex colors are saved

## How It Works - Complete Flow

1. **Initial Render**: Cell displays a colored circle swatch
2. **User Double-Clicks or F2**: Editor opens with a styled input (blue border), container positioned over cell
3. **Dark Mode Detection**: `afterOpen` checks `data-theme` and sets Coloris theme accordingly
4. **Color Picker Opens**: `afterOpen` triggers `input.click()`, Coloris picker appears
5. **User Selects Color**: Coloris updates input value as user picks color
6. **User Clicks "Apply Colour"**: `close` event fires, `finishEditing()` is called
7. **Validation**: Validator checks hex format (# followed by 6 characters)
8. **Save**: If valid, value is saved to cell; if invalid, editor may stay open
9. **Editor Closes**: `afterClose` calls `Coloris.close()` to hide the picker, cell renderer shows updated swatch


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

Change the Coloris visual theme:

```typescript
Coloris({
  theme: 'pill',
  formatToggle: true
});
```

**Note:** Dark mode is already handled automatically by detecting the `data-theme` attribute in the `afterOpen` hook.

---

**Congratulations!** You've created a fully functional color picker cell using the Coloris library with the `editorFactory` helper, featuring a circle swatch renderer, dark mode support, and native Handsontable editor styling!
