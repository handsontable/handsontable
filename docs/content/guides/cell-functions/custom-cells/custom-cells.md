---
id: c2670b72
title: Custom Cells
metaTitle: Simplified Custom Cell Definitions - JavaScript Data Grid | Handsontable
description: Validate data added or changed by the user, with predefined or custom rules. Validation helps you make sure that the data matches the expected format.
permalink: /custom-cells
canonicalUrl: /custom-cells
react:
  id: 6b3e971b
  metaTitle: Custom Cell Definitions - React Data Grid | Handsontable
angular:
  id: 29d3662c
  metaTitle: Custom Cell Definitions - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

# Simplified Custom Cell Definitions

[[toc]]

## Overview

This document introduces a  [convention-over-configuration](https://en.wikipedia.org/wiki/Convention_over_configuration), declarative approach to creating custom cell types in Handsontable. Rather than relying on imperative code and complex class hierarchies, you start with a working cell definition—just a few lines of code—which you then adjust to your own needs. While the previous, class-based approach isn't inherently bad and remains valuable for advanced customizations, it can be unnecessarily complex for simple editors or quick prototypes. With this factory-based method, you get a much simpler and faster way to build custom cells, while still retaining full access to Handsontable features.

## Why This Approach?

The traditional OOP approach to creating custom cells has several challenges:

1. **Steep Learning Curve**: Requires understanding of EditorManager, BaseEditor lifecycle, and complex inheritance patterns
2. **Boilerplate Code**: Lots of repetitive code for simple customizations
3. **Error-Prone**: Easy to miss critical lifecycle methods or forget to call super methods
4. **Poor Developer Experience**: Not optimized for modern workflows (AI assistance, quick prototyping)
5. **Functional programming patterns** are increasingly popular - example React moved from class components to hooks specifically to avoid `this` confusion

Our goal: **Make custom cell creation so simple that any developer can create a custom cell in minutes with AI assistance.**

## Renderers

Before diving into editors, here's how to create custom renderers:

### `renderers.factory`

A simplified way to create cell renderers.

**Signature:**
```typescript
Handsontable.renderers.factory((params) => {
  // params.instance - Handsontable instance
  // params.td - Table cell element
  // params.row - Row index
  // params.column - Column index
  // params.prop - Property name
  // params.value - Cell value
  // params.cellProperties - Cell configuration
})
```

**Example:**
```typescript
const renderer = Handsontable.renderers.factory(({ td, value }) => {
  td.style.backgroundColor = value;
  td.innerHTML = `<b>${value}</b>`;
});
```

Just use the parameters you need.

---

# Using `editorFactory` 

The `editorFactory` helper is the **recommended approach** for creating custom editors. It handles container creation, positioning, lifecycle management, and shortcuts automatically, allowing you to focus on your editor's unique functionality.

## What is `editorFactory`?

`editorFactory` is a high-level helper that wraps `BaseEditor.factory` and handles common patterns automatically. It provides:

- Automatic container creation (`editor.container`)
- Automatic positioning in `open()`
- Lifecycle hooks: `beforeOpen`, `afterOpen`, `afterInit`, `afterClose`
- Built-in shortcut support
- Value/render/config helpers
- Less boilerplate code
- Type-safe custom properties

## Basic Usage

### Cell Definition Structure

A complete cell definition includes three components:

```typescript
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    // Display the cell value
    td.innerText = value;
  }),
  
  validator: (value, callback) => {
    // Validate the value (optional)
    callback(!isNaN(parseInt(value)));
  },
  
  editor: editorFactory<{input: HTMLInputElement}>({
    init(editor) {
      editor.input = document.createElement('INPUT') as HTMLInputElement;
      // Container is created automatically and `input` is attached automatically 
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    }
  })
};
```

### Signature

```typescript
editorFactory<CustomProperties>({
  init(editor) { /* Required: Create input element */ },
  beforeOpen?(editor, { row, col, prop, td, originalValue, cellProperties }) { /* Per-cell setup */ },
  afterOpen?(editor) { /* After editor is positioned and visible */ },
  afterInit?(editor) { /* After init and UI attachment, useful for event binding */ },
  afterClose?(editor) { /* After editor closes */ },
  getValue?(editor) { /* Return current value */ },
  setValue?(editor, value) { /* Set value */ },
  onFocus?(editor) { /* Custom focus logic */ },
  shortcuts?: Array<{ /* Keyboard shortcuts */ }>,
  // ... other optional helpers
})
```

## Lifecycle Methods

Understanding when each method is called:

1. **`init(editor)`** - Called once when the editor is created (singleton pattern)
   - Create your input element (assign to `editor.input`)
   - Set up event listeners
   - Initialize third-party libraries
   - ⚠️ Container is created automatically (`editor.container`)

2. **`afterInit(editor)`** - Called immediately after `init`
   - Useful for event binding after DOM is ready
   - Access to fully initialized editor

3. **`beforeOpen(editor, { row, col, prop, td, originalValue, cellProperties })`** - Called before editor opens
   - Set editor value from `originalValue`
   - Update settings from `cellProperties`
   - Prepare editor state for the current cell
   - ⚠️ This replaces `prepare()` when using `editorFactory`

4. **`afterOpen(editor)`** - Called after editor is positioned and visible
   - Open dropdowns, pickers, or other UI elements
   - Trigger animations
   - Perform actions that require visible editor

5. **`afterClose(editor)`** - Called after editor closes
   - Cleanup actions
   - Reset state if needed

6. **`getValue(editor)`** - Called when saving the value
   - Return the current editor value
   - Optional - defaults to `editor.value`

7. **`setValue(editor, value)`** - Called to set the initial value
   - Update the editor with the cell's current value
   - Optional - defaults to setting `editor.value`

8. **`onFocus(editor)`** - Custom focus logic
   - Optional - defaults to focusing first focusable element in container
   - In case of special `focus` management, add your logic in this hook 


## Custom Properties with TypeScript

Define custom properties for your editor using generics:

```typescript
type MyEditorProps = {
  input: HTMLInputElement; // You create this
  container: HTMLDivElement; // Provided automatically by editorFactory
  myLibraryInstance: any;
};

const editor = editorFactory<MyEditorProps>({
  init(editor) {
    // TypeScript knows about editor.input, editor.container, etc.
    editor.input = document.createElement('INPUT') as HTMLInputElement;
    // editor.container is created automatically
    editor.myLibraryInstance = {/***/};
  },
  getValue(editor) {
    return editor.input.value; // Fully typed!
  }
});
```

## Common Patterns

### Pattern 1: Simple Input Wrapper

For wrapping HTML5 inputs:

```typescript
editor: editorFactory<{input: HTMLInputElement}>({
  init(editor) {
    editor.input = document.createElement('INPUT') as HTMLInputElement;
    editor.input.type = 'date'; // or 'text', 'color', etc.
    // Container is created automatically
  },
  afterOpen(editor) {
    // Open native picker if needed
    editor.input.showPicker();
  },
  getValue(editor) { 
    return editor.input.value; 
  },
  setValue(editor, value) { 
    editor.input.value = value; 
  }
})
```

### Pattern 2: Third-Party Library Integration

For integrating libraries like date pickers, color pickers, etc.:

```typescript
editor: editorFactory<{input: HTMLInputElement, picker: PickerInstance}>({
  init(editor) {
    editor.input = document.createElement('INPUT') as HTMLInputElement;
    editor.picker = initPicker(editor.input);
    
    // Handle picker events
    editor.picker.on('change', () => {
      editor.finishEditing();
    });
  },
  afterOpen(editor) {
    // Open picker after editor is positioned
    editor.picker.open();
  }
})
```

### Pattern 3: Preventing Click-Outside Closing

By default, Handsontable will attempt to close a custom editor whenever the user clicks outside the cell or editor container ("click-outside-to-close" behavior). If your editor contains elements like dropdowns, popups, or overlays rendered outside the container, you'll need to prevent this automatic closing when interacting with those UI elements.

**When is this needed?**

Use this pattern for editors that display dropdowns, popovers, or similar UI elements that aren't direct children of the editor container. Without this, clicking the dropdown will be interpreted as clicking "outside," causing the editor to close unexpectedly.

**Example:**
```typescript
init(editor) {
  editor.input = document.createElement('SELECT') as HTMLSelectElement;
  // ...dropdown setup, create dropdown DOM as needed

  editor.eventManager = new Handsontable.EventManager(editor.container);
  editor.eventManager.addEventListener(document.body, 'mousedown', (event) => {
    // If the click occurs inside the dropdown, don't let Handsontable close the editor
    if (editor.dropdown?.contains(event.target as Node)) {
      event.stopPropagation(); // Prevents editor from closing
    }
  });
}
```

### Pattern 4: Per-Cell Configuration

**Why is this needed?**

Handsontable columns can share the same editor, but sometimes you want different cells to behave differently—such as having distinct dropdown options, validation rules, minimum/maximum values, or UI customization. Instead of writing a separate editor for each variation, you can define per-cell properties on the column configuration or in your data. Using the `beforeOpen` lifecycle hook, you can dynamically read and apply these customizations every time the editor is opened for a specific cell.

Use `beforeOpen` to read cell-specific settings:

```typescript
beforeOpen(editor, { originalValue, cellProperties }) {
  // Access custom cell properties
  const options = cellProperties.customOptions;
  editor.updateOptions(options);

  // Set initial value
  editor.setValue(originalValue);
}
```

### Pattern 5: Keyboard Shortcuts

**Why is this needed?**

Handsontable is designed to be fully usable with keyboard navigation, allowing users to work efficiently without a mouse. Supporting custom keyboard shortcuts in your editors greatly improves accessibility and power-user productivity. With custom shortcuts, you can let users quickly commit or cancel changes, navigate between UI elements, or trigger special editor behaviors—all from the keyboard.

This is crucial for users who rely on keyboard navigation, require a screen reader, or simply want a faster editing experience. By adding custom shortcuts, your custom editors fully integrate with the keyboard-driven workflow of Handsontable.

**Example usage:**
```typescript
editor: editorFactory<{input: HTMLInputElement}>({
  init(editor) {
    editor.input = document.createElement('DIV') as HTMLDivElement;
    // ... setup
  },
  shortcuts: [
    {
      keys: [['ArrowLeft']],
      callback: (editor, event) => {
        // Custom action for ArrowLeft
        return false; // Don't prevent default
      }
    },
    {
      keys: [['1'], ['2'], ['3']],
      callback: (editor, event) => {
        // Handle number keys
        return true; // Prevent default
      }
    }
  ]
})
```

### Pattern 6: Overriding Editor Default Behavior

**Why is this needed?**

Handsontable has default keyboard behaviors that control how editors open, close, and navigate. By default, certain keys trigger specific actions:

- Clicking on another cell (saves changes)
- Pressing <kbd>Enter</kbd> (saves changes and moves selection one cell down)
- Pressing <kbd>Shift</kbd>+<kbd>Enter</kbd> (saves changes and moves selection one cell up)
- Pressing <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd> or <kbd>Alt</kbd>/<kbd>Option</kbd>+<kbd>Enter</kbd> (adds a new line inside the cell)
- Pressing <kbd>Escape</kbd> (aborts changes)
- Pressing <kbd>Tab</kbd> (saves changes and moves one cell to the right or to the left, depending on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction))
- Pressing <kbd>Shift</kbd>+<kbd>Tab</kbd> (saves changes and moves one cell to the left or to the right, depending on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction))
- Pressing <kbd>Page Up</kbd>, <kbd>Page Down</kbd> (saves changes and moves one screen up/down)

Sometimes you want to override these default behaviors. For example, you might want <kbd>Tab</kbd> to cycle through options within your editor instead of moving to the next cell.

**Example: Overriding Tab Key Behavior**

```typescript
editor: editorFactory<{input: HTMLDivElement, value: string, config: string[]}>({
  config: ['👍', '👎', '🤷‍♂️'],
  init(editor) {
    editor.input = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
    // ... setup
  },
   shortcuts: [
    {
      keys: [["Tab"]],
      callback: (editor, _event) => {
        let index = editor.config.indexOf(editor.value);
        index = index === editor.config.length - 1 ? 0 : index + 1;
        editor.setValue(editor.config[index]);
        retrun false; // Prevents default action 
      }
    }
   ]
})
```

**How it works:**
- Keyboard shortcut `callback` is called for every key press when the editor is active (open)
- Return `false` to prevent Handsontable's default behavior for that key
- Return `true` (or nothing) to allow the default behavior
- This gives you full control over keyboard interactions within your editor

**Common use cases:**
- Making Tab cycle through options instead of moving cells
- Preventing Enter from closing the editor in multi-line inputs
- Adding custom behavior to Escape key
- Overriding navigation keys for custom UI elements


## Usage in Handsontable

Apply your cell definition to columns:

```typescript
new Handsontable(container, {
  data: myData,
  columns: [
    { data: 'id', type: 'numeric' },
    { 
      data: 'customField',
      ...cellDefinition, // Spread renderer, validator, editor
      // Any custom properties
      customOptions: { /* ... */ }
    }
  ]
});
```

## Best Practices with `editorFactory`

### 1. Performance

- Create DOM elements in `init()`, not `afterOpen()`
- Reuse instances when possible
- Keep renderers simple and fast

### 2. Positioning

Positioning is handled automatically by `editorFactory`. You don't need to position the editor manually. The container is automatically positioned over the cell when `open()` is called.

### 3. Cleanup

Clean up resources in `afterClose()` if needed:

```typescript
afterClose(editor) {
  // Release resources if needed
  // editor.picker.destroy(); // Example
  // Container is hidden automatically
}
```

### 4. Validation

Use validators to ensure data integrity:

```typescript
validator: (value, callback) => {
  // Synchronous validation
  callback(isValid(value));
}
```

## Examples

👉 **[Browse All Recipes](@/recipes/introduction.md)** - Find recipes by use case, difficulty, or technology

We provide complete working examples for common use cases. All examples use the `editorFactory` helper:

1. **[Color Picker](@/recipes/cells/guide-color-picker/guide-color-picker.md)** - Integrate a color picker library using `editorFactory`
2. **[Flatpickr Date Picker](@/recipes/cells/guide-flatpickr/guide-flatpickr.md)** - Advanced date picker with options using `editorFactory`
3. **[Native Date Input](@/recipes/cells/guide-input-date/guide-input-date.md)** - HTML5 date input using `editorFactory`
4. **[Feedback Editor](@/recipes/cells/guide-feedback/guide-feedback.md)** - Emoji feedback buttons using `editorFactory`
5. **[Star Rating](@/recipes/cells/guide-rating/guide-rating.md)** - Interactive star rating using `editorFactory`
6. **[Multiple Select](@/recipes/cells/guide-select-multiple/guide-select-multiple.md)** - Multi-select dropdown using `editorFactory`

## Migration from Traditional Approach

If you have existing custom editors, migrating to this approach is optional. The `editorFactory` method is simply a helper built on top of the existing Editor classes. Your previous custom editors remain fully backward compatible, so you can continue using them as-is or migrate at your convenience.

**Before (Traditional):**
```javascript
class CustomEditor extends Handsontable.editors.BaseEditor {
  constructor(instance) {
    super(instance);
  }
  
  init() {
    this.wrapper = this.hot.document.root.createElement('DIV');
    this.input = this.hot.document.root.createElement('INPUT');
    this.hot.document.appendChild(this.wrapper);
    this.wrapper.appendChikd(this.input);
    // ...
  }
  
  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
  }
  
  // ... many more methods
}
```

**After (Using `editorFactory`):**
```typescript
const editor = editorFactory<{input: HTMLInputElement}>({
  init(editor) {
    editor.input = document.createElement('INPUT') as HTMLInputElement;
  },
  getValue(editor) {
    return editor.input.value;
  }
  setValue(editor, value) {
    editor.input.value = value;
  }
});
```

## Troubleshooting with `editorFactory`

### Editor Not Showing

- Container positioning is handled automatically
- Check that `init()` creates `editor.input` element
- Verify `afterOpen()` is called if you need to trigger UI elements

### Value Not Saving

- Verify `getValue()` returns the correct value
- Check validator is calling `callback(true)`
- Ensure `setValue()` properly updates the editor

### Click Outside Closes Immediately

- Use `EventManager` to stop propagation
- See Pattern 3 above
- Use `editor.container` (not `editor.wrapper`)

---

# Using `BaseEditor.factory` (Advanced)

`BaseEditor.factory` is the lower-level foundation that `editorFactory` builds upon. Use it when you need full control over container creation, positioning, and lifecycle management.

## When to Use `BaseEditor.factory`

Use `BaseEditor.factory` when:
- You need full control over container creation and styling
- You want to customize positioning logic
- You're building a highly specialized editor that doesn't fit `editorFactory` patterns
- You're migrating from class-based editors and want more control

**For most cases, prefer `editorFactory`** - it handles the common patterns automatically.

## What is `BaseEditor.factory`?

`BaseEditor.factory` is a simplified way to create custom editors by defining only the methods you need. It provides:

- Only implement the methods you need
- Automatic `super` method handling
- Type-safe custom properties via generics `<CustomProperties>`
- Direct access to editor instance properties
- Backward compatible
- First passed parameter is always `editor` instance, instead of using `this`
- ⚠️ You must handle container creation and positioning manually

## Signature

```typescript
Handsontable.editors.BaseEditor.factory<CustomProperties>({
  init(editor) { /* One-time setup */ },
  getValue(editor) { /* Return current value */ },
  setValue(editor, value) { /* Set value */ },
  open(editor) { /* Show editor - must handle positioning */ },
  close(editor) { /* Hide editor */ },
  focus(editor) { /* Focus editor */ },
  prepare(editor, row, col, prop, td, originalValue, cellProperties) { /* Per-cell setup */ }
})
```

## Lifecycle Methods

1. **`init(editor)`** - Called once when the editor is created (singleton pattern)
   - Create DOM elements
   - Set up event listeners
   - Initialize third-party libraries
   - Create and position container manually

2. **`prepare(editor, row, col, prop, td, originalValue, cellProperties)`** - Called every time a cell is selected
   - Update editor state for the current cell
   - Read cell-specific configuration
   - Pre-populate options or data

3. **`open(editor)`** - Called when the user starts editing
   - Position the editor over the cell (manual positioning required)
   - Show the editor UI
   - Focus the input

4. **`getValue(editor)`** - Called when saving the value
   - Return the current editor value

5. **`setValue(editor, value)`** - Called to set the initial value
   - Update the editor with the cell's current value

6. **`focus(editor)`** - Called when the editor needs focus
   - Ensure the input element is focused

7. **`close(editor)`** - Called when editing ends
   - Hide the editor
   - Clean up temporary state

## Custom Properties with TypeScript

```typescript
type MyEditorProps = {
  input: HTMLInputElement;
  wrapper: HTMLDivElement; // You create this manually
  myLibraryInstance: any;
};

const editor = Handsontable.editors.BaseEditor.factory<MyEditorProps>({
  init(editor) {
    // TypeScript knows about editor.input, editor.wrapper, etc.
    editor.input = document.createElement('INPUT') as HTMLInputElement;
    editor.wrapper = document.createElement('DIV') as HTMLDivElement;
    editor.myLibraryInstance = {/***/};
  },
  getValue(editor) {
    return editor.input.value; // Fully typed!
  }
});
```

## Common Patterns with `BaseEditor.factory`

### Pattern 1: Simple Input Wrapper

```typescript
editor: Handsontable.editors.BaseEditor.factory<{input: HTMLInputElement, wrapper: HTMLDivElement}>({
  init(editor) {
    editor.wrapper = editor.hot.rootDocument.createElement('DIV') as HTMLDivElement;
    editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
    editor.input.type = 'text';
    editor.wrapper.appendChild(editor.input);
    editor.hot.rootElement.appendChild(editor.wrapper);
  },
  getValue(editor) { return editor.input.value; },
  setValue(editor, value) { editor.input.value = value; },
  open(editor) {
    const rect = editor.getEditedCellRect();
    editor.wrapper.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.start}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      display: block;
    `;
  },
  close(editor) { editor.wrapper.style.display = 'none'; }
})
```

### Pattern 2: Preventing Click-Outside Closing

```typescript
init(editor) {
  editor.wrapper = document.createElement('DIV') as HTMLDivElement;
  // ... setup
  
  editor.eventManager = new Handsontable.EventManager(editor.wrapper);
  editor.eventManager.addEventListener(document.body, 'mousedown', (event) => {
    if (editor.dropdown?.contains(event.target as Node)) {
      event.stopPropagation();
    }
  });
}
```

### Pattern 3: Per-Cell Configuration

```typescript
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  const options = cellProperties.customOptions;
  editor.updateOptions(options);
  editor.input.value = originalValue;
}
```

## Best Practices with `BaseEditor.factory`

### Positioning

Always position editors using `getEditedCellRect()`:

```typescript
open(editor) {
  const rect = editor.getEditedCellRect();
  editor.wrapper.style = `
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.start}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
  `;
}
```

### Cleanup

Clean up resources in `close()` if needed:

```typescript
close(editor) {
  editor.wrapper.style.display = 'none';
  // Release resources if needed
  // editor.picker.destroy(); // Example
}
```

## Troubleshooting with `BaseEditor.factory`

### Editor Not Showing

- Check that `open()` sets `display: block` or similar
- Verify positioning with `getEditedCellRect()`
- Ensure z-index is appropriate

### Value Not Saving

- Verify `getValue()` returns the correct value
- Check validator is calling `callback(true)`
- Ensure `setValue()` properly updates the editor

### Click Outside Closes Immediately

- Use `EventManager` to stop propagation
- See Pattern 2 above
- Use `editor.wrapper` (not `editor.container`)

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type Handsontable from 'handsontable';

// Define your custom properties type
type CustomEditorProps = {
  input: HTMLInputElement;
  wrapper: HTMLDivElement;
};

// Factory provides full type safety
const editor = Handsontable.editors.BaseEditor.factory<CustomEditorProps>({
  init(editor) {
    // editor.input is fully typed
    editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
  }
});
```

---

## Contributing

Have you created a useful custom cell? Consider contributing it as an example!

---

*This approach aims to make Handsontable custom cells as accessible as possible, enabling teams to create custom cells in minutes rather than hours.*
