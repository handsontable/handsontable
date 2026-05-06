---
type: tutorial
id: 7wh7yk48
title: Color picker
metaTitle: Color Picker Cell - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom color picker cell in Angular using the native HTML5 color input, with live preview and hex validation.
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
category: Cell Types
---

This tutorial shows you how to build a color picker cell in Angular using the native HTML5 color input, with a custom renderer component and hex validation.

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cell-types/guide-color-picker-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-color-picker-angular/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom color picker cell in Angular using the native HTML5 color input. Users can click a cell to open a color picker, select a color, and see it rendered with a colored circle swatch. No external libraries are required.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (uses native HTML5 `<input type="color">`)

## What You'll Build

A cell that:

- Displays a colored circle swatch in the cell
- Opens a native HTML5 color picker when the cell is edited
- Validates hex color format
- Saves the value when a color is selected

## Prerequisites

No external libraries required. This example uses:

- `@handsontable/angular-wrapper`
- Native HTML5 `<input type="color">`

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from '@handsontable/angular-wrapper';
```

- Handsontable's modules are registered in `app.config.ts` (see Step 5) via `registerAllModules()`.

## Step 2: Create the Renderer Component

The renderer component controls how the cell looks when not being edited. It displays a colored circle swatch.

```typescript
@Component({
  selector: 'example1-color-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="color-picker-cell">
      <span class="color-picker-swatch" [style.background]="value"></span>
    </div>`,
  styles: `
  :host {
    height: 100%;
    width: 100%;
  }
  .color-picker-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .color-picker-swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
  .color-picker-editor {
    width: 100%;
    height: 100%;
    box-sizing: border-box !important;
    cursor: pointer;
    border: none;
    outline: none;
  }
  `,
  standalone: true,
  imports: [],
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}
```

- The template renders a circle swatch with the cell's color via `[style.background]="value"`.
- `.color-picker-cell` and `.color-picker-swatch` center and style the swatch; `.color-picker-editor` styles the editor input.
- `ChangeDetectionStrategy.OnPush` is used to optimize performance.

## Step 3: Create the Editor Component

The editor component uses the native HTML5 color input. When the user selects a color, the value is updated and `afterClose` calls `finishEdit.emit()` to save.

```typescript
@Component({
  selector: 'example1-color-picker-editor',
  template: `
    <input
      class="color-picker-editor"
      type="color"
      [value]="value"
      (input)="onColorChange($event)"
    />
  `,
  styleUrls: ['./example1.css'],
  standalone: true,
  imports: [],
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

- Extends [`HotCellEditorAdvancedComponent<string>`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - provides editor lifecycle
- `<input type="color">` is the native HTML5 color picker; no external library is required
- `[value]="value"` binds the current cell value; `(input)="onColorChange($event)"` updates the value on change
- `afterClose()` calls `finishEdit.emit()` so the value is saved when the editor closes

**Lifecycle flow:**

1. User opens editor (double-click or F2)
2. Input shows the current color
3. User selects a color → `onColorChange()` calls `setValue(input.value)`
4. User closes the editor (e.g. click outside) → `afterClose()` runs → `finishEdit.emit()` saves the value

## Step 4: Add Validator

The validator ensures only valid hex colors are saved to the cell.

```typescript
const colorValidator = (value: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
};
```

**What's happening:**

- Returns `boolean` - this is Angular's `CustomValidatorFn<string>` type
- Uses regex to validate hex color format: `#` followed by 6 hex characters
- Returns `true` for valid colors like "#FF0000", "#00ff00"
- Returns `false` for invalid formats

**Why add validation:**

- Ensures data consistency
- Native color picker already outputs valid hex, but validation adds extra safety

**Alternative validators:**

```typescript
// Support short format (#fff)
const flexibleValidator = (value: string): boolean =>
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
```

## Step 5: Configure app.config.ts

Configure Handsontable globally in `app.config.ts`. With standalone components, no `@NgModule` is needed.

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// Register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};
```

**What's happening:**

- Call `registerAllModules()` to enable all Handsontable features
- Configure global Handsontable settings via `HOT_GLOBAL_CONFIG`
- Set license (e.g. `NON_COMMERCIAL_LICENSE`)
- `provideZoneChangeDetection` improves Angular change detection performance

**Key points:**

- Each standalone component declares its own `imports` array -- no shared `declarations`
- `HotTableModule` is imported directly in the component that uses `<hot-table>`
- Global config applies to all Handsontable instances in the app

## Step 6: Configure Handsontable

Use the custom components in your Handsontable column configuration. The example adds a `color` property to each row (e.g. from `inputData`) and passes it to the grid.

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    color: `#${
      Math.round(0x1000000 + 0xffffff * Math.random())
        .toString(16)
        .slice(1)
        .toUpperCase()
    }`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    width: '100%',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock'],
    columns: [
      {
        data: 'id',
        type: 'numeric',
        width: 80,
        headerClassName: 'htLeft',
      },
      {
        data: 'itemName',
        type: 'text',
        width: 200,
        headerClassName: 'htLeft',
      },
      {
        data: 'color',
        headerClassName: 'htLeft',
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
        validator: colorValidator,
      },
      {
        data: 'itemNo',
        type: 'text',
        width: 100,
        headerClassName: 'htLeft',
      },
      {
        data: 'cost',
        type: 'numeric',
        width: 70,
        headerClassName: 'htLeft',
      },
      {
        data: 'valueStock',
        type: 'numeric',
        width: 130,
        headerClassName: 'htRight',
      },
    ],
  };
}
```

**What's happening:**

- `[data]="data"` - binds data array to Handsontable (with mapped `color` per row from `inputData`)
- `[settings]="gridSettings"` - passes configuration object
- `editor: ColorPickerEditorComponent` - uses custom editor class
- `renderer: ColorRendererComponent` - uses custom renderer class (circle swatch)
- `validator: colorValidator` - validates hex color format

**Key configuration:**

- Pass component classes directly (not instances)
- Angular wrapper handles component creation automatically
- Column widths and `headerClassName` align with the table layout

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
        @for (preset of presetColors; track preset) {
        <button
          [style.background]="preset"
          style="width: 20px; height: 20px; border: 1px solid #ccc; cursor: pointer;"
          (click)="selectPreset(preset)"
        ></button>
        }
      </div>
    </div>
  `,
  standalone: true,
  imports: [],
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
      @if (props.showLabel) {
        <b>{{ value }}</b>
      }
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

**Congratulations!** You've created a fully functional color picker cell in Angular using the native HTML5 color input, with a circle swatch renderer and hex validation. For a Pickr-based color picker (button + nano theme), see the [JavaScript Color Picker recipe](@/javascript/recipes/cell-types/color-picker/color-picker.md).

## What you learned

You built a custom color picker cell in Angular using `HotCellEditorAdvancedComponent` and `HotCellRendererAdvancedComponent`. You used the native HTML5 `<input type="color">` for the editor and displayed the selected color as a circle swatch in the renderer.

## Next steps

- [Color Picker (JavaScript)](@/javascript/recipes/cell-types/color-picker/color-picker.md) - The same concept using `editorFactory` and the Pickr library.
- [Colorful Picker (React)](@/react/recipes/cell-types/colorful-picker/colorful-picker.md) - The React version using `EditorComponent` and `react-colorful`.
- [Star Rating Editor (Angular)](@/angular/recipes/cell-types/guide-rating-angular/guide-rating.md) - Another Angular custom cell built with `HotCellEditorAdvancedComponent`.
