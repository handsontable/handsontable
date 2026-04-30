---
type: tutorial
id: c757a3b3
title: Flatpickr
metaTitle: Flatpickr Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using Flatpickr for a powerful, customizable date picker experience directly inside your data grid.
permalink: /recipes/cell-types/flatpickr
canonicalUrl: /recipes/cell-types/flatpickr
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 580a2104
  metaTitle: Flatpickr Cell Type - React Data Grid | Handsontable
angular:
  id: 8748f2d9
  metaTitle: Flatpickr Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to integrate the Flatpickr date picker as a custom Handsontable cell editor, with per-column locale and format configuration.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps date-fns flatpickr

@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.js)
@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.ts)
@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps date-fns flatpickr

@[code](@/content/recipes/cell-types/flatpickr/react/example1.css)
@[code](@/content/recipes/cell-types/flatpickr/react/example1.jsx)
@[code](@/content/recipes/cell-types/flatpickr/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps date-fns flatpickr

@[code](@/content/recipes/cell-types/flatpickr/angular/example1.ts)
@[code](@/content/recipes/cell-types/flatpickr/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom date picker cell using [Flatpickr](https://flatpickr.js.org/), a powerful and flexible date picker library. This is more advanced than using native HTML5 date inputs, offering better cross-browser consistency and extensive customization options.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Libraries:** `flatpickr`, `date-fns`

## What You'll Build

A cell that:
- Displays formatted dates (e.g., "12/31/2024" or "31/12/2024")
- Opens a beautiful calendar picker when edited
- Supports per-column configuration (EU vs US date formats)
- Handles locale-specific settings (first day of week)
- Auto-closes and saves when a date is selected
- Supports dark theme with dynamic stylesheet loading

## Prerequisites

```bash
npm install flatpickr date-fns
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { format, isDate } from 'date-fns';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';

registerAllModules();
```

**Why date-fns?**
- Lightweight, modular date formatting
- Better than native `toLocaleDateString()` for consistency
- Can be replaced with other libraries (moment, dayjs, etc.)
- We import `isDate` for validation

**Why `editorFactory` and `rendererFactory`?**
- `editorFactory` creates a custom editor with lifecycle hooks (`init`, `beforeOpen`, `afterOpen`, `afterClose`, `getValue`, `setValue`, etc.)
- `rendererFactory` creates a custom renderer with access to cell properties
- Both are Handsontable helpers that handle boilerplate like container creation, positioning, and lifecycle management

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = 'MM/dd/yyyy';
const DATE_FORMAT_EU = 'dd/MM/yyyy';
```

**Why constants?**
- Reusability across renderer and column configuration
- Single source of truth
- Easy to add more formats (ISO, custom, etc.)

## Step 3: Create the Renderer

The renderer displays the date in a human-readable format.

```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = value ? format(new Date(value), cellProperties.renderFormat) : '';
})
```

**What's happening:**
- `value` is the raw date value (e.g., ISO string "2025-03-15")
- Empty or invalid values are shown as an empty string
- `cellProperties.renderFormat` is a custom property we'll set per column
- `format()` from date-fns converts to desired format
- Display the formatted date

**Why use `cellProperties`?**
- Allows different columns to display dates differently
- One cell definition, multiple configurations

**Optional error handling for production:**
```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  if (!value) {
    td.innerText = '';
    return;
  }
  try {
    td.innerText = format(new Date(value), cellProperties.renderFormat || 'MM/dd/yyyy');
  } catch (e) {
    td.innerText = 'Invalid date';
    td.style.color = 'red';
  }
})
```

## Step 4: Create the Validator

```typescript
validator: (value, callback) => {
  callback(isDate(new Date(value)));
}
```

**What's happening:**
- Uses `isDate` from date-fns to validate the date
- `isDate` checks if the value is a valid Date object
- Returns `true` for valid dates, `false` for invalid ones

**Alternative validation approaches:**
```typescript
// Using native JavaScript
validator: (value, callback) => {
  const date = new Date(value);

  callback(!isNaN(date.getTime()));
}
```

## Step 5: Editor - Initialize (`init`)

Create the input element, initialize Flatpickr, and prepare the dark theme.

```typescript
init(editor) {
  editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
  editor.input.classList.add('flatpickr-editor');

  editor.flatpickr = flatpickr(editor.input, {
    dateFormat: 'Y-m-d',
    disableMobile: true,
    onClose: () => {
      editor.finishEditing();
    },
  });

  editor.preventCloseElement = editor.flatpickr.calendarContainer;

  /**
   * Prepare dark theme stylesheet for dynamic loading.
   */
  editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK') as HTMLLinkElement;
  editor._darkThemeLink.rel = 'stylesheet';
  editor._darkThemeLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';
}
```

**What's happening:**
1. Create an `input` element and add the `flatpickr-editor` CSS class for styling
2. Initialize Flatpickr on the input with an `onClose` handler that calls `finishEditing()` when the calendar closes (e.g., after selecting a date or pressing Escape)
3. Set `preventCloseElement` to the Flatpickr calendar container so that clicks inside the calendar are not treated as "outside" clicks — this keeps the editor open while the user selects a date
4. Create a `<link>` element for the dark theme (loaded dynamically in `afterOpen`)

**Key concepts:**

### The `onClose` handler
```typescript
onClose: () => {
  editor.finishEditing();
},
```
When the user selects a date or closes the calendar (e.g., Escape), Flatpickr fires `onClose`. Calling `finishEditing()` saves the value and closes the editor.

### The CSS class
```typescript
editor.input.classList.add('flatpickr-editor');
```
Adds a CSS class to style the input element using Handsontable's CSS custom properties (tokens). See the CSS file for details.

### The `preventCloseElement` pattern
Without it:
1. User clicks cell to edit
2. Flatpickr calendar opens
3. User clicks on the calendar
4. Handsontable treats the click as "outside" the editor and closes it

**Solution:** Assign the Flatpickr calendar container to `editor.preventCloseElement`. The editor factory treats this element as part of the editor, so clicks inside it do not close the editor prematurely.

## Step 6: Editor - After Close Hook (`afterClose`)

Close the Flatpickr calendar when the editor is closed by non-Flatpickr means (e.g., Escape key or clicking outside).

```typescript
afterClose(editor) {
  editor.flatpickr.close();
}
```

**What's happening:**
- When the user closes the editor by pressing Escape or clicking outside the cell, Handsontable closes the editor but Flatpickr's calendar popup is not automatically closed
- The `afterClose` hook runs when the editor is about to close; calling `editor.flatpickr.close()` ensures the calendar is hidden
- Without this hook, the calendar would remain visible on screen after the editor has closed

## Step 7: Editor - After Open Hook (`afterOpen`)

Toggle the dark theme when the editor opens, then open the Flatpickr calendar.

```typescript
afterOpen(editor) {
  const isDark = editor.hot.rootDocument.documentElement.getAttribute('data-theme') === 'dark';
  const head = editor.hot.rootDocument.head;

  if (isDark && !editor._darkThemeLink.parentNode) {
    head.appendChild(editor._darkThemeLink);
  } else if (!isDark && editor._darkThemeLink.parentNode) {
    head.removeChild(editor._darkThemeLink);
  }

  editor.flatpickr.open();
}
```

**What's happening:**
1. Check the current theme by reading the `data-theme` attribute on the `<html>` element
2. Dynamically add or remove the Flatpickr dark theme stylesheet
3. Call `editor.flatpickr.open()` to show the calendar (the editor factory does not open Flatpickr automatically)

**Why dynamic theme loading?**
- Flatpickr themes are CSS files, not runtime APIs
- Importing CSS directly (`import 'flatpickr/dist/themes/dark.css'`) doesn't work in all build environments
- Dynamic `<link>` injection allows toggling the theme each time the editor opens
- The theme stylesheet is loaded from jsDelivr CDN and cached by the browser

## Step 8: Editor - Before Open Hook (`beforeOpen`)

Apply per-column Flatpickr settings.

```typescript
beforeOpen(editor, { cellProperties }) {
  for (const key in cellProperties.flatpickrSettings) {
    editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
  }
}
```

**What's happening:**
1. Update Flatpickr settings from `cellProperties.flatpickrSettings` (e.g., locale, first day of week)
2. The editor's value is set by the framework before `beforeOpen` runs

**Key points:**
- `beforeOpen` is called before the editor opens
- `cellProperties.flatpickrSettings` contains column-specific Flatpickr configuration
- `flatpickr.set()` updates the existing Flatpickr instance with new settings

**Why update settings in `beforeOpen`?**
- Allows different columns to have different Flatpickr configurations (e.g., EU vs US first day of week)
- Settings are applied just before opening, ensuring they're fresh
- More efficient than reinitializing Flatpickr each time

## Step 9: Editor - Get Value (`getValue`)

Return the current date value from the input.

```typescript
getValue(editor) {
  return editor.input.value;
}
```

**What's happening:**
- Flatpickr automatically updates `input.value` in ISO format (e.g., "2025-03-15")
- Simply return the input's current value
- Called when Handsontable needs to save the cell value

## Step 10: Editor - Set Value (`setValue`)

Initialize the editor with the cell's current date value.

```typescript
setValue(editor, value) {
  editor.input.value = value;
  editor.flatpickr.setDate(value ? new Date(value) : new Date());
}
```

**What's happening:**
- Set the input's value to the provided date string
- Update Flatpickr's selected date using `setDate()` — use the cell value if present, otherwise the current date
- This ensures Flatpickr displays the correct date when opened
- Called to initialize the editor with the cell's current value

## Step 11: Style the Editor with CSS

The editor input needs styling to match Handsontable's cell appearance. Create a CSS file using Handsontable's CSS custom properties (tokens):

```css
.flatpickr-editor {
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  outline: none;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent) !important;
  background-color: var(--ht-cell-editor-background-color, #ffffff) !important;
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px) !important;
  border: none !important;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
.flatpickr-editor:focus-visible {
  border: none !important;
}

.flatpickr-editor.active {
  box-shadow: none;
  background-color: transparent;
  border-radius: 0 !important;
}
```

**Why use CSS custom properties?**
- `--ht-cell-editor-border-width` and `--ht-cell-editor-border-color` match the default Handsontable editor border
- `--ht-cell-editor-background-color` ensures the editor background matches the cell
- `--ht-cell-vertical-padding` and `--ht-cell-horizontal-padding` align text with the cell content
- These tokens automatically adapt when using custom Handsontable themes

**The `.active` state:** When the editor is active (calendar open), the input border and background are hidden since the calendar itself provides the visual feedback.

## Step 12: Complete Cell Definition

**TypeScript:** Define an interface for the editor instance (optional in JavaScript):

```typescript
interface FlatpickrEditorInstance {
  input: HTMLInputElement;
  flatpickr: flatpickr.Instance;
  preventCloseElement: HTMLElement;
  _darkThemeLink: HTMLLinkElement;
}
```

Put it all together:

```typescript
const cellDefinition = {
  validator: (value, callback) => {
    callback(isDate(new Date(value)));
  },
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = value ? format(new Date(value), cellProperties.renderFormat) : '';
  }),
  editor: editorFactory<FlatpickrEditorInstance>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
      editor.input.classList.add('flatpickr-editor');
      editor.flatpickr = flatpickr(editor.input, {
        dateFormat: 'Y-m-d',
        disableMobile: true,
        onClose: () => {
          editor.finishEditing();
        },
      });
      editor.preventCloseElement = editor.flatpickr.calendarContainer;
      editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK') as HTMLLinkElement;
      editor._darkThemeLink.rel = 'stylesheet';
      editor._darkThemeLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';
    },
    afterClose(editor) {
      editor.flatpickr.close();
    },
    afterOpen(editor) {
      const isDark = editor.hot.rootDocument.documentElement.getAttribute('data-theme') === 'dark';
      const head = editor.hot.rootDocument.head;
      if (isDark && !editor._darkThemeLink.parentNode) {
        head.appendChild(editor._darkThemeLink);
      } else if (!isDark && editor._darkThemeLink.parentNode) {
        head.removeChild(editor._darkThemeLink);
      }

      editor.flatpickr.open();
    },
    beforeOpen(editor, { cellProperties }) {
      for (const key in cellProperties.flatpickrSettings) {
        editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
      }
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
      editor.flatpickr.setDate(value ? new Date(value) : new Date());
    },
  }),
};
```

**What's happening:**
- **validator**: Ensures date is valid using `isDate` from date-fns
- **renderer**: Displays formatted date using `cellProperties.renderFormat` (empty string for missing values)
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates input, initializes Flatpickr with `onClose` calling `finishEditing()`, sets `preventCloseElement` so calendar clicks don't close the editor, prepares dark theme link
  - `afterClose`: Closes the Flatpickr calendar when the editor is closed by Escape or clicking outside
  - `afterOpen`: Toggles dark theme stylesheet and opens the Flatpickr calendar
  - `beforeOpen`: Applies per-column Flatpickr settings from `cellProperties.flatpickrSettings`
  - `getValue`: Returns the input's current value
  - `setValue`: Sets input value and Flatpickr's selected date

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 13: Use in Handsontable with Different Formats

```javascript
const container = document.querySelector('#example1');

const hotOptions = {
  data,
  colHeaders: ['Product', 'Version', 'Release (EU)', 'Release (US)', 'Status'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'product', type: 'text', width: 200 },
    { data: 'version', type: 'text', width: 80 },
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_EU,
      flatpickrSettings: {
        locale: {
          firstDayOfWeek: 1,
        },
      },
    },
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US,
      flatpickrSettings: {
        locale: {
          firstDayOfWeek: 0,
        },
      },
    },
    { data: 'status', type: 'text', width: 130 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**TypeScript:** Use `const container = document.querySelector('#example1')!` and type the options as `Handsontable.GridSettings`.

**Key feature:**
- Same data column (`releaseDate`)
- Two different display formats (EU vs US)
- Two different calendar configurations (Monday vs Sunday first day)
- One cell definition!

## How It Works - Complete Flow

1. **Initial Load**: Cell displays formatted date ("15/03/2025" EU or "03/15/2025" US), or empty string when there is no value
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **Before Open**: `beforeOpen` applies per-column Flatpickr settings (e.g., first day of week)
4. **After Open**: `afterOpen` toggles dark theme if needed and calls `editor.flatpickr.open()` to show the calendar
5. **Calendar Opens**: Flatpickr displays the calendar with column-specific settings
6. **User Selects Date or Closes Calendar**: `onClose` handler fires, calls `finishEditing()`
7. **Validation**: Validator checks date is valid using `isDate`
8. **Save**: Value saved in ISO format ("2025-03-15")
9. **Editor Closes**: `afterClose` runs and closes the Flatpickr calendar (important when the user closed via Escape or clicking outside). Container hidden, cell renderer displays the new formatted date

## Advanced Enhancements

### 1. Time Picker

Add time selection:

```typescript
flatpickrSettings: {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  time_24hr: true
}

// Update renderer
renderFormat: 'dd/MM/yyyy HH:mm'
```

### 2. Date Range Restrictions

Limit selectable dates:

```typescript
flatpickrSettings: {
  minDate: '2024-01-01',
  maxDate: '2024-12-31',
  disable: [
    // Disable weekends
    function(date) {
      return (date.getDay() === 0 || date.getDay() === 6);
    }
  ]
}
```

### 3. Inline Calendar

Show calendar always visible:

```typescript
flatpickrSettings: {
  inline: true,
  static: true
}

// Adjust wrapper height in open()
editor.container.style.height = '300px';
```

### 4. Multiple Date Locales

Use Flatpickr locales:

```typescript
import { French } from 'flatpickr/dist/l10n/fr.js';

flatpickrSettings: {
  locale: French,
  dateFormat: 'd/m/Y'
}
```

### 5. Custom Date Ranges

Add shortcuts:

```typescript
// Requires flatpickr shortcutButtonsPlugin
import ShortcutButtonsPlugin from 'flatpickr/dist/plugins/shortcutButtons/shortcutButtons.js';

flatpickrSettings: {
  plugins: [
    ShortcutButtonsPlugin({
      button: [
        { label: 'Today' },
        { label: 'Next Week' },
      ],
      onClick: (index, fp) => {
        let date;

        if (index === 0) {
          date = new Date();

        } else if (index === 1) {
          date = new Date();
          date.setDate(date.getDate() + 7);
        }

        fp.setDate(date);
      }
    })
  ]
}
```

---

**Congratulations!** You've created a production-ready date picker with full localization support, dark theme toggling, and advanced configuration.

## What you learned

You integrated the Flatpickr date picker as a Handsontable cell editor. You used `editorFactory` to manage the editor lifecycle, `preventCloseElement` to keep the calendar open while the user picks a date, and `cellProperties` to drive per-column format and locale configuration.

## Next steps

- [Pikaday](@/recipes/cell-types/pikaday/pikaday.md) - An alternative date picker using Pikaday and Moment.js, with portal positioning.
- [Moment.js date](@/recipes/cell-types/moment-date/moment-date.md) - A date cell type using Moment.js and Pikaday.
- [Date picker (Angular)](@/recipes/cell-types/guide-datepicker-angular/guide-datepicker.md) - A date editor built with Angular components and the native HTML5 date input.
