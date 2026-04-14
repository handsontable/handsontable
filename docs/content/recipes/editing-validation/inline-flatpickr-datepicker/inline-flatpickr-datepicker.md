---
id: f2h8k4n9
title: Inline Flatpickr date editor
metaTitle: Inline Flatpickr Date Editor Recipe - JavaScript Data Grid | Handsontable
description: Replace the default cell editor for dates with Flatpickr on the TextEditor TEXTAREA, including open, onClose, and teardown in close().
permalink: /recipes/editing-validation/inline-flatpickr-datepicker
canonicalUrl: /recipes/editing-validation/inline-flatpickr-datepicker
tags:
  - guides
  - tutorial
  - recipes
  - editing
  - flatpickr
react:
  id: g3j9m5p0
  metaTitle: Inline Flatpickr Date Editor Recipe - React Data Grid | Handsontable
angular:
  id: h4k0n6q1
  metaTitle: Inline Flatpickr Date Editor Recipe - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Editing and Validation
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps flatpickr

@[code](@/content/recipes/editing-validation/inline-flatpickr-datepicker/javascript/example1.js)
@[code](@/content/recipes/editing-validation/inline-flatpickr-datepicker/javascript/example1.ts)
@[code](@/content/recipes/editing-validation/inline-flatpickr-datepicker/javascript/example1.css)

:::

:::

## Overview

Use a custom editor that **extends** `Handsontable.editors.TextEditor`, initializes **Flatpickr** on the editor **TEXTAREA** inside `open()`, and **destroys** the Flatpickr instance in `close()` so you do not leak DOM nodes or listeners. Register the class under the name **`datepicker`** and set **`editor: 'datepicker'`** on the column.

**Difficulty:** Intermediate  
**Time:** ~15 minutes

## Run without a bundler (CDN)

To try the same pattern in plain HTML without installing Flatpickr, add the stylesheet and script before your app bundle:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
```

Handsontable still needs your usual script (for example, from `handsontable.full.min.js` or your build). The demo above uses the `flatpickr` package via the docs dependency loader instead of these tags.

## Steps

1. **Subclass `TextEditor`** - Reuse the native textarea, focus behavior, and positioning from `TextEditor`.
2. **`open()`** - Call `super.open()`, then `flatpickr(this.TEXTAREA, { ... })` with at least `dateFormat`, `defaultDate`, and `onClose: () => this.finishEditing()`. Use `appendTo: this.TEXTAREA_PARENT` so the calendar mounts under the editor holder and clicks stay inside the grid (same idea as `preventCloseElement` for factory editors).
3. **`close()`** - Call `this.fp.destroy()`, clear the reference, then `super.close()`.
4. **Register** - `registerEditor('datepicker', FlatpickrDateEditor)` from `handsontable/editors/registry` (same registration as `Handsontable.editors.registerEditor` on the full bundle).
5. **Column** - Set `editor: 'datepicker'` for the date column (see the embedded example).

## Key code

```typescript
class FlatpickrDateEditor extends TextEditor {
  static override get EDITOR_TYPE() {
    return 'datepicker';
  }

  fp: flatpickr.Instance | null = null;

  override open(): void {
    super.open();
    this.fp = flatpickr(this.TEXTAREA as HTMLTextAreaElement, {
      appendTo: this.TEXTAREA_PARENT,
      dateFormat: 'Y-m-d',
      defaultDate: /* from cell or today */,
      onClose: () => {
        this.finishEditing();
      },
    });
    this.fp.open();
  }

  override close(): void {
    if (this.fp) {
      this.fp.destroy();
      this.fp = null;
    }
    super.close();
  }
}

registerEditor('datepicker', FlatpickrDateEditor);
```

## Acceptance checks

- Opening a cell in the **Due date** column shows the Flatpickr calendar.
- Choosing a date writes the formatted string and closes the editor.
- Re-opening and closing does not accumulate calendars or listeners (`destroy()` runs every time).

## See also

- [Registering an editor](@/guides/cell-functions/cell-editor/cell-editor.md#registering-an-editor)
- [Datetime `flatpickr` picker (cell type recipe)](@/content/recipes/cell-types/flatpickr/flatpickr.md)
