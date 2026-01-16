---
id: 2rti5w12
title: "Recipe: Feedback Editor"
metaTitle: "Recipe: Feedback Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/feedback-angular
canonicalUrl: /recipes/feedback-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 64rvr6nb
  metaTitle: "Recipe: Feedback Editor - React Data Grid | Handsontable"
angular:
  id: dg9oi3jt
  metaTitle: "Recipe: Feedback Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Feedback Editor Cell - Step-by-Step Guide (Angular)

[[toc]]

## Overview

This guide shows how to create a simple feedback editor cell using emoji buttons with Angular's `HotCellEditorAdvancedComponent`. Perfect for quick feedback selection, status indicators, or any scenario where users need to choose from a small set of visual options.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None

## What You'll Build

A cell that:

- Displays emoji feedback buttons when editing
- Shows the selected emoji when viewing
- Supports keyboard navigation (arrow keys and Tab)
- Provides click-to-select functionality
- Works with Angular's component-based architecture
- Supports per-column configuration

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cells/guide-feedback-angular/angular/example1.ts)
@[code](@/content/recipes/cells/guide-feedback-angular/angular/example1.html)

:::

:::

## Prerequisites

```bash
npm install @handsontable/angular-wrapper
```

**What you need:**

- Angular 14+ (decorators support)
- `@handsontable/angular-wrapper` package
- Basic Angular knowledge (components, decorators, change detection)

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef } from "@angular/core";
import { HotTableModule, HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from "@handsontable/angular-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

registerAllModules();
```

**What we're importing:**

- `HotCellEditorAdvancedComponent` - Base class for creating custom editors
- `HotTableModule` - Angular wrapper module
- `ChangeDetectorRef` - For manual change detection
- `KeyboardShortcutConfig` - Type definitions for keyboard shortcuts
- Handsontable styles

## Step 2: Create the Editor Component

Create an Angular component that extends `HotCellEditorAdvancedComponent`.

**TypeScript (.ts):**

```typescript
@Component({
  standalone: false,
  template: `
    <div style="display: flex; gap: 4px; background:#eee; border: 1px solid #ccc; border-radius: 4px;">
      <button
        *ngFor="let option of config"
        [style.backgroundColor]="option === getValue() ? '#90f5e7ff' : '#fff'"
        [style.color]="option === getValue() ? '#ffffffff' : '#000'"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷‍♂️"];
  override value = "👍";

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

1. Class extends `HotCellEditorAdvancedComponent<string>` - base class for custom editors
2. `@Component` decorator with inline template
3. `override config` - array of options to display
4. `override value` - default value for the editor
5. `getValue()` / `setValue()` - inherited methods for value management
6. `finishEdit.emit()` - emits event to save and close the editor
7. `ChangeDetectorRef` - injected for manual change detection
8. `*ngFor` - loops through config options
9. Angular style binding - `[style.backgroundColor]`, `[style.color]`

**Key concepts:**

- **Class-based component**: Extends from `HotCellEditorAdvancedComponent<T>`
- **State management**: `value` is a class property, managed by base class
- **Angular patterns**: Template syntax, property binding, event binding

## Step 3: Add Styling

Style the editor container and buttons using inline styles or Angular style binding.

```typescript
@Component({
  standalone: false,
  template: `
    <div style="display: flex; gap: 4px; background:#eee; border: 1px solid #ccc; border-radius: 4px;">
      <button
        style="width:33%;"
        [style.backgroundColor]="option === getValue() ? '#90f5e7ff' : '#fff'"
        [style.color]="option === getValue() ? '#ffffffff' : '#000'"
        *ngFor="let option of config"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷‍♂️"];
  override value = "👍";
  override onFocus(): void {}

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

- Container uses flexbox for horizontal button layout
- Buttons dynamically size based on config length
- Active button has different background color
- Angular style binding for conditional styles

**Key styling:**

- `display: flex` - Horizontal button layout
- `gap: 4px` - Space between buttons
- `[style.backgroundColor]` - Angular style binding for active state
- `[style.color]` - Conditional text color

## Step 4: Read Config from Cell Properties

The Angular wrapper automatically handles per-column configuration through the base class.

```typescript
@Component({
  standalone: false,
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // Config will be automatically populated from cellProperties.config
  override config?: string[];
  override value = "👍";
  override onFocus(): void {}

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

- `override config` - allows the base class to set config from column definition
- The Angular wrapper automatically reads `config` from `cellProperties`
- No manual `onPrepare` implementation needed for basic config reading
- Each column can pass different `config` values

**Why this matters:**

- Different columns can have different options
- One editor component, multiple configurations
- Automatic configuration injection by the wrapper

## Step 5: Add Keyboard Shortcuts

Add keyboard navigation using the `shortcuts` property.

```typescript
@Component({
  standalone: false,
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷‍♂️"];
  override value = "👍";
  override onFocus(): void {}

  override shortcuts: KeyboardShortcutConfig[] = [
    {
      keys: [["ArrowRight"], ["Tab"]],
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());
        index = index === this.config.length - 1 ? 0 : index + 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges(); // Manual change detection
        return false; // Prevent default Tab behavior
      },
    },
    {
      keys: [["ArrowLeft"]],
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());
        index = index === 0 ? this.config.length - 1 : index - 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

- **ArrowRight/Tab**: Move to next option (wraps to first if at end)
- **ArrowLeft**: Move to previous option (wraps to last if at start)
- `callback: (editor, _event) => {}` - receives editor instance and event
- `this.getValue()` and `this.setValue()` - access current value and update it
- `this.cdr.detectChanges()` - triggers UI update after value change
- Return `false` to prevent default behavior (e.g., Tab moving to next cell)

**Keyboard navigation benefits:**

- Fast selection without mouse
- Accessible for keyboard-only users
- Intuitive left/right navigation
- Tab cycles through options instead of moving cells

## Step 6: Complete Editor Component

Put it all together:

```typescript
@Component({
  standalone: false,
  template: `
    <div style="display: flex; gap: 4px; background:#eee; border: 1px solid #ccc; border-radius: 4px;">
      <button
        style="width:33%;"
        [style.backgroundColor]="option === getValue() ? '#90f5e7ff' : '#fff'"
        [style.color]="option === getValue() ? '#ffffffff' : '#000'"
        *ngFor="let option of config"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷‍♂️"];
  override value = "👍";

  override shortcuts: KeyboardShortcutConfig[] = [
    {
      keys: [["ArrowRight"], ["Tab"]],
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());
        index = index === this.config.length - 1 ? 0 : index + 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();
        return false;
      },
    },
    {
      keys: [["ArrowLeft"]],
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());
        index = index === 0 ? this.config.length - 1 : index - 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

- **Class properties**: `config`, `value`, and `shortcuts` defined as class properties
- **Template**: Inline template with Angular syntax
- **Keyboard shortcuts**: Defined directly as class property
- **Change detection**: Manual trigger with `ChangeDetectorRef`
- **Styling**: Inline styles and Angular style binding

## Step 7: Use in Handsontable

Use the editor component in your Angular component:

**TypeScript (.ts):**

```typescript
import { Component } from "@angular/core";
import { GridSettings } from "@handsontable/angular-wrapper";

@Component({
  selector: "app-example",
  template: ` <hot-table [data]="data" [settings]="gridSettings"></hot-table> `,
})
export class ExampleComponent {
  readonly data = [
    { id: 1, itemName: "Product A", feedback: "👍" },
    { id: 2, itemName: "Product B", feedback: "👎" },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    manualColumnResize: true,
    colHeaders: ["ID", "Item Name", "Feedback", "Rating"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "feedback",
        width: 150,
        editor: FeedbackEditorComponent,
        config: ["👍", "👎", "🤷‍♂️"],
      },
      {
        data: "stars",
        width: 150,
        editor: FeedbackEditorComponent,
        config: ["1", "2", "3", "4", "5"],
      },
    ],
  };
}
```

**HTML (.html):**

```html
<hot-table [data]="data" [settings]="gridSettings"></hot-table>
```

**What's happening:**

- `editor: FeedbackEditorComponent` - Assigns the editor class to the column
- `config: ['👍', '👎', '🤷‍♂️']` - Column-specific options
- Same editor component, different configurations per column
- Configuration through `GridSettings` interface

**Key features:**

- Reusable editor component
- Per-column configuration
- Type-safe with TypeScript
- Declarative settings object

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the emoji value (👍, 👎, or 🤷‍♂️)
2. **User Double-Clicks or Enter**: Editor opens, Angular wrapper reads column config
3. **Editor Opens**: Component template rendered over cell
4. **Button Display**: All options visible, current value highlighted
5. **User Interaction**:
   - Click a button → `setValue(item)` and `finishEdit.emit()` called
   - Press ArrowLeft/Right → Shortcut callback updates value, `cdr.detectChanges()` triggers UI update
   - Press Tab → Cycles through options (prevents default cell navigation)
6. **Visual Feedback**: Selected button highlighted with different background color
7. **User Confirms**: Press Enter, click button, or click away
8. **Save**: Value saved to cell via `finishEdit.emit()`
9. **Editor Closes**: Cell shows selected emoji

## Enhancements

### 1. More Feedback Options

Add more emoji options:

```typescript
readonly gridSettings: GridSettings = {
  columns: [
    {
      data: 'feedback',
      editor: FeedbackEditorComponent,
      config: ['👍', '👎', '🤷‍♂️', '❤️', '🔥', '⭐'],
    },
  ],
};
```

The editor automatically adjusts button widths based on config length.

### 2. Custom Button Styling

Enhanced button appearance with inline styles or component styles:

```typescript
@Component({
  standalone: false,
  template: `
    <div class="editor-container">
      <button
        class="feedback-button"
        [class.active]="option === getValue()"
        *ngFor="let option of config"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
  styles: [
    `
      .editor-container {
        display: flex;
        gap: 4px;
        background: #eee;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .feedback-button {
        padding: 8px;
        border: 2px solid #ddd;
        background: white;
        color: #333;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2em;
        transition: all 0.2s;
        width: 33%;
      }
      .feedback-button.active {
        border-color: #007bff;
        background: #007bff;
        color: white;
      }
      .feedback-button:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // ... rest of the component
}
```

### 3. Dynamic Config from Cell Properties

To read custom config from column definition, implement the `beforeOpen` lifecycle hook:

```typescript
@Component({
  standalone: false,
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config?: string[];
  override value = "👍";
  override onFocus(): void {}

  override beforeOpen(editor: ExtendedEditor<any>, { cellProperties }: any): void {
    this.config = cellProperties.config as string[];
  }

  // ... rest of the component
}
```

Then pass different configs per column:

```typescript
columns: [
  {
    data: "feedback",
    editor: FeedbackEditorComponent,
    config: ["👍", "👎", "❤️", "🔥"],
  },
];
```

**What's happening:**

- `beforeOpen` is called before the editor opens
- Read `config` from `cellProperties.config`
- Each column can have different options
- One editor component, multiple configurations

### 4. Tooltip on Hover

Add tooltips to buttons:

```tsx
{
  config.map((item) => {
    const tooltips: Record<string, string> = {
      "👍": "Positive feedback",
      "👎": "Negative feedback",
      "🤷‍♂️": "Neutral feedback",
    };

    return (
      <button
        key={item}
        className={`button ${value === item ? "active" : ""}`}
        onClick={() => {
          setValue(item);
          finishEditing();
        }}
        title={tooltips[item] || ""}
      >
        {item}
      </button>
    );
  });
}
```

### 5. Text Labels Instead of Emojis

Use text buttons for clarity:

```typescript
columns: [
  {
    data: "feedback",
    editor: FeedbackEditorComponent,
    config: ["Positive", "Negative", "Neutral"],
  },
];
```

The editor works with any string values, not just emojis.

### 6. Using External CSS File

Move styles to a separate CSS file:

```css
/* feedback-editor.component.css */
.editor-container {
  box-sizing: border-box;
  display: flex;
  gap: 4px;
  padding: 3px;
  background: rgb(238, 238, 238);
  border: 1px solid rgb(204, 204, 204);
  border-radius: 4px;
  height: 100%;
  width: 100%;
}

.feedback-button {
  background: #fff;
  color: black;
  border: none;
  padding: 0;
  margin: 0;
  height: 100%;
  width: 33%;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
}

.feedback-button.active {
  background: #90f5e7ff;
  color: white;
}

.feedback-button:hover {
  background: #f0f0f0;
}
```

```typescript
@Component({
  standalone: false,
  templateUrl: "./feedback-editor.component.html",
  styleUrls: ["./feedback-editor.component.css"],
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // ... component code
}
```

## Accessibility

HTML buttons are inherently accessible, but you can enhance them:

```typescript
@Component({
  standalone: false,
  template: `
    <div style="display: flex; gap: 4px; background:#eee; border: 1px solid #ccc; border-radius: 4px;">
      <button
        *ngFor="let option of config; let i = index"
        [attr.aria-label]="option + ' feedback option'"
        [attr.aria-pressed]="option === getValue()"
        [tabIndex]="option === getValue() ? 0 : -1"
        [style.backgroundColor]="option === getValue() ? '#90f5e7ff' : '#fff'"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // ... component code
}
```

**Keyboard navigation:**

- **Tab**: Navigate to editor (focuses active button)
- **Arrow Left/Right**: Cycle through options (via shortcuts)
- **Enter**: Select current option and finish editing
- **Escape**: Cancel editing
- **Click**: Direct selection

**ARIA attributes:**

- `[attr.aria-label]`: Describes each button
- `[attr.aria-pressed]`: Indicates selected state
- `[tabIndex]`: Controls keyboard focus order

## Performance Considerations

### Why This Is Fast

1. **Class-based approach**: Minimal overhead, no virtual DOM reconciliation
2. **No External Libraries**: Zero overhead beyond Angular
3. **Manual Change Detection**: Control when UI updates occur
4. **Native Events**: Browser-optimized click handlers
5. **Simple Template**: Lightweight rendering with `*ngFor`

### Angular Change Detection

Manual change detection ensures updates only when needed:

```typescript
override shortcuts: KeyboardShortcutConfig[] = [
  {
    keys: [['ArrowRight'], ['Tab']],
    callback: (editor, _event) => {
      let index = this.config.indexOf(this.getValue());
      index = index === this.config.length - 1 ? 0 : index + 1;
      this.setValue(this.config[index]);
      this.cdr.detectChanges(); // Trigger change detection only when needed
      return false;
    },
  },
];
```

**Why it's efficient:**

- Change detection only triggered when value changes
- No unnecessary re-renders
- Direct property access without state management overhead

## TypeScript Support

`HotCellEditorAdvancedComponent` is fully typed. You can specify the value type:

```typescript
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // TypeScript knows value is string | undefined
  // TypeScript knows setValue accepts string
  // TypeScript knows getValue returns string | undefined
}
```

For number-based feedback:

```typescript
export class RatingEditorComponent extends HotCellEditorAdvancedComponent<number> {
  override config = [1, 2, 3, 4, 5];
  override value = 3;

  // TypeScript knows value is number | undefined
  // TypeScript knows setValue accepts number
  // TypeScript knows getValue returns number | undefined
}
```

For complex types:

```typescript
interface FeedbackOption {
  emoji: string;
  label: string;
}

export class ComplexFeedbackEditor extends HotCellEditorAdvancedComponent<FeedbackOption> {
  override config: FeedbackOption[] = [
    { emoji: "👍", label: "Good" },
    { emoji: "👎", label: "Bad" },
  ];
}
```

## Best Practices

1. **Use `override` keyword** - For properties and methods from base class
2. **Handle keyboard events properly** - Use shortcuts property for navigation
3. **Call `finishEdit.emit()` appropriately** - When user confirms changes (button click)
4. **Use `ChangeDetectorRef.detectChanges()`** - After value changes in shortcuts
5. **Inject dependencies as `readonly`** - For better code safety
6. **Extend with proper type parameter** - `HotCellEditorAdvancedComponent<T>` with correct type
7. **Keep template simple** - Use component methods for complex logic
8. **Declare shortcuts as class property** - No need for lifecycle hooks

---

**Congratulations!** You've created a simple feedback editor with emoji buttons using React's `EditorComponent`, perfect for quick feedback selection in your data grid!
