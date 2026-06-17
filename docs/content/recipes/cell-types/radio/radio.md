---
type: how-to
title: Radio buttons
metaTitle: Radio Button Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type that renders radio button options directly in cells, with keyboard navigation and roving tabindex accessibility.
permalink: /recipes/cell-types/radio
canonicalUrl: /recipes/cell-types/radio
tags:
  - guides
  - tutorial
  - recipes
react:
  metaTitle: Radio Button Cell Type - React Data Grid | Handsontable
angular:
  metaTitle: Radio Button Cell Type - Angular Data Grid | Handsontable
vue:
  metaTitle: Radio Button Cell Type - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
menuTag: new
---

This tutorial shows you how to build a custom radio button cell type using a renderer that displays radio inputs directly in cells, with ARIA semantics, roving tabindex, and keyboard navigation.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/cell-types/radio/javascript/example1.js)
@[code](@/content/recipes/cell-types/radio/javascript/example1.ts)
@[code](@/content/recipes/cell-types/radio/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/radio/react/example1.css)
@[code](@/content/recipes/cell-types/radio/react/example1.jsx)
@[code](@/content/recipes/cell-types/radio/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/cell-types/radio/angular/example1.ts)
@[code](@/content/recipes/cell-types/radio/angular/example1.html)
@[code](@/content/recipes/cell-types/radio/angular/example1.css)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/recipes/cell-types/radio/vue/example1.vue)

:::

:::

## Overview

::: only-for javascript react vue

This guide shows how to build a renderer-based radio cell type. The radio buttons are always visible inside the cell -- no editor popup. All interaction (click and keyboard) is handled by the renderer directly. The editor is a minimal stub required by the cell-type system.

:::

::: only-for angular

This guide shows how to build a renderer-based radio cell type. The radio buttons are always visible inside the cell -- no editor popup. The approach is identical to the JavaScript version: `rendererFactory` builds the radio UI, a `BaseEditor` stub satisfies the cell-type API, and an `afterInit` hook adds the Enter/F2 bridge.

:::

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Libraries:** None (pure HTML and CSS)

## What You'll Build

A cell type that:
- Renders a list of labeled radio buttons directly in the cell (always visible, no editor popup)
- Stores a single selected value per cell
- Accepts an `options` array (`{ value, label }` or plain strings) per column
- Supports keyboard navigation (<kbd>ArrowDown</kbd>, <kbd>ArrowUp</kbd>, <kbd>Escape</kbd>)
- Uses roving tabindex for correct Tab behavior within the group
- Exposes `role="radiogroup"` with a label derived from the column header
- Works without any external libraries

## Prerequisites

None. This uses only native HTML, CSS, and the Handsontable API.

## Step 1: Import Dependencies

::: only-for javascript

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';

registerAllModules();
```

:::

::: only-for react

```typescript
import { useRef } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';

registerAllModules();
```

:::

::: only-for vue

```typescript
import { useTemplateRef, onMounted } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';

registerAllModules();
```

:::

::: only-for angular

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';

// app.config.ts — registerAllModules() is called here
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

:::

## Step 2: Add CSS Styling

Create a separate CSS file. All styles are scoped to `.htRadioCell` so they do not affect the same `.htUIRadio` classes used by context menus and filter panels.

```css
.htRadioCell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  line-height: 1.4;
}

.htRadioCell .htUIRadio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ht-foreground-color, #1f2937);
  padding: 2px 6px !important;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.htRadioCell .htUIRadioLabel {
  flex: 1;
}

.htRadioCell .htUIRadio > input[type='radio'] {
  cursor: pointer;
}
```

**Handsontable token used:**
- `--ht-foreground-color` -- label text color

**Why only layout CSS?**

The Handsontable theme already handles radio indicator appearance (circle border, checked dot, colors) via `.htUIRadio > input[type="radio"]` using its own `--ht-radio-*` CSS variables. The CSS file only provides the container layout (vertical flex, padding, row alignment) without overriding those built-in indicator styles.

## Step 3: Editor Stub

::: only-for javascript react vue

Every cell type registered with `registerCellType` must include an editor. Because the renderer handles all interaction, the editor does nothing -- its only job is satisfying the cell-type API.

```typescript
class RadioEditor extends BaseEditor {
  init(): void {}
  open(): void {}
  close(): void {}
  focus(): void {}
  getValue(): string { return this.originalValue as string; }
  setValue(value: string): void { this.originalValue = value; }
}
```

:::

::: only-for angular

Angular uses the same `BaseEditor` stub as JavaScript. The renderer handles all interaction.

```typescript
class RadioEditor extends BaseEditor {
  init(): void {}
  open(): void {}
  close(): void {}
  focus(): void {}
  getValue(): string { return this.originalValue as string; }
  setValue(value: string): void { this.originalValue = value; }
}
```

:::

## Step 4: Renderer -- Build the Radio UI

::: only-for javascript react angular vue

The renderer builds the radio group on every render. It empties the cell, then creates one `<label class="htUIRadio">` row per option.

```typescript
const radioRenderer = rendererFactory(({ instance, td, row, column, value, cellProperties }) => {
  while (td.firstChild) td.removeChild(td.firstChild);

  const options = (cellProperties as RadioCellProperties).options || [];
  const wrapper = document.createElement('div');

  wrapper.className = 'htRadioCell';
  wrapper.setAttribute('role', 'radiogroup');

  // ARIA label from the column header
  const colHeader = instance.getColHeader(column as number);

  if (colHeader) wrapper.setAttribute('aria-label', String(colHeader));

  // ... build options, attach listeners, append to td
  td.appendChild(wrapper);
  td.style.verticalAlign = 'top';
});
```

**What's happening:**
- `rendererFactory` passes the full renderer context: `instance`, `td`, `row`, `column`, `value`, `cellProperties`.
- `cellProperties.options` carries the per-column option list.
- `role="radiogroup"` + `aria-label` make the group announce correctly to screen readers.
- `td.style.verticalAlign = 'top'` aligns the stacked options to the top of the cell.

:::

## Step 5: Roving Tabindex

Only one radio per group should be reachable with <kbd>Tab</kbd>. The checked option (or the first option when nothing is selected) gets `tabIndex=0`; all others get `-1`.

::: only-for javascript react angular vue

```typescript
const hasChecked = options.some((opt) => {
  const v = typeof opt === 'object' ? opt.value : opt;

  return String(v) === String(value);
});

options.forEach((opt, idx) => {
  const optValue = typeof opt === 'object' ? opt.value : opt;
  const input = document.createElement('input');

  input.checked = String(optValue) === String(value);
  input.tabIndex = (input.checked || (!hasChecked && idx === 0)) ? 0 : -1;
  // ...
});
```

:::

**Why roving tabindex?**

The ARIA Authoring Practices Guide for radio groups requires exactly one tabbable element in the group. This lets keyboard users Tab past a whole column of radio cells, then use arrow keys to navigate within a cell they care about.

## Step 6: Click and Change Handlers

::: only-for javascript react angular vue

Clicking a radio saves the value to the data model and restores focus after Handsontable re-renders the cell.

```typescript
input.addEventListener('change', (e) => {
  e.stopPropagation();
  const v = (e.target as HTMLInputElement).value;

  instance.setDataAtCell(row as number, column as number, v);
  queueMicrotask(() => {
    const newTd = instance.getCell(row as number, column as number);

    newTd?.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(v)}"]`)?.focus();
  });
});

// Stop mousedown so Handsontable doesn't steal the click for cell selection.
label.addEventListener('mousedown', (e) => e.stopPropagation());
```

**Why `queueMicrotask`?**

`setDataAtCell` triggers a synchronous re-render that replaces the DOM. The focused element disappears. `queueMicrotask` schedules a microtask that runs after the render, finds the new radio by value, and refocuses it -- without a visible flicker.

**Why stop `mousedown`?**

Handsontable listens for `mousedown` on the table to update cell selection. Without `stopPropagation`, clicking a radio also repositions the Handsontable cursor, which can interfere with focus management.

:::

## Step 7: Keyboard Navigation

::: only-for javascript react angular vue

Each radio listens for arrow keys and <kbd>Escape</kbd>.

```typescript
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    instance.selectCell(row as number, column as number); // return focus to grid
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    e.stopPropagation();
    cycle('next');
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    e.stopPropagation();
    cycle('prev');
    return;
  }
  // Block remaining keys from Handsontable's shortcut system.
  e.stopPropagation();
});
```

The `cycle` helper finds the current index, computes next/prev with wrap-around, calls `setDataAtCell`, and schedules a `queueMicrotask` focus restore -- the same pattern as the click handler.

:::

## Step 8: Enter / F2 Bridge

::: only-for javascript react vue

By default, <kbd>Enter</kbd> and <kbd>F2</kbd> open the text editor on a cell. For radio cells, they should instead move focus into the radio group so the user can navigate with arrow keys.

Add a capture-phase listener on `hot.rootElement` after initialization:

```typescript
hot.rootElement.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return; // already inside a radio
  if (e.key !== 'Enter' && e.key !== 'F2') return;

  const sel = hot.getSelectedLast();

  if (!sel) return;

  const [r, c] = sel;

  if (hot.getCellMeta(r, c).type !== 'radio') return;

  const td = hot.getCell(r, c);
  const target = td?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
    ?? td?.querySelector<HTMLInputElement>('input[type="radio"]');

  if (target) {
    e.stopImmediatePropagation();
    e.preventDefault();
    target.focus();
  }
}, true);
```

**Why capture phase?**

The `true` third argument makes this listener fire in the capture phase, before Handsontable's own `keydown` handlers run. `stopImmediatePropagation()` prevents Handsontable from also opening the text editor.

:::

::: only-for angular

In Angular, the listener goes inside the `afterInit` hook in `gridSettings` -- the hook receives `this` as the Handsontable instance:

```typescript
readonly gridSettings: GridSettings = {
  // ...
  afterInit(this: Handsontable.Core) {
    this.rootElement.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key !== 'Enter' && e.key !== 'F2') return;
      const sel = this.getSelectedLast();
      if (!sel) return;
      const [r, c] = sel;
      if (this.getCellMeta(r, c).type !== 'radio') return;
      const td = this.getCell(r, c);
      const target = td?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
        ?? td?.querySelector<HTMLInputElement>('input[type="radio"]');
      if (target) { e.stopImmediatePropagation(); e.preventDefault(); target.focus(); }
    }, true);
  },
};
```

:::

## Step 9: Register and Use in Handsontable

::: only-for javascript

Register the cell type, then reference it with `type: 'radio'` in the column config. Pass `options` alongside the column definition.

```typescript
registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Task', 'Priority', 'Status'],
  rowHeaders: true,
  rowHeights: 96, // accommodate 3 stacked options
  columns: [
    { data: 'task',     type: 'text'  },
    { data: 'priority', type: 'radio', options: priorityOptions },
    { data: 'status',   type: 'radio', options: statusOptions   },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

::: only-for vue

Register the cell type, then use `type="radio"` on each `HotColumn`. Pass `options` via the `:settings` prop -- `HotColumn` uses this to merge custom properties into the column definition.

```typescript
registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });
```

```html
<HotTable :data="data" :settings="hotSettings">
  <HotColumn data="task"     type="text"  :width="300" />
  <HotColumn data="priority" type="radio" :width="160" :settings="{ options: priorityOptions }" />
  <HotColumn data="status"   type="radio" :width="170" :settings="{ options: statusOptions }" />
</HotTable>
```

Where `hotSettings` includes `rowHeights: 96`.

:::

::: only-for react

```tsx
registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });

<HotTable data={data} rowHeights={96} licenseKey="non-commercial-and-evaluation" ...>
  <HotColumn data="task"     type="text" />
  <HotColumn data="priority" type="radio" options={priorityOptions} />
  <HotColumn data="status"   type="radio" options={statusOptions}   />
</HotTable>
```

:::

::: only-for angular

Register the cell type and use `type: 'radio'` in the column config. Add the Enter/F2 bridge via `afterInit`:

```typescript
registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });

readonly gridSettings: GridSettings = {
  rowHeights: 96,
  columns: [
    { data: 'task',     type: 'text' },
    { data: 'priority', type: 'radio', options: priorityOptions },
    { data: 'status',   type: 'radio', options: statusOptions   },
  ],
  afterInit(this: Handsontable.Core) {
    this.rootElement.addEventListener('keydown', (e) => {
      // ... same Enter/F2 bridge as JavaScript
    }, true);
  },
};
```

:::

**Why `rowHeights: 96`?**

The default row height (~28 px) is too short to display three stacked options with padding. Setting a fixed height ensures the radio group fits without overflowing.

## How It Works - Complete Flow

1. **Render**: Handsontable calls `radioRenderer` for each radio cell. The renderer empties the cell and builds the `<label>` / `<input type="radio">` group from `cellProperties.options`.
2. **View**: Radio buttons are always visible. The checked option reflects the current cell value.
3. **Click**: The `change` event fires, calls `setDataAtCell`, and queues a microtask to refocus the now-rebuilt radio.
4. **Arrow keys**: Each radio's `keydown` listener calls `cycle()`, which calls `setDataAtCell` and queues a focus restore.
5. **Enter / F2**: The capture-phase listener on `rootElement` catches the key before Handsontable, then focuses the checked (or first) radio.
6. **Escape**: The radio's `keydown` listener calls `instance.selectCell()` to return focus to the grid cursor.

## Enhancements

### 1. Allow Per-Cell Options

Override options from `cellProperties` at the cell level using Handsontable's `cells` callback:

```javascript
cells(row, col) {
  if (col === 1 && row === 2) {
    return { options: [{ value: 'critical', label: 'Critical' }] };
  }
}
```

### 2. Read-Only State

Mark individual cells as non-interactive by setting `readOnly: true` in the column or via `cells()`:

```javascript
columns: [
  { data: 'status', type: 'radio', options: statusOptions, readOnly: true },
]
```

The renderer checks `cellProperties.readOnly` and sets `disabled` on all radio inputs, which blocks both click changes and keyboard navigation. Handsontable also dims the cell background automatically.

### 3. Validator for Allowed Values

Reject values not present in the options list:

```javascript
const radioValidator = (value, callback) => {
  callback(priorityOptions.some((o) => o.value === value));
};

columns: [
  { data: 'priority', type: 'radio', options: priorityOptions, validator: radioValidator },
]
```

## Accessibility

**Keyboard navigation:**
- <kbd>Tab</kbd>: Move to the next tabbable radio group (one per cell, via roving tabindex).
- <kbd>Enter</kbd> / <kbd>F2</kbd>: Enter the radio group from the grid cursor.
- <kbd>ArrowDown</kbd> / <kbd>ArrowRight</kbd>: Move to the next option (wraps).
- <kbd>ArrowUp</kbd> / <kbd>ArrowLeft</kbd>: Move to the previous option (wraps).
- <kbd>Escape</kbd>: Return focus to the grid.

**Screen reader support:**
- `role="radiogroup"` on the wrapper.
- `aria-label` derived from the column header.
- Each option is a native `<input type="radio">` with a visible `<label>`.

---

## What you learned

You built a renderer-based radio cell type using Handsontable's `rendererFactory` and a minimal `BaseEditor` stub. You learned the roving tabindex pattern, the `queueMicrotask` focus-restore technique, and how to intercept Enter/F2 in capture phase to bridge keyboard navigation between the grid cursor and the radio group.

## Next steps

- [Feedback](@/recipes/cell-types/feedback/feedback.md) - Another custom cell type using `editorFactory` and an editor popup.
- [Star Rating](@/recipes/cell-types/rating/rating.md) - SVG-based custom renderer using `rendererFactory`.
- [Custom cell type](@/guides/cell-types/cell-type/cell-type.md) - The full reference for renderer, editor, and validator registration.
