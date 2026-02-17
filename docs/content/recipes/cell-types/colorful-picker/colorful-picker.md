---
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
searchCategory: Recipes
category: Cell Types
---

# Color Picker Cell Type - Step-by-Step Guide (React)

[[toc]]

## Overview

This guide shows how to create a color picker editor cell using `react-colorful`'s `HexColorPicker` with React's `EditorComponent`. Perfect for selecting colors in design tools, theme builders, or any scenario where users need to choose hex color values.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** react-colorful

## What You'll Build

A cell that:
- Displays a hex color picker when editing
- Shows the selected color when viewing
- Stores values as hex color strings (e.g., `#FF5733`)
- Provides an "Apply Color" button to confirm selection
- Works with React's component-based architecture
- Supports custom renderer to display color swatches

## Complete Example

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps react-colorful

@[code](@/content/recipes/cell-types/colorful-picker/react/example1.css)
@[code](@/content/recipes/cell-types/colorful-picker/react/example1.jsx)
@[code](@/content/recipes/cell-types/colorful-picker/react/example1.tsx)

:::

:::

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
import { HexColorPicker } from 'react-colorful';

registerAllModules();
```

**What we're importing:**
- `EditorComponent` - React component for creating custom editors
- `HotTable` and `HotColumn` - React wrapper components
- `HexColorPicker` - Lightweight color picker from react-colorful
- Handsontable styles

## Step 2: Create the Editor Component

Create a React component that uses `EditorComponent` with the render prop pattern.

```tsx
export const ColorPickerEditor = () => {
  return (
    <EditorComponent<string>>
      {({ value, setValue, finishEditing }) => (
        <div className="color-picker-editor">
          <HexColorPicker
            color={value || '#000000'}
            onChange={(color) => setValue(color)}
          />
          <button className="button" onClick={() => finishEditing()}>
            Apply Color
          </button>
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
5. `finishEditing` - Function to save and close the editor
6. `HexColorPicker` displays the color picker and updates on change
7. "Apply Color" button confirms selection and closes the editor

**Key concepts:**
- **Render prop pattern**: `EditorComponent` uses a function as children
- **Controlled component**: `HexColorPicker` receives `color` and `onChange`
- **Explicit confirmation**: User clicks "Apply Color" to save (alternative: close on blur)

## Step 3: Add Styling

Style the editor container and button using CSS.

```css
.color-picker-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgb(238, 238, 238);
  border: 1px solid rgb(204, 204, 204);
  border-radius: 4px;
  width: 100%;
}

.color-picker-editor .button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.color-picker-editor .button:hover {
  background: #0056b3;
}
```

**What's happening:**
- Container uses flexbox with column layout (picker above button)
- `HexColorPicker` has built-in styling from react-colorful
- Button styled for clear call-to-action

## Step 4: Prepare Sample Data

Create data with hex color values for the color column.

```tsx
const inputData = new Array(10)
  .fill(null)
  .map((_, row) =>
    new Array(10)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

export const data = inputData.map((el) => ({
  ...el,
  color:
    '#' +
    Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase(),
}));
```

**What's happening:**
- Generates a 10×10 grid with random hex colors
- Each row has a `color` property with format `#RRGGBB`

## Step 5: Use in Handsontable

Use the editor component in your `HotTable`:

```tsx
const ExampleComponent = () => {
  return (
    <HotTable
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      data={data}
      colHeaders={true}
    >
      <HotColumn
        width={250}
        editor={ColorPickerEditor}
        data="color"
        title="Colour"
      />
    </HotTable>
  );
};
```

**What's happening:**
- `editor={ColorPickerEditor}` - Assigns the color picker editor to the column
- `data="color"` - Binds to the color property in each row
- Column displays hex values; double-click opens the picker

**Key features:**
- Simple, focused editor for color selection
- Values stored as hex strings
- Type-safe with TypeScript

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the hex color value (e.g., `#FF5733`)
2. **User Double-Clicks or Enter**: Editor opens
3. **Editor Opens**: `EditorComponent` positions container over cell
4. **Color Picker Display**: `HexColorPicker` shows with current color selected
5. **User Interaction**:
   - Drag sliders or click palette → `setValue(color)` updates preview
   - Click "Apply Color" → `finishEditing()` saves and closes
6. **Save**: Hex value saved to cell
7. **Editor Closes**: Cell shows the hex string

## Enhancements

### 1. Custom Renderer with Color Swatch

Add a custom renderer to display a color swatch instead of the raw hex value:

```tsx
import { rendererFactory } from 'handsontable/renderers';

const colorRenderer = rendererFactory(({ td, value }) => {
  const hexColor = value || '#cccccc';
  td.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
    ">
      <div style="
        width: 24px;
        height: 24px;
        background: ${hexColor};
        border: 1px solid #ddd;
        border-radius: 4px;
      "></div>
      <span style="font-family: monospace; font-size: 12px;">${hexColor}</span>
    </div>
  `;
});

// Use in HotColumn
<HotColumn
  width={250}
  editor={ColorPickerEditor}
  renderer={colorRenderer}
  data="color"
  title="Colour"
/>
```

**What's happening:**
- Renders a colored square (swatch) next to the hex code
- Improves visual recognition of colors
- Monospace font for hex values

### 2. Close on Color Select (Optional)

To close the editor immediately when a color is picked (without "Apply" button):

```tsx
<HexColorPicker
  color={value || '#000000'}
  onChange={(color) => {
    setValue(color);
    finishEditing(); // Close immediately
  }}
/>
```

Remove the "Apply Color" button if using this approach.

### 3. Using External CSS File

Move styles to a separate CSS file:

```css
/* color-picker-editor.css */
.color-picker-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgb(238, 238, 238);
  border: 1px solid rgb(204, 204, 204);
  border-radius: 4px;
  width: 100%;
}

.color-picker-editor .button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.color-picker-editor .button:hover {
  background: #0056b3;
}
```

```tsx
import './color-picker-editor.css';

const ColorPickerEditor = () => {
  // ... component code
};
```

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

The `HexColorPicker` from react-colorful provides keyboard support. Enhance the button:

```tsx
<button
  className="button"
  onClick={() => finishEditing()}
  aria-label="Apply selected color"
  type="button"
>
  Apply Color
</button>
```

**Keyboard navigation:**
- **Tab**: Navigate to editor
- **Enter**: Confirm (when focused on Apply button)
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

`EditorComponent` is fully typed. Specify the value type for hex strings:

```tsx
<EditorComponent<string>>
  {({ value, setValue, finishEditing }) => {
    // TypeScript knows value is string | undefined
    // TypeScript knows setValue accepts string
    return (
      <div className="color-picker-editor">
        <HexColorPicker
          color={value || '#000000'}
          onChange={(color) => setValue(color)}
        />
        <button className="button" onClick={() => finishEditing()}>
          Apply Color
        </button>
      </div>
    );
  }}
</EditorComponent>
```

## Best Practices

1. **Provide fallback for empty values** - Use `value || '#000000'` for HexColorPicker
2. **Call `finishEditing()` appropriately** - When user confirms (button click or optional blur)
3. **Use custom renderer** - Display color swatches for better UX
4. **Store as hex** - Hex strings are portable and easy to validate
5. **Consider UX** - "Apply" button gives users a chance to preview before committing

---

**Congratulations!** You've created a color picker editor using React's `EditorComponent` and `react-colorful`, perfect for color selection in your data grid!
