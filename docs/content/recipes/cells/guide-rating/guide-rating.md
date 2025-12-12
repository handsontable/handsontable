---
id: b5f02fb2
title: "Recipe: Star Rating Editor"
metaTitle:  "Recipe: Star Rating Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using star emojis for intuitive 1-5 star ratings directly in your data grid.
permalink: /recipes/stars-rating
canonicalUrl: /recipes/stars-rating
tags:
  - guides
  - tutorial
  - recipes
react:
  id: dd56fc85
  metaTitle: "Recipe: Star Rating Editor - React Data Grid | Handsontable"
angular:
  id: e51f625c
  metaTitle: "Recipe: Star Rating Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Star Rating Editor Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create an interactive star rating cell using emoji stars. Perfect for product ratings, review scores, or any scenario where users need to provide a 1-5 star rating.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (pure HTML and JavaScript)

## What You'll Build

A cell that:
- Displays 5 stars both when editing and viewing
- Shows filled stars (opacity 1.0) and unfilled stars (opacity 0.4)
- Supports mouse hover for preview
- Allows keyboard input (1-5 keys, arrow keys)
- Provides immediate visual feedback
- Works without any external libraries

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-rating/javascript/example1.js)
@[code](@/content/recipes/cells/guide-rating/javascript/example1.ts)

:::

:::

## Prerequisites

None! This uses only native HTML and JavaScript features.

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

registerAllModules();
```

**What we're NOT importing:**
- No date libraries
- No UI component libraries
- No external emoji libraries
- Just Handsontable.

## Step 2: Create the Renderer

The renderer displays 5 stars with filled stars (opacity 1.0) and unfilled stars (opacity 0.4).

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = Array.from({ length: 5 }, (_, index) =>
    `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
  ).join('');

  return td;
})
```

**What's happening:**

### Key concepts:
- `Array.from({ length: 5 })` - Creates an array with 5 elements (indices 0-4)
- `index < value` - Stars up to the rating value are filled (opacity 1.0)
- `index >= value` - Stars beyond the rating are unfilled (opacity 0.4)
- `join('')` - Concatenates all star spans into a single string

**Visual example:**
- Rating 3: ⭐⭐⭐<span style="opacity:0.4">⭐⭐</span> (first 3 stars full opacity, last 2 faded)
- Rating 5: ⭐⭐⭐⭐⭐ (all 5 stars full opacity)
- Rating 1: ⭐<span style="opacity:0.4">⭐⭐⭐⭐</span> (first star full, rest faded)

**Why opacity instead of showing/hiding?**
- Creates a smooth visual feedback
- All stars always visible (easier to understand scale)
- Intuitive "filled vs unfilled" appearance

## Step 3: Create the Validator

Ensure values are within the 1-5 star range.

```typescript
validator: (value, callback) => {
  value = parseInt(value);

  callback(value >= 1 && value <= 5);
}
```

**What's happening:**
- Convert value to integer (keyboard input returns strings)
- Check if between 1 and 5 (star rating range)
- Call `callback(true)` for valid, `callback(false)` for invalid

## Step 4: Editor - Initialize (`init`)

Create the container div for the star rating editor.

```typescript
init(editor) {
  // Create container div for stars
  editor.input = editor.hot.rootDocument.createElement('div') as HTMLDivElement;
  editor.input.style = 'background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;';
}
```

**What's happening:**
1. Create a `div` container for the star buttons
2. Style it with background, padding, border, and cursor pointer
3. This container will hold the 5 star elements

**Key styling:**
- `background: #eee` - Light gray background
- `padding: 5px 8px` - Internal spacing
- `border: 1px solid blue` - Visual border
- `cursor: pointer` - Indicates interactivity
- `border-radius: 4px` - Rounded corners
- `font-size: 16px` - Star emoji size

## Step 5: Editor - After Init Hook (`afterInit`)

Set up mouse events for hover preview and click selection.

```typescript
afterInit(editor) {
  // Mouseover: preview rating as user hovers
  editor.input.addEventListener('mouseover', (event) => {
    if (event.target instanceof HTMLSpanElement && event.target.dataset.value) {
      const hoverValue = parseInt(event.target.dataset.value);

      if (parseInt(editor.value) !== hoverValue) {
        editor.setValue(hoverValue);
      }
    }
  });

  // Mousedown: select rating and finish editing
  editor.input.addEventListener('mousedown', () => {
    editor.finishEditing();
  });
}
```

**What's happening:**

### Mouseover Event:
1. User hovers over a star
2. Check if target is a star span with `data-value` attribute
3. Get the hover rating from `dataset.value`
4. If different from current value, update it
5. This creates a "preview" effect as user hovers

### Mousedown Event:
1. User clicks (mousedown) anywhere in the editor
2. Finish editing immediately
3. Value is saved to the cell

**Why mousedown instead of click?**
- `mousedown` fires earlier than `click`
- Feels more responsive
- User sees immediate feedback

## Step 6: Editor - Render Function (`render`)

Generate the HTML for the 5 star buttons based on current rating.

```typescript
render(editor) {
  editor.input.innerHTML = Array.from({ length: 5 }, (_, index) =>
    `<span data-value="${index + 1}" style="opacity: ${index < editor.value ? '1' : '0.4'}">⭐</span>`
  ).join('');
}
```

**What's happening:**
1. Create 5 star spans (indices 0-4, values 1-5)
2. Each span has `data-value` attribute with rating (1-5)
3. Opacity: filled stars (index < value) = 1.0, unfilled = 0.4
4. Join all spans into a single HTML string

**Key attributes:**
- `data-value="${index + 1}"` - Stores the rating for this star (1-5)
- Used by mouseover event to know which rating to preview
- Enables click-to-select functionality

**Dynamic rendering:**
- Updates whenever `editor.setValue()` is called
- Automatically called by `editorFactory` when value changes
- Provides live preview as user interacts

## Step 7: Editor - Keyboard Shortcuts

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
- **ArrowRight**: Increase rating (max 5)
- **ArrowLeft**: Decrease rating (min 1)
- Bounded within valid range
- Smooth incremental adjustment

**Keyboard navigation benefits:**
- Fast selection without mouse
- Accessible for keyboard-only users
- Number keys for direct selection, arrows for adjustment

## Step 8: Complete Cell Definition

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = Array.from({ length: 5 }, (_, index) =>
      `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
    ).join('');

    return td;
  }),

  validator: (value, callback) => {
    value = parseInt(value);

    callback(value >= 1 && value <= 5);
  },

  editor: editorFactory<{ input: HTMLDivElement }>({
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
    ],
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('div') as HTMLDivElement;
      editor.input.style = 'background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;';
    },
    afterInit(editor) {
      editor.input.addEventListener('mouseover', (event) => {
        if (event.target instanceof HTMLSpanElement && event.target.dataset.value) {
          const hoverValue = parseInt(event.target.dataset.value);

          if (parseInt(editor.value) !== hoverValue) {
            editor.setValue(hoverValue);
          }
        }
      });
      editor.input.addEventListener('mousedown', () => {
        editor.finishEditing();
      });
    },
    render(editor) {
      editor.input.innerHTML = Array.from({ length: 5 }, (_, index) =>
        `<span data-value="${index + 1}" style="opacity: ${index < editor.value ? '1' : '0.4'}">⭐</span>`
      ).join('');
    },
  }),
};
```

**What's happening:**
- **renderer**: Displays 5 stars with opacity based on rating
- **validator**: Ensures rating is between 1-5
- **editor**: Uses `editorFactory` helper with:
  - Keyboard shortcuts for 1-5 keys and arrow keys
  - Container initialization
  - Mouse events for hover preview and click
  - Render function to generate star HTML

## Step 9: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: 'Lunar Core', stars: 4 },
    { id: 2, itemName: 'Zero Thrusters', stars: 2 },
    { id: 3, itemName: 'EVA Suits', stars: 5 },
    { id: 4, itemName: 'Solar Panels', stars: 3 },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Rating',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'itemName', type: 'text' },
    {
      data: 'stars',
      width: 100,
      ...cellDefinition,
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

## How It Works - Complete Flow

1. **Initial Render**: Cell displays 5 stars with filled stars based on rating
2. **User Double-Clicks or F2**: Editor opens over cell showing interactive stars
3. **Mouse Hover**: User hovers over stars → preview rating updates in real-time
4. **Click Selection**: User clicks → rating selected and editor closes
5. **Keyboard Input**: User presses 1-5 keys → rating set directly
6. **Arrow Navigation**: User presses ArrowLeft/Right → rating increments/decrements
7. **Validation**: Validator checks range (1-5)
8. **Save**: Valid value saved to cell
9. **Editor Closes**: Cell shows updated star rating

## Enhancements

### 1. Show Numeric Value

Display the numeric rating alongside stars:

```typescript
renderer: rendererFactory(({ td, value }) => {
  const stars = Array.from({ length: 5 }, (_, index) =>
    `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
  ).join('');

  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${stars}</span>
      <span style="font-weight: bold; color: #666;">${value}/5</span>
    </div>
  `;

  return td;
})
```

### 2. Color-Coded Stars

Change star color based on rating value:

```typescript
renderer: rendererFactory(({ td, value }) => {
  let color = '#ffd700'; // Gold for high ratings

  if (value <= 2) color = '#f44336'; // Red for low ratings
  else if (value === 3) color = '#ff9800'; // Orange for medium

  td.innerHTML = Array.from({ length: 5 }, (_, index) =>
    `<span style="opacity: ${index < value ? '1' : '0.4'}; color: ${color};">⭐</span>`
  ).join('');

  return td;
})
```

### 3. Half-Star Ratings

Support half-star ratings (0.5 increments):

```typescript
renderer: rendererFactory(({ td, value }) => {
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;

  td.innerHTML = Array.from({ length: 5 }, (_, index) => {
    if (index < fullStars) {
      return '<span style="opacity: 1;">⭐</span>';

    } else if (index === fullStars && hasHalfStar) {
      return '<span style="opacity: 0.5;">⭐</span>';
    }

    return '<span style="opacity: 0.4;">⭐</span>';
  }).join('');

  return td;
})

// Update validator
validator: (value, callback) => {
  value = parseFloat(value);

  callback(value >= 0.5 && value <= 5 && value % 0.5 === 0);
}
```

### 4. Custom Star Count

Configurable number of stars per column:

```typescript
// Make star count configurable
renderer: rendererFactory(({ td, value, cellProperties }) => {
  const maxStars = cellProperties.maxStars || 5;

  td.innerHTML = Array.from({ length: maxStars }, (_, index) =>
    `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
  ).join('');

  return td;
})

// Usage
columns: [{
  data: 'rating',
  ...cellDefinition,
  maxStars: 10 // 10-star rating
}]
```

### 5. Text Labels

Add text labels like "Excellent", "Good", etc.:

```typescript
renderer: rendererFactory(({ td, value }) => {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const label = labels[value] || '';

  const stars = Array.from({ length: 5 }, (_, index) =>
    `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
  ).join('');

  td.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${stars}</span>
      <span style="font-size: 0.9em; color: #666;">${label}</span>
    </div>
  `;

  return td;
})
```


## Accessibility

Add ARIA attributes for screen readers:

```typescript
render(editor) {
  editor.input.innerHTML = Array.from({ length: 5 }, (_, index) => {
    const rating = index + 1;
    const isSelected = index < editor.value;

    return `<span
      data-value="${rating}"
      role="button"
      aria-label="${rating} star${rating > 1 ? 's' : ''}"
      aria-pressed="${isSelected}"
      tabindex="${isSelected ? '0' : '-1'}"
      style="opacity: ${isSelected ? '1' : '0.4'}">⭐</span>`;
  }).join('');
}
```

**Keyboard navigation:**
- **Number keys (1-5)**: Direct rating selection
- **Arrow Right**: Increase rating (max 5)
- **Arrow Left**: Decrease rating (min 1)
- **Enter**: Confirm selection and finish editing
- **Escape**: Cancel editing
- **Tab**: Navigate to editor

**ARIA attributes:**
- `role="button"`: Identifies stars as interactive buttons
- `aria-label`: Describes each star (e.g., "1 star", "2 stars")
- `aria-pressed`: Indicates selected stars
- `tabindex`: Controls keyboard focus order

## Performance Considerations

### Why This Is Fast

1. **Simple DOM**: Just 5 span elements, minimal markup
2. **No External Libraries**: Zero overhead
3. **Efficient Updates**: Only re-renders when value changes
4. **Native Events**: Browser-optimized mouse/keyboard handlers

### The Render Function

```typescript
render(editor) {
  editor.input.innerHTML = Array.from({ length: 5 }, (_, index) =>
    `<span data-value="${index + 1}" style="opacity: ${index < editor.value ? '1' : '0.4'}">⭐</span>`
  ).join('');
}
```

**Is this expensive?**
- **Fires on**: Value changes (not continuously)
- **DOM update**: Single `innerHTML` assignment
- **String concatenation**: Very fast in modern JS

**Performance verdict**: Extremely fast!
- Minimal DOM manipulation (5 spans)
- No complex calculations
- Simple string operations

**Optimization (if needed):**
For many rows, consider caching star elements:

```typescript
init(editor) {
  // Create stars once
  editor.stars = Array.from({ length: 5 }, (_, index) => {
    const star = document.createElement('span');

    star.setAttribute('data-value', String(index + 1));
    star.textContent = '⭐';
    star.style.opacity = '0.4';

    return star;
  });

  editor.stars.forEach(star => editor.input.appendChild(star));
}

render(editor) {
  // Just update opacity classes
  editor.stars.forEach((star, index) => {
    star.style.opacity = index < editor.value ? '1' : '0.4';
  });
}
```

## Styling Tips

### Custom Star Appearance (CSS)

```css
/* Style the editor container */
.htSelectEditor {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Style stars */
.htSelectEditor span {
  display: inline-block;
  font-size: 1.2em;
  margin: 0 2px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.htSelectEditor span:hover {
  transform: scale(1.2);
  filter: brightness(1.2);
}

/* Style filled stars */
.htSelectEditor span[style*="opacity: 1"] {
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
}
```

### Custom Cell Renderer Styling

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = `
    <div style="
      text-align: center;
      font-size: 1.5em;
      padding: 8px;
      background: linear-gradient(to right,
        ${value >= 1 ? '#ffd700' : '#e0e0e0'} 0%,
        ${value >= 2 ? '#ffd700' : '#e0e0e0'} 20%,
        ${value >= 3 ? '#ffd700' : '#e0e0e0'} 40%,
        ${value >= 4 ? '#ffd700' : '#e0e0e0'} 60%,
        ${value >= 5 ? '#ffd700' : '#e0e0e0'} 80%,
        #e0e0e0 100%
      );
      border-radius: 4px;
    ">
      ${Array.from({ length: 5 }, (_, index) =>
        `<span style="opacity: ${index < value ? '1' : '0.4'}">⭐</span>`
      ).join('')}
    </div>
  `;

  return td;
})
```

### Animated Star Fills

Add smooth transitions when rating changes:

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = Array.from({ length: 5 }, (_, index) =>
    `<span style="
      opacity: ${index < value ? '1' : '0.4'};
      transition: opacity 0.3s ease;
      display: inline-block;
    ">⭐</span>`
  ).join('');

  return td;
})
```


---

**Congratulations!** You've created an interactive star rating editor with hover preview and keyboard support using only native HTML and JavaScript, perfect for intuitive 1-5 star ratings in your data grid!
