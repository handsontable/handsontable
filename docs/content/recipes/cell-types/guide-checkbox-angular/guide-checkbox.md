---
id: orf6yb2z
title: "Recipe: Checkbox Editor"
metaTitle: "Recipe: Checkbox Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/checkbox-angular
canonicalUrl: /recipes/checkbox-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: yi0viy3z
  metaTitle: "Recipe: Checkbox Editor - React Data Grid | Handsontable"
angular:
  id: 8kfslhbq
  metaTitle: "Recipe: Checkbox Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Checkbox Editor - Step-by-Step Guide (Angular)

[[toc]]

## Overview

This guide shows how to create a checkbox editor cell using Angular Material's checkbox with Angular's [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent). Perfect for true/false values, status toggles, or any scenario where users need a simple on/off switch.

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

@[code](@/content/recipes/cell-types/guide-checkbox-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-checkbox-angular/angular/example1.html)

:::

:::

## Prerequisites

```bash
npm install @handsontable/angular-wrapper @angular/material
```

**What you need:**

- Angular 16+ (decorators support)
- `@handsontable/angular-wrapper` package
- `@angular/material` package
- Basic Angular knowledge (components, decorators, change detection)

## Step 1: Import Dependencies

```typescript
import { Component } from "@angular/core";
import { HotTableModule, HotCellEditorAdvancedComponent, GridSettings } from "@handsontable/angular-wrapper";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { registerAllModules } from "handsontable/registry";

registerAllModules();
```

**What we're importing:**

- [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - Base class for creating custom editors
- `HotTableModule` - Angular wrapper module
- `MatCheckboxModule` - Angular Material checkbox component
- `GridSettings` - Type definitions for Handsontable settings
- `registerAllModules()` - Registers all Handsontable features
- Handsontable styles

## Step 2: Create the editor component

Create an Angular component that extends [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent).

```typescript
@Component({
  selector: "checkbox-editor",
  standalone: false,
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
})
export class CheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

1.  The class extends [`HotCellEditorAdvancedComponent<boolean>`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent), which is the base for custom editors.
2.  The `@Component` decorator uses an inline template with `<mat-checkbox>`.
3.  `[checked]="value"` binds the checkbox's state to the cell's current value.
4.  `(change)="onCheckboxChange($event.checked)"` calls a method to handle state changes.
5.  `onCheckboxChange()` updates the value and calls `finishEdit.emit()` to save and close the editor.
6.  `setValue()` and `getValue()` are overridden to handle boolean values with null safety.
7.  Inline styles center the checkbox and add a border for better visibility during editing.

## Step 3: Use in Handsontable

Use the editor component in your Angular component:

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
        editor: CheckboxEditorComponent,
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

- `editor: CheckboxEditorComponent` - Assigns the checkbox editor to the column
- Column configured for boolean values (true/false)
- Configuration through `GridSettings` interface

**Key features:**

- Simple checkbox editor
- No additional configuration needed
- Type-safe with TypeScript
- Declarative settings object

## How it works

1.  When you start editing a cell, the `CheckboxEditorComponent` is rendered.
2.  The Material checkbox is displayed, reflecting the cell's current `true`/`false` value.
3.  Clicking the checkbox triggers the `onCheckboxChange()` method.
4.  This method updates the cell's value and immediately calls `finishEdit.emit()`, which saves the change and closes the editor.
5.  The cell then displays the updated boolean value.

## Enhancements

### 1. Custom Checkbox Styling

Use Angular Material theming for custom colors:

```typescript
@Component({
  selector: "checkbox-editor",
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
export class CheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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
export class TriStateCheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean | null> {
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
  selector: "labeled-checkbox-editor",
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
export class LabeledCheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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
  selector: "colored-checkbox-editor",
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
export class ColoredCheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... rest of the component
}
```

### 5. Using External Template and Styles

Move template and styles to separate files:

```html
<!-- checkbox-editor.component.html -->
<div class="editor-container">
  <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
</div>
```

```css
/* checkbox-editor.component.css */
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
  selector: "checkbox-editor",
  standalone: false,
  templateUrl: "./checkbox-editor.component.html",
  styleUrls: ["./checkbox-editor.component.css"],
})
export class CheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  // ... component code
}
```

## Accessibility

Angular Material checkbox is already fully accessible with built-in ARIA support. You can enhance it further:

```typescript
@Component({
  selector: "accessible-checkbox-editor",
  standalone: false,
  template: `
    <div
      role="region"
      aria-label="checkbox editor"
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
export class AccessibleCheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
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

---

**Congratulations!** You've created a checkbox editor with Material checkbox using Angular's [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent), perfect for true/false values in your data grid!
