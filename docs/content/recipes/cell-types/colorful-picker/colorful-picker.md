---
type: how-to
id: e50f0177
title: Colorful Picker
metaTitle: Color Picker Cell Type - React Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using a color picker for selecting hex colors directly in your data grid.
permalink: /recipes/cell-types/colorful-picker
canonicalUrl: /recipes/cell-types/colorful-picker
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 45ff1241
  metaTitle: Color Picker Cell Type - React Data Grid | Handsontable
angular:
  id: 4f6678f9
  metaTitle: Color Picker Cell Type - Angular Data Grid | Handsontable
vue:
  id: hvnfgr8y
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build a color picker cell in React using the `react-colorful` library and Handsontable's `EditorComponent`.

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps react-colorful

@[code](@/content/recipes/cell-types/colorful-picker/react/example1.css)
@[code](@/content/recipes/cell-types/colorful-picker/react/example1.jsx)
@[code](@/content/recipes/cell-types/colorful-picker/react/example1.tsx)

:::

:::

## Overview

This guide shows how to create a color picker editor cell using `react-colorful`'s `HexColorPicker` with React's `EditorComponent`. Perfect for selecting colors in design tools, theme builders, or any scenario where users need to choose hex color values.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** react-colorful

## What You'll Build

A cell that:
- Displays an input showing the hex value and a popover with a color picker when editing
- Shows the selected color as a swatch when viewing (custom renderer)
- Stores values as hex color strings (e.g., `#FF5733`)
- Validates input so only valid hex values (e.g. `#RRGGBB`) are accepted
- Works with React's component-based architecture
- Uses `hotRenderer` to display color swatches in cells

## Prerequisites

```bash
npm install @handsontable/react-wrapper react-colorful
```

**What you need:**
- React 16.8+ (hooks support)
- `@handsontable/react-wrapper` package
- `react-colorful` package for the color picker UI
- Basic React knowledge (hooks, JSX)

## Step 1: Import Dependencies

```tsx
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { HexColorPicker } from 'react-colorful';

registerAllModules();
```

**What we're importing:**
- `EditorComponent` - React component for creating custom editors
- `HotTable` and `HotColumn` - React wrapper components
- `rendererFactory` - For the custom cell renderer (color swatch)
- `HexColorPicker` - Lightweight color picker from react-colorful

## Step 2: Create the Editor Component

Create a React component that uses `EditorComponent` with the render prop pattern. The editor shows an input with the current hex value and a popover containing the color picker.

```tsx
export const ColorPickerEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue }) => (
        <div className="color-picker-editor">
          <input className="color-picker-editor-input" value={value} readOnly />
          <div className="color-picker-editor-popover">
            <HexColorPicker color={value || '#000000'} onChange={(color) => setValue(color)} />
          </div>
        </div>
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
1. `EditorComponent` wraps your editor UI
2. The `children` prop is a function that receives editor state
3. `value` - Current cell value (hex color string)
4. `setValue` - Function to update the value
5. The input displays the current hex value; the popover shows `HexColorPicker` for picking a color
6. When the user selects a color, `setValue(color)` updates the value; the editor closes on blur (e.g. clicking outside)

**Key concepts:**
- **Render prop pattern**: `EditorComponent` uses a function as children
- **Controlled component**: `HexColorPicker` receives `color` and `onChange`
- **Input + popover**: The input shows the hex code; the popover is positioned below and contains the picker

## Step 3: Add Styling

Style the cell (swatch display), the editor container, the input, and the popover. The popover is positioned below the editor so the color picker appears when the cell is in edit mode.

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
}

.color-picker-editor-popover {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 8px;
}

.color-picker-editor:focus {
  outline: none;
}

.color-picker-editor-input {
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  outline: none;
}
```

**What's happening:**
- `.color-picker-cell` and `.color-picker-swatch` display a circular color swatch in the cell
- `.color-picker-editor` is the editor wrapper; `.color-picker-editor-input` styles the hex value input
- `.color-picker-editor-popover` positions the color picker below the editor (e.g. `top: 100%`, `left: 0`)
- `HexColorPicker` has built-in styling from react-colorful

## Step 4: Prepare Sample Data

Use an array of row objects and add a `color` property with random hex values. The example uses an inventory-style dataset (with columns like `id`, `itemName`, `itemNo`, `cost`, `valueStock`, and optionally more); you can use any structure as long as each row has a `color` field.

```tsx
const inputData = [
  { id: 640329, itemName: 'Lunar Core', itemNo: 'XJ-12', cost: 350000, valueStock: 700000 },
  { id: 863104, itemName: 'Zero Thrusters', itemNo: 'QL-54', cost: 450000, valueStock: 0 },
  // ... more rows
];

export const data = inputData.map((el) => ({
  ...el,
  color: `#${
    Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase()
  }`,
}));
```

**What's happening:**
- Each row is an object with columns such as `id`, `itemName`, `itemNo`, `cost`, `valueStock`
- A `color` property is added with a random hex value in `#RRGGBB` format

## Step 5: Use in Handsontable

Use the editor, custom renderer, and validator on the color column. The example table has multiple columns; the color column uses `hotRenderer` and `validator`.

```tsx
const colorCellRenderer = rendererFactory(({ td, value }) => {
  td.innerHTML = `<span class="color-picker-cell"><span class="color-picker-swatch" style="background:${value}"></span></span>`;
});

const colorValidator = (value, callback) => {
  callback(value.length === 7 && value[0] === '#'); // validate hex format
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock']}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="id" type="numeric" width={80} className="htLeft" />
      <HotColumn data="itemName" type="text" width={200} className="htLeft" />
      <HotColumn
        data="color"
        width={120}
        editor={ColorPickerEditor}
        hotRenderer={colorCellRenderer}
        validator={colorValidator}
        className="htLeft"
      />
      <HotColumn data="itemNo" type="text" width={100} className="htLeft" />
      <HotColumn data="cost" type="numeric" width={70} className="htLeft" />
      <HotColumn data="valueStock" type="numeric" width={130} className="htRight" />
    </HotTable>
  );
};
```

**What's happening:**
- `editor={ColorPickerEditor}` - Assigns the color picker editor to the column
- `hotRenderer={colorCellRenderer}` - Renders a color swatch in the cell instead of the raw hex string
- `validator={colorValidator}` - Ensures only valid hex values (e.g. `#RRGGBB`) are accepted
- `data="color"` - Binds to the `color` property in each row; double-click opens the picker

**Key features:**
- Swatch display via custom renderer, validation, and type-safe editor with TypeScript

## How It Works - Complete Flow

1. **Initial Render**: Cell shows a color swatch (custom renderer); value is stored as hex (e.g. `#FF5733`)
2. **User Double-Clicks or Enter**: Editor opens
3. **Editor Opens**: `EditorComponent` positions container over cell; input shows current hex value; popover with `HexColorPicker` appears below
4. **User Interaction**: Drag sliders or click palette → `setValue(color)` updates the value; input and picker stay in sync
5. **Close**: User blurs the editor (e.g. clicks outside) → value is saved and editor closes
6. **Validation**: `colorValidator` ensures value is valid hex before saving
7. **Save**: Hex value saved to cell; cell renderer shows the new swatch

## Enhancements

### 1. Custom Renderer with Color Swatch (and Optional Hex Label)

The example uses `hotRenderer` to show only a circular swatch. You can extend it to show the hex code next to the swatch:

```tsx
import { rendererFactory } from 'handsontable/renderers';

// Swatch only (as in the example)
const colorCellRenderer = rendererFactory(({ td, value }) => {
  td.innerHTML = `<span class="color-picker-cell"><span class="color-picker-swatch" style="background:${value}"></span></span>`;
});

// Or swatch + hex label
const colorRendererWithHex = rendererFactory(({ td, value }) => {
  const hexColor = value || '#cccccc';
  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; padding: 4px;">
      <div style="width: 24px; height: 24px; background: ${hexColor}; border: 1px solid #ddd; border-radius: 4px;"></div>
      <span style="font-family: monospace; font-size: 12px;">${hexColor}</span>
    </div>
  `;
});

// Use hotRenderer in HotColumn
<HotColumn
  data="color"
  editor={ColorPickerEditor}
  hotRenderer={colorCellRenderer}
  validator={colorValidator}
/>
```

**What's happening:**
- `hotRenderer` is used in the React wrapper for custom cell rendering
- Swatch-only keeps the cell compact; adding the hex label improves readability when needed

### 2. Explicit "Apply" Button (Optional)

The example closes the editor on blur. If you prefer explicit confirmation, add a button and use `finishEditing` from the render props:

```tsx
<EditorComponent>
  {({ value, setValue, finishEditing }) => (
    <div className="color-picker-editor">
      <input className="color-picker-editor-input" value={value} readOnly />
      <div className="color-picker-editor-popover">
        <HexColorPicker color={value || '#000000'} onChange={(color) => setValue(color)} />
      </div>
      <button className="button" type="button" onClick={() => finishEditing()}>
        Apply Colour
      </button>
    </div>
  )}
</EditorComponent>
```

### 3. Using External CSS File

The example uses a separate CSS file for cell and editor styles (e.g. `example1.css`). Import it in your component:

```tsx
import './example1.css'; // or your color-picker-editor.css

const ColorPickerEditor = () => {
  // ... component code
};
```

Keep the `.color-picker-cell`, `.color-picker-swatch`, `.color-picker-editor`, `.color-picker-editor-input`, and `.color-picker-editor-popover` rules so the swatch and the editor look correct.

### 4. RGBA or HSL Variants

`react-colorful` also provides `RgbaColorPicker` and `HslColorPicker`. For RGBA:

```tsx
import { RgbaColorPicker } from 'react-colorful';

// Note: value would need to be stored as rgba string or object
// and converted appropriately
```

### 5. Default Color

Handle empty cells with a sensible default:

```tsx
<HexColorPicker
  color={value || '#000000'}
  onChange={(color) => setValue(color)}
/>
```

The `|| '#000000'` ensures the picker always has a valid color.

## Accessibility

The `HexColorPicker` from react-colorful provides keyboard support. For the editor input, you can add an `aria-label` so screen readers describe the field:

```tsx
<input
  className="color-picker-editor-input"
  value={value}
  aria-label="Hex color value"
/>
```

**Keyboard navigation:**
- **Tab**: Navigate to editor
- **Escape**: Cancel editing
- **Click**: Direct selection in color picker

## Performance Considerations

### Why This Is Fast

1. **react-colorful**: Lightweight (~2KB gzipped), no heavy dependencies
2. **React Virtual DOM**: Efficient updates only when value changes
3. **Controlled updates**: `onChange` only fires when user interacts
4. **No unnecessary re-renders**: Editor unmounts when closed

### Bundle Size

`react-colorful` is tree-shakeable. If you only need hex:

```tsx
import { HexColorPicker } from 'react-colorful';
```

## TypeScript Support

`EditorComponent` is fully typed. For the color editor, the value is a string (hex). You can type the validator as well:

```tsx
const colorValidator = (value: string, callback: (valid: boolean) => void) => {
  callback(value.length === 7 && value[0] === '#'); // validate color format
};

export const ColorPickerEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue }) => (
        <div className="color-picker-editor">
          <input className="color-picker-editor-input" value={value} readOnly />
          <div className="color-picker-editor-popover">
            <HexColorPicker color={value || '#000000'} onChange={(color) => setValue(color)} />
          </div>
        </div>
      )}
    </EditorComponent>
  );
};
```

## Best Practices

1. **Provide fallback for empty values** - Use `value || '#000000'` for HexColorPicker
2. **Use hotRenderer** - Display color swatches in cells for better UX
3. **Store as hex** - Hex strings are portable and validate with a single regex
4. **Input + popover** - Showing the hex in an input with the picker in a popover keeps the cell compact and clear
5. **Optional "Apply" button** - For explicit confirmation, add a button that calls `finishEditing()` from the render props

---


## What you learned

You integrated the `react-colorful` library as a Handsontable cell editor in React. You used `EditorComponent` with the render prop pattern to manage editor state, `rendererFactory` to display a color swatch, and CSS custom properties to style the editor.

## Next steps

- [Color Picker (JavaScript)](@/javascript/recipes/cell-types/color-picker/color-picker.md) - The same pattern using `editorFactory` and the Pickr library.
- [Color Picker (Angular)](@/angular/recipes/cell-types/guide-color-picker-angular/guide-color-picker.md) - The Angular version using `HotCellEditorAdvancedComponent` and the native HTML5 color input.
- [Star Rating (React)](@/react/recipes/cell-types/react-rating/react-rating.md) - Another custom editor using `EditorComponent` in React.
