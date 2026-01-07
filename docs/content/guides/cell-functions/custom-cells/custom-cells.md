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

::: only-for react

## React 

For React applications, Handsontable provides `EditorComponent`, a high-level React component that simplifies creating custom editors. It handles container creation, positioning, lifecycle management, and shortcuts automatically, allowing you to focus on your editor's UI and logic.

### What is `EditorComponent`?

`EditorComponent` is a React component that wraps the editor functionality and provides:

- Automatic container creation and positioning
- Lifecycle hooks: `onPrepare`, `onOpen`, `onClose`, `onFocus`
- Built-in keyboard shortcut support
- Render prop pattern for flexible UI composition
- Type-safe editor state management

### Basic Usage

`EditorComponent` uses a [**render prop pattern**](https://legacy.reactjs.org/docs/render-props.html) where you pass a function as `children` that receives editor state and methods:

```tsx
import { EditorComponent } from '@handsontable/react-wrapper';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const MyCustomEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue, finishEditing, isOpen, row, col, mainElementRef }) => (
        <div>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                finishEditing();
              }
            }}
          />
        </div>
      )}
    </EditorComponent>
  );
};

const App = () => {
  return (
    <HotTable data={data} licenseKey="non-commercial-and-evaluation">
      <HotColumn editor={MyCustomEditor} />
    </HotTable>
  );
};
```

### Component Props

`EditorComponent` accepts the following props:

```typescript
<EditorComponent
  onPrepare={(row, column, prop, TD, originalValue, cellProperties) => {
    // Called before editor opens - use for positioning or setup
  }}
  onOpen={() => {
    // Called when editor becomes visible
  }}
  onClose={() => {
    // Called when editor closes
  }}
  onFocus={() => {
    // Called when editor receives focus
  }}
  shortcutsGroup="custom-editor" // Optional: group name for shortcuts
  shortcuts={[
    // Optional: keyboard shortcuts
    {
      keys: [['Enter']],
      callback: ({ value, setValue, finishEditing }, event) => {
        // Custom shortcut handler
        return false; // Return false to prevent default behavior
      }
    }
  ]}
>
  {({ value, setValue, finishEditing, isOpen, row, col, mainElementRef }) => (
    // Your editor UI
  )}
</EditorComponent>
```

### Children Function Props

The render prop function receives the following props:

- **`value: T`** - Current editor value
- **`setValue: (newValue: T) => void`** - Update the editor value
- **`finishEditing: () => void`** - Save changes and close the editor
- **`isOpen: boolean`** - Whether the editor is currently open
- **`row: number | undefined`** - Current row index
- **`col: number | undefined`** - Current column index
- **`mainElementRef: React.RefObject<HTMLDivElement>`** - Reference to the editor container element

### Lifecycle Hooks

1. **`onPrepare(row, column, prop, TD, originalValue, cellProperties)`** - Called before the editor opens
   - Use for per-cell setup, reading custom properties, or positioning
   - The container is automatically positioned, but you can override if needed

2. **`onOpen()`** - Called after the editor is positioned and visible
   - Use to open dropdowns, trigger animations, or focus elements

3. **`onClose()`** - Called when the editor closes
   - Use for cleanup actions

4. **`onFocus()`** - Called when the editor receives focus
   - Use for custom focus management

### Common Patterns

#### Pattern 1: Simple Input Editor

```tsx
const TextEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue, finishEditing }) => (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          onBlur={finishEditing}
          autoFocus
        />
      )}
    </EditorComponent>
  );
};
```

#### Pattern 2: Dropdown Select Editor

```tsx
const SelectEditor = () => {
  return (
    <EditorComponent
      onPrepare={(row, col, prop, TD, originalValue, cellProperties) => {
        // Access per-cell options
        const options = cellProperties.options || [];
      }}
    >
      {({ value, setValue, finishEditing }) => {
        const options = ['Option 1', 'Option 2', 'Option 3'];
        
        return (
          <select
            value={value || ''}
            onChange={(e) => {
              setValue(e.target.value);
              finishEditing();
            }}
            autoFocus
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }}
    </EditorComponent>
  );
};
```

#### Pattern 3: Custom UI with Buttons

```tsx
const ButtonEditor = () => {
  return (
    <EditorComponent>
      {({ value, setValue, finishEditing }) => (
        <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
          <button onClick={() => { setValue('Yes'); finishEditing(); }}>
            Yes
          </button>
          <button onClick={() => { setValue('No'); finishEditing(); }}>
            No
          </button>
          <button onClick={() => { setValue('Maybe'); finishEditing(); }}>
            Maybe
          </button>
        </div>
      )}
    </EditorComponent>
  );
};
```

#### Pattern 4: Keyboard Shortcuts

```tsx
const ShortcutEditor = () => {
  return (
    <EditorComponent
      shortcuts={[
        {
          keys: [['Tab']],
          callback: ({ value, setValue, finishEditing }, event) => {
            // Cycle through options on Tab
            const options = ['A', 'B', 'C'];
            const currentIndex = options.indexOf(value);
            const nextIndex = (currentIndex + 1) % options.length;
            setValue(options[nextIndex]);
            return false; // Prevent default Tab behavior
          }
        },
        {
          keys: [['Escape']],
          callback: ({ finishEditing }, event) => {
            finishEditing();
            return false; // Prevent default Escape behavior
          }
        }
      ]}
    >
      {({ value, setValue }) => (
        <div>
          <input value={value || ''} onChange={(e) => setValue(e.target.value)} />
          <p>Press Tab to cycle options, Escape to close</p>
        </div>
      )}
    </EditorComponent>
  );
};
```

#### Pattern 5: Third-Party Library Integration

```tsx
import { useEffect, useRef } from 'react';
import SomePickerLibrary from 'some-picker-library';

const PickerEditor = () => {
  const pickerRef = useRef(null);
  
  return (
    <EditorComponent
      onOpen={() => {
        // Open picker when editor opens
        pickerRef.current?.open();
      }}
      onClose={() => {
        // Close picker when editor closes
        pickerRef.current?.close();
      }}
    >
      {({ value, setValue, finishEditing, mainElementRef }) => {
        useEffect(() => {
          // Initialize picker library
          pickerRef.current = new SomePickerLibrary(mainElementRef.current, {
            value: value,
            onChange: (newValue) => {
              setValue(newValue);
              finishEditing();
            }
          });
          
          return () => {
            pickerRef.current?.destroy();
          };
        }, []);
        
        return <div ref={mainElementRef} />;
      }}
    </EditorComponent>
  );
};
```

### Using with `editorFactory` in React

You can also use the `editorFactory` approach (described below) in React applications. Both approaches are compatible:

- **`EditorComponent`** - Best for React-first workflows, uses render props, fully React-integrated
- **`editorFactory`** - Best for shared code between React and vanilla JS, or when you prefer a more functional approach

Both approaches work seamlessly with React and provide the same level of functionality.

### TypeScript Support

`EditorComponent` is fully typed. You can specify the value type:

```tsx
const NumberEditor = () => {
  return (
    <EditorComponent<number>
      onPrepare={(row, col, prop, TD, originalValue, cellProperties) => {
        // TypeScript knows originalValue is number | undefined
      }}
    >
      {({ value, setValue, finishEditing }) => {
        // TypeScript knows value is number | undefined
        return (
          <input
            type="number"
            value={value ?? 0}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            onBlur={finishEditing}
          />
        );
      }}
    </EditorComponent>
  );
};
```

### Best Practices

1. **Use `onPrepare` for per-cell configuration** - Access `cellProperties` to read custom options
2. **Handle keyboard events properly** - Use shortcuts or handle `onKeyDown` events
3. **Call `finishEditing()` appropriately** - When user confirms changes (Enter, blur, button click)
4. **Use `mainElementRef` for third-party libraries** - Attach libraries to the container element
5. **Keep render prop function simple** - Extract complex logic into separate components or hooks

### Comparison: `EditorComponent` vs `useHotEditor` Hook

Handsontable also provides a lower-level `useHotEditor` hook if you need more control:

- **`EditorComponent`** - Higher-level, handles container and positioning automatically
- **`useHotEditor`** - Lower-level, gives you full control over container creation and positioning

For most use cases, `EditorComponent` is recommended as it handles common patterns automatically.

::: tip

All the sections below describe how to utilize the features available for the Handsontable factory based editors.
This information is applicable in React when using the non-component editor approach.

:::


:::

## Renderers

Before diving into editors, here's how to create custom renderers:

### `rendererFactory`

A simplified way to create cell renderers.

**Signature:**
```typescript
rendererFactory((params) => {
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
import { rendererFactory } from 'handsontable/renderers';

const renderer = rendererFactory(({ td, value }) => {
  td.style.backgroundColor = value;
  td.innerHTML = `<b>${value}</b>`;
});
```

Just use the parameters you need.

---

# Using `editorFactory`

The `editorFactory` helper is the **recommended approach** for creating custom editors. It handles container creation, positioning, lifecycle management, and shortcuts automatically, allowing you to focus on your editor's unique functionality.

## What is `editorFactory`?

`editorFactory` is a high-level helper that wraps `BaseEditor` class construction and handles common patterns automatically. It provides:

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
import { rendererFactory } from 'handsontable/renderers';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';

const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
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

registerCellType('myCellType', cellDefinition);
// then in Handsontable you can use `"myCellType"` to `type` option to use your cell type.
```

### Signature

```typescript
editorFactory<CustomProperties, CustomMethods = {}>({
  init(editor) { /* Required: Create input element */ },
  beforeOpen?(editor, { row, col, prop, td, originalValue, cellProperties }) { /* Per-cell setup */ },
  afterOpen?(editor, event?) { /* After editor is positioned and visible */ },
  afterInit?(editor) { /* After init and UI attachment, useful for event binding */ },
  afterClose?(editor) { /* After editor closes */ },
  getValue?(editor) { /* Return current value */ },
  setValue?(editor, value) { /* Set value */ },
  onFocus?(editor) { /* Custom focus logic */ },
  render?(editor) { /* Custom render function */ },
  shortcuts?: Array<{ /* Keyboard shortcuts */ }>,
  shortcutsGroup?: string, /* Group name for shortcuts */
  position?: 'container' | 'portal', /* Positioning strategy */
  value?: any, /* Initial value (if CustomProperties has value) */
  config?: any, /* Configuration (if CustomProperties has config) */
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

4. **`afterOpen(editor, event?)`** - Called after editor is positioned and visible
   - Open dropdowns, pickers, or other UI elements
   - Trigger animations
   - Perform actions that require visible editor
   - Optional `event` parameter provides the event that triggered the editor opening

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

9. **`render(editor)`** - Custom render function
   - Optional - can be used for custom rendering logic
   - Receives the editor instance as parameter

10. **`value`** - Initial value property
    - Optional - can be set directly if your `CustomProperties` type includes a `value` property
    - Automatically typed based on your `CustomProperties` definition

11. **`config`** - Configuration property
    - Optional - can be set directly if your `CustomProperties` type includes a `config` property
    - Automatically typed based on your `CustomProperties` definition

12. **`position`** - Positioning strategy
    - Optional - either `'container'` (default) or `'portal'`
    - Controls how the editor container is positioned in the DOM

13. **`shortcutsGroup`** - Shortcut group name
    - Optional - string identifier for grouping keyboard shortcuts
    - Useful for organizing shortcuts in complex editors


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
    editor.input = document.createElement('input') as HTMLInputElement;
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
    editor.input = document.createElement('input') as HTMLInputElement;
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
    editor.input = document.createElement('input') as HTMLInputElement;
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
  editor.input = document.createElement('select') as HTMLSelectElement;
  // ...dropdown setup, create dropdown DOM as needed

  editor.hot.rootDocument.addEventListener('mousedown', (event) => {
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
    editor.input = document.createElement('div') as HTMLDivElement;
    // ... setup
  },
  shortcuts: [
    {
      keys: [['ArrowLeft']],
      callback: (editor, event) => {
        // Custom action for ArrowLeft
        return false; // Prevent default
      }
    },
    {
      keys: [['1'], ['2'], ['3']],
      callback: (editor, event) => {
        // Handle number keys
        return true; // Don't  Prevent default
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
      keys: [['Tab']],
      callback: (editor, _event) => {
        let index = editor.config.indexOf(editor.value);

        index = index === editor.config.length - 1 ? 0 : index + 1;
        editor.setValue(editor.config[index]);

        return false; // Prevents default action
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

### Pattern 7: Using Direct Value and Config Properties

**Why is this needed?**

Instead of managing state through `setValue` and `getValue`, you can define `value` and `config` as properties in your `CustomProperties` type. The factory will automatically handle these properties, making your editor code simpler and more declarative.

**Example:**
```typescript
editor: editorFactory<{
  input: HTMLInputElement,
  value: string,
  config: string[]
}>({
  config: ['Option 1', 'Option 2', 'Option 3'], // Set directly
  init(editor) {
    editor.input = document.createElement('INPUT') as HTMLInputElement;
    // editor.value and editor.config are automatically available
  },
  beforeOpen(editor, { originalValue }) {
    editor.value = originalValue || editor.config[0]; // Use directly
  },
  getValue(editor) {
    return editor.value; // Access directly
  }
})
```

### Pattern 8: Custom Positioning Strategy

**Why is this needed?**

By default, the editor container is positioned using the `'container'` strategy, which places it within the Handsontable container. For editors that need to render outside the normal DOM hierarchy (like portals for dropdowns that need to escape overflow constraints), you can use the `'portal'` strategy.

**Example:**
```typescript
editor: editorFactory<{input: HTMLInputElement}>({
  position: 'portal', // Render outside normal container hierarchy
  init(editor) {
    editor.input = document.createElement('input') as HTMLInputElement;
  }
})
```

### Pattern 9: Organizing Keyboard Shortcuts

**Why is this needed?**

When you have multiple editors or complex shortcut configurations, organizing shortcuts into groups helps manage conflicts and provides better debugging. The `shortcutsGroup` option lets you assign a name to your editor's shortcuts.

**Example:**
```typescript
editor: editorFactory<{input: HTMLInputElement}>({
  shortcutsGroup: 'myCustomEditor',
  init(editor) {
    editor.input = document.createElement('input') as HTMLInputElement;
  },
  shortcuts: [
    {
      keys: [['Enter']],
      callback: (editor) => {
        // Custom Enter behavior
        return false;
      }
    }
  ]
})
```


## Usage in Handsontable

Apply your cell definition to columns:


### Registering custom cell with `registerCellType`

```typescript
import { registerCellType } from 'handsontable/cellTypes';

const cellDefinition = {
  renderer: /* ... */,
  editor: /* ... */,
  customOptions: { /* ... */ }
};

registerCellType('my-type', cellDefinition)

new Handsontable(container, {
  data: myData,
  columns: [
    { data: 'id', type: 'numeric' },
    {
      data: 'customField',
      type: 'my-type',
    }
  ]
});
```

### Using spread `...` operator

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

1. **[Color Picker](@/recipes/cells/guide-color-picker/guide-color-picker.md)** - Integrate a color picker library using `factoryEditor`
2. **[Flatpickr Date Picker](@/recipes/cells/guide-flatpickr/guide-flatpickr.md)** - Advanced date picker with options using `factoryEditor`
3. **[Native Date Input](@/recipes/cells/guide-input-date/guide-input-date.md)** - HTML5 date input using `factoryEditor`
4. **[Feedback Editor](@/recipes/cells/guide-feedback/guide-feedback.md)** - Emoji feedback buttons using `factoryEditor`
5. **[Star Rating](@/recipes/cells/guide-rating/guide-rating.md)** - Interactive star rating using `factoryEditor`
6. **[Multiple Select](@/recipes/cells/guide-select-multiple/guide-select-multiple.md)** - Multi-select dropdown using `factoryEditor`

## Migration from Traditional Approach

If you have existing custom editors, migrating to this approach is optional. The `editorFactory` method is simply a helper built on top of the existing Editor classes. Your previous custom editors remain fully backward compatible, so you can continue using them as-is or migrate at your convenience.

**Before (Traditional):**
```javascript
class CustomEditor extends Handsontable.editors.BaseEditor {
  constructor(instance) {
    super(instance);
  }

  init() {
    this.wrapper = this.hot.document.root.createElement('div');
    this.input = this.hot.document.root.createElement('input');
    this.hot.document.appendChild(this.wrapper);
    this.wrapper.appendChild(this.input);
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
    editor.input = document.createElement('input') as HTMLInputElement;
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

- Use `Event Listener` to stop propagation
- See Pattern 3 above
- Use `editor.container` (not `editor.wrapper`)


---

## Contributing

Have you created a useful custom cell? Consider contributing it as an example!

---

*This approach aims to make Handsontable custom cells as accessible as possible, enabling teams to create custom cells in minutes rather than hours.*
