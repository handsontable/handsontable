---
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

# Flatpickr Cell Type - Step-by-Step Guide

[[toc]]



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

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps date-fns flatpickr

@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.js)
@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.ts)
@[code](@/content/recipes/cell-types/flatpickr/javascript/example1.css)

:::

:::


## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { format, isDate } from 'date-fns';
import flatpickr from 'flatpickr';
// CSS theme import for production builds (bundled with a module bundler)
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
- `editorFactory` creates a custom editor with lifecycle hooks (`init`, `beforeOpen`, `afterOpen`, `afterClose`, etc.)
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
  td.innerText = format(new Date(value), cellProperties.renderFormat);
})
```

**What's happening:**
- `value` is the raw date value (e.g., ISO string "2025-03-15")
- `cellProperties.renderFormat` is a custom property we'll set per column
- `format()` from date-fns converts to desired format
- Display the formatted date

**Why use `cellProperties`?**
- Allows different columns to display dates differently
- One cell definition, multiple configurations

**Error handling for production:**
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
  editor._closing = false;
  editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
  editor.input.classList.add('flatpickr-editor');

  editor.flatpickr = flatpickr(editor.input, {
    dateFormat: 'Y-m-d',
    enableTime: false,
    onChange: () => {
      if (!editor._closing) {
        editor.finishEditing();
      }
    },
    onClose: () => {
      if (!editor._closing) {
        editor.finishEditing();
      }
    },
  });

  /**
   * Prepare dark theme stylesheet for dynamic loading.
   */
  editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK') as HTMLLinkElement;
  editor._darkThemeLink.rel = 'stylesheet';
  editor._darkThemeLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table.
   */
  editor.hot.rootDocument.addEventListener('mousedown', (event) => {
    if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
      event.stopPropagation();
    }
  });
}
```

**What's happening:**
1. Set `_closing` flag for re-entrancy protection (explained below)
2. Create an `input` element and add the `flatpickr-editor` CSS class for styling
3. Initialize Flatpickr on the input with `onChange` and `onClose` handlers
4. Create a `<link>` element for the dark theme (loaded dynamically in `afterOpen`)
5. Set up event listener to prevent calendar clicks from closing the editor

**Key concepts:**

### The `_closing` guard
```typescript
editor._closing = false;
```
Both `onChange` and `onClose` call `finishEditing()`. Without the guard, closing the editor triggers Flatpickr's `onClose`, which calls `finishEditing()` again, creating an infinite loop. The `_closing` flag in `afterClose` prevents this re-entrancy.

### The `onChange` and `onClose` handlers
```typescript
onChange: () => {
  if (!editor._closing) {
    editor.finishEditing();
  }
},
onClose: () => {
  if (!editor._closing) {
    editor.finishEditing();
  }
},
```
- `onChange`: Called when user selects a date — saves and closes
- `onClose`: Called when calendar closes (e.g., pressing Escape) — ensures the editor also closes
- Both are guarded by `_closing` to prevent re-entrancy

### The CSS class
```typescript
editor.input.classList.add('flatpickr-editor');
```
Adds a CSS class to style the input element using Handsontable's CSS custom properties (tokens). See the CSS file for details.

### The Event Listener pattern
This is crucial! Without it:
1. User clicks cell to edit
2. Flatpickr calendar opens
3. User clicks on calendar
4. Handsontable thinks user clicked "outside" the editor
5. Editor closes immediately!

**Solution:**
```typescript
editor.hot.rootDocument.addEventListener('mousedown', (event) => {
  if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
    event.stopPropagation(); // Tell Handsontable: "This click is part of editing!"
  }
});
```

## Step 6: Editor - After Close Hook (`afterClose`)

Handle editor cleanup with re-entrancy protection.

```typescript
afterClose(editor) {
  editor._closing = true;
  editor.flatpickr.close();
  editor._closing = false;
}
```

**What's happening:**
1. Set `_closing = true` to prevent `onClose` from calling `finishEditing()` again
2. Close the Flatpickr calendar
3. Reset `_closing` for the next edit session

**Why is this needed?**
When the editor closes, Flatpickr's calendar may still be open. Calling `flatpickr.close()` triggers Flatpickr's `onClose` callback, which would call `finishEditing()` again without the guard — creating a loop.

## Step 7: Editor - After Open Hook (`afterOpen`)

Toggle the dark theme and open the Flatpickr calendar.

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
3. Open the Flatpickr calendar so the user can select a date immediately

**Why dynamic theme loading?**
- Flatpickr themes are CSS files, not runtime APIs
- Importing CSS directly (`import 'flatpickr/dist/themes/dark.css'`) doesn't work in all build environments
- Dynamic `<link>` injection allows toggling the theme each time the editor opens
- The theme stylesheet is loaded from jsDelivr CDN and cached by the browser

## Step 8: Editor - Before Open Hook (`beforeOpen`)

Initialize the editor with the cell's current value and update Flatpickr settings.

```typescript
beforeOpen(editor, { originalValue, cellProperties }) {
  editor.setValue(originalValue);

  for (const key in cellProperties.flatpickrSettings) {
    editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
  }
}
```

**What's happening:**
1. Set the editor's value to the cell's current value
2. Update Flatpickr settings from `cellProperties.flatpickrSettings`
3. This allows per-column configuration (e.g., different locales, date formats)

**Key points:**
- `beforeOpen` is called before the editor opens
- `originalValue` is the cell's current date value
- `cellProperties.flatpickrSettings` contains column-specific Flatpickr configuration
- `flatpickr.set()` updates the existing Flatpickr instance with new settings

**Why update settings in `beforeOpen`?**
- Allows different columns to have different Flatpickr configurations
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
  editor.flatpickr.setDate(new Date(value));
}
```

**What's happening:**
- Set the input's value to the provided date string
- Update Flatpickr's selected date using `setDate()`
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
    var(--ht-cell-editor-shadow-color, transparent);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
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

Put it all together:

```typescript
const cellDefinition = {
  validator: (value, callback) => {
    callback(isDate(new Date(value)));
  },
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = format(new Date(value), cellProperties.renderFormat);
  }),
  editor: editorFactory<{
    input: HTMLInputElement,
    flatpickr: flatpickr.Instance,
    flatpickrSettings: flatpickr.Options.Options,
    _closing: boolean,
    _darkThemeLink: HTMLLinkElement
  }>({
    init(editor) {
      editor._closing = false;
      editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
      editor.input.classList.add('flatpickr-editor');
      editor.flatpickr = flatpickr(editor.input, {
        dateFormat: 'Y-m-d',
        enableTime: false,
        onChange: () => {
          if (!editor._closing) {
            editor.finishEditing();
          }
        },
        onClose: () => {
          if (!editor._closing) {
            editor.finishEditing();
          }
        },
      });
      editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK') as HTMLLinkElement;
      editor._darkThemeLink.rel = 'stylesheet';
      editor._darkThemeLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';
      /**
       * Prevent recognizing clicking on datepicker as clicking outside of table.
       */
      editor.hot.rootDocument.addEventListener('mousedown', (event) => {
        if (editor.flatpickr.calendarContainer.contains(event.target as Node)) {
          event.stopPropagation();
        }
      });
    },
    afterClose(editor) {
      editor._closing = true;
      editor.flatpickr.close();
      editor._closing = false;
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
    beforeOpen(editor, { originalValue, cellProperties }) {
      editor.setValue(originalValue);

      for (const key in cellProperties.flatpickrSettings) {
        editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
      }
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
      editor.flatpickr.setDate(new Date(value));
    },
  }),
};
```

**What's happening:**
- **validator**: Ensures date is valid using `isDate` from date-fns
- **renderer**: Displays formatted date using `cellProperties.renderFormat`
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates input with CSS class, initializes Flatpickr with guarded callbacks, prepares dark theme link, sets up event listener
  - `afterClose`: Closes Flatpickr calendar with re-entrancy protection
  - `afterOpen`: Toggles dark theme and opens Flatpickr calendar
  - `beforeOpen`: Sets value and updates Flatpickr settings from column config
  - `getValue`: Returns the input's current value
  - `setValue`: Sets input value and updates Flatpickr date

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 13: Use in Handsontable with Different Formats

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: [
    'Product',
    'Version',
    'Release (EU)',
    'Release (US)',
    'Status',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'product', type: 'text', width: 200 },
    { data: 'version', type: 'text', width: 80 },
    // European format column
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_EU, // Custom property for renderer
      flatpickrSettings: {          // Custom property for editor
        locale: {
          firstDayOfWeek: 1         // Monday
        }
      },
    },
    // US format column
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US, // Custom property for renderer
      flatpickrSettings: {          // Custom property for editor
        locale: {
          firstDayOfWeek: 0         // Sunday
        }
      },
    },
    { data: 'status', type: 'text', width: 130 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key feature:**
- Same data column (`releaseDate`)
- Two different display formats (EU vs US)
- Two different calendar configurations (Monday vs Sunday first day)
- One cell definition!

## How It Works - Complete Flow

1. **Initial Load**: Cell displays formatted date ("15/03/2025" EU or "03/15/2025" US)
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **Before Open**: `beforeOpen` sets value and updates Flatpickr settings from column config
4. **After Open**: `afterOpen` toggles dark theme based on current page theme, then opens Flatpickr calendar
5. **Calendar Opens**: Flatpickr displays calendar with column-specific settings (Monday/Sunday first day)
6. **User Selects Date**: `onChange` handler fires, calls `finishEditing()`
7. **Validation**: Validator checks date is valid using `isDate`
8. **Save**: Value saved in ISO format ("2025-03-15")
9. **After Close**: `afterClose` safely closes Flatpickr with `_closing` guard to prevent re-entrancy
10. **Editor Closes**: Container hidden, cell renderer displays new formatted date

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
