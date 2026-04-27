---
type: tutorial
id: 2rti5w12
title: "Feedback Editor"
metaTitle: "Feedback Editor - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using emoji buttons for quick feedback selection directly in your data grid.
permalink: /recipes/feedback-angular
canonicalUrl: /recipes/feedback-angular
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 64rvr6nb
  metaTitle: "Feedback Editor - React Data Grid | Handsontable"
angular:
  id: dg9oi3jt
  metaTitle: "Feedback Editor - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

This tutorial shows you how to build an emoji feedback cell in Angular using `HotCellEditorAdvancedComponent`, with Handsontable CSS tokens for theme-aware styling and keyboard navigation.

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/cell-types/guide-feedback-angular/angular/example1.ts)
@[code](@/content/recipes/cell-types/guide-feedback-angular/angular/example1.html)
@[code](@/content/recipes/cell-types/guide-feedback-angular/angular/example1.css)

:::

:::

## Overview

This guide shows how to create a simple feedback editor cell using emoji buttons with Angular's [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent). Perfect for quick feedback selection, status indicators, or any scenario where users need to choose from a small set of visual options.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None

## What You'll Build

A cell that:

- Displays emoji feedback buttons when editing
- Shows the selected emoji when viewing
- Uses Handsontable CSS tokens for theme-aware styling (same look as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md))
- Supports keyboard navigation (arrow keys and Tab)
- Provides click-to-select functionality
- Works with Angular's component-based architecture
- Supports per-column configuration

## Prerequisites

```bash
npm install @handsontable/angular-wrapper
```

**What you need:**

- Angular 16+ (decorators support)
- `@handsontable/angular-wrapper` package
- Basic Angular knowledge (components, decorators, change detection)

## Step 1: Import Dependencies

```typescript
import { Component, ChangeDetectorRef } from "@angular/core";
import { HotTableModule, HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from "@handsontable/angular-wrapper";
```

**What we're importing:**

- [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - Base class for creating custom editors
- `HotTableModule` - Angular module providing the `<hot-table>` component (imported in `AppComponent`)
- `ChangeDetectorRef` - For manual change detection
- `KeyboardShortcutConfig` - Type definitions for keyboard shortcuts

`registerAllModules()` is called once in `app.config.ts`, not in component files.

## Step 2: Create the Editor Component

Create an Angular component that extends [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent).

```typescript
@Component({
  standalone: true,
  imports: [],
  template: `
    <div class="feedback-editor">
      @for (option of config; track option) {
      <button [class.active]="option === getValue()" (click)="onClick(option)">
        {{ option }}
      </button>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷"];
  override value = "👍";

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}
```

**What's happening:**

1. Class extends [`HotCellEditorAdvancedComponent<string>`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent) - base class for custom editors
2. `@Component` decorator with inline template and `styleUrls` for theme-aware CSS (Handsontable tokens)
3. `override config` - array of options to display (`👍`, `👎`, `🤷`)
4. `override value` - default value for the editor
5. `getValue()` / `setValue()` - inherited methods for value management
6. `finishEdit.emit()` - emits event to save and close the editor
7. `ChangeDetectorRef` - injected for manual change detection
8. `@for` - loops through config options
9. `feedback-editor` and `active` CSS classes - styled via external CSS using Handsontable tokens (same as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md))

**Key concepts:**

- **Class-based component**: Extends from [`HotCellEditorAdvancedComponent<T>`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent)
- **State management**: `value` is a class property, managed by base class
- **Angular patterns**: Template syntax, property binding, event binding

## Step 3: Add Styling

Use a separate CSS file with Handsontable CSS custom properties (tokens) so the editor matches native editors and adapts to themes and dark mode—same approach as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md).

**example1.css:**

```css
.feedback-editor {
  display: flex;
  gap: var(--ht-gap, 4px);
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  padding: var(--ht-cell-vertical-padding, 4px) var(--ht-cell-horizontal-padding, 8px);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  border: none;
  border-radius: 0;
}

.feedback-editor button {
  background: var(--ht-background-color, #ffffff);
  color: var(--ht-foreground-color, #000000);
  border: 1px solid var(--ht-border-color, #e0e0e0);
  border-radius: var(--ht-border-radius, 4px);
  padding: 0;
  margin: 0;
  height: 100%;
  width: 33%;
  font-size: var(--ht-font-size, 14px);
  text-align: center;
  cursor: pointer;
}

.feedback-editor button:hover {
  background: var(--ht-border-color, #e0e0e0);
}

.feedback-editor button.active,
.feedback-editor button.active:hover {
  background: var(--ht-accent-color, #1a42e8);
  color: #ffffff;
  border-color: var(--ht-accent-color, #1a42e8);
}
```

Reference it in the component with `styleUrls: ['./example1.css']` and use classes `feedback-editor` and `active` in the template.

**Key tokens:** `--ht-cell-editor-border-color`, `--ht-cell-editor-background-color`, `--ht-accent-color`, `--ht-background-color`, `--ht-foreground-color`, `--ht-border-color`, `--ht-font-size`, `--ht-gap`.

## Step 4: Read Config from Cell Properties

The Angular wrapper automatically handles per-column configuration through the base class.

```typescript
import { Component } from "@angular/core";
import { GridSettings, HotTableModule } from "@handsontable/angular-wrapper";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [HotTableModule],
  template: ` <hot-table [data]="data" [settings]="gridSettings"></hot-table> `,
})
export class AppComponent {
  readonly data = [
    { feature: "Dark Mode", category: "UI", priority: "High", feedback: "👍", votes: 124, status: "Planned" },
    { feature: "Bulk Edit", category: "Core", priority: "High", feedback: "👍", votes: 98, status: "In Progress" },
    { feature: "AI Suggestions", category: "Beta", priority: "Medium", feedback: "🤷", votes: 45, status: "Research" },
    { feature: "Offline Mode", category: "Infra", priority: "Low", feedback: "👎", votes: 12, status: "Backlog" },
  ];

  readonly gridSettings: GridSettings = {
    ...,
    columns: [
      { data: "feature", type: "text", width: 200 },
      { data: "category", type: "text", width: 90 },
      { data: "priority", type: "text", width: 100 },
      {
        data: "feedback",
        width: 100,
        editor: FeedbackEditorComponent,
        config: ["👍", "👎", "🤷"],
      },
      { data: "votes", type: "numeric", width: 60 },
      { data: "status", type: "text", width: 120 },
    ],
  };
}
```

```typescript
@Component({
  standalone: true,
  imports: [],
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  // Config will be automatically populated from cellProperties.config
  override config?: string[];
  override value = "👍";

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
  standalone: true,
  imports: [],
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷"];
  override value = "👍";

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
  standalone: true,
  imports: [],
  template: `
    <div class="feedback-editor">
      @for (option of config; track option) {
      <button [class.active]="option === getValue()" (click)="onClick(option)">
        {{ option }}
      </button>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷"];
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
- **Template**: Uses `feedback-editor` and `active` classes; styling from CSS file with Handsontable tokens
- **Keyboard shortcuts**: Defined directly as class property
- **Change detection**: Manual trigger with `ChangeDetectorRef`
- **Styling**: External CSS with theme-aware tokens (same look as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md))

## Step 7: Use in Handsontable

Use the editor component in your Angular component (same table structure as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md)):

```typescript
import { Component } from "@angular/core";
import { GridSettings, HotTableModule } from "@handsontable/angular-wrapper";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [HotTableModule],
  template: ` <hot-table [data]="data" [settings]="gridSettings"></hot-table> `,
})
export class AppComponent {
  readonly data = [
    { feature: "Dark Mode", category: "UI", priority: "High", feedback: "👍", votes: 124, status: "Planned" },
    { feature: "Bulk Edit", category: "Core", priority: "High", feedback: "👍", votes: 98, status: "In Progress" },
    { feature: "AI Suggestions", category: "Beta", priority: "Medium", feedback: "🤷", votes: 45, status: "Research" },
    { feature: "Offline Mode", category: "Infra", priority: "Low", feedback: "👎", votes: 12, status: "Backlog" },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    width: "100%",
    headerClassName: "htLeft",
    colHeaders: ["Feature", "Category", "Priority", "Feedback", "Votes", "Status"],
    columns: [
      { data: "feature", type: "text", width: 200 },
      { data: "category", type: "text", width: 90 },
      { data: "priority", type: "text", width: 100 },
      {
        data: "feedback",
        width: 100,
        editor: FeedbackEditorComponent,
        config: ["👍", "👎", "🤷"],
      },
      { data: "votes", type: "numeric", width: 60 },
      { data: "status", type: "text", width: 120 },
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
- `config: ['👍', '👎', '🤷']` - Column-specific options
- Same editor component can be reused with different `config` per column
- Configuration through `GridSettings` interface

**Key features:**

- Reusable editor component with theme-aware styling
- Per-column configuration
- Type-safe with TypeScript
- Declarative settings object

## Enhancements

### 1. More Feedback Options

Add more emoji options (same as the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md#1-more-feedback-options)):

```typescript
readonly gridSettings: GridSettings = {
  columns: [
    {
      data: 'feedback',
      editor: FeedbackEditorComponent,
      config: ['👍', '👎', '🤷', '❤️', '🔥', '⭐'],
    },
  ],
};
```

The editor automatically adjusts button widths based on config length.

### 2. Custom Button Styling

You can add extra styles (e.g. transitions, hover effects) in your CSS file while keeping Handsontable tokens for theme consistency. For example, in `example1.css`:

```css
.feedback-editor button {
  transition: transform 0.2s, box-shadow 0.2s;
}

.feedback-editor button:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
```

Keep using the existing `.feedback-editor` and `.active` rules with `var(--ht-*)` tokens so the editor stays theme-aware.

### 3. Dynamic Config from Cell Properties

To read custom config from column definition, implement the `beforeOpen` lifecycle hook:

```typescript
@Component({
  standalone: true,
  imports: [],
  template: `...`,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config?: string[];
  override value = "👍";

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

Add tooltips to buttons using the `title` attribute:

```typescript
const tooltips: Record<string, string> = {
  "👍": "Positive",
  "👎": "Negative",
  "🤷": "Neutral",
};
```

In the template:

```html
<div class="feedback-editor">
  @for (option of config; track option) {
  <button
    [class.active]="option === getValue()"
    [attr.title]="tooltips[option] ?? ''"
    (click)="onClick(option)"
  >
    {{ option }}
  </button>
  }
</div>
```

Expose `tooltips` as a class property or use a getter.

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

The main example already uses an external CSS file (`example1.css`) with Handsontable tokens—see **Step 3** and the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md) CSS. Use `styleUrls: ['./example1.css']` (or your own path) in the component. For a different file name or folder, point `styleUrls` to that file and keep the same `.feedback-editor` and `.active` rules with `var(--ht-*)` tokens for theme-aware styling.

## Accessibility

HTML buttons are inherently accessible, but you can enhance them with ARIA attributes:

```typescript
@Component({
  standalone: true,
  imports: [],
  template: `
    <div class="feedback-editor">
      @for (option of config; track $index) {
      <button
        [attr.aria-label]="option + ' feedback option'"
        [attr.aria-pressed]="option === getValue()"
        [tabIndex]="option === getValue() ? 0 : -1"
        [class.active]="option === getValue()"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
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

---

**Congratulations!** You've created a theme-aware feedback editor with emoji buttons using Angular's [`HotCellEditorAdvancedComponent`](@/guides/cell-functions/custom-cells/custom-cells.md#hotcelleditoradvancedcomponent), matching the look of the [Feedback recipe](@/recipes/cell-types/feedback/feedback.md) and perfect for quick feedback selection in your data grid!

## What you learned

You built an emoji feedback cell editor in Angular using `HotCellEditorAdvancedComponent`. You used Handsontable CSS tokens for theme-aware button styling, `override shortcuts` for keyboard navigation, and `ChangeDetectorRef` to trigger view updates after keyboard-driven value changes.

## Next steps

- [Feedback (JavaScript)](/recipes/cell-types/feedback) - The same concept using `editorFactory` with Handsontable CSS tokens.
- [Feedback (React)](/recipes/cell-types/feedback-react) - The React version using `EditorComponent`.
- [Star Rating Editor (Angular)](/recipes/stars-rating-angular) - Another Angular editor using `HotCellEditorAdvancedComponent` with SVG stars.
