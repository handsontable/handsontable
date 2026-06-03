---
type: explanation
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
vue:
  id: q319vaao
  metaTitle: Custom Cell Definitions - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

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

::: only-for angular

## Angular

For Angular applications, Handsontable provides `HotCellEditorAdvancedComponent` and `HotCellRendererAdvancedComponent`, high-level Angular components that simplify creating custom editors and renderers. These components handle lifecycle management, provide type-safe properties, and integrate seamlessly with Angular's dependency injection and change detection.

### What are the Advanced Components?

Angular provides two base classes for creating custom cells:

- **`HotCellRendererAdvancedComponent`** - Base class for custom cell renderers
- **`HotCellEditorAdvancedComponent`** - Base class for custom cell editors

Both components provide:

- Automatic lifecycle management
- Type-safe @Input and @Output properties
- Built-in keyboard shortcut support
- Integration with Angular's change detection
- Support for custom configuration via `rendererProps` or `config`

## Custom Renderers

### `HotCellRendererAdvancedComponent`

A base class for creating custom cell renderers in Angular. Extend this class to create your own renderer components. 

#### Basic Structure

```typescript
import { Component } from "@angular/core";
import { HotCellRendererAdvancedComponent } from "@handsontable/angular-wrapper";

@Component({
  selector: "my-custom-renderer",
  template: ` <div>{{ value }}</div> `,
  standalone: false,
})
export class MyCustomRenderer extends HotCellRendererAdvancedComponent<string> {
  // Your custom logic here
}
```

#### Input Properties

The base class provides the following @Input properties automatically:

- **`value: TValue`** - The cell value (typed based on generic parameter)
- **`instance: Handsontable`** - Handsontable instance
- **`td: HTMLTableCellElement`** - The cell's TD element
- **`row: number`** - Row index
- **`col: number`** - Column index
- **`prop: string`** - Property name
- **`cellProperties: Handsontable.CellProperties & { rendererProps?: TProps }`** - Cell configuration with optional renderer-specific properties

#### The `getProps()` Method

Use `getProps()` to retrieve renderer-specific properties passed via `rendererProps`:

```typescript
@Component({
  selector: 'colored-renderer',
  template: `
    <div [style.color]="getProps().textColor">
      {{ value }}
    </div>
  `,
  standalone: false,
})
export class ColoredRenderer extends HotCellRendererAdvancedComponent<string, { textColor: string }> {
  // getProps() automatically typed as { textColor: string }
}

// Usage in column configuration:
{
  data: 'name',
  renderer: ColoredRenderer,
  rendererProps: { textColor: 'blue' }
}
```

#### Example: Star Rating Renderer

```typescript
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { HotCellRendererAdvancedComponent } from "@handsontable/angular-wrapper";

@Component({
  selector: "star-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @for (star of stars; track $index) {
        <span [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
      }
    </div>
  `,
  standalone: false,
})
export class StarRenderer extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
}

// Usage:
columns: [
  {
    data: "rating",
    renderer: StarRenderer,
  },
];
```

#### When should I use [`HotCellRendererComponent`](@/guides/cell-functions/cell-renderer/cell-renderer.md) and when should I use `HotCellRendererAdvancedComponent`?

The choice between `HotCellRendererComponent` and `HotCellRendererAdvancedComponent` depends on the underlying Handsontable API you intend to use.

`HotCellRendererComponent`: This is the base component for creating renderers that are compatible with the `baseRenderer` API from Handsontable. It is suitable for most standard rendering use cases.

`HotCellRendererAdvancedComponent`: This component is designed to work with the newer [`rendererFactory`](@/guides/cell-functions/custom-cells/custom-cells.md#rendererfactory) API from Handsontable. While both components offer similar configuration options at the Angular level, `HotCellRendererAdvancedComponent` aligns with the more modern, factory-based approach in the core Handsontable library, which can be more optimized.

In short:
- Use `HotCellRendererComponent` for renderers based on the traditional `baseRenderer`.
- Use `HotCellRendererAdvancedComponent` when you want to align with the newer `rendererFactory` pattern for potential performance benefits and a more modern API approach.

## Custom Editors

### `HotCellEditorAdvancedComponent`

A base class for creating custom cell editors in Angular. Extend this class to create your own editor components with full control over the editing experience.

#### Basic Structure

```typescript
import { Component } from "@angular/core";
import { HotCellEditorAdvancedComponent } from "@handsontable/angular-wrapper";

@Component({
  selector: "my-custom-editor",
  template: ` <input [(ngModel)]="value" (blur)="finishEdit.emit()" /> `,
  standalone: false,
})
export class MyCustomEditor extends HotCellEditorAdvancedComponent<string> {
  // Your custom logic here
}
```

#### Input Properties

The base class provides the following @Input properties:

- **`row: number`** - Row index of the cell being edited
- **`column: number`** - Column index of the cell being edited
- **`prop: string | number`** - Property name of the cell being edited
- **`originalValue: T`** - Original value of the cell before editing
- **`cellProperties: CellProperties`** - Cell configuration

#### Output Events

- **`finishEdit: EventEmitter<void>`** - Emit to save changes and close the editor
- **`cancelEdit: EventEmitter<void>`** - Emit to cancel changes and revert to original value

#### Lifecycle Methods

Override these methods to customize editor behavior:

1. **`onFocus(editor?: ExtendedEditor<T>): void`**

   - Called when the editor receives focus
   - Use for custom focus management

2. **`afterOpen(editor: ExtendedEditor<T>, event?: Event): void`**

   - Called after the editor is opened and positioned
   - Use to open dropdowns, trigger animations, or focus elements

3. **`afterClose(editor: ExtendedEditor<T>): void`**

   - Called when the editor closes
   - Use for cleanup actions

4. **`afterInit(editor: ExtendedEditor<T>): void`**

   - Called after the editor is initialized
   - Use for one-time setup

5. **`beforeOpen(editor, { row, col, prop, td, originalValue, cellProperties }): void`**
   - Called before the editor opens
   - Use for per-cell setup or reading custom properties

#### Value Methods

- **`getValue(): T`** - Returns the current editor value (override if needed)
- **`setValue(value: T): void`** - Sets the editor value (override if needed)

#### Configuration Properties

- **`position: 'container' | 'portal'`** - Editor positioning strategy (default: 'container')
- **`shortcuts?: KeyboardShortcutConfig[]`** - Keyboard shortcuts configuration
- **`shortcutsGroup?: string`** - Group name for shortcuts
- **`config?: any`** - Custom configuration object

#### When should I use [`HotCellEditorComponent`](@/guides/cell-functions/cell-editor/cell-editor.md) and when should I use `HotCellEditorAdvancedComponent`?

The choice between HotCellEditorComponent and HotCellEditorAdvancedComponent depends on your cell editor requirements.

`HotCellEditorComponent`: This is the basic component for creating simple editors. It is based on the older [`BaseEditor`](@/api/baseEditor.md) from `Handsontable` and is ideal for simple use cases.

`HotCellEditorAdvancedComponent`: This component is built on the newer [`editorFactory`](@/guides/cell-functions/custom-cells/custom-cells.md#using-editorfactory) API from `Handsontable`. It offers significantly more configuration and customization options, such as:

Defining custom keyboard shortcuts.
Choosing the editor's positioning strategy ('container' or 'portal').
Access to additional lifecycle hooks like afterInit and beforeOpen.

In short:
- Use `HotCellEditorComponent` for simple, standard editors.
- Use `HotCellEditorAdvancedComponent` when you need advanced control over the editor's behavior, positioning, and keyboard shortcuts.

### Common Patterns

#### Pattern 1: Simple Input Editor

A basic text input editor:

```typescript
import { Component } from "@angular/core";
import { HotCellEditorAdvancedComponent } from "@handsontable/angular-wrapper";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "text-editor",
  template: `
    <input
      type="text"
      [(ngModel)]="value"
      (keydown.enter)="finishEdit.emit()"
      (keydown.escape)="cancelEdit.emit()"
      style="width: 100%; height: 100%; border: 2px solid blue;"
    />
  `,
  standalone: true,
  imports: [FormsModule],
})
export class TextEditor extends HotCellEditorAdvancedComponent<string> {}
```

#### Pattern 2: Dropdown Select Editor

A dropdown editor with predefined options:

```typescript
import { Component, inject, ChangeDetectorRef } from "@angular/core";
import { HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";

@Component({
  selector: "select-editor",
  template: `
    <select [(ngModel)]="value" (change)="finishEdit.emit()" style="width: 100%; height: 100%;">
      @for (option of options; track option) {
        <option [value]="option">{{ option }}</option>
      }
    </select>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SelectEditor extends HotCellEditorAdvancedComponent<string> {
  options = ["Option 1", "Option 2", "Option 3"];

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [["ArrowDown"]],
      callback: (editor) => {
        const currentIndex = this.options.indexOf(this.getValue());
        const nextIndex = (currentIndex + 1) % this.options.length;
        this.setValue(this.options[nextIndex]);
        this.cdr.detectChanges();
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);
}
```

#### Pattern 3: Custom UI with Buttons

An editor with custom button controls:

```typescript
import { Component } from "@angular/core";
import { HotCellEditorAdvancedComponent } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";

@Component({
  selector: "button-editor",
  template: `
    <div style="display: flex; gap: 4px; background: #eee; padding: 4px;">
      @for (option of options; track option) {
        <button [style.backgroundColor]="option === value ? '#90f5e7' : '#fff'" (click)="onSelect(option)">
          {{ option }}
        </button>
      }
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ButtonEditor extends HotCellEditorAdvancedComponent<string> {
  options = ["Yes", "No", "Maybe"];

  onSelect(option: string): void {
    this.value = option;
    this.finishEdit.emit();
  }
}
```

#### Pattern 4: Keyboard Shortcuts

An editor with comprehensive keyboard navigation:

```typescript
import { Component, inject, ChangeDetectorRef } from "@angular/core";
import { HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";

@Component({
  selector: "star-editor",
  template: `
    <div
      style="background: #eee; padding: 5px 8px; cursor: pointer;"
      (mouseover)="onMouseOver($event)"
      (mousedown)="finishEdit.emit()"
    >
      @for (star of stars; track $index) {
      <span [attr.data-value]="$index + 1" [style.opacity]="$index < getValue() ? '1' : '0.4'"> ⭐ </span>
      }
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class StarEditor extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [["1"], ["2"], ["3"], ["4"], ["5"]],
      callback: (editor, event) => {
        this.setValue(parseInt(event.key));
        this.cdr.detectChanges();
      },
    },
    {
      keys: [["ArrowRight"]],
      callback: (editor) => {
        if (this.getValue() < 5) {
          this.setValue(this.getValue() + 1);
          this.cdr.detectChanges();
        }
      },
    },
    {
      keys: [["ArrowLeft"]],
      callback: (editor) => {
        if (this.getValue() > 1) {
          this.setValue(this.getValue() - 1);
          this.cdr.detectChanges();
        }
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLSpanElement && target.dataset["value"]) {
      this.setValue(parseInt(target.dataset["value"]));
      this.cdr.detectChanges();
    }
  }
}
```

#### Pattern 5: Third-Party Library Integration (Angular Material)

Integrating external libraries like Angular Material:

```typescript
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { HotCellEditorAdvancedComponent } from "@handsontable/angular-wrapper";
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
  selector: "app-boolean-editor",
  standalone: true,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
  imports: [CommonModule, MatCheckboxModule],
})
export class BooleanEditor extends HotCellEditorAdvancedComponent<boolean> {
  onCheckboxChange(checked: boolean): void {
    this.value = checked;
    this.finishEdit.emit();
  }

  override setValue(value: boolean): void {
    this.value = value ?? false;
  }

  override getValue(): boolean {
    return this.value ?? false;
  }
}
```

**Key points for third-party integration:**

- Import required external modules in the `imports` array
- Override `setValue()` and `getValue()` for custom value handling
- Use `finishEdit.emit()` to save changes when user interacts with the external component

**Usage in column configuration:**

```typescript
columns: [
  {
    data: "active",
    editor: BooleanEditor,
  },
];
```

### TypeScript Support

Both `HotCellEditorAdvancedComponent` and `HotCellRendererAdvancedComponent` are fully typed with generics:

```typescript
// Editor with typed value
export class NumberEditor extends HotCellEditorAdvancedComponent<number> {
  // value is automatically typed as number
}

// Renderer with typed value and props
export class CustomRenderer extends HotCellRendererAdvancedComponent<string, { color: string; bold: boolean }> {
  // value is typed as string
  // getProps() returns { color: string; bold: boolean }
}

// Editor with complex type
interface Product {
  id: number;
  name: string;
  price: number;
}

export class ProductEditor extends HotCellEditorAdvancedComponent<Product> {
  // value is typed as Product
  // getValue() returns Product
  // setValue() expects Product
}
```

### Best Practices

1. **Use ChangeDetectorRef for manual updates** - Inject and call `detectChanges()` after programmatic value changes
2. **Use standalone components when possible** - Better tree-shaking and module isolation
3. **Handle keyboard events with shortcuts** - Define shortcuts in the `shortcuts` array for consistent behavior
4. **Call `finishEdit.emit()` appropriately** - When user confirms changes (Enter, blur, button click)
5. **Use `getProps()` for renderer configuration** - Pass custom properties via `rendererProps`
6. **Override lifecycle methods as needed** - `beforeOpen`, `afterOpen`, `afterClose`, `onFocus`
7. **Type your components with generics** - Specify value type for type safety: `HotCellEditorAdvancedComponent<YourType>`

### Column Configuration

Use your custom components in column settings:

```typescript
import { GridSettings } from "@handsontable/angular-wrapper";

gridSettings: GridSettings = {
  columns: [
    {
      data: "name",
      renderer: CustomRenderer,
      rendererProps: { color: "blue", bold: true },
    },
    {
      data: "rating",
      renderer: StarRenderer,
      editor: StarEditor,
    },
    {
      data: "active",
      editor: BooleanEditor,
    },
  ],
};
```

::: tip

All the sections below describe how to utilize the features available for the Handsontable factory based editors.
This information is also applicable in Angular when you need lower-level control or want to share code between vanilla JavaScript and Angular implementations.

:::

:::

::: only-for vue

## Vue

The Vue 3 wrapper does not provide a component-based editor API equivalent to React's `EditorComponent` or Angular's `HotCellEditorAdvancedComponent`. Instead, you use Handsontable's standard renderer functions and editor classes directly — the same primitives that work in vanilla JavaScript — but you can also mount Vue components into cells using Vue's `render` function.

### Custom renderers

A **renderer function** receives the cell's `td` element and fills it with whatever markup you need. You pass it directly to the `renderer` option on a column.

#### Function renderer

The simplest approach: write a plain function, manipulate the `td` element, and return it.

::: example #example1 :vue3

@[code](@/content/guides/cell-functions/custom-cells/vue/example1.vue)

:::

#### Vue component renderer

For richer cell content, use Vue's `h` and `render` helpers to mount a Vue component into the `td` element on every render call.

::: example #example2 :vue3

@[code](@/content/guides/cell-functions/custom-cells/vue/example2.vue)

:::

### Custom editors

Create a custom editor by extending one of Handsontable's built-in editor classes (for example, `TextEditor`) and overriding the methods you need to change. Pass the class to the `editor` option on a column.

::: example #example3 :vue3

@[code](@/content/guides/cell-functions/custom-cells/vue/example3.vue)

:::

::: tip

The sections below describe the framework-agnostic `rendererFactory` and `editorFactory` helpers. You can use both helpers in Vue 3 projects — pass the result to the `renderer` or `editor` column option the same way you would pass a renderer function or editor class.

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

## Using `editorFactory`

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

Each method runs at a specific point in the editor lifecycle:

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
   - Optional - use for custom rendering logic
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

**Using `preventCloseElement`**

Inside your `init` or `afterInit` callback, assign an **`HTMLElement`** to **`editor.preventCloseElement`** (for example, your dropdown or picker DOM node). The factory will attach a `mousedown` listener to that element that stops propagation, so clicks on it are not treated as "click-outside" and the editor stays open.

Create the element in `init` or `afterInit`, assign it to `editor.preventCloseElement`, and append it to the editor container (or to the document if the dropdown is rendered outside the container).

**Example:**
```typescript
const MyEditor = editorFactory({
  init(editor) {
    editor.input = document.createElement('input');

    const dropdownEl = document.createElement('div');
    dropdownEl.className = 'my-picker-dropdown';

    // Clicks on dropdownEl will not close the editor
    editor.preventCloseElement = dropdownEl;
  },
  getValue(editor) { /* ... */ },
  setValue(editor, value) { /* ... */ },
});
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
- Pressing <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> or <kbd>Alt</kbd>/<kbd>⌥</kbd>+<kbd>Enter</kbd> (adds a new line inside the cell)
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
- Handsontable calls the keyboard shortcut `callback` for every key press when the editor is active (open)
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

`editorFactory` handles positioning automatically. You don't need to position the editor manually. The container positions itself over the cell when `open()` runs.

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

1. **[Color Picker](@/recipes/cell-types/color-picker/color-picker.md)** - Integrate a color picker library using `factoryEditor`
2. **[Feedback Editor](@/recipes/cell-types/feedback/feedback.md)** - Emoji feedback buttons using `factoryEditor`
3. **[Flatpickr Date Picker](@/recipes/cell-types/flatpickr/flatpickr.md)** - Advanced date picker with options using `factoryEditor`
4. **[Pikaday Date Picker](@/recipes/cell-types/pikaday/pikaday.md)** - Integrate Pikaday date picker using `factoryEditor`
5. **[Star Rating](@/recipes/cell-types/rating/rating.md)** - Interactive star rating using `factoryEditor`

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
- Verify `afterOpen()` runs if you need to trigger UI elements

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

## What you learned

- How `rendererFactory` and `editorFactory` simplify custom cell creation compared to the class-based approach.
- How to use lifecycle hooks (`init`, `beforeOpen`, `afterOpen`, `afterClose`) to control editor behavior.
- How to add per-cell configuration, keyboard shortcuts, and custom positioning strategies.
- How `registerCellType` bundles a renderer, editor, and validator under a reusable alias.

## Next steps

- Browse the [recipes](@/recipes/introduction.md) for complete working examples such as color pickers, star ratings, and multi-select dropdowns.
- Learn how the traditional class-based approach works in the [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) guide.
- Explore [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) and [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) for standalone function-based customization.
