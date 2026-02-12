---
id: ibewekco
title: "Recipe: Star Rating Editor"
metaTitle: "Recipe: Star Rating Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using star emojis for intuitive 1-5 star ratings directly in your data grid.
permalink: /recipes/stars-rating-angular
canonicalUrl: /recipes/stars-rating-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: a070f35k
  metaTitle: "Recipe: Star Rating Editor - React Data Grid | Handsontable"
angular:
  id: 66fxpbip
  metaTitle: "Recipe: Star Rating Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Star Rating Editor Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create an interactive star rating cell using emoji stars. Perfect for product ratings, review scores, or any scenario where users need to provide a 1-5 star rating.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None

## What You'll Build

A cell that:

- Displays 5 stars both when editing and viewing
- Shows filled stars (opacity 1.0) and unfilled stars (opacity 0.4)
- Supports mouse hover for preview
- Allows keyboard input (1-5 keys, arrow keys)
- Provides immediate visual feedback
- Works without any external libraries

## Complete Example

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/cell-types/guide-rating-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-rating-angular/angular/example1.html)

:::

:::

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from "@angular/core";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  KeyboardShortcutConfig,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";
import { registerAllModules } from "handsontable/registry";

registerAllModules();
```

**What we're importing:**

- [`HotCellRendererAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcellrendereradvancedcomponent) - Base class for custom renderers
- [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - Base class for custom editors with advanced features
- `KeyboardShortcutConfig` - Type for keyboard shortcuts configuration
- `GridSettings` - Type for Handsontable configuration
- Angular core modules for component creation

**What we're NOT importing:**

- No date libraries
- No UI component libraries
- No external emoji libraries

## Step 2: Create the Renderer Component

The renderer displays 5 stars with filled stars (opacity 1.0) and unfilled stars (opacity 0.4).

```typescript
@Component({
  selector: "star-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div>
    @for (star of stars; track $index) {
    <span [attr.data-value]="$index + 1" [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
    }
  </div>`,
  standalone: false,
})
export class StarRendererComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
}
```

**What's happening:**

### Key concepts:

- `extends HotCellRendererAdvancedComponent<number>` - Inherits base renderer functionality with typed value
- `value` property - Automatically provided by the base class (1-5 rating)
- `[style.opacity]` - Angular property binding for dynamic styles
- `$index < value ? '1' : '0.4'` - Stars up to the rating are filled (opacity 1.0), rest are unfilled (0.4)

**Template structure:**

- `stars = Array(5)` - Creates an array with 5 elements for iteration
- `[attr.data-value]` - Sets HTML data attribute for potential interactions

**Visual example:**

- Rating 3: ⭐⭐⭐<span style="opacity:0.4">⭐⭐</span> (first 3 stars full opacity, last 2 faded)
- Rating 5: ⭐⭐⭐⭐⭐ (all 5 stars full opacity)
- Rating 1: ⭐<span style="opacity:0.4">⭐⭐⭐⭐</span> (first star full, rest faded)

**Why opacity instead of showing/hiding?**

- Creates smooth visual feedback
- All stars always visible (easier to understand scale)
- Intuitive "filled vs unfilled" appearance

**Change Detection:**

- `ChangeDetectionStrategy.OnPush` - Optimizes performance by only checking when inputs change

## Step 3: Column Configuration (Optional Validator)

In Angular, validators are typically configured at the column level in `GridSettings`. Here's how to ensure values are within the 1-5 star range:

```typescript
columns: [
  {
    data: "stars",
    width: 200,
    renderer: StarRendererComponent,
    editor: StarEditorComponent,
    // Optional: Add validator to ensure valid range
    validator: (value: number) => {
      const rating = parseInt(value?.toString() || "0");
      return rating >= 1 && rating <= 5;
    },
  },
];
```

**What's happening:**

- Angular validator uses `CustomValidatorFn<T>` - returns boolean directly
- Convert value to integer (keyboard input may be strings)
- Check if between 1 and 5 (star rating range)
- Returns `true` for valid, `false` for invalid
- Validator runs before saving to data model

**When to use:**

- Validating user input from keyboard shortcuts
- Ensuring data integrity
- Providing visual feedback for invalid values

## Step 4: Create the Editor Component

The editor component extends [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) and provides interactive star selection.

```typescript
@Component({
  standalone: false,
  template: `
    <div
      style="background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
      <span [attr.data-value]="$index + 1" [style.opacity]="$index < getValue() ? '1' : '0.4'">⭐</span>
      }
    </div>
  `,
})
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

  private readonly cdr = inject(ChangeDetectorRef);
}
```

**What's happening:**

### Template Structure:

1. **Container div** - Styled with background, padding, border, and cursor pointer
2. **Event bindings** - `(mouseover)` for hover preview, `(mousedown)` for selection
3. **getValue()** - Method from base class returns current editor value

### Key styling:

- `background: #eee` - Light gray background
- `padding: 5px 8px` - Internal spacing
- `border: 1px solid blue` - Visual border
- `cursor: pointer` - Indicates interactivity
- `border-radius: 4px` - Rounded corners
- `font-size: 16px` - Star emoji size

### Base Class Features:

- `extends HotCellEditorAdvancedComponent<number>` - Provides editor lifecycle and methods
- `value` property - Stores current rating (managed by base class)
- `getValue()` / `setValue()` - Methods to get/set current value
- `finishEdit` / `cancelEdit` - EventEmitters to control editing

## Step 5: Editor - Mouse Event Handlers

Add mouse interaction for hover preview and click selection.

```typescript
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

  private readonly cdr = inject(ChangeDetectorRef);

  onMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLSpanElement &&
      target.dataset["value"] &&
      parseInt(this.getValue().toString()) !== parseInt(target.dataset["value"])
    ) {
      this.setValue(parseInt(target.dataset["value"]));
    }
    this.cdr.detectChanges();
  }

  onMouseDown(): void {
    this.finishEdit.emit();
  }
}
```

**What's happening:**

### onMouseOver (Hover Preview):

1. Get the hovered element from event
2. Check if it's a star span with `data-value` attribute
3. Parse the rating value from the data attribute
4. If different from current value, update it with `setValue()`
5. Trigger change detection to update the view
6. Creates a "preview" effect as user hovers

### onMouseDown (Click Selection):

1. User clicks anywhere in the editor
2. Emit `finishEdit` event to close editor
3. Current value is saved to the cell

**Why mousedown instead of click?**

- `mousedown` fires earlier than `click`
- Feels more responsive
- User sees immediate feedback

**Change Detection:**

- `cdr.detectChanges()` - Manually triggers Angular's change detection
- Necessary because event is triggered outside Angular's zone
- Ensures stars update immediately on hover

## Step 6: Editor - Keyboard Shortcuts

Add keyboard support for rating selection using the `shortcuts` property from the base class.

```typescript
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [["1"], ["2"], ["3"], ["4"], ["5"]],
      callback: (editor, _event) => {
        editor.setValue(_event.key);
      },
    },
    {
      keys: [["ArrowRight"]],
      callback: (editor, _event) => {
        if (parseInt(editor.value) < 5) {
          editor.setValue(parseInt(editor.value) + 1);
        }
      },
    },
    {
      keys: [["ArrowLeft"]],
      callback: (editor, _event) => {
        if (parseInt(editor.value) > 1) {
          editor.setValue(parseInt(editor.value) - 1);
        }
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);
  // ... rest of the component
}
```

**What's happening:**

### Shortcuts Property:

- `override shortcuts` - Overrides the base class property to define custom keyboard shortcuts
- `KeyboardShortcutConfig[]` - Type-safe configuration for keyboard shortcuts
- Handsontable automatically registers and handles these shortcuts

### Number Keys (1-5):

- Press 1-5 to set rating directly
- Fastest way to select a specific rating
- Gets key value from keyboard event: `_event.key`
- `editor.setValue(_event.key)` - Updates the value immediately

### Arrow Keys:

- **ArrowRight**: Increase rating (max 5)
  - Check current value: `parseInt(editor.value) < 5`
  - Increment: `editor.setValue(parseInt(editor.value) + 1)`
- **ArrowLeft**: Decrease rating (min 1)
  - Check current value: `parseInt(editor.value) > 1`
  - Decrement: `editor.setValue(parseInt(editor.value) - 1)`
- Bounded within valid range
- Smooth incremental adjustment

**Keyboard navigation benefits:**

- Fast selection without mouse
- Accessible for keyboard-only users
- Number keys for direct selection, arrows for adjustment
- All shortcuts handled by Handsontable's shortcut manager

## Step 7: Complete Column Configuration

Now combine the renderer and editor components in your column configuration:

```typescript
export class AppComponent {
  readonly data = [
    { id: 640329, itemName: "Lunar Core", stars: 4 },
    { id: 863104, itemName: "Zero Thrusters", stars: 5 },
    { id: 395603, itemName: "EVA Suits", stars: 3 },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    height: "auto",
    colHeaders: ["ID", "Item Name", "Stars Rating"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "stars",
        width: 200,
        renderer: StarRendererComponent,
        editor: StarEditorComponent,
      },
    ],
  };
}
```

**What's happening:**

- **data**: Array of objects with star ratings (1-5)
- **gridSettings**: Typed with `GridSettings` for IntelliSense
- **columns configuration**:
  - `renderer: StarRendererComponent` - Angular component for display
  - `editor: StarEditorComponent` - Angular component for editing
  - `width: 200` - Column width for comfortable star display

**How it works:**

1. Handsontable detects that renderer/editor are Angular components
2. Creates component instances dynamically
3. Passes cell data to components via `@Input` properties
4. Listens to component `@Output` events for editor lifecycle

## Step 8: Create the Angular Component

Put it all together in your Angular component:

```typescript
@Component({
  selector: "app-star-rating",
  standalone: false,
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data = [
    { id: 640329, itemName: "Lunar Core", stars: 4 },
    { id: 863104, itemName: "Zero Thrusters", stars: 5 },
    { id: 395603, itemName: "EVA Suits", stars: 3 },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    height: "auto",
    colHeaders: ["ID", "Item Name", "Stars Rating"],
    columns: [
      { data: "id", type: "numeric" },
      { data: "itemName", type: "text" },
      {
        data: "stars",
        width: 200,
        renderer: StarRendererComponent,
        editor: StarEditorComponent,
      },
    ],
  };
}
```

## Step 9: Register in Angular Module

Declare all components in your Angular module:

```typescript
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
import { AppComponent, StarEditorComponent, StarRendererComponent } from "./app.component";

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
  declarations: [AppComponent, StarEditorComponent, StarRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**Important steps:**

1. **Import HotTableModule** - Provides `<hot-table>` directive
2. **Declare all components** - Main component, renderer, and editor
3. **Register Handsontable modules** - Call `registerAllModules()` before module creation
4. **Configure global settings** - Use `HOT_GLOBAL_CONFIG` provider for theme and license

## Enhancements

### 1. Show Numeric Value

Display the numeric rating alongside stars:

```typescript
@Component({
  selector: "star-renderer-with-number",
  template: `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div>
        @for (star of stars; track $index) {
        <span [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
        }
      </div>
      <span style="color: #666; font-size: 14px;">({{ value }}/5)</span>
    </div>
  `,
  standalone: false,
})
export class StarRendererWithNumberComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
}
```

### 2. Color-Coded Stars

Change star color based on rating value:

```typescript
@Component({
  selector: "star-renderer-colored",
  template: `
    <div>
      @for (star of stars; track $index) {
      <span [style.opacity]="$index < value ? '1' : '0.4'" [style.color]="getColor()">⭐</span>
      }
    </div>
  `,
  standalone: false,
})
export class StarRendererColoredComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);

  get getColor(): string {
    if (this.value >= 4) return "#ffd700"; // Gold
    if (this.value === 3) return "#ffa500"; // Orange
    return "#ff6347"; // Red
  }
}
```

### 3. Half-Star Ratings

Support half-star ratings (0.5 increments):

```typescript
@Component({
  selector: "star-renderer-half",
  template: `
    <div>
      @for (star of stars; track $index) {
      <span>
        @if ($index < fullStars) {
        <span style="opacity: 1">⭐</span>
        } @if ($index === fullStars && hasHalf) {
        <span style="opacity: 0.7">⭐</span>
        } @if ($index >= fullStars && !($index === fullStars && hasHalf)) {
        <span style="opacity: 0.4">⭐</span>
        }
      </span>
      }
    </div>
  `,
  standalone: false,
})
export class StarRendererHalfComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);

  get fullStars(): number {
    return Math.floor(this.value);
  }

  get hasHalf(): boolean {
    return this.value % 1 !== 0;
  }
}

// Update validator in column configuration
columns: [
  {
    data: "stars",
    renderer: StarRendererHalfComponent,
    validator: (value: number) => {
      const rating = parseFloat(value?.toString() || "0");
      return rating >= 0.5 && rating <= 5 && rating % 0.5 === 0;
    },
  },
];
```

### 4. Custom Star Count

Configurable number of stars per column using `rendererProps`:

```typescript
@Component({
  selector: "star-renderer-custom",
  template: `
    <div>
      @for (star of getStarsArray(); track $index) {
      <span [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
      }
    </div>
  `,
  standalone: false,
})
export class StarRendererCustomComponent extends HotCellRendererAdvancedComponent<number, { maxStars?: number }> {
  getStarsArray(): any[] {
    const maxStars = this.getProps().maxStars || 5;
    return Array(maxStars);
  }
}

// Usage in column configuration
columns: [
  {
    data: "stars",
    renderer: StarRendererCustomComponent,
    // Pass custom properties via cellProperties
    rendererProps: { maxStars: 10 },
  },
];
```

### 5. Text Labels

Add text labels like "Excellent", "Good", etc.:

```typescript
@Component({
  selector: "star-renderer-labels",
  template: `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <div>
        @for (star of stars; track $index) {
        <span [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
        }
      </div>
      <div style="font-size: 12px; color: #666;">
        {{ getLabel() }}
      </div>
    </div>
  `,
  standalone: false,
})
export class StarRendererLabelsComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  get getLabel(): string {
    return this.labels[this.value] || "";
  }
}
```

## Accessibility

Add ARIA attributes for screen readers:

```typescript
@Component({
  selector: "star-editor-accessible",
  template: `
    <div
      role="radiogroup"
      aria-label="Star rating from 1 to 5"
      style="background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
      <span
        [attr.data-value]="$index + 1"
        [style.opacity]="$index < getValue() ? '1' : '0.4'"
        role="radio"
        [attr.aria-checked]="$index < getValue()"
        [attr.aria-label]="$index + 1 + ' star' + ($index > 0 ? 's' : '')"
        tabindex="0"
        >⭐</span
      >
      }
    </div>
  `,
  standalone: false,
})
export class StarEditorAccessibleComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

  private readonly cdr = inject(ChangeDetectorRef);

  // ... rest of implementation
}
```

**Keyboard navigation:**

- **Number keys (1-5)**: Direct rating selection
- **Arrow Right**: Increase rating (max 5)
- **Arrow Left**: Decrease rating (min 1)
- **Enter**: Confirm selection and finish editing
- **Escape**: Cancel editing
- **Tab**: Navigate to editor

**ARIA attributes:**

- `role="button"`: Identifies stars as interactive buttons
- `aria-label`: Describes each star (e.g., "1 star", "2 stars")
- `aria-pressed`: Indicates selected stars
- `tabindex`: Controls keyboard focus order

---

**Congratulations!** You've created an interactive star rating editor with hover preview and keyboard support using Angular components, perfect for intuitive 1-5 star ratings in your data grid!
