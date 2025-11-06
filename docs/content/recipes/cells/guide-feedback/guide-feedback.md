---
id: e23f98e7
title: "Recipe: Feedback Editor"
metaTitle:  "Recipe: Feedback Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/feedback
canonicalUrl: /recipes/feedback
tags:
  - guides
  - tutorial
  - recipies
react:
  id: 034db272
  metaTitle: "Recipe: Feedback Editor - React Data Grid | Handsontable"
angular:
  id: 8e13e6d5
  metaTitle: "Recipe: Feedback Editor - Angular Data Grid | Handsontable"
searchCategory: Recepies
category: Cells
---

# Feedback Editor Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a simple feedback editor cell using emoji buttons. Perfect for quick feedback selection, status indicators, or any scenario where users need to choose from a small set of visual options.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Libraries:** None (pure HTML)

## What You'll Build

A cell that:
- Displays emoji feedback buttons when editing
- Shows the selected emoji when viewing
- Supports keyboard navigation (arrow keys)
- Provides click-to-select functionality
- Works without any external libraries

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-feedback/javascript/example1.js)
@[code](@/content/recipes/cells/guide-feedback/javascript/example1.ts)

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


## Step 2: Editor - Initialize (`init`)

Create the DOM structure with emoji buttons, this function will be called only once. 

```typescript
init(editor) {
  // Create container for buttons
  editor.input = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.input.style = 'display: flex; gap: 4px; padding: 5px; background:#eee; border: 1px solid #ccc; border-radius: 4px;';
  
  // Set up click handler for buttons
  editor.input.addEventListener('click', (event) => {
    if (event.target instanceof HTMLButtonElement) {
      editor.setValue(event.target.innerText);
      editor.finishEditing();
    }
  });
  
  // Initial render
  editor.render(editor);
}
```

**What's happening:**
1. Create a `div` container for the buttons
2. Style it with flexbox for horizontal layout
3. Add click handler to detect button clicks
4. When a button is clicked, set the value and finish editing
5. Call `render` to create the initial button layout

**Key styling:**
- `display: flex` - Horizontal button layout
- `gap: 4px` - Space between buttons
- `padding: 5px` - Internal spacing
- `border-radius: 4px` - Rounded corners

## Step 3: Editor - Render Function

Create buttons dynamically based on the config.

```typescript
render(editor) {
  editor.input.innerHTML = editor.config
    .map((option) => {
      const isSelected = editor.value === option;
      const selectedStyle = isSelected 
        ? 'background: #007bff; color: white;' 
        : '';
      return `<button style="width:33%; ${selectedStyle}">${option}</button>`;
    })
    .join('');
}
```

**What's happening:**
- Generate HTML for each button from `config` array
- Highlight the currently selected button
- Each button takes 33% width (for 3 options)
- Selected button has blue background

**Dynamic button creation:**
- Uses `map` to iterate through config options
- Conditional styling for selected state
- `join('')` concatenates into single HTML string

## Step 4: Editor - Keyboard Shortcuts

Add arrow key navigation to cycle through options.

```typescript
shortcuts: [
  {
    keys: [['ArrowRight']],
    callback: (editor, _event) => {
      let index = editor.config.indexOf(editor.value);
      index = index === editor.config.length - 1 ? 0 : index + 1;
      editor.setValue(editor.config[index]);
    }
  },
  {
    keys: [['ArrowLeft']],
    callback: (editor, _event) => {
      let index = editor.config.indexOf(editor.value);
      index = index === 0 ? editor.config.length - 1 : index - 1;
      editor.setValue(editor.config[index]);
    }
  }
]
```

**What's happening:**
- **ArrowRight**: Move to next option (wraps to first if at end)
- **ArrowLeft**: Move to previous option (wraps to last if at start)
- Finds current index in config array
- Updates value and triggers render automatically

**Keyboard navigation benefits:**
- Fast selection without mouse
- Accessible for keyboard-only users
- Intuitive left/right navigation

## Step 5: Editor – Custom Tab Key Behavior

By default, pressing <kbd>Tab</kbd> in Handsontable saves the cell and moves the selection horizontally, following your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction).  
In this example, we want <kbd>Tab</kbd> to cycle through feedback options—just like the arrow keys—without moving to another cell.  
To achieve this, we use the editor's `shortcuts`  and return `false` in callback to prevent the default action (saving and moving to the next cell).

```typescript
shortcuts: [
    {
      keys: [['ArrowRight'],[ "Tab"]],
      callback: (editor, _event) => {
        let index = editor.config.indexOf(editor.value);
        index = index === editor.config.length - 1 ? 0 : index + 1;
        editor.setValue(editor.config[index]);
        return false; // Prevent default tabbing behavior
      },
    },
]
```

**How it works:**
- Listens for <kbd>Tab</kbd> when the editor is active
- Moves to the next option in `config` (wraps around at the end)
- Updates the editor's value and button highlight
- Returning `false` blocks Handsontable's built-in tab handler, so editing stays in place


## Step 6: Editor - Before Open Hook

Initialize the editor with the current cell value when editing starts.

```typescript
beforeOpen(editor, { originalValue }) {
  editor.setValue(originalValue);
}
```

**What's happening:**
- Called when editor is about to open
- Receives the current cell value as `originalValue`
- Sets the editor's value to match the cell
- This ensures the correct button is highlighted when editing starts

## Step 7: Complete Cell Definition

```typescript
const cellDefinition = {
  editor: editorFactory<{input: HTMLDivElement, value: string, config: string[]}>({
    config: ['👍', '👎', '🤷‍♂️'],
    value: '👍',
    shortcuts: [
      {
        keys: [['ArrowRight'], ["Tab"]],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);
          index = index === editor.config.length - 1 ? 0 : index + 1;
          editor.setValue(editor.config[index]);
          retrun false;
        }
      },
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);
          index = index === 0 ? editor.config.length - 1 : index - 1;
          editor.setValue(editor.config[index]);
        }
      }
    ],
    render: (editor) => {
      editor.input.innerHTML = editor.config
        .map((option) => {
          const isSelected = editor.value === option;
          const selectedStyle = isSelected 
            ? 'background: #007bff; color: white;' 
            : '';
          return `<button style="width:33%; ${selectedStyle}">${option}</button>`;
        })
        .join('');
    },
    init: (editor) => {
      editor.input = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
      editor.input.style = 'display: flex; gap: 4px; padding: 5px; background:#eee; border: 1px solid #ccc; border-radius: 4px;';
      editor.input.addEventListener('click', (event) => {
        if (event.target instanceof HTMLButtonElement) {
          editor.setValue(event.target.innerText);
          editor.finishEditing();
        }
      });
      editor.render(editor);
    },
    beforeOpen: (editor, { originalValue }) => {
      editor.setValue(originalValue);
    },
  })
};
```

**What's happening:**
- **config**: Array of emoji options
- **value**: Default/initial value. This is optional for better readability. 
- **shortcuts**: Keyboard navigation handlers
- **render**: Function to create button HTML
- **init**: Sets up DOM and event handlers
- **beforeOpen**: Initializes editor with cell value

**Note:** No custom renderer needed! Handsontable's default renderer will display the emoji value in the cell.

## Step 8: Use in Handsontable

```typescript
const container = document.querySelector("#example1")!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    { id: 1, itemName: "Lunar Core", feedback: "👍" },
    { id: 2, itemName: "Zero Thrusters", feedback: "👎" },
    { id: 3, itemName: "EVA Suits", feedback: "🤷‍♂️" },
    { id: 4, itemName: "Solar Panels", feedback: "👍" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Item feedback",
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: "id", type: "numeric" },
    { data: "itemName", type: "text" },
    {
      data: "feedback",
      width: 150,
      ...cellDefinition,
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
};

const hot = new Handsontable(container, hotOptions);
```

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the emoji value (👍, 👎, or 🤷‍♂️)
2. **User Double-Clicks or Enter**: Editor opens over cell showing three buttons
3. **Button Display**: All options visible, current value highlighted
4. **User Interaction**: 
   - Click a button → Selects value and closes editor
   - Press ArrowLeft/Right → Cycles through options
   - Enter key saves value and closes editor 
5. **Visual Feedback**: Selected button highlighted in blue
6. **User Confirms**: Press Enter, click button, or click away
7. **Save**: Value saved to cell
8. **Editor Closes**: Cell shows selected emoji

## Enhancements

### 1. Custom Renderer with Styling

Add a custom renderer to style the emoji display:

```typescript
renderer: Handsontable.renderers.factory(({ td, value }) => {
  td.innerHTML = `
    <div style="text-align: center; font-size: 1.5em; padding: 4px;">
      ${value || '🤷‍♂️'}
    </div>
  `;
  return td;
})
```

**What's happening:**
- Center-aligns the emoji
- Increases font size for better visibility
- Adds padding for spacing

### 2. More Feedback Options

Add more emoji options:

```typescript
config: ['👍', '👎', '🤷‍♂️', '❤️', '🔥', '⭐'],
```

**Adjust button width:**
```typescript
render: (editor) => {
  const buttonWidth = `${100 / editor.config.length}%`;
  editor.input.innerHTML = editor.config
    .map((option) => {
      const isSelected = editor.value === option;
      const selectedStyle = isSelected 
        ? 'background: #007bff; color: white;' 
        : '';
      return `<button style="width:${buttonWidth}; ${selectedStyle}">${option}</button>`;
    })
    .join('');
}
```

### 3. Custom Button Styling

Enhanced button appearance:

```typescript
render: (editor) => {
  editor.input.innerHTML = editor.config
    .map((option) => {
      const isSelected = editor.value === option;
      const baseStyle = `
        width: 33%;
        padding: 8px;
        border: 2px solid ${isSelected ? '#007bff' : '#ddd'};
        background: ${isSelected ? '#007bff' : 'white'};
        color: ${isSelected ? 'white' : '#333'};
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2em;
        transition: all 0.2s;
      `;
      return `<button style="${baseStyle}">${option}</button>`;
    })
    .join('');
}
```

### 4. Dynamic Config from Cell Properties

Make options configurable per column:

```typescript
beforeOpen: (editor, { cellProperties }) => {
  // Override config if specified in column definition
  if (cellProperties.feedbackOptions) {
    editor.config = cellProperties.feedbackOptions;
  }
  editor.setValue(editor.originalValue || editor.value);
},

// Usage
columns: [{
  data: 'feedback',
  ...cellDefinition,
  feedbackOptions: ['👍', '👎', '❤️', '🔥'] // Custom options
}]
```

### 5. Tooltip on Hover

Add tooltips to buttons:

```typescript
render: (editor) => {
  const tooltips = {
    '👍': 'Positive feedback',
    '👎': 'Negative feedback',
    '🤷‍♂️': 'Neutral feedback'
  };
  
  editor.input.innerHTML = editor.config
    .map((option) => {
      const isSelected = editor.value === option;
      const selectedStyle = isSelected 
        ? 'background: #007bff; color: white;' 
        : '';
      const tooltip = tooltips[option] || '';
      return `<button 
        style="width:33%; ${selectedStyle}" 
        title="${tooltip}"
      >${option}</button>`;
    })
    .join('');
}
```

### 6. Text Labels Instead of Emojis

Use text buttons for clarity:

```typescript
config: ['Positive', 'Negative', 'Neutral'],
render: (editor) => {
  editor.input.innerHTML = editor.config
    .map((option) => {
      const isSelected = editor.value === option;
      const selectedStyle = isSelected 
        ? 'background: #007bff; color: white;' 
        : '';
      return `<button style="width:33%; ${selectedStyle}">${option}</button>`;
    })
    .join('');
}
```


## Accessibility

Buttons are inherently accessible:

```typescript
render: (editor) => {
  editor.input.innerHTML = editor.config
    .map((option, index) => {
      const isSelected = editor.value === option;
      const selectedStyle = isSelected 
        ? 'background: #007bff; color: white;' 
        : '';
      return `<button 
        style="width:33%; ${selectedStyle}"
        aria-label="${option} feedback option"
        aria-pressed="${isSelected}"
        tabindex="${isSelected ? '0' : '-1'}"
      >${option}</button>`;
    })
    .join('');
}
```

**Keyboard navigation:**
- **Tab**: Navigate to editor (focuses first button)
- **Arrow Left/Right**: Cycle through options (via shortcuts)
- **Enter**: Select current option and finish editing
- **Escape**: Cancel editing
- **Click**: Direct selection

**ARIA attributes:**
- `aria-label`: Describes each button
- `aria-pressed`: Indicates selected state
- `tabindex`: Controls keyboard focus order

## Performance Considerations

### Why This Is Fast

1. **Simple DOM**: Just a few buttons, minimal markup
2. **No External Libraries**: Zero overhead
3. **Efficient Updates**: Only re-renders when value changes
4. **Native Events**: Browser-optimized click handlers

### The Render Function

```typescript
render: (editor) => {
  editor.input.innerHTML = editor.config
    .map((option) => {
      // ... create button HTML ...
    })
    .join('');
}
```

**Is this expensive?**
- **Fires on**: Value changes (not continuously)
- **DOM update**: Single `innerHTML` assignment
- **String concatenation**: Very fast in modern JS

**Performance verdict**: Extremely fast!
- Minimal DOM manipulation
- No complex calculations
- Simple string operations

**Optimization (if needed):**
For many rows, consider caching button elements:

```typescript
init(editor) {
  // Create buttons once
  editor.buttons = editor.config.map((option) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.style.cssText = 'width:33%;';
    button.addEventListener('click', () => {
      editor.setValue(option);
      editor.finishEditing();
    });
    return button;
  });
  
  // Just update classes in render
  render: (editor) => {
    editor.buttons.forEach((button, index) => {
      const isSelected = editor.value === editor.config[index];
      button.style.background = isSelected ? '#007bff' : '';
      button.style.color = isSelected ? 'white' : '';
    });
  }
}
```

## Styling Tips

### Custom Button Appearance (CSS)

```css
/* Style the editor container */
.htSelectEditor {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Style buttons */
.htSelectEditor button {
  transition: all 0.2s ease;
  font-weight: 500;
}

.htSelectEditor button:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Style selected button */
.htSelectEditor button[aria-pressed="true"] {
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}
```

### Custom Cell Renderer Styling

```typescript
renderer: Handsontable.renderers.factory(({ td, value }) => {
  td.innerHTML = `
    <div style="
      text-align: center;
      font-size: 2em;
      padding: 8px;
      background: ${value === '👍' ? '#e8f5e9' : value === '👎' ? '#ffebee' : '#f5f5f5'};
      border-radius: 4px;
    ">
      ${value || '🤷‍♂️'}
    </div>
  `;
  return td;
})
```

### Responsive Button Layout

```typescript
init: (editor) => {
  editor.input = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.input.style.cssText = `
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  // ... rest of init
}
```


---

**Congratulations!** You've created a simple feedback editor with emoji buttons using only native HTML and JavaScript, perfect for quick feedback selection in your data grid!

