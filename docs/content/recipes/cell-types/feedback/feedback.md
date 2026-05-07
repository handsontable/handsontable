---
type: tutorial
id: e23f98e7
title: Feedback
metaTitle:  Feedback Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/cell-types/feedback
canonicalUrl: /recipes/cell-types/feedback
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 034db272
  metaTitle: Feedback Cell Type - React Data Grid | Handsontable
angular:
  id: 8e13e6d5
  metaTitle: Feedback Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build an emoji feedback cell using Handsontable's `editorFactory` helper, with Handsontable CSS tokens for theme-aware styling and keyboard navigation.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/cell-types/feedback/javascript/example1.js)
@[code](@/content/recipes/cell-types/feedback/javascript/example1.ts)
@[code](@/content/recipes/cell-types/feedback/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/feedback/react/example1.css)
@[code](@/content/recipes/cell-types/feedback/react/example1.jsx)
@[code](@/content/recipes/cell-types/feedback/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/cell-types/feedback/angular/example1.ts)
@[code](@/content/recipes/cell-types/feedback/angular/example1.html)
@[code](@/content/recipes/cell-types/feedback/angular/example1.css)

:::

:::

## Overview

This guide shows how to create a feedback editor cell using emoji buttons. Use it for status indicators or any scenario where users choose from a small set of visual options.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (pure HTML)

## What You'll Build

A cell that:
- Displays emoji feedback buttons (rounded) when editing
- Shows the selected emoji when viewing
- Uses Handsontable CSS tokens for theme-aware styling
- Supports keyboard navigation (arrow keys, <kbd>Tab</kbd>)
- Provides click-to-select functionality
- Works without any external libraries

## Prerequisites

None! This uses only native HTML and JavaScript features.

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';

registerAllModules();
```

**What we're NOT importing:**
- No date libraries
- No UI component libraries
- No external emoji libraries
- Handsontable only.

## Step 2: Add CSS Styling

Create a separate CSS file for the editor styles. This uses Handsontable CSS custom properties (tokens) so the editor automatically adapts to custom themes and dark mode.

```css
.feedback-editor {
  display: flex;
  gap: var(--ht-gap, 4px);
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  padding: var(--ht-cell-vertical-padding, 4px) var(--ht-cell-horizontal-padding, 8px);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  border: none;
  border-radius: 0;
}

.feedback-editor button {
  background: var(--ht-background-color, #ffffff);
  color: var(--ht-foreground-color, #000000);
  border: 1px solid var(--ht-border-color, #e0e0e0);
  border-radius: var(--ht-border-radius, 4px);
  padding: 0;
  margin: 0;
  height: 100%;
  width: 33%;
  font-size: var(--ht-font-size, 14px);
  text-align: center;
  cursor: pointer;
}

.feedback-editor button:hover {
  background: var(--ht-border-color, #e0e0e0);
}

.feedback-editor button.active,
.feedback-editor button.active:hover {
  background: var(--ht-accent-color, #1a42e8);
  color: #ffffff;
  border-color: var(--ht-accent-color, #1a42e8);
}
```

**Handsontable tokens used:**
- `--ht-cell-editor-border-color` / `--ht-cell-editor-border-width` - blue border matching native editors
- `--ht-cell-editor-background-color` - editor background
- `--ht-cell-vertical-padding` / `--ht-cell-horizontal-padding` - consistent cell padding
- `--ht-background-color` / `--ht-foreground-color` - base button colors
- `--ht-border-color` - button borders and hover state
- `--ht-accent-color` - active/selected button highlight
- `--ht-border-radius` - button corner rounding
- `--ht-font-size` / `--ht-gap` - consistent sizing

## Step 3: Editor - Initialize (`init`)

Create the DOM structure with emoji buttons, this function will be called only once.

```typescript
init(editor) {
  editor.input = document.createElement('DIV') as HTMLDivElement;
  editor.input.classList.add('feedback-editor');
  editor._openedAt = 0;

  editor.input.addEventListener('click', (event) => {
    // Ignore synthetic click events that Android fires right after the editor
    // opens — they land on the button that just appeared at the touch position.
    if (Date.now() - editor._openedAt < 300) {
      return;
    }
    if (event.target instanceof HTMLButtonElement) {
      editor.setValue(event.target.innerText);
      editor.finishEditing();
    }
  });

  editor.render(editor);
}
```

**What's happening:**
1. Create a `div` container for the buttons
2. Add the `feedback-editor` CSS class (all styling is in the CSS file)
3. Add click handler to detect button clicks
4. When a button is clicked, set the value and finish editing
5. Call `render` to create the initial button layout

## Step 4: Editor - Render Function

Create buttons dynamically based on the config, using CSS classes instead of inline styles.

```typescript
render(editor) {
  editor.input.innerHTML = editor.config
    .map((option) =>
      `<button class="${editor.value === option ? 'active' : ''}">${option}</button>`
    )
    .join('');
}
```

**What's happening:**
- Generate HTML for each button from `config` array
- Add `active` class to the currently selected button
- The `.active` CSS class applies `--ht-accent-color` as background
- Each button takes 33% width with rounded corners (`--ht-border-radius`)

## Step 5: Editor - Keyboard Shortcuts

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
- <kbd>ArrowRight</kbd>: Move to next option (wraps to first if at end)
- <kbd>ArrowLeft</kbd>: Move to previous option (wraps to last if at start)
- Finds current index in config array
- Updates value and triggers render automatically

**Keyboard navigation benefits:**
- Fast selection without mouse
- Accessible for keyboard-only users
- Intuitive left/right navigation

## Step 6: Editor – Custom Tab Key Behavior

By default, pressing <kbd>Tab</kbd> in Handsontable saves the cell and moves the selection horizontally, following your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction).
In this example, <kbd>Tab</kbd> cycles through feedback options -- the same as the arrow keys -- without moving to another cell.
The editor's `shortcuts` option handles this by returning `false` in the callback to prevent the default action (saving and moving to the next cell).

```typescript
shortcuts: [
  {
    keys: [['ArrowRight'], ['Tab']],
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


## Step 7: Editor - Before Open Hook

Initialize the editor with the current cell value when editing starts.

```typescript
beforeOpen(editor, { originalValue, cellProperties }) {
  editor.setValue(originalValue);
}
```

**What's happening:**
- Called when editor is about to open
- Receives the current cell value as `originalValue`
- Sets the editor's value to match the cell
- This ensures the correct button is highlighted when editing starts

## Step 8: Complete Cell Definition

```typescript
const cellDefinition = {
  editor: editorFactory<{ input: HTMLDivElement; value: string; config: string[] }>({
    config: ['👍', '👎', '🤷'],
    value: '👍',
    shortcuts: [
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);

          index = index === editor.config.length - 1 ? 0 : index + 1;
          editor.setValue(editor.config[index]);

          return false;
        },
      },
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          let index = editor.config.indexOf(editor.value);

          index = index === 0 ? editor.config.length - 1 : index - 1;
          editor.setValue(editor.config[index]);
        },
      },
    ],
    render: (editor) => {
      editor.input.innerHTML = editor.config
        .map(
          (option) =>
            `<button class="${editor.value === option ? 'active' : ''}">${option}</button>`,
        )
        .join('');
    },
    init: (editor) => {
      editor.input = document.createElement('DIV') as HTMLDivElement;
      editor.input.classList.add('feedback-editor');
      editor._openedAt = 0;
      editor.input.addEventListener('click', (event) => {
        if (Date.now() - editor._openedAt < 300) {
          return;
        }
        if (event.target instanceof HTMLButtonElement) {
          editor.setValue(event.target.innerText);
          editor.finishEditing();
        }
      });
      editor.render(editor);
    },
    afterOpen: (editor) => {
      editor._openedAt = Date.now();
    },
    beforeOpen: (editor, { originalValue, cellProperties }) => {
      editor.setValue(originalValue);
    },
  }),
};
```

**What's happening:**
- **config**: Array of emoji options (`👍`, `👎`, `🤷`)
- **value**: Default/initial value
- **shortcuts**: Keyboard navigation (<kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd> cycle options, <kbd>Tab</kbd> cycles and prevents default)
- **render**: Creates button HTML with `active` CSS class for the selected option
- **init**: Sets up the container with `feedback-editor` class and click handler
- **beforeOpen**: Initializes editor with the current cell value

**Note:** No custom renderer needed! Handsontable's default renderer will display the emoji value in the cell. All visual styling is handled by the CSS file using Handsontable tokens.

## Step 9: Register and Use in Handsontable

Register the cell definition as a reusable cell type, then use it in the column configuration.

```typescript
registerCellType('feedback', cellDefinition);

const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data: [
    { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
    { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
    { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
    { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
  ],
  colHeaders: ['Feature', 'Category', 'Priority', 'Feedback', 'Votes', 'Status'],
  autoRowSize: true,
  rowHeaders: true,
  autoWrapRow: true,
  height: 'auto',
  width: '100%',
  headerClassName: 'htLeft',
  columns: [
    { data: 'feature', type: 'text', width: 200 },
    { data: 'category', type: 'text', width: 90 },
    { data: 'priority', type: 'text', width: 100 },
    { data: 'feedback', width: 100, type: 'feedback' },
    { data: 'votes', type: 'numeric', width: 60 },
    { data: 'status', type: 'text', width: 120 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `registerCellType('feedback', cellDefinition)` - Registers the editor as a reusable cell type
- `type: 'feedback'` - Applies the cell type to the Feedback column
- `headerClassName: 'htLeft'` - Left-aligns all column headers

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the emoji value (👍, 👎, or 🤷)
2. **User Double-Clicks or <kbd>Enter</kbd>**: Editor opens over cell showing three rounded buttons with the Handsontable blue border
3. **Button Display**: All options visible, current value highlighted using `--ht-accent-color`
4. **User Interaction**:
   - Click a button: Selects value and closes editor
   - Press <kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd>: Cycles through options
   - Press <kbd>Tab</kbd>: Cycles through options (stays in editor)
   - <kbd>Enter</kbd> key saves value and closes editor
5. **Visual Feedback**: Selected button highlighted with accent color
6. **Save**: Value saved to cell
7. **Editor Closes**: Cell shows selected emoji

## Enhancements

### 1. More Feedback Options

Add more emoji options by extending the config array and adjusting the button width in CSS:

```typescript
config: ['👍', '👎', '🤷', '❤️', '🔥', '⭐'],
```

### 2. Dynamic Config from Cell Properties

Make options configurable per column:

```typescript
beforeOpen: (editor, { cellProperties }) => {
  if (cellProperties.feedbackOptions) {
    editor.config = cellProperties.feedbackOptions;
  }

  editor.setValue(editor.originalValue || editor.value);
},

// Usage
columns: [{
  data: 'feedback',
  type: 'feedback',
  feedbackOptions: ['👍', '👎', '❤️', '🔥']
}]
```

### 3. Tooltip on Hover

Add tooltips to buttons:

```typescript
render: (editor) => {
  const tooltips = { '👍': 'Positive', '👎': 'Negative', '🤷': 'Neutral' };

  editor.input.innerHTML = editor.config
    .map((option) =>
      `<button class="${editor.value === option ? 'active' : ''}" title="${tooltips[option] || ''}">${option}</button>`
    )
    .join('');
}
```

### 4. Text Labels Instead of Emojis

Use text buttons for clarity:

```typescript
config: ['Positive', 'Negative', 'Neutral'],
```

## Accessibility

**Keyboard navigation:**
- <kbd>Tab</kbd>: Cycles through feedback options (stays in editor)
- <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>: Cycles through options
- <kbd>Enter</kbd>: Saves value and closes editor
- <kbd>Escape</kbd>: Cancels editing
- **Click**: Direct selection

---


## What you learned

You built an emoji feedback cell editor using Handsontable's `editorFactory` helper. You used Handsontable CSS custom properties to style the editor in a theme-aware way, and registered the result as a reusable cell type with `registerCellType`.

## Next steps

- [Feedback (React)](@/react/recipes/cell-types/feedback-react/feedback-react.md) - The same pattern using React's `EditorComponent`.
- [Feedback Editor (Angular)](@/angular/recipes/cell-types/guide-feedback-angular/guide-feedback.md) - The Angular version using `HotCellEditorAdvancedComponent`.
- [Star Rating](@/recipes/cell-types/rating/rating.md) - Another custom editor built with `editorFactory` and SVG stars.
