---
type: tutorial
id: ibewekco
title: "Star Rating Editor"
metaTitle: "Star Rating Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using SVG stars for intuitive 1-5 star ratings directly in your data grid.
permalink: /recipes/stars-rating-angular
canonicalUrl: /recipes/stars-rating-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: a070f35k
  metaTitle: "Star Rating Editor - React Data Grid | Handsontable"
angular:
  id: 66fxpbip
  metaTitle: "Star Rating Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build an interactive SVG star rating cell in Angular using `HotCellEditorAdvancedComponent` and `HotCellRendererAdvancedComponent`, with hover preview and keyboard shortcuts.

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/cell-types/guide-rating-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-rating-angular/angular/example1.html)
@[code](@/content/recipes/cell-types/guide-rating-angular/angular/example1.css)

:::

:::

## Overview

This guide shows how to create an interactive star rating cell using inline SVG stars with Angular's custom cell components. Use it for product ratings, review scores, or any scenario where users need to provide a 1-5 star rating.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (pure HTML, SVG and JavaScript)

## What You'll Build

A cell that:

- Displays 5 SVG stars both when editing and viewing
- Shows filled stars (gold) and unfilled stars (gray)
- Uses Handsontable CSS tokens for theme-aware editor styling
- Supports mouse hover for preview
- Allows keyboard input (1-5 keys, arrow keys)
- Provides immediate visual feedback
- Highlights the current star (accent color) while editing
- Works without any external libraries

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotTableModule,
  KeyboardShortcutConfig,
  HotCellRendererAdvancedComponent,
} from "@handsontable/angular-wrapper";
```

**What we're importing:**

- [`HotCellRendererAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcellrendereradvancedcomponent) - Base class for custom renderers
- [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - Base class for custom editors with advanced features
- `HotTableModule` - Angular module providing the `<hot-table>` component (imported in `AppComponent`)
- `KeyboardShortcutConfig` - Type for keyboard shortcuts configuration
- `GridSettings` - Type for Handsontable configuration
- `DomSanitizer` - Required to render SVG via `[innerHTML]` (Angular strips SVG by default)
- Angular core modules for component creation

**What we're NOT importing:**

- No date libraries
- No UI component libraries
- No external emoji libraries

## Step 2: Create the Renderer Component

The renderer displays 5 SVG stars wrapped in a flex container using CSS classes for color control (same approach as the [Star Rating recipe](@/javascript/recipes/cell-types/rating/rating.md)).

```typescript
const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

@Component({
  selector: "star-renderer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rating-cell">
      @for (star of stars; track $index) {
        <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
      }
    </div>`,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);
}
```

**What's happening:**

- `extends HotCellRendererAdvancedComponent<number>` - Inherits base renderer functionality with typed value
- `value` property - Automatically provided by the base class (1-5 rating)
- `.rating-cell` - Flex container wrapping the stars (matches the editor layout)
- `.rating-star` - Base class for each star (gray via CSS token `--ht-background-secondary-color`)
- `.active` - Filled stars (gold `#facc15`)
- `[innerHTML]="starSvgMarkup"` - Inline SVG with `fill="currentColor"` so CSS controls the star color
- `inject(DomSanitizer).bypassSecurityTrustHtml(starSvg)` - Angular sanitizes `[innerHTML]` and strips SVG by default; marking the SVG as trusted allows it to render

**Why SVG instead of emoji?**

- Consistent rendering across all browsers and operating systems
- Full control over color, size, and styling via CSS
- Theme-aware when using Handsontable CSS tokens

## Step 3: Add CSS Styling

Create a separate CSS file for the rating styles. This uses Handsontable CSS custom properties (tokens) so the editor automatically adapts to custom themes and dark mode.

```css
.rating-cell {
  display: flex;
  align-items: center;
  margin: 3px 0 0 -1px;
}

.rating-star {
  color: var(--ht-background-secondary-color, #e0e0e0);
  cursor: default;
  display: inline-flex;
  align-items: center;
}

.rating-star.active {
  color: #facc15;
}

.rating-editor {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
}

.rating-editor .rating-star {
  cursor: pointer;
}

.rating-editor .rating-star.current {
  color: var(--ht-accent-color, #1a42e8);
}
```

**Handsontable tokens used:**

- `--ht-background-secondary-color` - Inactive star color (adapts to theme)
- `--ht-accent-color` - Current star highlight in editor
- `--ht-cell-editor-border-color` / `--ht-cell-editor-border-width` - Editor border
- `--ht-cell-editor-background-color` - Editor background
- `--ht-cell-vertical-padding` / `--ht-cell-horizontal-padding` - Cell padding

## Step 4: Column Configuration (Optional Validator)

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

## Step 5: Create the Editor Component

The editor component extends [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) and provides interactive star selection using the same SVG and CSS classes as the renderer.

```typescript
@Component({
  standalone: true,
  imports: [],
  template: `
    <div
      class="rating-editor"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
        <span
          [attr.data-value]="$index + 1"
          class="rating-star"
          [class.active]="$index < getValue()"
          [class.current]="isCurrentStar($index)"
          [innerHTML]="starSvgMarkup"
        ></span>
      }
    </div>
  `,
  styleUrls: ["./example1.css"],
})
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  isCurrentStar(index: number): boolean {
    return (index + 1) === parseInt(this.getValue()?.toString() ?? "0", 10);
  }
  // ... event handlers and shortcuts
}
```

**What's happening:**

- **Container** - `class="rating-editor"` uses the same theme-aware styling as the [Star Rating recipe](@/javascript/recipes/cell-types/rating/rating.md) (blue border, padding, background via CSS tokens)
- **Stars** - Same SVG as the renderer (via sanitized `starSvgMarkup`); `.active` for filled (gold), `.current` for the selected star (accent color)
- **isCurrentStar(index)** - Template expressions can't call global `parseInt`, so a component method compares the current value with the star index
- **getValue()** - Method from base class returns current editor value
- **Event bindings** - `(mouseover)` for hover preview, `(mousedown)` for selection

## Step 6: Editor - Mouse Event Handlers

Add mouse interaction for hover preview and click selection. Use `closest('.rating-star')` so that when the user hovers over the SVG (or its `<path>`), the handler finds the parent span with `data-value`.

```typescript
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = starSvg;

  private readonly cdr = inject(ChangeDetectorRef);

  onMouseOver(event: MouseEvent): void {
    const star = (event.target as HTMLElement).closest(".rating-star") as HTMLElement | null;
    if (
      star?.dataset["value"] &&
      parseInt(this.getValue()?.toString() ?? "0", 10) !== parseInt(star.dataset["value"], 10)
    ) {
      this.setValue(parseInt(star.dataset["value"], 10));
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

1. Get the hovered element; with inline SVG, the target may be the `<svg>` or `<path>`, not the span
2. Use `closest('.rating-star')` to find the parent span with `data-value`
3. If the hovered star's value differs from the current value, update it with `setValue()`
4. Call `cdr.detectChanges()` so the view updates immediately

### onMouseDown (Click Selection):

1. User clicks anywhere in the editor
2. Emit `finishEdit` to close the editor and save the value

**Why `closest()`?**

- With inline SVGs, the event target is often the inner `<path>` or `<svg>` element
- `closest('.rating-star')` walks up the DOM to the span that has `data-value`
- Ensures hover and click work regardless of which part of the star is under the cursor

## Step 7: Editor - Keyboard Shortcuts

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

## Step 8: Complete Column Configuration

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

## Step 9: Create the Angular Component

Put it all together in your Angular component:

```typescript
@Component({
  selector: "app-root",
  standalone: true,
  imports: [HotTableModule],
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

## Step 10: Configure app.config.ts

Configure Handsontable globally in `app.config.ts`. With standalone components, no `@NgModule` is needed.

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";

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

**Important steps:**

1. **HotTableModule in AppComponent** - Add to `imports: [HotTableModule]` in the main component's `@Component` decorator
2. **Standalone sub-components** - `StarRendererComponent` and `StarEditorComponent` use `standalone: true, imports: []`
3. **Register Handsontable modules** - Call `registerAllModules()` once in `app.config.ts`
4. **Configure global settings** - Use `HOT_GLOBAL_CONFIG` provider for theme and license

## Enhancements

### 1. Show Numeric Value

Display the numeric rating alongside stars:

```typescript
@Component({
  selector: "star-renderer-with-number",
  template: `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div class="rating-cell">
        @for (star of stars; track $index) {
          <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
        }
      </div>
      <span style="color: #666; font-size: 14px;">({{ value }}/5)</span>
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererWithNumberComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);
}
```

### 2. Color-Coded Stars

Change star color based on rating value:

```typescript
@Component({
  selector: "star-renderer-colored",
  template: `
    <div class="rating-cell">
      @for (star of stars; track $index) {
        <span
          class="rating-star"
          [class.active]="$index < value"
          [style.color]="$index < value ? getColor() : undefined"
          [innerHTML]="starSvgMarkup"
        ></span>
      }
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererColoredComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  getColor(): string {
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
    <div class="rating-cell">
      @for (star of stars; track $index) {
      <span>
        @if ($index < fullStars) {
        <span class="rating-star active" [innerHTML]="starSvgMarkup"></span>
        } @if ($index === fullStars && hasHalf) {
        <span class="rating-star" style="opacity: 0.7" [innerHTML]="starSvgMarkup"></span>
        } @if ($index >= fullStars && !($index === fullStars && hasHalf)) {
        <span class="rating-star" [innerHTML]="starSvgMarkup"></span>
        }
      </span>
      }
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererHalfComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

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
    <div class="rating-cell">
      @for (star of getStarsArray(); track $index) {
      <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
      }
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererCustomComponent extends HotCellRendererAdvancedComponent<number, { maxStars?: number }> {
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  getStarsArray(): unknown[] {
    const maxStars = this.getProps().maxStars ?? 5;
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
      <div class="rating-cell">
        @for (star of stars; track $index) {
          <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
        }
      </div>
      <div style="font-size: 12px; color: #666;">
        {{ getLabel() }}
      </div>
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarRendererLabelsComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);
  readonly labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  getLabel(): string {
    return this.labels[this.value] ?? "";
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
      class="rating-editor"
      role="radiogroup"
      aria-label="Star rating from 1 to 5"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
      <span
        [attr.data-value]="$index + 1"
        class="rating-star"
        [class.active]="$index < getValue()"
        [class.current]="isCurrentStar($index)"
        [innerHTML]="starSvgMarkup"
        role="radio"
        [attr.aria-checked]="$index < getValue()"
        [attr.aria-label]="$index + 1 + ' star' + ($index > 0 ? 's' : '')"
        tabindex="0"
      ></span>
      }
    </div>
  `,
  styleUrls: ["./example1.css"],
  standalone: true,
  imports: [],
})
export class StarEditorAccessibleComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  isCurrentStar(index: number): boolean {
    return (index + 1) === parseInt(this.getValue()?.toString() ?? "0", 10);
  }

  private readonly cdr = inject(ChangeDetectorRef);

  // ... rest of implementation (onMouseOver with closest('.rating-star'), onMouseDown)
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

- `role="radiogroup"`: Identifies the star group
- `role="radio"`: Identifies each star as a radio option
- `aria-label`: Describes each star (e.g., "1 star", "2 stars")
- `aria-checked`: Indicates selected stars
- `tabindex`: Controls keyboard focus order

---


## What you learned

You built an SVG star rating cell in Angular using `HotCellEditorAdvancedComponent` and `HotCellRendererAdvancedComponent`. You used `DomSanitizer` to render inline SVG safely, `closest()` for reliable star hover detection, and `KeyboardShortcutConfig` for number-key and arrow-key selection.

## Next steps

- [Star Rating (JavaScript)](@/javascript/recipes/cell-types/rating/rating.md) - The same concept using `editorFactory` and `rendererFactory`.
- [Star Rating (React)](@/react/recipes/cell-types/react-rating/react-rating.md) - The React version using `EditorComponent` and `react-star-rating-component`.
- [Feedback Editor (Angular)](@/angular/recipes/cell-types/guide-feedback-angular/guide-feedback.md) - Another Angular editor using `HotCellEditorAdvancedComponent`.
