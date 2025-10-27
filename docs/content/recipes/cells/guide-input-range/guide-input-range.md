---
id: b5f02fb2
title: "Recipe: Range Slider Input"
metaTitle:  "Recipe: Range Slider Input - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using a native HTML5 range slider input for fast, interactive numeric editing directly in your data grid.
permalink: /recipes/input-range
canonicalUrl: /recipes/input-range
tags:
  - guides
  - tutorial
  - recipies
react:
  id: dd56fc85
  metaTitle: "Recipe: Range Slider Input - React Data Grid | Handsontable"
angular:
  id: e51f625c
  metaTitle: "Recipe: Range Slider Input - Angular Data Grid | Handsontable"
searchCategory: Recepies
category: Cells
---

# Range Slider Input Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create an interactive range slider cell using the native HTML5 `<input type="range">`. Perfect for percentage inputs, ratings, volume controls, or any numeric value selection with visual feedback.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Libraries:** None (pure HTML5)

## What You'll Build

A cell that:
- Displays a slider both when editing and viewing
- Shows live updates as the slider moves
- Validates numeric ranges
- Provides immediate visual feedback
- Works without any external libraries

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-input-range/javascript/example1.js)
@[code](@/content/recipes/cells/guide-input-range/javascript/example1.ts)

:::

:::

## Prerequisites

None! This uses only native HTML5 features.

## Step 1: Import Dependencies

```typescript
import Handsontable from "handsontable";
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerAllModules } from "handsontable/registry";

registerAllModules();
```

**What we're NOT importing:**
- No date libraries
- No UI component libraries
- No sliders libraries
- Just Handsontable.

## Step 2: Create the Renderer

The renderer shows a disabled slider as a read-only preview.

```typescript
renderer: Handsontable.renderes.factory(({ td, value }) => {
  td.innerHTML = `
    <div>
      <input 
        style="pointer-events: none; width: 100%; padding: 0;" 
        disabled 
        readonly 
        type="range" 
        value="${value}" 
      />
    </div>
  `;
  return td;
})
```

**What's happening:**

### Key attributes:
- `type="range"` - Native slider input
- `disabled` - Can't be interacted with
- `readonly` - Can't be changed
- `value="${value}"` - Shows current value position

### Key styles:
- `pointer-events: none` - Completely disables mouse interaction
- `width: 100%` - Fills the cell
- `padding: 0` - Removes default padding

**Why all three: `pointer-events: none`, `disabled`, and `readonly`?**
- **`disabled`**: Grays out the slider, makes it visually inactive
- **`readonly`**: Prevents value changes
- **`pointer-events: none`**: Prevents any mouse interaction
- Together they create a perfect "preview" mode

**Why wrap in a `<div>`?**
```typescript
td.innerHTML = `<div>...</div>`;
```
- Better styling control
- Prevents layout issues
- Can add labels or values later

## Step 3: Enhanced Renderer with Value Display

Show the numeric value alongside the slider:

```typescript
renderer: Handsontable.renderes.factory(({ td, value }) => {
  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <input 
        style="pointer-events: none; width: 100%; padding: 0; flex: 1;" 
        disabled 
        readonly 
        type="range" 
        value="${value}" 
        min="0"
        max="100"
      />
      <span style="font-weight: bold; min-width: 40px; text-align: right;">
        ${value}%
      </span>
    </div>
  `;
  return td;
})
```

**Possible improvements:**
- Flexbox layout for alignment
- Numeric percentage display
- Min/max values shown in slider
- Bold value for emphasis

## Step 4: Create the Validator

Ensure values are within the expected range.

```typescript
validator: (value, callback) => {    
  value = parseInt(value);
  callback(value >= 0 && value <= 100);
}
```

**What's happening:**
- Convert value to integer (range inputs return strings)
- Check if between 0 and 100
- Call `callback(true)` for valid, `callback(false)` for invalid

**Configurable range validation:**
```typescript
validator: (value, callback) => {
  value = parseInt(value);
  
  // Handle empty/invalid values
  if (isNaN(value)) {
    callback(false);
    return;
  }
  
  // You could get min/max from cellProperties
  const min = 0;
  const max = 100;
  
  callback(value >= min && value <= max);
}
```

## Step 5: Editor - Define Types

```typescript
editor: Handsontable.editors.BaseEditor.factory<{
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
}>({
  // ... methods
})
```

**Type breakdown:**
- `wrapper` - Container div for positioning
- `input` - The `<input type="range">` element

## Step 6: Editor - Initialize (`init`)

Create the DOM structure and set up live updates.

```typescript
init(editor) {
  // Create wrapper div
  editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.wrapper.style.display = "none";
  editor.wrapper.classList.add("htSelectEditor");
  
  // Create range input
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;      
  editor.input.setAttribute('type', 'range');
  editor.input.setAttribute('min', '0');
  editor.input.setAttribute('max', '100');
  editor.input.setAttribute('step', '1');
  editor.input.style = 'width: 100%; padding: 0;';
  
  // Assemble DOM
  editor.wrapper.appendChild(editor.input);
  editor.hot.rootElement.appendChild(editor.wrapper);
  
  // Live update: sync editor with cell preview
  editor.input.addEventListener('input', (event) => {
    if (editor.TD) {
      editor.TD.querySelector('input')!.value = (event.target as HTMLInputElement).value;
    }
  });
}
```

**Key concepts:**

### Range input attributes:
```typescript
editor.input.setAttribute('type', 'range');  // Slider input
editor.input.setAttribute('min', '0');       // Minimum value
editor.input.setAttribute('max', '100');     // Maximum value
editor.input.setAttribute('step', '1');      // Increment step
```

**Customization ideas:**
- `step="5"` - Jump by 5s
- `step="0.1"` - Allow decimals
- `min="-100"` - Allow negative values

### The Magic: Live Updates! ✨

This is the most interesting part:

```typescript
editor.input.addEventListener('input', (event) => {
  if (editor.TD) {
    editor.TD.querySelector('input')!.value = (event.target as HTMLInputElement).value;
  }
});
```

**What's happening:**
1. User moves the slider in editor
2. `'input'` event fires on every movement
3. We find the slider in the cell below (`editor.TD.querySelector('input')`)
4. Update its value to match
5. User sees the cell's preview slider move in real-time!

**Why `editor.TD`?**
- `editor.TD` is the cell being edited
- It's a property set by Handsontable
- Contains the actual table cell DOM element

**Why `querySelector('input')`?**
- The renderer created a slider inside the cell
- We need to find and update it
- This creates the "live preview" effect

**Visual flow:**
```
User drags slider (editor) → 'input' event fires → 
Update cell slider (TD) → User sees both moving together!
```

### `'input'` vs `'change'` events:

```typescript
// 'input' - fires continuously while dragging
editor.input.addEventListener('input', ...) // ✅ Live updates

// 'change' - fires only when user releases
editor.input.addEventListener('change', ...) // ❌ Only final value
```

We want `'input'` for smooth, real-time feedback!

## Step 7: Editor - Get Value (`getValue`)

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- Return current slider position
- Value is a string (e.g., "75")
- Validator will convert to number

## Step 8: Editor - Set Value (`setValue`)

```typescript
setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- Set slider position to cell's current value
- Called when editing starts
- Slider moves to correct position automatically

## Step 9: Editor - Open (`open`)

Position the editor over the cell.

```typescript
open(editor) {
  const rect = editor.getEditedCellRect();
  editor.wrapper.style = `
    display: block;
    border: none;
    box-sizing: border-box;
    margin: 0;
    padding: 8 4px;
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.start}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
  `;
}
```

**Key points:**

### Positioning
- Get cell dimensions with `getEditedCellRect()`
- Position absolutely over the cell
- Match width and height exactly

### Styling
- `padding: 8 4px` - Small horizontal padding match the preview cell padding 
- Makes slider slightly inset from cell edges
- Improves visual appearance

**Why no `showPicker()` like date input?**
- Range inputs don't have a "picker"
- The slider IS the interface
- Just showing and positioning is enough

## Step 10: Editor - Focus and Close

```typescript
focus(editor) {
  editor.input.focus();
}

close(editor) {
  editor.wrapper.style.display = 'none';
}
```

**Focus method:**
- Allows keyboard control (arrow keys)
- Called when validation fails

**Close method:**
- Hide the wrapper
- Prepare for next edit

## Step 11: Complete Cell Definition

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.innerHTML = `
      <div>
        <input 
          style="pointer-events: none; width: 100%; padding: 0;" 
          disabled 
          readonly 
          type="range" 
          value="${value}" 
        />
      </div>
    `;
    return td;
  }),
  
  validator: (value, callback) => {    
    value = parseInt(value);
    callback(value >= 0 && value <= 100);
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
      editor.input.setAttribute('type', 'range');
      editor.input.setAttribute('min', '0');
      editor.input.setAttribute('max', '100');
      editor.input.setAttribute('step', '1');
      editor.input.style = 'width: 100%; padding: 0;';
      
      editor.wrapper.appendChild(editor.input);
      editor.hot.rootElement.appendChild(editor.wrapper);
      
      editor.input.addEventListener('input', (event) => {
        if (editor.TD) {
          editor.TD.querySelector('input')!.value = (event.target as HTMLInputElement).value;
        }
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
      editor.wrapper.style = `
        display: block;
        border: none;
        box-sizing: border-box;
        margin: 0;
        padding: 8 4px;
        position: absolute;
        top: ${rect.top}px;
        left: ${rect.start}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
      `;
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
    { id: 1, itemName: "Task A", completed: 25 },
    { id: 2, itemName: "Task B", completed: 50 },
    { id: 3, itemName: "Task C", completed: 75 },
    { id: 4, itemName: "Task D", completed: 100 },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Completed Percentage",
  ],
  autoRowSize: true,
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    { data: "itemName", type: "text", width: 150 },
    {
      data: "completed",
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
});
```

## How It Works - Complete Flow

1. **Initial Render**: Cell shows disabled slider at value position
2. **User Double-Clicks**: Editor opens over cell
3. **Two Sliders Visible**: Cell's preview slider + editor's active slider
4. **User Drags**: Editor slider moves
5. **Live Update**: `'input'` event fires, updates cell slider in real-time
6. **Both Sliders Move Together**: Visual feedback!
7. **User Confirms**: Press Enter or click away
8. **Validation**: Validator checks range
9. **Save**: Valid value saved
10. **Editor Closes**: Only preview slider remains

## User Experience Highlights

### Visual Continuity
- Editor slider appears exactly where preview was
- Smooth transition from view to edit mode
- No jarring position changes

### Live Feedback
- See changes before committing
- Both sliders move together
- Intuitive and satisfying

### Keyboard Support
- Arrow keys move slider
- Page Up/Down for larger jumps
- Home/End for min/max values

## Enhancements

### 1. Show Numeric Value During Editing

Add a value display to the editor:

```typescript
init(editor) {
  editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.wrapper.style.display = "none";
  editor.wrapper.classList.add("htSelectEditor");
  
  // Create container for slider and value
  const container = editor.hot.rootDocument.createElement("DIV");
  container.style.cssText = 'display: flex; align-items: center; gap: 8px; height: 100%;';
  
  // Range input
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;      
  editor.input.setAttribute('type', 'range');
  editor.input.setAttribute('min', '0');
  editor.input.setAttribute('max', '100');
  editor.input.setAttribute('step', '1');
  editor.input.style = 'width: 100%; padding: 0; flex: 1;';
  
  // Value display
  const valueDisplay = editor.hot.rootDocument.createElement("SPAN");
  valueDisplay.style.cssText = 'font-weight: bold; min-width: 40px; text-align: right;';
  valueDisplay.textContent = '0';
  
  container.appendChild(editor.input);
  container.appendChild(valueDisplay);
  editor.wrapper.appendChild(container);
  editor.hot.rootElement.appendChild(editor.wrapper);
  
  // Update both displays
  editor.input.addEventListener('input', (event) => {
    const value = (event.target as HTMLInputElement).value;
    valueDisplay.textContent = value;
    
    if (editor.TD) {
      editor.TD.querySelector('input')!.value = value;
    }
  });
}
```

### 2. Color-Coded Progress

Change slider color based on value:

```typescript
renderer: rendererFactory(({ td, value }) => {
  let color = '#4CAF50'; // Green
  
  if (value < 30) color = '#f44336'; // Red
  else if (value < 70) color = '#ff9800'; // Orange
  
  td.innerHTML = `
    <div>
      <input 
        style="
          pointer-events: none;
          width: 100%;
          padding: 0;
          accent-color: ${color};
        " 
        disabled 
        readonly 
        type="range" 
        value="${value}" 
        min="0"
        max="100"
      />
    </div>
  `;
  return td;
})
```


### 3. Custom Step Values

Different increments for different use cases:

```typescript
// Course increments (multiples of 5)
editor.input.setAttribute('step', '5');

// Fine control (decimals)
editor.input.setAttribute('step', '0.1');

// Large jumps
editor.input.setAttribute('step', '10');
```

### 4. Dynamic Min/Max from Cell Properties

Configurable per column:

```typescript
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  const min = cellProperties.rangeMin || 0;
  const max = cellProperties.rangeMax || 100;
  const step = cellProperties.rangeStep || 1;
  
  editor.input.setAttribute('min', String(min));
  editor.input.setAttribute('max', String(max));
  editor.input.setAttribute('step', String(step));
}

// Usage
columns: [{
  data: 'temperature',
  ...cellDefinition,
  rangeMin: -50,
  rangeMax: 50,
  rangeStep: 0.5
}]
```

### 5. Progress Bar Style

Make it look like a progress bar:

```typescript
renderer: Handsontable.renders.factory(({ td, value }) => {
  td.innerHTML = `
    <div style="position: relative; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${value}%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.3s ease;
      "></div>
      <span style="
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-weight: bold;
        color: ${value > 50 ? 'white' : '#333'};
      ">${value}%</span>
    </div>
  `;
  return td;
})
```

### 6. Auto-Save on Change

Save immediately when user stops dragging:

```typescript
init(editor) {
  // ... existing code ...
  
  editor.input.addEventListener('change', () => {
    editor.finishEditing();
  });
}
```

**Note:** This saves on `'change'` (when user releases), not `'input'` (while dragging).

## Use Cases

### Perfect for:
- ✅ Percentages (0-100%)
- ✅ Ratings (1-5 stars)
- ✅ Priorities (1-10)
- ✅ Volume controls
- ✅ Opacity sliders
- ✅ Temperature ranges
- ✅ Age selection
- ✅ Price ranges

### Not ideal for:
- ❌ Precise numeric entry (use number input)
- ❌ Very large ranges (hard to be precise)
- ❌ Negative values (less intuitive)
- ❌ Non-linear scales

## Accessibility

Range inputs are highly accessible:

```typescript
init(editor) {
  // ... existing code ...
  
  // Add ARIA labels
  editor.input.setAttribute('aria-label', 'Completion percentage');
  editor.input.setAttribute('aria-valuemin', '0');
  editor.input.setAttribute('aria-valuemax', '100');
  editor.input.setAttribute('aria-valuenow', editor.input.value);
  
  // Update aria-valuenow on change
  editor.input.addEventListener('input', () => {
    editor.input.setAttribute('aria-valuenow', editor.input.value);
  });
}
```

**Keyboard navigation works automatically:**
- **Arrow Right/Up**: Increase value
- **Arrow Left/Down**: Decrease value
- **Page Up**: Jump up
- **Page Down**: Jump down
- **Home**: Go to minimum
- **End**: Go to maximum

## Performance Considerations

### Why This Is Fast

1. **Native HTML5**: Browser-optimized rendering
2. **No External Libraries**: Zero overhead
3. **Efficient DOM Updates**: Only update what's needed
4. **CSS Hardware Acceleration**: Smooth animations

### The `'input'` Event Cost

```typescript
editor.input.addEventListener('input', (event) => {
  if (editor.TD) {
    editor.TD.querySelector('input')!.value = (event.target as HTMLInputElement).value;
  }
});
```

**Is this expensive?**
- **Fires frequently**: Yes, on every pixel moved
- **DOM query**: `querySelector` on every update
- **Value update**: Simple property assignment

**Performance verdict**: Still very fast!
- Modern browsers handle this easily
- querySelector on a single cell is negligible
- Property updates are optimized

**Optimization (if needed):**
```typescript
init(editor) {
  // ... create elements ...
  
  // Cache the preview slider reference
  let cachedPreviewSlider: HTMLInputElement | null = null;
  
  editor.input.addEventListener('input', (event) => {
    if (editor.TD) {
      // Only query once per edit session
      if (!cachedPreviewSlider) {
        cachedPreviewSlider = editor.TD.querySelector('input');
      }
      if (cachedPreviewSlider) {
        cachedPreviewSlider.value = (event.target as HTMLInputElement).value;
      }
    }
  });
  
  // Clear cache when editor closes
  editor.addHook('afterClose', () => {
    cachedPreviewSlider = null;
  });
}
```

## Styling Tips

### Custom Slider Appearance (CSS)

```css
/* Modern browsers support accent-color */
input[type="range"] {
  accent-color: #4CAF50;
}

/* Or full custom styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"]::-webkit-slider-track {
  background: #ddd;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-track {
  background: #ddd;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4CAF50;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}
```


---

**Congratulations!** You've created an interactive range slider with live preview feedback using only native HTML5, in under 70 lines of code!

