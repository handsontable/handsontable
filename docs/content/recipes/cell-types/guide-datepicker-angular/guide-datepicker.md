---
id: 0slrmsni
title: "Date picker"
metaTitle: "Date picker - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using Flatpickr for a powerful, customizable date picker experience directly inside your data grid.
permalink: /recipes/datepicker-angular
canonicalUrl: /recipes/datepicker-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: n4f2zp8e
  metaTitle: Date picker - React Data Grid | Handsontable
angular:
  id: o1ijr8z3
  metaTitle: Date picker - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cells
---
[[toc]]

## Overview

This guide shows how to create a custom date picker cell using Angular components with the native HTML5 date input. You'll learn how to build custom editor and renderer components that extend Handsontable's Angular wrapper classes, providing a clean, type-safe implementation.

**Difficulty:** Intermediate
**Time:** ~15 minutes
**Libraries:** `date-fns`

## What You'll Build

A cell that:

- Displays formatted dates (e.g., "12/31/2024" or "31/12/2024")
- Opens a native HTML5 date picker when edited
- Supports per-column configuration (EU vs US date formats)
- Uses Angular component architecture with proper lifecycle management
- Leverages Angular's change detection and two-way data binding
- Auto-saves when a date is selected

## Prerequisites

```bash
npm install date-fns
```

Ensure you have `@handsontable/angular-wrapper` installed in your Angular project.

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cell-types/guide-datepicker-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-datepicker-angular/angular/example1.html)

:::

:::

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject, ViewChild, ElementRef } from "@angular/core";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";
import { format, parse, isValid } from "date-fns";
```

**Key imports explained:**

- **Angular Core**: Component decorators, change detection, dependency injection
- **Handsontable Wrapper**: Base classes for custom editor and renderer components
- **date-fns**: Lightweight date formatting and parsing
  - `format`: Convert Date to formatted string
  - `parse`: Parse string to Date object
  - `isValid`: Validate Date objects

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = "MM/dd/yyyy";
const DATE_FORMAT_EU = "dd/MM/yyyy";
```

**Why constants?**

- Reusability across renderer and column configuration
- Single source of truth
- Easy to add more formats (ISO, custom, etc.)

## Step 3: Create the Renderer Component

The renderer displays the date in a human-readable format using an Angular component.

```typescript
@Component({
  selector: "date-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div>{{ formattedDate }}</div>`,
  standalone: false,
})
export class DateRendererComponent extends HotCellRendererAdvancedComponent<string, { renderFormat: string }> {
  get formattedDate(): string {
    return format(new Date(this.value), this.getProps().renderFormat);
  }
}
```

**What's happening:**

- [**Extends HotCellRendererAdvancedComponent**](@/guides/cell-functions/custom-cells/custom-cells.md#hotcellrendereradvancedcomponent): Generic types specify:
  - `TValue = string`: The cell value type (date as string)
  - `TProps = { renderFormat: string }`: Custom renderer properties
- **@Input() value**: Automatically provided by Handsontable (inherited from base class)
- **getProps()**: Returns `rendererProps` from column configuration
- **OnPush strategy**: Optimizes change detection for better performance

**Key benefits:**

- Type-safe access to custom properties via `getProps()`
- Automatic change detection when `value` changes
- Clean Angular template syntax
- One component definition, multiple configurations per column

**Adding error handling:**

```typescript
get formattedDate(): string {
  if (!this.value) return '';

  try {
    const date = new Date(this.value);
    return isValid(date)
      ? format(date, this.getProps().renderFormat || 'MM/dd/yyyy')
      : 'Invalid date';
  } catch (e) {
    return 'Invalid date';
  }
}
```

## Step 4: Create the Editor Component (Part 1 - Setup)

The editor component handles user input with a native HTML5 date picker.

```typescript
@Component({
  selector: "date-editor",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="date"
      [(ngModel)]="dateValue"
      #editorInput
      (change)="onDateChange()"
      style="width: 100%; height: 100%; padding: 8px; border: 2px solid #4CAF50; border-radius: 4px; font-size: 14px; box-sizing: border-box;"
    />
  `,
  standalone: false,
})
export class DateEditorComponent extends HotCellEditorAdvancedComponent<string> {
  dateValue: string = "";

  @ViewChild("editorInput", { static: true })
  protected editorInput!: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  // Lifecycle methods continue in next step...
}
```

**What's happening:**

- **Extends `HotCellEditorAdvancedComponent<string>`**: Base class provides:
  - `@Input() originalValue`: Cell's current value
  - `@Input() row, column, prop`: Cell position
  - `@Input() cellProperties`: Column configuration
  - `@Output() finishEdit`: Emit to save changes
  - `@Output() cancelEdit`: Emit to discard changes
  - `getValue()` / `setValue()`: Value management
- **Template**: Native HTML5 `<input type="date">` with:
  - `[(ngModel)]`: Two-way binding to `dateValue`
  - `#editorInput`: Template reference for DOM access
  - `(change)`: Triggers when user selects a date
- **@ViewChild**: Direct access to input element for focus management
- **ChangeDetectorRef**: Manual change detection control
- **OnPush strategy**: Optimized rendering

## Step 5: Editor - Lifecycle Hook `afterOpen`

Called immediately after the editor opens.

```typescript
override afterOpen(): void {
  setTimeout(() => {
    this.editorInput.nativeElement.showPicker?.();
  }, 0);
}
```

**What's happening:**

- `showPicker()` is a native HTML5 API that opens the date picker calendar
- `setTimeout` ensures the DOM is fully rendered before opening picker
- `?.` optional chaining handles browsers that don't support `showPicker()`
- Provides smooth UX - calendar appears automatically

## Step 6: Editor - Lifecycle Hook `beforeOpen`

Called before the editor opens to initialize the value.

```typescript
override beforeOpen(_: any, { originalValue }: any) {
  if (originalValue) {
    try {
      let parsedDate: Date;

      // Try to parse MM/DD/YYYY format
      if (typeof originalValue === "string" && originalValue.includes("/")) {
        parsedDate = parse(originalValue, "MM/dd/yyyy", new Date());
      }
      // Try to parse YYYY-MM-DD format
      else if (typeof originalValue === "string" && originalValue.includes("-")) {
        parsedDate = parse(originalValue, "yyyy-MM-dd", new Date());
      }
      // Fallback to generic date parsing
      else {
        parsedDate = new Date(originalValue);
      }

      if (isValid(parsedDate)) {
        // Format as YYYY-MM-DD for native input type="date"
        this.dateValue = format(parsedDate, "yyyy-MM-dd");
      } else {
        this.dateValue = "";
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      this.dateValue = "";
    }
  } else {
    this.dateValue = "";
  }

  this.cdr.detectChanges();
}
```

**What's happening:**

- Receives `originalValue` from the cell (stored format: MM/dd/yyyy)
- Parses the value using `parse()` from date-fns
- Handles multiple date formats (MM/DD/YYYY, YYYY-MM-DD)
- Converts to YYYY-MM-DD format required by `<input type="date">`
- Validates with `isValid()` before setting
- Triggers change detection to update the view

**Why multiple format support?**

- Cell stores dates in MM/dd/yyyy format
- Native input requires YYYY-MM-DD format
- Ensures compatibility with different data sources

## Step 7: Editor - Date Change Handler

Called when user selects a date in the picker.

```typescript
onDateChange(): void {
  if (this.dateValue) {
    try {
      // Parse YYYY-MM-DD from input
      const parsedDate = parse(this.dateValue, "yyyy-MM-dd", new Date());

      if (isValid(parsedDate)) {
        // Format as MM/DD/YYYY for Handsontable
        const formattedDate = format(parsedDate, "MM/dd/yyyy");
        this.setValue(formattedDate);
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
  }
}
```

**What's happening:**

- Triggered by `(change)` event in template
- Parses native input value (YYYY-MM-DD)
- Converts to storage format (MM/dd/yyyy)
- Calls `setValue()` to update editor's internal value
- Value will be saved when editor closes

**Format conversion flow:**

1. User sees: "12/31/2024" (renderer displays)
2. Editor opens: "2024-12-31" (native input requires)
3. User selects: Native picker updates `dateValue`
4. `onDateChange`: Converts back to "12/31/2024"
5. Saved to cell: "12/31/2024"

## Step 8: Configure Grid with Multiple Date Formats

```typescript
const DATE_FORMAT_US = "MM/dd/yyyy";
const DATE_FORMAT_EU = "dd/MM/yyyy";

@Component({
  selector: "app-date-picker-example",
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class DatePickerExampleComponent {
  readonly data = [
    { id: 640329, itemName: "Lunar Core", restockDate: "2025-08-01" },
    { id: 863104, itemName: "Zero Thrusters", restockDate: "2025-09-15" },
    { id: 395603, itemName: "EVA Suits", restockDate: "2025-10-05" },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ["ID", "Item Name", "Restock Date EU", "Restock Date US"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      // European format column
      {
        data: "restockDate",
        width: 150,
        allowInvalid: false,
        rendererProps: {
          renderFormat: DATE_FORMAT_EU,
        },
        editor: DateEditorComponent,
        renderer: DateRendererComponent,
      },
      // US format column
      {
        data: "restockDate",
        width: 150,
        allowInvalid: false,
        rendererProps: {
          renderFormat: DATE_FORMAT_US,
        },
        editor: DateEditorComponent,
        renderer: DateRendererComponent,
      },
    ],
  };
}
```

**Key configuration points:**

- **editor: DateEditorComponent**: Reference to your editor component class
- **renderer: DateRendererComponent**: Reference to your renderer component class
- **rendererProps**: Custom properties passed to `getProps()` in renderer
  - Type-safe access via generic parameter
  - Different format per column
- **Same data source**: Both columns display `restockDate`
- **Different presentation**: EU (dd/MM/yyyy) vs US (MM/dd/yyyy)

**Amazing feature:**

- One data column (`restockDate`)
- Two visual representations
- Same editor and renderer components
- Configuration-driven behavior

## Step 9: Module Configuration

Register components in your Angular module:

```typescript
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
import { FormsModule } from "@angular/forms";
import { DatePickerExampleComponent, DateEditorComponent, DateRendererComponent } from "./app.component";

// Register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule, FormsModule],
  declarations: [DatePickerExampleComponent, DateEditorComponent, DateRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [DatePickerExampleComponent],
})
export class AppModule {}
```

**Important notes:**

- **FormsModule**: Required for `[(ngModel)]` in editor template
- **Component declarations**: Both DateEditorComponent and DateRendererComponent must be declared in the NgModule declarations array
- **registerAllModules()**: Registers all Handsontable features
- **HOT_GLOBAL_CONFIG**: Global configuration for all tables in the app

## Advanced Enhancements

### 1. Time Picker Support

Add time selection with `datetime-local` input:

```typescript
// In DateEditorComponent template
<input
  type="datetime-local"
  [(ngModel)]="dateValue"
  #editorInput
  (change)="onDateChange()"
/>

// Update parsing in beforeOpen
if (isValid(parsedDate)) {
  this.dateValue = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
}

// Update rendering format
renderFormat: 'dd/MM/yyyy HH:mm'
```

### 2. Date Validation with Min/Max

Add native HTML5 validation:

```typescript
// In DateEditorComponent template
<input
  type="date"
  [(ngModel)]="dateValue"
  [min]="minDate"
  [max]="maxDate"
  #editorInput
/>

// In component class
@Input() minDate: string = '2024-01-01';
@Input() maxDate: string = '2024-12-31';

// Pass via cellProperties in column config
columns: [
  {
    data: 'restockDate',
    editor: DateEditorComponent,
    minDate: '2024-01-01',
    maxDate: '2024-12-31',
  }
]
```

### 3. Custom Styling with Angular

Use component styles:

```typescript
@Component({
  selector: "date-editor",
  template: `<input type="date" [(ngModel)]="dateValue" #editorInput class="date-input" />`,
  styles: [`
    .date-input {
      width: 100%;
      height: 100%;
      padding: 8px;
      border: 2px solid #4CAF50;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .date-input:focus {
      outline: none;
      border-color: #45a049;
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
    }
  `],
  standalone: false,
})
```

### 4. Error Handling with Visual Feedback

Add validation messages:

```typescript
@Component({
  template: `
    <div class="editor-container">
      <input type="date" [(ngModel)]="dateValue" #editorInput (change)="onDateChange()" />
      @if (hasError) {
      <span class="error-message">Invalid date format</span>
      }
    </div>
  `,
})
export class DateEditorComponent extends HotCellEditorAdvancedComponent<string> {
  hasError = false;

  onDateChange(): void {
    try {
      const parsedDate = parse(this.dateValue, "yyyy-MM-dd", new Date());
      this.hasError = !isValid(parsedDate);

      if (!this.hasError) {
        const formattedDate = format(parsedDate, "MM/dd/yyyy");
        this.setValue(formattedDate);
      }
    } catch (error) {
      this.hasError = true;
    }
  }
}
```

### 5. Reactive Forms Integration

Use Angular's reactive forms:

```typescript
import { FormControl, ReactiveFormsModule } from "@angular/forms";

@Component({
  template: `<input type="date" [formControl]="dateControl" #editorInput />`,
  standalone: false,
})
// Note: Import ReactiveFormsModule in your NgModule
export class DateEditorComponent extends HotCellEditorAdvancedComponent<string> {
  dateControl = new FormControl("");

  override beforeOpen(_: any, { originalValue }: any) {
    if (originalValue) {
      const parsedDate = parse(originalValue, "MM/dd/yyyy", new Date());
      if (isValid(parsedDate)) {
        this.dateControl.setValue(format(parsedDate, "yyyy-MM-dd"));
      }
    }

    this.dateControl.valueChanges.subscribe((value) => {
      if (value) {
        const parsedDate = parse(value, "yyyy-MM-dd", new Date());
        if (isValid(parsedDate)) {
          this.setValue(format(parsedDate, "MM/dd/yyyy"));
        }
      }
    });
  }
}
```

### 6. Internationalization (i18n)

Use Angular's built-in i18n:

```typescript
import { DatePipe } from "@angular/common";

@Component({
  selector: "date-renderer",
  template: `<div>{{ value | date : getProps().renderFormat }}</div>`,
  standalone: false,
})
export class DateRendererComponent extends HotCellRendererAdvancedComponent<string, { renderFormat: string }> {}
// Note: DatePipe is available through CommonModule imported in your NgModule
```

---

**Congratulations!** You've created a production-ready date picker with full localization support and advanced configuration.
