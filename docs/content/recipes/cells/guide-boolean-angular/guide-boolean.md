---
id: orf6yb2z
title: "Recipe: Boolean Editor"
metaTitle: "Recipe: Boolean Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/boolean-angular
canonicalUrl: /recipes/boolean-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: yi0viy3z
  metaTitle: "Recipe: Boolean Editor - React Data Grid | Handsontable"
angular:
  id: 8kfslhbq
  metaTitle: "Recipe: Boolean Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Boolean Editor - Step-by-Step Guide (Angular)

[[toc]]

## Overview

This guide shows how to create a boolean editor cell using Angular Material's checkbox with Angular's `HotCellEditorAdvancedComponent`. Perfect for true/false values, status toggles, or any scenario where users need a simple on/off switch.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** Angular Material

## What You'll Build

A cell that:

- Displays a Material checkbox when editing
- Shows true/false value when viewing
- Provides click-to-toggle functionality
- Works with Angular's component-based architecture
- Integrates seamlessly with Angular Material
- Automatically saves on checkbox change

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cells/guide-boolean-angular/angular/example1.ts)
@[code](@/content/recipes/cells/guide-boolean-angular/angular/example1.html)

:::

:::

## Prerequisites

```bash
npm install @handsontable/angular-wrapper @angular/material
```

**What you need:**

- Angular 14+ (decorators support)
- `@handsontable/angular-wrapper` package
- `@angular/material` package
- Basic Angular knowledge (components, decorators, change detection)

## Step 1: Import Dependencies

```typescript
import { Component } from "@angular/core";
import { HotTableModule, HotCellEditorAdvancedComponent, GridSettings } from "@handsontable/angular-wrapper";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

registerAllModules();
```

**What we're importing:**

- `HotCellEditorAdvancedComponent` - Base class for creating custom editors
- `HotTableModule` - Angular wrapper module
- `MatCheckboxModule` - Angular Material checkbox component
- `GridSettings` - Type definitions for Handsontable settings
- `registerAllModules()` - Registers all Handsontable features
- Handsontable styles

## Step 2: Create the Editor Component

Create an Angular component that extends `HotCellEditorAdvancedComponent`.

**TypeScript (.ts):**

```typescript
@Component({
  selector: "boolean-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
})
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

**What's happening:**

1. Class extends `HotCellEditorAdvancedComponent<boolean>` - base class for custom editors
2. `@Component` decorator with inline template and `standalone: false`
3. Template uses `mat-checkbox` from Angular Material
4. `[checked]="value"` - binds checkbox state to current value
5. `(change)="onCheckboxChange($event.checked)"` - handles checkbox changes
6. `onCheckboxChange()` - updates value and calls `finishEdit.emit()`
7. `setValue()` / `getValue()` - override methods to handle boolean values with null safety

**Key concepts:**

- **Class-based component**: Extends from `HotCellEditorAdvancedComponent<boolean>`
- **State management**: `value` is a class property, managed by base class
- **Material Integration**: Uses Angular Material checkbox component
- **Automatic save**: Checkbox change immediately triggers save

## Step 3: Add Styling

Style the editor container using inline styles to center the checkbox.

```typescript
@Component({
  selector: "boolean-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
})
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

**What's happening:**

- Container uses flexbox to center the checkbox
- White background with blue border for visual distinction
- Takes full height and width of the cell
- Material checkbox styled with `color="primary"`

**Key styling:**

- `display: flex` - Enables flexbox layout
- `align-items: center` - Vertical centering
- `justify-content: center` - Horizontal centering
- `height: 100%; width: 100%` - Fill the entire cell
- `border: 2px solid #1a42e8` - Blue border for editor visibility

## Step 4: Complete Editor Component

Put it all together:

```typescript
@Component({
  selector: "boolean-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
})
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

**What's happening:**

- **Class extends base**: `HotCellEditorAdvancedComponent<boolean>` provides editor functionality
- **Template**: Inline template with Material checkbox
- **Value management**: `setValue()` and `getValue()` with null safety (`?? false`)
- **Change handler**: `onCheckboxChange()` updates value and finishes editing immediately
- **Styling**: Inline styles for centering and visual distinction

## Step 5: Use in Handsontable

Use the editor component in your Angular component:

**TypeScript (.ts):**

```typescript
import { Component } from "@angular/core";
import { GridSettings } from "@handsontable/angular-wrapper";

@Component({
  selector: "app-example",
  standalone: false,
  template: ` <hot-table [data]="data" [settings]="gridSettings"></hot-table> `,
})
export class ExampleComponent {
  readonly data = [
    { id: 640329, itemName: "Lunar Core", inStock: true },
    { id: 863104, itemName: "Zero Thrusters", inStock: false },
    { id: 395603, itemName: "EVA Suits", inStock: true },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ["ID", "Item Name", "In Stock"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "inStock",
        width: 150,
        editor: BooleanEditorComponent,
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

- `editor: BooleanEditorComponent` - Assigns the boolean editor to the column
- Column configured for boolean values (true/false)
- Configuration through `GridSettings` interface
- `standalone: false` component declaration

**Key features:**

- Simple boolean editor
- No additional configuration needed
- Type-safe with TypeScript
- Declarative settings object

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the boolean value (true/false)
2. **User Double-Clicks or Enter**: Editor opens with Material checkbox
3. **Editor Opens**: Component template rendered over cell
4. **Checkbox Display**: Material checkbox appears, showing current checked state
5. **User Interaction**:
   - Click checkbox → `onCheckboxChange()` called with new value
   - `onCheckboxChange()` updates `this.value` and calls `finishEdit.emit()`
   - Editor automatically closes after change
6. **Visual Feedback**: Checkbox shows checked/unchecked state
7. **Save**: Value immediately saved to cell when checkbox changes
8. **Editor Closes**: Cell shows updated boolean value
9. **No keyboard shortcuts needed**: Material checkbox handles Space and Enter natively

## Enhancements

### 1. Custom Checkbox Styling

Use Angular Material theming for custom colors:

```typescript
@Component({
  selector: "boolean-editor",
  standalone: false,
  template: `
    <div class="editor-container">
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="accent"> </mat-checkbox>
    </div>
  `,
  styles: [
    `
      .editor-container {
        background-color: white;
        border: 2px solid #1a42e8;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        padding: 8px;
      }
    `,
  ],
})
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... rest of the component
}
```

### 2. Tri-State Checkbox

Support null values for indeterminate state:

```typescript
@Component({
  selector: "tri-state-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox
        [checked]="value === true"
        [indeterminate]="value === null"
        (change)="onCheckboxChange($event.checked)"
        color="primary"
      >
      </mat-checkbox>
    </div>
  `,
})
export class TriStateBooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean | null> {
  onCheckboxChange(checked: boolean): void {
    if (this.value === null) {
      this.value = true;
    } else if (this.value === true) {
      this.value = false;
    } else {
      this.value = null;
    }
    this.finishEdit.emit();
  }

  override setValue(value: boolean | null): void {
    this.value = value;
  }

  override getValue(): boolean | null {
    return this.value;
  }
}
```

### 3. Checkbox with Label

Add descriptive text next to the checkbox:

```typescript
@Component({
  selector: "labeled-boolean-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary">
        {{ value ? "Active" : "Inactive" }}
      </mat-checkbox>
    </div>
  `,
})
export class LabeledBooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

### 4. Custom Border Colors

Different border colors for different states:

```typescript
@Component({
  selector: "colored-boolean-editor",
  standalone: false,
  template: `
    <div
      [style.border]="value ? '2px solid #4caf50' : '2px solid #f44336'"
      style="background-color: white; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" [color]="value ? 'accent' : 'warn'">
      </mat-checkbox>
    </div>
  `,
})
export class ColoredBooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... rest of the component
}
```

### 5. Using External Template and Styles

Move template and styles to separate files:

```html
<!-- boolean-editor.component.html -->
<div class="editor-container">
  <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
</div>
```

```css
/* boolean-editor.component.css */
.editor-container {
  background-color: white;
  border: 2px solid #1a42e8;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
```

```typescript
@Component({
  selector: "boolean-editor",
  standalone: false,
  templateUrl: "./boolean-editor.component.html",
  styleUrls: ["./boolean-editor.component.css"],
})
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... component code
}
```

## Accessibility

Angular Material checkbox is already fully accessible with built-in ARIA support. You can enhance it further:

```typescript
@Component({
  selector: "accessible-boolean-editor",
  standalone: false,
  template: `
    <div
      role="region"
      aria-label="Boolean editor"
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox
        [checked]="value"
        (change)="onCheckboxChange($event.checked)"
        [attr.aria-label]="'Toggle value, currently ' + (value ? 'checked' : 'unchecked')"
        color="primary"
      >
      </mat-checkbox>
    </div>
  `,
})
export class AccessibleBooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... component code
}
```

**Keyboard navigation:**

- **Tab**: Navigate to editor (focuses checkbox)
- **Space**: Toggle checkbox state
- **Enter**: Toggle checkbox and finish editing
- **Escape**: Cancel editing
- **Click**: Direct toggle

**Built-in ARIA support:**

- Material checkbox includes proper `role="checkbox"`
- `aria-checked` automatically reflects state
- Keyboard navigation handled by Material
- Focus management built-in

## Performance Considerations

### Why This Is Fast

1. **Class-based approach**: Minimal overhead, no virtual DOM reconciliation
2. **Angular Material**: Optimized checkbox component
3. **Simple Template**: Single checkbox, minimal DOM manipulation
4. **Native Events**: Browser-optimized click handlers
5. **Direct value updates**: No intermediate state management

### Angular Change Detection

The editor automatically triggers change detection when needed:

```typescript
onCheckboxChange(checked: boolean): void {
  this.value = checked;
  this.finishEdit.emit(); // Triggers save and closes editor
}
```

**Why it's efficient:**

- Immediate save on checkbox change
- No debouncing or delays needed
- Angular Material handles internal state efficiently
- Editor closes immediately after change

## TypeScript Support

`HotCellEditorAdvancedComponent` is fully typed. You can specify the value type:

```typescript
export class BooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // TypeScript knows value is boolean | undefined
  // TypeScript knows setValue accepts boolean
  // TypeScript knows getValue returns boolean
}
```

For nullable boolean (tri-state):

```typescript
export class TriStateBooleanEditorComponent extends HotCellEditorAdvancedComponent<boolean | null> {
  override value: boolean | null = null;

  // TypeScript knows value is boolean | null | undefined
  // TypeScript knows setValue accepts boolean | null
  // TypeScript knows getValue returns boolean | null
}
```

For custom boolean types:

```typescript
type YesNo = "yes" | "no";

export class YesNoEditorComponent extends HotCellEditorAdvancedComponent<YesNo> {
  override value: YesNo = "no";

  onCheckboxChange(checked: boolean): void {
    this.value = checked ? "yes" : "no";
    this.finishEdit.emit();
  }
}
```

## Best Practices

1. **Use `override` keyword** - For properties and methods from base class
2. **Call `finishEdit.emit()` on change** - When checkbox changes to save immediately
3. **Implement null safety** - Use `value ?? false` in `setValue()` and `getValue()`
4. **Extend with proper type parameter** - `HotCellEditorAdvancedComponent<boolean>` for type safety
5. **Keep template simple** - Single checkbox with minimal wrapper
6. **Use Material theming** - Leverage Angular Material's color system
7. **Set `standalone: false`** - Required for Angular module system

---

**Congratulations!** You've created a boolean editor with Material checkbox using Angular's `HotCellEditorAdvancedComponent`, perfect for true/false values in your data grid!
