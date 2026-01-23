---
id: xs3x77mj
title: "Recipe: Multiple Select Dropdown"
metaTitle: "Recipe: Multiple Select Dropdown - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type featuring a searchable, multi-select dropdown using the multiple-select-vanilla library.
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

This guide shows how to create a custom multi-select dropdown cell using the [multiple-select-vanilla](https://github.com/leviwheatcroft/multiple-select-vanilla) library. Users can select multiple items from a dropdown list, with a clean, searchable interface.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Libraries:** `multiple-select-vanilla`

## What You'll Build

A cell that:

- Displays selected items as comma-separated text
- Opens a searchable multi-select dropdown when edited
- Handles array of objects as values
- Supports per-column option lists
- Provides filtering and selection features

## Prerequisites

```bash
npm install multiple-select-vanilla
```

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cells/guide-select-multiple-angular/angular/example1.ts)
@[code](@/content/recipes/cells/guide-select-multiple-angular/angular/example1.html)

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

- **HotCellRendererAdvancedComponent**: Base class for custom cell renderers
- **HotCellEditorAdvancedComponent**: Base class for custom cell editors
- Use Angular's template system and change detection
- Full access to Angular features (services, lifecycle hooks, etc.)

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

**Data structure rationale:**

### Why `{ value, label }` objects?

- **Value**: Unique identifier, stored in database
- **Label**: Display text, shown to user
- **Flexibility**: Value can be ID, label can be localized text

**Example scenarios:**

```typescript
// IDs vs Names
{ value: '123', label: 'John Smith' }

// Codes vs Descriptions
{ value: 'US', label: 'United States' }

// Keys vs Localized Text
{ value: 'save', label: 'Ušetřit peníze' } // Czech
```

### Why arrays in data?

```typescript
components: [
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" },
];
```

- Represents multiple selections
- Easy to iterate and display
- Maps naturally to `<select multiple>`

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

## Step 4: Create the Validator (Optional)

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

## Step 5: Create the Editor Component Structure

Create an Angular component that extends `HotCellEditorAdvancedComponent` with a custom dropdown UI.

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
          <div class="dropdown-list" *ngIf="isOpen">
            <div *ngFor="let option of config" class="dropdown-item" (click)="toggleOption(option)">
              <input type="checkbox" [checked]="isSelected(option.value)" (click)="$event.stopPropagation()" />
              <label>{{ option.label }}</label>
            </div>
          </div>
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
}
```

**What's happening:**

### Extend HotCellEditorAdvancedComponent

```typescript
export class MultiSelectEditorComponent extends HotCellEditorAdvancedComponent<
  { value: string; label: string }[]
>
```

- Generic type specifies the value type
- Provides lifecycle hooks: `beforeOpen`, `afterOpen`, `afterClose`
- Access to `@Input()` properties: `row`, `column`, `originalValue`, `cellProperties`
- `@Output()` events: `finishEdit`, `cancelEdit`

### Custom dropdown UI with Angular

```typescript
template: `
  <div class="dropdown-header" (click)="toggleDropdown()">
    <span>{{ getSelectedLabel() }}</span>
  </div>
  <div class="dropdown-list" *ngIf="isOpen">
    <div *ngFor="let option of config" (click)="toggleOption(option)">
      <input type="checkbox" [checked]="isSelected(option.value)" />
      <label>{{ option.label }}</label>
    </div>
  </div>
`;
```

- Full Angular template with bindings
- Custom dropdown instead of native `<select>`
- Checkboxes for visual feedback
- Click handlers for toggling options

### State management

```typescript
selectedValues: {
  value: string;
  label: string;
}
[] = [];
isOpen = false;
```

- Track currently selected values
- Control dropdown visibility
- Use ChangeDetectorRef for manual updates

## Step 6: Editor - Lifecycle Hook `beforeOpen`

Load configuration when the editor is about to open.

```typescript
override beforeOpen(editor: any): void {
  this.config = editor.cellProperties.config || [];
  this.selectedValues = [...editor.originalValue];
}
```

**What's happening:**

### Get options from cell properties

```typescript
this.config = editor.cellProperties.config || [];
```

- `editor.cellProperties` contains column configuration
- `config` property holds available options for this column
- Different columns can have different option lists
- Fallback to empty array if not defined

### Initialize selected values

```typescript
this.selectedValues = [...editor.originalValue];
```

- `editor.originalValue` is the current cell value
- Create a copy using spread operator
- Avoid mutating the original value
- Populate UI with current selections

**Key points:**

- Called before editor becomes visible
- Perfect for loading data and initializing state
- Access to cell properties and original value
- `override` keyword required for lifecycle hooks

## Step 7: Editor - Lifecycle Hook `afterClose`

Clean up and finalize the edit when the editor closes.

```typescript
override afterClose(): void {
  this.selectedValues = [];
  this.isOpen = false;
  this.finishEdit.emit();
}
```

**What's happening:**

### Reset state

```typescript
this.selectedValues = [];
this.isOpen = false;
```

- Clear selected values array
- Close dropdown if still open
- Prepare for next edit

### Emit finishEdit event

```typescript
this.finishEdit.emit();
```

- Signal Handsontable that editing is complete
- Triggers `getValue()` to save the value
- Cell will be updated with new value

**Key points:**

- Called after editor is hidden
- Perfect for cleanup and saving
- `finishEdit` saves the data
- `cancelEdit` would discard changes

## Step 8: Editor - Selection Management Methods

Implement methods to handle user interactions with the dropdown.

```typescript
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
```

**What's happening:**

### Toggle dropdown visibility

```typescript
toggleDropdown(): void {
  this.isOpen = !this.isOpen;
  this.cdr.detectChanges();
}
```

- Invert `isOpen` state
- Trigger Angular change detection
- Show/hide dropdown in template with `*ngIf="isOpen"`

### Toggle option selection

```typescript
toggleOption(option: { value: string; label: string }): void {
  const index = this.selectedValues.findIndex((item) => item.value === option.value);
  if (index > -1) {
    this.selectedValues.splice(index, 1); // Remove if already selected
  } else {
    this.selectedValues.push(option); // Add if not selected
  }

  this.setValue(this.selectedValues); // Update editor value
  this.cdr.detectChanges();
}
```

- Find option in selected values
- Remove if already selected (uncheck)
- Add if not selected (check)
- Call `setValue` to update internal value
- Trigger change detection for UI update

### Check if option is selected

```typescript
isSelected(value: string): boolean {
  return this.selectedValues.some((item) => item.value === value);
}
```

- Used in template: `[checked]="isSelected(option.value)"`
- Returns true if value exists in selectedValues
- Controls checkbox state

### Get display label

```typescript
getSelectedLabel(): string {
  if (this.selectedValues.length === 0) {
    return "Select options...";
  }
  return this.selectedValues.map((item) => item.label).join(", ");
}
```

- Show placeholder when nothing selected
- Otherwise show comma-separated labels
- Displayed in dropdown header

**Change Detection:**

```typescript
private readonly cdr = inject(ChangeDetectorRef);
```

- Inject Angular's ChangeDetectorRef
- Call `detectChanges()` after state updates
- Ensures UI reflects current state immediately

## Step 9: Complete Editor Component

Here's the complete editor component with all methods:

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
          <div class="dropdown-list" *ngIf="isOpen">
            <div *ngFor="let option of config" class="dropdown-item" (click)="toggleOption(option)">
              <input type="checkbox" [checked]="isSelected(option.value)" (click)="$event.stopPropagation()" />
              <label>{{ option.label }}</label>
            </div>
          </div>
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

- Extends `HotCellEditorAdvancedComponent` with array of objects as value type
- Uses Angular template with data bindings and event handlers
- Lifecycle hooks: `beforeOpen` and `afterClose`
- Custom dropdown UI instead of native select element
- Change detection managed with `ChangeDetectorRef`
- Emits `finishEdit` to save changes

## Step 10: Use Components in Grid Configuration

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

## Step 11: Register Components in Module

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
- **CommonModule**: Provides `*ngFor`, `*ngIf` directives

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

## How It Works - Complete Flow

1. **Initial Render**: Renderer component displays comma-separated labels (e.g., "Component 1, Component 2")
2. **User Opens Editor**: Double-click or press F2 on cell
3. **Before Open**: `beforeOpen()` loads config from cell properties and initializes `selectedValues`
4. **Editor Opens**: Angular renders dropdown with checkboxes, showing current selections
5. **User Interacts**: User clicks to toggle dropdown, clicks checkboxes to select/deselect options
6. **Toggle Option**: `toggleOption()` updates `selectedValues` array and calls `setValue()`
7. **User Finishes**: Clicks outside editor or presses Enter/Escape
8. **After Close**: `afterClose()` emits `finishEdit`, triggering Handsontable to call `getValue()`
9. **Get Value**: Base class `getValue()` returns the current value from `setValue()`
10. **Save**: New array saved to cell data
11. **Re-render**: Renderer component displays updated comma-separated labels

**Key differences from vanilla JS:**

- No `init()` method - Angular handles component instantiation
- No `setValue()` override needed - called internally by `toggleOption()`
- Change detection managed by `ChangeDetectorRef`
- Template-driven UI instead of DOM manipulation
- Full access to Angular features (dependency injection, services, etc.)

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
      <span *ngIf="!value || value.length === 0" class="no-selection"> No selection </span>
      <span *ngFor="let item of value" class="badge">
        {{ item.label }}
      </span>
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
          <div class="dropdown-list" *ngIf="isOpen">
            <div *ngFor="let group of groupedConfig" class="option-group">
              <div class="group-label">{{ group.label }}</div>
              <div *ngFor="let option of group.options" class="dropdown-item" (click)="toggleOption(option)">
                <input type="checkbox" [checked]="isSelected(option.value)" />
                <label>{{ option.label }}</label>
              </div>
            </div>
          </div>
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

## TypeScript Type Definitions

Add proper type definitions for cell properties:

```typescript
// Extend Handsontable's CellProperties type
declare module "handsontable/settings" {
  interface CellProperties {
    config?: Array<{ value: string; label: string }>;
  }
}

// Now TypeScript knows about the config property
columns: [
  {
    data: "components",
    renderer: MultiSelectRendererComponent,
    editor: MultiSelectEditorComponent,
    config: components, // ✅ Fully typed!
  },
];
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
        <div class="dropdown-list"
             *ngIf="isOpen"
             role="list">
          <div *ngFor="let option of config"
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
        </div>
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
