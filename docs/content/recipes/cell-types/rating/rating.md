---
type: how-to
id: b5f02fb2
title: Star Rating
metaTitle:  Star Rating Cell Type - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using SVG stars for intuitive 1-5 star ratings directly in your data grid.
permalink: /recipes/cell-types/rating
canonicalUrl: /recipes/cell-types/rating
tags:
  - guides
  - tutorial
  - recipes
react:
  id: dd56fc85
  metaTitle: Star Rating Cell Type - React Data Grid | Handsontable"
angular:
  id: e51f625c
  metaTitle: Star Rating Cell Type - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build an interactive SVG star rating cell using `editorFactory` and `rendererFactory`, with hover preview and keyboard shortcuts - no external libraries required.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/cell-types/rating/javascript/example1.js)
@[code](@/content/recipes/cell-types/rating/javascript/example1.ts)
@[code](@/content/recipes/cell-types/rating/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/rating/react/example1.css)
@[code](@/content/recipes/cell-types/rating/react/example1.jsx)
@[code](@/content/recipes/cell-types/rating/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/cell-types/rating/angular/example1.ts)
@[code](@/content/recipes/cell-types/rating/angular/example1.html)
@[code](@/content/recipes/cell-types/rating/angular/example1.css)

:::

:::

## Overview

This guide shows how to create an interactive star rating cell using inline SVG stars. Perfect for product ratings, review scores, or any scenario where users need to provide a 1-5 star rating.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (pure HTML, SVG and JavaScript)

## What You'll Build

A cell that:
- Displays 5 SVG stars both when editing and viewing
- Shows filled stars (gold) and unfilled stars (gray)
- Uses Handsontable CSS tokens for theme-aware editor styling
- Supports mouse hover for preview
- Allows keyboard input (1-5 keys, arrow keys)
- Provides immediate visual feedback
- Works without any external libraries

## Prerequisites

None! This uses only native HTML, SVG and JavaScript features.

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';

registerAllModules();
```

**What we're NOT importing:**
- No icon libraries
- No UI component libraries
- No external SVG sprite sheets
- Handsontable only.

## Step 2: Define the Star SVG

Create an inline SVG string for the star shape. Using `fill="currentColor"` allows CSS to control the star color.

```typescript
const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
```

**What's happening:**
- `width="1em" height="1em"` - Stars scale with the font size
- `viewBox="0 0 24 24"` - Standard 24x24 coordinate space
- `fill="currentColor"` - Inherits the CSS `color` property, so active/inactive states are controlled via CSS
- The `<path>` draws a classic 5-pointed star shape

**Why SVG instead of emoji?**
- Consistent rendering across all browsers and operating systems
- Full control over color, size, and styling via CSS
- No platform-dependent emoji variations
- Crisp at any resolution

## Step 3: Add CSS Styling

Create a separate CSS file for the rating styles. This uses Handsontable CSS custom properties (tokens) so the editor automatically adapts to custom themes and dark mode.

```css
.rating-cell {
  display: flex;
  align-items: center;
  margin: 3px 0 0 -1px;
}

.rating-star {
  color: var(--ht-background-secondary-color, #e0e0e0);
  cursor: default;
  display: inline-flex;
  align-items: center;
}

.rating-star.active {
  color: #facc15;
}

.rating-editor {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
}

.rating-editor .rating-star {
  cursor: pointer;
}

.rating-editor .rating-star.current {
  color: var(--ht-accent-color, #1a42e8);
}
```

**Cell container:**
- `.rating-cell` wraps the stars in the renderer with `display: flex` to match the editor layout
- `margin: 3px 0 0 -1px` - Fine-tunes alignment between renderer and editor to prevent visual jump

**Star colors:**
- `var(--ht-background-secondary-color, #e0e0e0)` - Inactive/unfilled stars (adapts to theme)
- `#facc15` (gold) - Active/filled stars
- Colors are applied via the CSS `color` property, which the SVG inherits through `fill="currentColor"`

**Current star indicator:**
- `.rating-editor .rating-star.current` highlights the last active star (the one matching the rating value) using `--ht-accent-color`
- Makes it clear which star is selected while editing — the current star turns blue (accent color) instead of gold

**Handsontable tokens used:**
- `--ht-background-secondary-color` - Inactive star color (adapts to theme)
- `--ht-accent-color` - Current star highlight in editor (blue)
- `--ht-cell-editor-border-color` / `--ht-cell-editor-border-width` - blue border matching native editors
- `--ht-cell-editor-background-color` - editor background
- `--ht-cell-editor-shadow-blur-radius` / `--ht-cell-editor-shadow-color` - editor shadow
- `--ht-cell-vertical-padding` / `--ht-cell-horizontal-padding` - consistent cell padding matching the renderer

## Step 4: Create the Renderer

The renderer displays 5 SVG stars wrapped in a flex container using CSS classes for color control.

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = `<div class="rating-cell">${Array.from(
    { length: 5 },
    (_, index) =>
      `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
  ).join('')}</div>`;
})
```

**What's happening:**
- Stars are wrapped in a `<div class="rating-cell">` flex container to match the editor's flex layout
- `Array.from({ length: 5 })` - Creates an array with 5 elements (indices 0-4)
- `index < value` - Stars up to the rating value get the `active` class (gold color)
- `index >= value` - Stars beyond the rating stay gray via CSS
- Each span contains the inline SVG star
- `join('')` - Concatenates all star spans into a single string

## Step 5: Create the Validator

Ensure values are within the valid range.

```typescript
validator: (value, callback) => {
  value = parseInt(value);

  callback(value >= 0 && value <= 100);
}
```

**What's happening:**
- Convert value to integer (keyboard input returns strings)
- Validate the value is within the acceptable range
- Call `callback(true)` for valid, `callback(false)` for invalid

## Step 6: Editor - Initialize (`init`)

Create the container div for the star rating editor.

```typescript
init(editor) {
  editor.input = editor.hot.rootDocument.createElement('DIV') as HTMLDivElement;
  editor.input.classList.add('rating-editor');
}
```

**What's happening:**
1. Create a `div` container for the star buttons
2. Add the `rating-editor` CSS class (all styling is in the CSS file)
3. This container will hold the 5 SVG star elements

**Key styling (from CSS):**
- `display: flex; align-items: center` - Stars aligned vertically
- `box-shadow` with `--ht-cell-editor-border-color` - Blue border matching native editors
- `padding` with cell padding tokens - Matches renderer to prevent visual jump
- `font-family/font-size/line-height: inherit` - Consistent sizing with the cell

## Step 7: Editor - After Init Hook (`afterInit`)

Set up mouse events for hover preview and click selection.

```typescript
afterInit(editor) {
  editor.input.addEventListener('mouseover', (event) => {
    const star = (event.target as HTMLElement).closest('.rating-star') as HTMLElement | null;

    if (
      star?.dataset.value &&
      parseInt(editor.value) !== parseInt(star.dataset.value)
    ) {
      editor.setValue(star.dataset.value);
    }
  });

  editor.input.addEventListener('mousedown', () => {
    editor.finishEditing();
  });
}
```

**What's happening:**

### Mouseover Event:
1. User hovers over a star (or its SVG child element)
2. Use `closest('.rating-star')` to find the parent span — this is important because the hover target may be the SVG `<path>` element inside the span
3. Get the hover rating from the span's `dataset.value`
4. If different from current value, update it
5. This creates a "preview" effect as user hovers

### Mousedown Event:
1. User clicks (mousedown) anywhere in the editor
2. Finish editing immediately
3. Value is saved to the cell

**Why `closest()` instead of checking `event.target` directly?**
- With inline SVGs, the actual hover/click target is often the `<svg>` or `<path>` element, not the parent `<span>`
- `closest('.rating-star')` walks up the DOM tree to find the span with the `data-value` attribute
- This ensures reliable star detection regardless of which SVG child element the user interacts with

## Step 8: Editor - Render Function (`render`)

Generate the HTML for the 5 star buttons based on current rating.

```typescript
render(editor) {
  editor.input.innerHTML = Array.from(
    { length: 5 },
    (_, index) =>
      `<span data-value="${index + 1}" class="rating-star ${
        index < editor.value ? 'active' : ''
      }${index + 1 === parseInt(editor.value) ? ' current' : ''}">${starSvg}</span>`
  ).join('');
}
```

**What's happening:**
1. Create 5 star spans (indices 0-4, values 1-5)
2. Each span has `data-value` attribute with rating (1-5)
3. Stars use the `rating-star` class for base styling (gray color)
4. Active stars get the `active` class (gold color)
5. The star matching the current value gets the `current` class (accent color) — this highlights the selected rating in the editor
6. Each span contains the inline SVG star
7. Join all spans into a single HTML string

**Dynamic rendering:**
- Updates whenever `editor.setValue()` is called
- Automatically called by `editorFactory` when value changes
- Provides live preview as user interacts

## Step 9: Editor - Keyboard Shortcuts

Add keyboard support for rating selection.

```typescript
shortcuts: [
  {
    keys: [['1'], ['2'], ['3'], ['4'], ['5']],
    callback: (editor, _event) => {
      editor.setValue((_event as KeyboardEvent).key);
    }
  },
  {
    keys: [['ArrowRight']],
    callback: (editor, _event) => {
      if (parseInt(editor.value) < 5) {
        editor.setValue(parseInt(editor.value) + 1);
      }
    }
  },
  {
    keys: [['ArrowLeft']],
    callback: (editor, _event) => {
      if (parseInt(editor.value) > 1) {
        editor.setValue(parseInt(editor.value) - 1);
      }
    }
  }
]
```

**What's happening:**

### Number Keys (1-5):
- Press 1-5 to set rating directly
- Fastest way to select a specific rating
- Gets key value from keyboard event

### Arrow Keys:
- <kbd>ArrowRight</kbd>: Increase rating (max 5)
- <kbd>ArrowLeft</kbd>: Decrease rating (min 1)
- Bounded within valid range
- Smooth incremental adjustment

**Keyboard navigation benefits:**
- Fast selection without mouse
- Accessible for keyboard-only users
- Number keys for direct selection, arrows for adjustment

## Step 10: Complete Cell Definition

```typescript
const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = `<div class="rating-cell">${Array.from(
      { length: 5 },
      (_, index) =>
        `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
    ).join('')}</div>`;
  }),
  validator: (value, callback) => {
    value = parseInt(value);

    callback(value >= 0 && value <= 100);
  },
  editor: editorFactory<{ input: HTMLDivElement }>({
    shortcuts: [
      {
        keys: [['1'], ['2'], ['3'], ['4'], ['5']],
        callback: (editor, _event) => {
          editor.setValue((_event as KeyboardEvent).key);
        },
      },
      {
        keys: [['ArrowRight']],
        callback: (editor, _event) => {
          if (parseInt(editor.value) < 5) {
            editor.setValue(parseInt(editor.value) + 1);
          }
        },
      },
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          if (parseInt(editor.value) > 1) {
            editor.setValue(parseInt(editor.value) - 1);
          }
        },
      },
    ],
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement(
        'DIV'
      ) as HTMLDivElement;
      editor.input.classList.add('rating-editor');
    },
    afterInit(editor) {
      editor.input.addEventListener('mouseover', (event) => {
        const star = (event.target as HTMLElement).closest(
          '.rating-star'
        ) as HTMLElement | null;

        if (
          star?.dataset.value &&
          parseInt(editor.value) !== parseInt(star.dataset.value)
        ) {
          editor.setValue(star.dataset.value);
        }
      });
      editor.input.addEventListener('mousedown', () => {
        editor.finishEditing();
      });
    },
    render(editor) {
      editor.input.innerHTML = Array.from(
        { length: 5 },
        (_, index) =>
          `<span data-value="${index + 1}" class="rating-star ${
            index < editor.value ? 'active' : ''
          }${index + 1 === parseInt(editor.value) ? ' current' : ''}">${starSvg}</span>`
      ).join('');
    },
  }),
};
```

**What's happening:**
- **starSvg**: Inline SVG star with `fill="currentColor"` for CSS color control
- **renderer**: Displays 5 SVG stars wrapped in a `.rating-cell` flex container with CSS class-based coloring (gold/gray)
- **validator**: Ensures rating is within valid range
- **editor**: Uses `editorFactory` helper with:
  - Keyboard shortcuts for 1-5 keys and arrow keys
  - Container initialization with `rating-editor` CSS class
  - Mouse events using `closest()` for reliable SVG hover detection
  - Render function with `current` class to highlight the selected star using accent color

## Step 11: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Product', 'Category', 'Rating', 'Reviews', 'Price'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'product', type: 'text', width: 240 },
    { data: 'category', type: 'text', width: 120 },
    { data: 'rating', width: 150, ...cellDefinition },
    { data: 'reviews', type: 'numeric', width: 80 },
    { data: 'price', type: 'numeric', width: 80 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads the renderer, validator, and editor onto the Rating column
- `headerClassName: 'htLeft'` - Left-aligns all column headers
- `width: '100%'` - Table fills the container width

## How It Works - Complete Flow

1. **Initial Render**: Cell displays 5 SVG stars — gold for filled, gray for unfilled
2. **User Double-Clicks or Enter**: Editor opens over cell showing interactive stars with Handsontable blue border
3. **Current Star Indicator**: The last active star turns blue (accent color) to clearly show the selected rating
4. **Mouse Hover**: User hovers over stars → preview rating updates in real-time (detected via `closest()`)
5. **Click Selection**: User clicks → rating selected and editor closes
6. **Keyboard Input**: User presses 1-5 keys → rating set directly
7. **Arrow Navigation**: User presses <kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd> → rating increments/decrements
8. **Validation**: Validator checks the value is valid
9. **Save**: Valid value saved to cell
10. **Editor Closes**: Cell shows updated star rating

## Enhancements

### 1. Show Numeric Value

Display the numeric rating alongside stars:

```typescript
renderer: rendererFactory(({ td, value }) => {
  const stars = Array.from({ length: 5 }, (_, index) =>
    `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
  ).join('');

  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${stars}</span>
      <span style="font-weight: bold; color: #666;">${value}/5</span>
    </div>
  `;
})
```

### 2. Custom Star Count

Configurable number of stars per column:

```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  const maxStars = cellProperties.maxStars || 5;

  td.innerHTML = Array.from({ length: maxStars }, (_, index) =>
    `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
  ).join('');
})

// Usage
columns: [{
  data: 'rating',
  ...cellDefinition,
  maxStars: 10 // 10-star rating
}]
```

### 3. Text Labels

Add text labels like "Excellent", "Good", etc.:

```typescript
renderer: rendererFactory(({ td, value }) => {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const label = labels[value] || '';

  const stars = Array.from({ length: 5 }, (_, index) =>
    `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
  ).join('');

  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${stars}</span>
      <span style="font-size: 0.9em; color: #666;">${label}</span>
    </div>
  `;
})
```

### 4. Custom Star Colors

Change colors by overriding CSS for specific columns:

```css
/* Red/green rating */
.custom-rating .rating-star {
  color: #e5e7eb;
}

.custom-rating .rating-star.active {
  color: #22c55e;
}
```

## Accessibility

**Keyboard navigation:**
- **Number keys (1-5)**: Direct rating selection
- <kbd>ArrowRight</kbd>: Increase rating (max 5)
- <kbd>ArrowLeft</kbd>: Decrease rating (min 1)
- <kbd>Enter</kbd>: Confirm selection and finish editing
- <kbd>Escape</kbd>: Cancel editing

---


## What you learned

You built an SVG star rating cell using `editorFactory` and `rendererFactory`. You used Handsontable CSS tokens for theme-aware styling, `closest()` for reliable hover detection on inline SVG elements, and keyboard shortcuts for direct number-key and arrow-key selection.

## Next steps

- [Star Rating (React)](@/react/recipes/cell-types/react-rating/react-rating.md) - The same concept using React's `EditorComponent` and `react-star-rating-component`.
- [Star Rating Editor (Angular)](@/angular/recipes/cell-types/guide-rating-angular/guide-rating.md) - The Angular version using `HotCellEditorAdvancedComponent`.
- [Feedback](@/recipes/cell-types/feedback/feedback.md) - Another no-library custom editor using `editorFactory` and CSS tokens.
