---
id: 7wh7yk48
title: Color picker
metaTitle: Color Picker Cell - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom color picker cell using the Coloris library, supporting live preview, validation, and custom themes.
permalink: /recipes/color-picker-angular
canonicalUrl: /recipes/color-picker-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: g7xbdr4b
  metaTitle: Color Picker Cell - React Data Grid | Handsontable
angular:
  id: tgb1xbxy
  metaTitle: Color Picker Cell - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cells
---

# Color Picker Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom color picker cell in Angular using the native HTML5 color input. Users can click a cell to open a color picker, select a color, and see it rendered with a colored background.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (uses native HTML5 color input)

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cells/guide-color-picker-angular/angular/example1.ts)
@[code](@/content/recipes/cells/guide-color-picker-angular/angular/example1.html)

:::

:::

## What You'll Build

A cell that:

- Displays the color value as text with a colored background
- Opens a native HTML5 color picker when edited
- Validates hex color format
- Saves the value when color is selected

## Prerequisites

No external libraries required. This example uses:

- `@handsontable/angular-wrapper`
- Native HTML5 `<input type="color">`

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";
import { registerAllModules } from "handsontable/registry";

// Register Handsontable's modules
registerAllModules();
```

**Why this matters:**

- `HotCellRendererAdvancedComponent` - base class for custom renderers
- `HotCellEditorAdvancedComponent` - base class for custom editors
- `GridSettings` - TypeScript interface for Handsontable configuration
- `registerAllModules()` - registers all Handsontable features

## Step 2: Create the Renderer Component

The renderer component controls how the cell looks when not being edited.

```typescript
@Component({
  selector: "app-color-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="height: 100%; width: 100%;" [style.background]="value">
    <b>{{ value }}</b>
  </div>`,
  styles: `
  :host{
    height: 100%;
    width: 100%;
  }
  `,
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}
```

**What's happening:**

- Extends `HotCellRendererAdvancedComponent<string>` - provides `@Input() value` automatically
- `value` is the cell's current value (e.g., "#ff0000")
- Template uses Angular binding `[style.background]="value"` to set background color
- <code v-pre>{{ value }}</code> displays the hex code in bold text
- `ChangeDetectionStrategy.OnPush` optimizes performance
- `:host` styles ensure the component fills the cell

**Customization ideas:**

- Add a color swatch with additional HTML elements
- Handle empty values: <code v-pre>{{ value || 'No color' }}</code>
- Use `[style.color]` for contrast-aware text color
- Add tooltips or icons

## Step 3: Create the Editor Component

The editor component handles user input when the cell is being edited.

```typescript
@Component({
  selector: "app-color-picker-editor",
  template: `
    <input style="width: 100%; height: 100%;" type="color" [value]="value" (input)="onColorChange($event)" />
  `,
  standalone: false,
})
export class ColorPickerEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override afterClose(): void {
    this.finishEdit.emit();
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setValue(input.value);
  }
}
```

**What's happening:**

- Extends `HotCellEditorAdvancedComponent<string>` - provides editor lifecycle
- `<input type="color">` is the native HTML5 color picker
- `[value]="value"` binds the current cell value to the input
- `(input)="onColorChange($event)"` updates value on every change
- `setValue(input.value)` stores the new color value
- `afterClose()` lifecycle hook calls `finishEdit.emit()` to save the value

**Key points:**

- The native color picker automatically validates and formats colors as hex
- `afterClose()` is called when the editor is closed (e.g., clicking outside)
- `finishEdit.emit()` tells Handsontable to save the value
- No need for manual DOM manipulation - Angular handles it

**Lifecycle flow:**

1. User opens editor (double-click or F2)
2. Input shows current color value
3. User selects a color
4. `onColorChange()` updates the value
5. User clicks outside or presses Enter
6. `afterClose()` is called
7. `finishEdit.emit()` saves the value

## Step 4: Add Validator (Optional)

The validator ensures only valid hex colors are saved to the cell.

```typescript
const colorValidator = (value: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
};
```

**What's happening:**

- Simple function returning `boolean` - this is Angular's `CustomValidatorFn<string>` type
- Uses regex to validate hex color format: `#` followed by 6 hex characters
- Returns `true` for valid colors like "#FF0000", "#00ff00"
- Returns `false` for invalid formats

**Why add validation:**

- Prevents manual input of invalid colors (if using text input)
- Ensures data consistency
- Native color picker already outputs valid hex, but validation adds extra safety

**Alternative validators:**

```typescript
// Support short format (#fff)
const flexibleValidator = (value: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
};
```

## Step 5: Register Components in Module

Register the custom components in your Angular module.

```typescript
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
import { ColorPickerEditorComponent, ColorRendererComponent } from "./app.component";

// Register Handsontable's modules
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
  declarations: [AppComponent, ColorPickerEditorComponent, ColorRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**What's happening:**

- Import `HotTableModule` for Handsontable Angular integration
- Declare custom components in `declarations` array
- Configure global Handsontable settings via `HOT_GLOBAL_CONFIG`
- Set theme and license key

**Key points:**

- Custom editor and renderer must be declared in the same module
- `HotTableModule` provides the `<hot-table>` component
- Global config applies to all Handsontable instances in the app

## Step 6: Configure Handsontable

Use the custom components in your Handsontable column configuration.

```typescript
@Component({
  selector: "app-root",
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    color: `#${Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase()}`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ["ID", "Item Name", "Item color"],
    columns: [
      { data: "id", type: "numeric" },
      {
        data: "itemName",
        type: "text",
      },
      {
        data: "color",
        width: 150,
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
        validator: colorValidator, // Optional
      },
    ],
  };
}
```

**What's happening:**

- `[data]="data"` - binds data array to Handsontable
- `[settings]="gridSettings"` - passes configuration object
- `editor: ColorPickerEditorComponent` - uses custom editor class
- `renderer: ColorRendererComponent` - uses custom renderer class
- `validator: colorValidator` - optional validation function

**Key configuration:**

- Pass component classes directly (not instances)
- Angular wrapper handles component creation automatically
- Validator is optional but recommended for data integrity
- `width: 150` gives enough space for color display

## Step 7: Complete Example

Here's the full implementation with all components:

**app.component.ts:**

```typescript
import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";

export const inputData = [
  { id: 640329, itemName: "Lunar Core" },
  { id: 863104, itemName: "Zero Thrusters" },
  { id: 395603, itemName: "EVA Suits" },
];

const colorValidator = (value: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
};

@Component({
  selector: "app-color-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="height: 100%; width: 100%;" [style.background]="value">
    <b>{{ value }}</b>
  </div>`,
  styles: `:host { height: 100%; width: 100%; }`,
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}

@Component({
  selector: "app-color-picker-editor",
  template: `
    <input style="width: 100%; height: 100%;" type="color" [value]="value" (input)="onColorChange($event)" />
  `,
  standalone: false,
})
export class ColorPickerEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override afterClose(): void {
    this.finishEdit.emit();
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setValue(input.value);
  }
}

@Component({
  selector: "app-root",
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    color: `#${Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase()}`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    height: "auto",
    colHeaders: ["ID", "Item Name", "Item color"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "color",
        width: 150,
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
        validator: colorValidator,
      },
    ],
  };
}
```

**app.module.ts:**

```typescript
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
import { AppComponent, ColorPickerEditorComponent, ColorRendererComponent } from "./app.component";

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
  imports: [BrowserModule, HotTableModule],
  declarations: [AppComponent, ColorPickerEditorComponent, ColorRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## How It Works - Complete Flow

1. **Initial Render**: Renderer component displays hex color code with colored background
2. **User Double-Clicks or F2**: Editor component opens
3. **Color Picker Displays**: Native HTML5 color input shows with current value
4. **User Selects Color**: `(input)` event fires, `onColorChange()` updates value via `setValue()`
5. **User Clicks Outside or Presses Enter**: `afterClose()` is called
6. **Save Triggered**: `finishEdit.emit()` tells Handsontable to save the value
7. **Validation**: `colorValidator` checks hex format (# followed by 6 hex characters)
8. **Render Update**: If valid, value is saved and renderer displays new color

## Enhancements

### 1. Add Default Colors

Provide preset color options using a custom dropdown:

```typescript
@Component({
  selector: "app-color-picker-editor-enhanced",
  template: `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <input style="width: 100%; flex: 1;" type="color" [value]="value" (input)="onColorChange($event)" />
      <div style="display: flex; gap: 2px; padding: 2px;">
        <button
          *ngFor="let preset of presetColors"
          [style.background]="preset"
          style="width: 20px; height: 20px; border: 1px solid #ccc; cursor: pointer;"
          (click)="selectPreset(preset)"
        ></button>
      </div>
    </div>
  `,
  standalone: false,
})
export class ColorPickerEditorEnhancedComponent extends HotCellEditorAdvancedComponent<string> {
  presetColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

  override afterClose(): void {
    this.finishEdit.emit();
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setValue(input.value);
  }

  selectPreset(color: string): void {
    this.setValue(color);
  }
}
```

### 2. Custom Styling for Invalid Values

Highlight invalid colors in the renderer:

```typescript
@Component({
  selector: "app-color-renderer-validated",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;"
      [style.background]="isValid ? value : '#f0f0f0'"
      [style.color]="isValid ? '#000' : '#ff0000'"
    >
      <b>{{ isValid ? value : "Invalid Color" }}</b>
    </div>
  `,
  styles: `:host { height: 100%; width: 100%; }`,
})
export class ColorRendererValidatedComponent extends HotCellRendererAdvancedComponent<string> {
  get isValid(): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(this.value);
  }
}
```

### 3. Add Color Name Tooltip

Display color name on hover:

```typescript
@Component({
  selector: "app-color-renderer-tooltip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="height: 100%; width: 100%;" [style.background]="value" [title]="getColorName()">
      <b>{{ value }}</b>
    </div>
  `,
  styles: `:host { height: 100%; width: 100%; }`,
})
export class ColorRendererTooltipComponent extends HotCellRendererAdvancedComponent<string> {
  getColorName(): string {
    const colorNames: Record<string, string> = {
      "#FF0000": "Red",
      "#00FF00": "Green",
      "#0000FF": "Blue",
      // Add more colors...
    };
    return colorNames[this.value.toUpperCase()] || this.value;
  }
}
```

### 4. Support RGB Format

Extend validator to support RGB colors:

```typescript
const flexibleColorValidator = (value: string): boolean => {
  // Support both hex and rgb formats
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const rgbRegex = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;

  return hexRegex.test(value) || rgbRegex.test(value);
};

// Update column config
{
  data: "color",
  editor: ColorPickerEditorComponent,
  renderer: ColorRendererComponent,
  validator: flexibleColorValidator,
}
```

Note: Native `<input type="color">` always outputs hex format, so you'd need a custom text input editor to allow RGB input.

### 5. Add Renderer Props

Pass configuration to renderer via `rendererProps`:

```typescript
@Component({
  selector: "app-color-renderer-configurable",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      style="height: 100%; width: 100%;"
      [style.background]="value"
      [style.border]="props.showBorder ? '2px solid #333' : 'none'">
      <b *ngIf="props.showLabel">{{ value }}</b>
    </div>
  `,
  styles: `:host { height: 100%; width: 100%; }`,
})
export class ColorRendererConfigurableComponent extends HotCellRendererAdvancedComponent<string, { showLabel: boolean; showBorder: boolean }> {
  get props() {
    return this.getProps();
  }
}

// In column config:
{
  data: "color",
  editor: ColorPickerEditorComponent,
  renderer: ColorRendererConfigurableComponent,
  rendererProps: {
    showLabel: true,
    showBorder: false,
  },
}
```

---

**Congratulations!** You've created a fully functional color picker cell in Angular using native HTML5 color input, providing an intuitive color selection experience in your data grid!
