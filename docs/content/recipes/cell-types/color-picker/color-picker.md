---
type: how-to
id: 2d2b22ef
title: Color picker
metaTitle: Color Picker Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom color picker cell using the Pickr library, with a button to open the picker, live preview, hex validation, and nano theme.
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

This tutorial shows you how to integrate the Pickr color picker library as a custom Handsontable cell editor, with a swatch renderer and hex validation.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps @simonwep/pickr

@[code collapse={11-196}](@/content/recipes/cell-types/color-picker/javascript/example1.js)
@[code collapse={11-198}](@/content/recipes/cell-types/color-picker/javascript/example1.ts)
@[code](@/content/recipes/cell-types/color-picker/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps @simonwep/pickr

@[code](@/content/recipes/cell-types/color-picker/react/example1.css)
@[code](@/content/recipes/cell-types/color-picker/react/example1.jsx)
@[code](@/content/recipes/cell-types/color-picker/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps @simonwep/pickr

@[code](@/content/recipes/cell-types/color-picker/angular/example1.ts)
@[code](@/content/recipes/cell-types/color-picker/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom color picker cell using the [Pickr](https://github.com/Simonwep/pickr) library. Users can click a cell to open a color picker, select a color, and see it rendered with a colored background.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `@simonwep/pickr`

## What You'll Build

A cell that:
- Displays a colored circle swatch in the cell
- Opens a color picker when edited via an "Open color picker" button
- Shows a styled editor input with Handsontable's native blue border
- Validates hex color format
- Updates the value as you pick a color; closing the picker saves and finishes editing
- Closes the picker on Tab or Escape

## Prerequisites

```bash
npm install @simonwep/pickr
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

registerAllModules();
```

**Why this matters:**
- `editorFactory` and `rendererFactory` are Handsontable helpers for creating custom editors and renderers
- Pickr is created per-editor in the `afterInit` hook and attached to a button
- Import Pickr theme CSS (e.g. `nano.min.css`) for the color picker UI styling

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
  border: none;
  outline: none;
  box-sizing: border-box !important;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.pickr {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
}
```

**What's happening:**
- `.color-picker-cell` centers the circle swatch inside the cell
- `.color-picker-swatch` renders a small circle with `border-radius: 50%`
- `.color-picker-editor` removes default input borders and appearance so the editor can be styled as needed

## Step 3: Create the Renderer

The renderer controls how the cell looks when not being edited. The renderer displays a colored circle swatch.

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = `<span class="color-picker-cell"><span class="color-picker-swatch" style="background:${value}"></span></span>`;
})
```

**What's happening:**
- `td` is the table cell DOM element
- `value` is the cell's current value (e.g., "#ff0000")
- The renderer displays a circle swatch with the color as its background
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

Create the input element that will hold the hex value, and apply the editor CSS class. A separate button for opening the picker is added in `afterInit`.

```typescript
init(editor) {
  editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
  editor.input.setAttribute('aria-label', 'Open color picker');
  editor.input.classList.add('color-picker-editor');
}
```

**What's happening:**
1. Create an `input` element using `editor.hot.rootDocument.createElement()`
2. Set an aria-label for accessibility
3. Add the `color-picker-editor` CSS class for the blue border styling
4. The `editorFactory` helper will handle container creation and DOM insertion

**Key points:**
- Use `editor.hot.rootDocument.createElement()` (not `document.createElement()`) for iframe/shadow DOM compatibility
- The input stores the current hex value; a button added in `afterInit` will open the Pickr popup
- The CSS class styles the editor (no border, full size) so the picker button is the main control

## Step 6: Editor - After Init Hook (`afterInit`)

Create a button, attach Pickr to it, and set up the `change` and `hide` event handlers. Setting `preventCloseElement` keeps the editor open when the user clicks inside the Pickr popup.

```typescript
afterInit(editor) {
  const button = editor.hot.rootDocument.createElement('button');
  button.textContent = 'Open color picker';
  button.classList.add('color-picker-button');
  editor.input.after(button);

  editor.pickr = Pickr.create({
    el: button,
    theme: 'nano',
    default: editor.input.value || '#000000',
    autoReposition: false,
    padding: 0,
    components: {
      preview: true,
      hue: true,
    }
  });

  // Collapse the Pickr trigger button so it doesn't add vertical space
  // between the cell editor and the popup.
  editor.pickr._root.root.style.height = '0';
  editor.pickr._root.root.style.overflow = 'hidden';

  editor.preventCloseElement = editor.pickr._root.app;

  editor.pickr.on('change', (color) => {
    if (color) {
      const hex = color.toHEXA().toString();
      editor.input.value = hex;
    }
  });

  editor.pickr.on('hide', () => {
    if (Date.now() - editor._openedAt < 400) {
      editor.pickr.show();

      return;
    }
    editor.finishEditing();
  });
}
```

**What's happening:**
1. Create a button and insert it after the input so users can open the picker
2. Create a Pickr instance with theme `nano` and preview + hue components
3. Set `editor.preventCloseElement` to the Pickr root so clicking inside the popup doesn't close the editor
4. On `change`, update the input value from the selected color (using `color.toHEXA().toString()`)
5. On `hide`, call `editor.finishEditing()` so closing the picker saves the value and closes the editor

**Why `afterInit` instead of `init`?**
- `afterInit` runs after the input is added to the DOM
- Pickr needs the button to be in the DOM to attach properly

## Step 7: Editor - After Open Hook (`afterOpen`)

Set the current color and show the Pickr picker.

```typescript
afterOpen(editor) {
  editor._openedAt = Date.now();
  editor.pickr.setColor(editor.input.value || '#000000');
  editor.pickr.show();

  // Pickr positions its popup relative to the trigger button with an
  // internal offset. Use double-rAF to ensure Pickr's own positioning
  // is complete before overriding the top to sit flush below the cell.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cellRect = editor.TD.getBoundingClientRect();

      editor.pickr._root.app.style.top = `${cellRect.bottom}px`;
    });
  });
}
```

**What's happening:**
- Sets the picker to the cell's current color
- Calls `show()` to open the Pickr popup

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- The `editorFactory` helper handles positioning in `open`

## Step 8: Editor - After Close Hook (`afterClose`)

Ensure the Pickr popup is hidden when the editor closes.

```typescript
afterClose(editor) {
  editor.pickr._root.app.classList.remove('visible');
  editor.pickr.hide();
}
```

**What's happening:**
- Called when the editor is closed (by Tab, Escape, clicking outside, etc.)
- Hides the Pickr picker via `editor.pickr.hide()`
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
- On Pickr's `change` event, `editor.input.value` is set from the selected color; when the user closes the picker, `hide` fires and `editor.finishEditing()` is called

## Step 10: Editor - Keyboard Shortcuts

Add a Tab shortcut to hide the picker (which triggers the `hide` event and then `finishEditing()`).

```typescript
shortcuts: [
  {
    keys: [['Tab']],
    callback: (editor) => {
      editor.pickr.hide();
    },
  },
]
```

**What's happening:**
- Pressing Tab hides the Pickr popup, which fires the `hide` event and calls `editor.finishEditing()`
- Uses the `editorFactory` shortcuts API to register key bindings
- `afterClose` also calls `editor.pickr.hide()` when the editor closes by other means

## Step 11: Complete Cell Definition

Put it all together. The editor uses a hidden input for the value and a button that opens the Pickr popup; color is updated on `change` and editing finishes when the picker is closed (`hide`).

```typescript
type ColorPickerEditor = {
  input: HTMLInputElement;
  pickr: ReturnType<typeof Pickr.create>;
  preventCloseElement: HTMLElement;
};

const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = `<span class="color-picker-cell"><span class="color-picker-swatch" style="background:${value}"></span></span>`;
  }),
  validator: (value, callback) => {
    callback(value.length === 7 && value[0] == '#');
  },
  editor: editorFactory<ColorPickerEditor>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
      editor.input.setAttribute('aria-label', 'Open color picker');
      editor.input.classList.add('color-picker-editor');
    },
    afterInit(editor) {
      const button = editor.hot.rootDocument.createElement('button');
      button.textContent = 'Open color picker';
      button.classList.add('color-picker-button');
      editor.input.after(button);

      editor.pickr = Pickr.create({
        el: button,
        theme: 'nano',
        default: editor.input.value || '#000000',
        autoReposition: false,
        padding: 0,
        components: { preview: true, hue: true },
      });

      // Collapse the Pickr trigger button so it doesn't add vertical space
      // between the cell editor and the popup.
      editor.pickr._root.root.style.height = '0';
      editor.pickr._root.root.style.overflow = 'hidden';

      editor.preventCloseElement = editor.pickr._root.app;

      editor.pickr.on('change', (color) => {
        if (color) editor.input.value = color.toHEXA().toString();
      });
      editor.pickr.on('hide', () => {
        if (Date.now() - editor._openedAt < 400) {
          editor.pickr.show();

          return;
        }
        editor.finishEditing();
      });
    },
    afterOpen(editor) {
      editor._openedAt = Date.now();
      editor.pickr.setColor(editor.input.value || '#000000');
      editor.pickr.show();

      // Pickr positions its popup relative to the trigger button with an
      // internal offset. Override the top to sit flush below the cell.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cellRect = editor.TD.getBoundingClientRect();

          editor.pickr._root.app.style.top = `${cellRect.bottom}px`;
        });
      });
    },
    afterClose(editor) {
      editor.pickr._root.app.classList.remove('visible');
      editor.pickr.hide();
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
        callback: (editor) => editor.pickr.hide(),
      },
    ],
  }),
};
```

**What's happening:**
- **renderer**: Displays a colored circle swatch centered in the cell
- **validator**: Ensures hex color format (# followed by 6 characters)
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates styled input element and aria-label
  - `afterInit`: Creates button, Pickr on the button (nano theme), `preventCloseElement`, and `change` / `hide` handlers
  - `afterOpen`: Sets current color and shows the picker
  - `afterClose`: Hides the Pickr popup when editor closes
  - `shortcuts`: Tab key hides the picker (which triggers `hide` and then `finishEditing`)
  - `getValue` / `setValue`: Standard value management via the input

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 12: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data: [
    { id: 1, itemName: 'Lunar Core', color: '#FF5733', itemNo: 'XJ-12', cost: 350000, valueStock: 700000 },
    { id: 2, itemName: 'Zero Thrusters', color: '#33FF57', itemNo: 'QL-54', cost: 450000, valueStock: 0 },
    { id: 3, itemName: 'EVA Suits', color: '#3357FF', itemNo: 'PM-67', cost: 150000, valueStock: 7500000 },
  ],
  colHeaders: ['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  columns: [
    { data: 'id', type: 'numeric', width: 80, headerClassName: 'htLeft' },
    { data: 'itemName', type: 'text', width: 200, headerClassName: 'htLeft' },
    { data: 'color', headerClassName: 'htLeft', ...cellDefinition },
    { data: 'itemNo', type: 'text', width: 100, headerClassName: 'htLeft' },
    { data: 'cost', type: 'numeric', width: 70, headerClassName: 'htLeft' },
    { data: 'valueStock', type: 'numeric', width: 130, headerClassName: 'htRight' },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer, validator, and editor into the color column config
- The validator ensures only valid hex colors are saved
- The live example uses more rows and random hex colors; you can use any data that includes a `color` field

## How It Works - Complete Flow

1. **Initial Render**: Cell displays a colored circle swatch
2. **User Double-Clicks or <kbd>F2</kbd>**: Editor opens with a styled input and an "Open color picker" button
3. **Color Picker Opens**: `afterOpen` sets the current color and calls `pickr.show()`
4. **User Selects Color**: Pickr updates the preview; the `change` event updates `editor.input.value` with the hex from `color.toHEXA().toString()`
5. **User Closes Picker (or presses Tab)**: The `hide` event fires (or Tab triggers `pickr.hide()`), then `editor.finishEditing()` is called
6. **Validation**: Validator checks hex format (# followed by 6 characters)
7. **Save**: If valid, value is saved to cell; if invalid, editor may stay open
8. **Editor Closes**: `afterClose` calls `editor.pickr.hide()`, cell renderer shows updated swatch


## Enhancements

### 1. Add Color Swatches

Provide preset colors:

```typescript
editor.pickr = Pickr.create({
  el: button,
  // ...other options
  swatches: [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff'
  ],
});
```

### 2. Support Alpha Channel

Allow transparency by setting `lockOpacity: false` and enabling the opacity component:

```typescript
Pickr.create({
  // ...
  lockOpacity: false,
  components: {
    preview: true,
    opacity: true,
    hue: true,
    // ...
  },
});

// Update validator for rgba
validator: (value, callback) => {
  const rgbaRegex = /^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)$/;
  callback(rgbaRegex.test(value));
}
```

### 3. Use a Different Theme

This recipe uses the `nano` theme. Pickr also offers `classic` and `monolith`. To switch, change the CSS import and the `theme` option:

```typescript
import '@simonwep/pickr/dist/themes/classic.min.css';

// In Pickr.create():
theme: 'classic',
```

---


## What you learned

You integrated the Pickr color picker library as a Handsontable cell editor. You used `editorFactory` to manage the editor lifecycle, `rendererFactory` to display a color swatch, and Handsontable's CSS tokens to style the editor consistently with the rest of the grid.

## Next steps

- [Colorful Picker (React)](@/react/recipes/cell-types/colorful-picker/colorful-picker.md) - The same pattern using `react-colorful` and React's `EditorComponent`.
- [Color Picker (Angular)](@/angular/recipes/cell-types/guide-color-picker-angular/guide-color-picker.md) - The same pattern using Angular components and the native HTML5 color input.
- [Star Rating](@/recipes/cell-types/rating/rating.md) - Another custom editor built with `editorFactory` and SVG.
