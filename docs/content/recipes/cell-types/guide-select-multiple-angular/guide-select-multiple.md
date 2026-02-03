---
id: xs3x77mj
title: "Recipe: Multiple Select Dropdown"
metaTitle: "Recipe: Multiple Select Dropdown - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type featuring a searchable, multi-select dropdown using the native HTML5.
permalink: /recipes/select-multiple-angular
canonicalUrl: /recipes/select-multiple-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: kckn2wxq
  metaTitle: "Recipe: Multiple Select Dropdown - React Data Grid | Handsontable"
angular:
  id: icpb0due
  metaTitle: "Recipe: Multiple Select Dropdown - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Multiple Select Dropdown Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom multi-select dropdown cell using the native HTML5.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Libraries:** none

## What You'll Build

A cell that:

- Displays selected items as comma-separated text
- Opens a searchable multi-select dropdown when edited
- Handles array of objects as values
- Supports per-column option lists
- Provides filtering and selection features

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cell-types/guide-select-multiple-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-select-multiple-angular/angular/example1.html)

:::

:::

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef, inject } from "@angular/core";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";
import { registerAllModules } from "handsontable/registry";

registerAllModules();
```

**About Angular components:**

- [**HotCellRendererAdvancedComponent**](@/guides/cell-functions/custom-cells/custom-cells.md#hotcellrendereradvancedcomponent): Base class for custom cell renderers
- [**HotCellEditorAdvancedComponent**](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent): Base class for custom cell editors

## Step 2: Prepare Your Data

Define the data structure with arrays of objects for multi-select values:

```typescript
export const inputData = [
  { id: 640329, itemName: "Lunar Core" },
  { id: 863104, itemName: "Zero Thrusters" },
  { id: 395603, itemName: "EVA Suits" },
];

// Define available options
const components = [
  { value: "1", label: "Component 1" },
  { value: "2", label: "Component 2" },
  { value: "3", label: "Component 3" },
];

// Generate data with random components
const data = inputData.map((el) => ({
  ...el,
  components: components
    .map((n) => [Math.random(), n])
    .sort()
    .map((n) => n[1])
    .slice(0, Math.ceil(Math.random() * components.length)),
}));
```

## Step 3: Create the Renderer Component

Create an Angular component that extends `HotCellRendererAdvancedComponent` to display selected items.

```typescript
@Component({
  selector: "multi-select-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ displayValue }}</div>`,
  standalone: false,
})
export class MultiSelectRendererComponent extends HotCellRendererAdvancedComponent<{ value: string; label: string }[]> {
  get displayValue(): string {
    return this.value && this.value.length > 0 ? this.value.map((el) => el.label).join(", ") : "No elements";
  }
}
```

**What's happening:**

### Extend HotCellRendererAdvancedComponent

```typescript
export class MultiSelectRendererComponent extends HotCellRendererAdvancedComponent<
  { value: string; label: string }[]
>
```

- Generic type specifies the value type (array of objects)
- Provides `@Input() value` automatically
- Access to other inputs: `instance`, `td`, `row`, `col`, `prop`, `cellProperties`

### Use Angular template

```typescript
template: `<div>{{ displayValue }}</div>`;
```

- Angular template binding
- Automatic change detection
- Clean separation of logic and presentation

### Computed property for display

```typescript
get displayValue(): string {
  return this.value && this.value.length > 0
    ? this.value.map((el) => el.label).join(", ")
    : "No elements";
}
```

- Check if value exists and has items
- Extract labels and join with commas
- Show fallback message if empty

## Validator (Optional)

For the Angular wrapper, validators use the `CustomValidatorFn<T>` type, which is simpler than the standard Handsontable validator. It takes a value and returns a boolean directly (no callback).

```typescript
import { CustomValidatorFn } from "@handsontable/angular-wrapper";

// Accept any selection (even empty)
validator: (value) => true;
```

**Custom validation examples:**

### Require at least one selection:

```typescript
validator: (value: { value: string; label: string }[]) => {
  return Array.isArray(value) && value.length > 0;
};
```

### Limit maximum selections:

```typescript
validator: (value: { value: string; label: string }[]) => {
  return Array.isArray(value) && value.length <= 3;
};
```

### Require specific item:

```typescript
validator: (value: { value: string; label: string }[]) => {
  const hasRequired = value.some((el) => el.value === "cpu");
  return hasRequired;
};
```

## Step 4: Create the Editor Component

Use a single Angular component that extends [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent).

```typescript
@Component({
  template: `
    <div class="multiselect-editor-container" (click)="$event.stopPropagation()">
      <div class="multiselect-wrapper">
        <label>Select options:</label>
        <div class="dropdown">
          <div class="dropdown-header" (click)="toggleDropdown()">
            <span>{{ getSelectedLabel() }}</span>
            <span class="arrow">▼</span>
          </div>
          @if (isOpen) {
          <div class="dropdown-list">
            @for (option of config; track option.value) {
            <div class="dropdown-item" (click)="toggleOption(option)">
              <input type="checkbox" [checked]="isSelected(option.value)" (click)="$event.stopPropagation()" />
              <label>{{ option.label }}</label>
            </div>
            }
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    /* CSS styles */
  ],
  standalone: false,
  selector: "multi-select-editor",
})
export class MultiSelectEditorComponent extends HotCellEditorAdvancedComponent<{ value: string; label: string }[]> {
  selectedValues: { value: string; label: string }[] = [];
  isOpen = false;

  private readonly cdr = inject(ChangeDetectorRef);

  override afterClose(): void {
    this.selectedValues = [];
    this.isOpen = false;
    this.finishEdit.emit();
  }

  override beforeOpen(editor: any): void {
    this.config = editor.cellProperties.config || [];
    this.selectedValues = [...editor.originalValue];
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  toggleOption(option: { value: string; label: string }): void {
    const index = this.selectedValues.findIndex((item) => item.value === option.value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(option);
    }

    this.setValue(this.selectedValues);
    this.cdr.detectChanges();
  }

  isSelected(value: string): boolean {
    return this.selectedValues.some((item) => item.value === value);
  }

  getSelectedLabel(): string {
    if (this.selectedValues.length === 0) {
      return "Select options...";
    }
    return this.selectedValues.map((item) => item.label).join(", ");
  }
}
```

**Key points:**

- Lifecycle: `beforeOpen` loads `config` and current value; `afterClose` resets state and emits `finishEdit`.
- State: `selectedValues` tracks selections; `isOpen` controls dropdown.
- Interaction: `toggleOption()` adds/removes items and calls `setValue()`.
- Change detection: `ChangeDetectorRef.detectChanges()` updates the view immediately.
- Config: per-column options available via `editor.cellProperties.config`.

## Step 5: Use Components in Grid Configuration

Configure Handsontable to use your custom renderer and editor components.

```typescript
@Component({
  selector: "app-multi-select-example",
  standalone: false,
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class ExampleComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    components: components
      .map((n) => [Math.random(), n])
      .sort()
      .map((n) => n[1])
      .slice(0, Math.ceil(Math.random() * components.length)),
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    height: "auto",
    colHeaders: ["ID", "Item Name", "Components"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "components",
        width: 150,
        renderer: MultiSelectRendererComponent,
        editor: MultiSelectEditorComponent,
        config: components,
      },
    ],
  };
}
```

**What's happening:**

### Pass component classes directly

```typescript
renderer: MultiSelectRendererComponent,
editor: MultiSelectEditorComponent,
```

- Angular wrapper handles component instantiation
- Type-safe references to component classes

### Pass configuration via `config` property

```typescript
config: components,
```

- Available in editor via `editor.cellProperties.config`
- Different columns can have different configs
- Accessed in `beforeOpen` lifecycle hook

**Key features:**

- **Type safety**: GridSettings interface provides IntelliSense
- **Reusability**: Use same components across multiple columns
- **Flexibility**: Different configs per column
- **Angular integration**: Full access to Angular features in components

## Step 6: Register Components in Module

Register your custom components in the Angular module.

```typescript
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: "ht-theme-main",
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [ExampleComponent, MultiSelectEditorComponent, MultiSelectRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [ExampleComponent],
})
export class AppModule {}
```

**What's happening:**

### Import required modules

```typescript
imports: [BrowserModule, HotTableModule, CommonModule];
```

- **BrowserModule**: Required for Angular apps
- **HotTableModule**: Provides `<hot-table>` component
- **CommonModule**: Required for Angular apps

### Declare custom components

```typescript
declarations: [ExampleComponent, MultiSelectEditorComponent, MultiSelectRendererComponent];
```

- All custom components must be declared
- Makes them available for use in the module

### Configure Handsontable globally

```typescript
providers: [
  {
    provide: HOT_GLOBAL_CONFIG,
    useValue: {
      themeName: "ht-theme-main",
      license: NON_COMMERCIAL_LICENSE,
    } as HotGlobalConfig,
  },
];
```

- Set global theme
- Configure license key
- Applied to all Handsontable instances in the app

## Customization Options

You can enhance the editor component with additional features:

### Select All Button

Add a button to select or deselect all options:

```typescript
@Component({
  template: `
    <div class="multiselect-editor-container">
      <button (click)="selectAll()">Select All</button>
      <button (click)="deselectAll()">Deselect All</button>
      <!-- rest of template -->
    </div>
  `,
})
export class MultiSelectEditorComponent extends HotCellEditorAdvancedComponent<{ value: string; label: string }[]> {
  selectAll(): void {
    this.selectedValues = [...this.config];
    this.setValue(this.selectedValues);
    this.cdr.detectChanges();
  }

  deselectAll(): void {
    this.selectedValues = [];
    this.setValue(this.selectedValues);
    this.cdr.detectChanges();
  }
}
```

## Advanced Enhancements

### 1. Dynamic Options Based on Other Cells

Load different options based on values in other columns:

```typescript
override beforeOpen(editor: any): void {
  const rowData = editor.instance.getDataAtRow(editor.row);
  const category = rowData[0]; // Assuming category is in first column

  // Different options based on category
  let options = this.cellProperties.config || [];

  if (category === 'Electronics') {
    options = [
      { value: 'cpu', label: 'CPU' },
      { value: 'ram', label: 'RAM' },
    ];
  } else if (category === 'Furniture') {
    options = [
      { value: 'wood', label: 'Wood' },
      { value: 'metal', label: 'Metal' },
    ];
  }

  this.config = options;
  this.selectedValues = [...editor.originalValue];
}
```

### 2. Renderer with Badges

Enhance the renderer to display items as styled badges:

```typescript
@Component({
  selector: "multi-select-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badges-container">
      @if (!value || value.length === 0) {
      <span class="no-selection"> No selection </span>
      } @for (item of value; track item.value) {
      <span class="badge">
        {{ item.label }}
      </span>
      }
    </div>
  `,
  styles: [
    `
      .badges-container {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        background: #e3f2fd;
        border-radius: 12px;
        font-size: 12px;
        color: #1976d2;
      }
      .no-selection {
        color: #999;
        font-style: italic;
      }
    `,
  ],
  standalone: false,
})
export class MultiSelectRendererComponent extends HotCellRendererAdvancedComponent<
  { value: string; label: string }[]
> {}
```

### 3. Grouped Options with Template

Use Angular templates for more complex option displays:

```typescript
@Component({
  template: `
    <div class="multiselect-editor-container" (click)="$event.stopPropagation()">
      <div class="multiselect-wrapper">
        <label>Select options:</label>
        <div class="dropdown">
          <div class="dropdown-header" (click)="toggleDropdown()">
            <span>{{ getSelectedLabel() }}</span>
            <span class="arrow">▼</span>
          </div>
          @if (isOpen) {
          <div class="dropdown-list">
            @for (group of groupedConfig; track group.label) {
            <div class="option-group">
              <div class="group-label">{{ group.label }}</div>
              @for (option of group.options; track option.value) {
              <div class="dropdown-item" (click)="toggleOption(option)">
                <input type="checkbox" [checked]="isSelected(option.value)" />
                <label>{{ option.label }}</label>
              </div>
              }
            </div>
            }
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MultiSelectEditorComponent extends HotCellEditorAdvancedComponent<{ value: string; label: string }[]> {
  groupedConfig: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];

  override beforeOpen(editor: any): void {
    // Transform flat config into grouped structure
    this.groupedConfig = [
      {
        label: "Hardware",
        options: editor.cellProperties.config.filter((opt: any) => opt.category === "hardware"),
      },
      {
        label: "Software",
        options: editor.cellProperties.config.filter((opt: any) => opt.category === "software"),
      },
    ];
    this.selectedValues = [...editor.originalValue];
  }
}
```

## Accessibility

The Angular implementation provides good accessibility support:

**Keyboard shortcuts:**

- **Enter**: Open/close dropdown
- **Escape**: Close dropdown and finish editing
- **Click outside**: Close dropdown and finish editing
- **Space/Click**: Toggle checkbox selection

**Improvements for better accessibility:**

```typescript
@Component({
  template: `
    <div class="multiselect-editor-container"
         role="listbox"
         [attr.aria-label]="'Select components'"
         (click)="$event.stopPropagation()">
      <div class="dropdown">
        <button
          class="dropdown-header"
          (click)="toggleDropdown()"
          [attr.aria-expanded]="isOpen"
          aria-haspopup="listbox">
          <span>{{ getSelectedLabel() }}</span>
          <span class="arrow">▼</span>
        </button>
        @if (isOpen) {
          <div class="dropdown-list" role="list">
            @for (option of config; track option.value) {
              <div
                class="dropdown-item"
                role="listitem"
                [attr.aria-selected]="isSelected(option.value)"
                (click)="toggleOption(option)">
                <input
                  type="checkbox"
                  [checked]="isSelected(option.value)"
                  [attr.aria-label]="option.label"
                  (click)="$event.stopPropagation()" />
                <label>{{ option.label }}</label>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
```

**Benefits:**

- Proper ARIA roles and attributes
- Screen reader support
- Keyboard navigation
- Semantic HTML structure

---

**Congratulations!** You've created a powerful multi-select cell with search, keyboard navigation, and full customization options!
