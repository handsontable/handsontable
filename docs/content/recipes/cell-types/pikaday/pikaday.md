---
type: tutorial
id: 01620d5a
title: Pikaday
metaTitle: Pikaday Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using Pikaday for a date picker with per-column configuration directly inside your data grid. This guide serves as a migration path for users moving away from the built-in date cell type.
permalink: /recipes/cell-types/pikaday
canonicalUrl: /recipes/cell-types/pikaday
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 9ac52da1
  metaTitle: Pikaday Cell Type - React Data Grid | Handsontable
angular:
  id: b83502de
  metaTitle: Pikaday Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to integrate the Pikaday date picker as a custom Handsontable cell editor, with portal positioning and Moment.js formatting. This recipe also serves as a migration guide for users moving away from the built-in `date` cell type.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/pikaday/javascript/example1.js)
@[code](@/content/recipes/cell-types/pikaday/javascript/example1.ts)
@[code](@/content/recipes/cell-types/pikaday/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/pikaday/react/example1.css)
@[code](@/content/recipes/cell-types/pikaday/react/example1.jsx)
@[code](@/content/recipes/cell-types/pikaday/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps moment @handsontable/pikaday

@[code](@/content/recipes/cell-types/pikaday/angular/example1.ts)
@[code](@/content/recipes/cell-types/pikaday/angular/example1.html)

:::

:::

## Overview

This guide shows how to create a custom date picker cell using [Pikaday](https://github.com/Pikaday/Pikaday), a date picker library with no dependencies. **Migration note:** the built-in `date` cell type with Pikaday will be removed in the next Handsontable release. Use this recipe to maintain Pikaday functionality in your application.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Libraries:** `@handsontable/pikaday`, `moment`

## What You'll Build

A cell that:
- Displays formatted dates (e.g., "12/31/2024" or "31/12/2024")
- Opens a beautiful calendar picker when edited
- Supports per-column configuration (date formats, first day of week, disabled dates)
- Handles keyboard navigation (arrow keys to navigate dates)
- Auto-closes and saves when a date is selected
- Works with portal positioning for better z-index handling

## Prerequisites

```bash
npm install @handsontable/pikaday moment
```

**Why these libraries?**
- `@handsontable/pikaday` - The Pikaday date picker library (Handsontable's fork)
- `moment` - Date formatting and parsing (can be replaced with date-fns, dayjs, etc.)

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import { CellProperties } from 'handsontable/settings';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';

registerAllModules();
```

**What we're importing:**
- Handsontable core and styles
- `editorFactory` and `rendererFactory` for creating custom cell type components
- Pikaday for date picker functionality
- Moment for date formatting and parsing

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = 'MM/DD/YYYY';
const DEFAULT_DATE_FORMAT = DATE_FORMAT_US;
```

**Why constants?**
- Reusability across renderer and column configuration
- Single source of truth
- Add more formats (EU, ISO, custom, etc.) by extending this list

## Step 3: Define TypeScript Types

Define types for editor properties and methods to ensure type safety.

```typescript
type EditorPropertiesType = {
  input: HTMLInputElement;
  pickaday: Pikaday;
  datePicker: HTMLDivElement;
  parentDestroyed: boolean;
};

// Helper type to extract the editor type from factory callbacks
type FactoryEditorType<TProps, TMethods> = Parameters<
  Parameters<
    typeof editorFactory<TProps, TMethods>
  >[0]["init"]
>[0];

type EditorMethodsType = {
  showDatepicker: (
    editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
    event: Event | undefined,
  ) => void;
  hideDatepicker: (
    editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
  ) => void;
  getDatePickerConfig: (
    editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
  ) => Pikaday.PikadayOptions;
  getDateFormat: (
    editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
  ) => string;
};
```

**What's happening:**
- `EditorPropertiesType`: Defines custom properties added to the editor instance
- `FactoryEditorType`: Helper to extract the correct editor type from factory callbacks
- `EditorMethodsType`: Defines custom methods that will be available on the editor

**Why this matters:**
- Provides full TypeScript type safety
- Enables autocomplete in your IDE
- Catches type errors at compile time

## Step 4: Create the Renderer

The renderer controls how the cell looks when not being edited.

```typescript
renderer: rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = moment(new Date(value), cellProperties.renderFormat).format(
    cellProperties.renderFormat,
  );
})
```

**What's happening:**
- `value` is the raw date value (e.g., ISO string "2024-12-31" or formatted "12/31/2024")
- `cellProperties.renderFormat` is a custom property we'll set per column
- `moment().format()` converts to desired format
- Display the formatted date

**Why use `cellProperties`?**
- Allows different columns to display dates differently
- One cell definition, multiple configurations

## Step 5: Editor - Initialize (`init`)

Create the input element and set up event handling to prevent clicks on the datepicker from closing the editor.

```typescript
init(editor) {
  editor.parentDestroyed = false;
  // Create the input element on init. This is a text input that date picker will be attached to.
  editor.input = editor.hot.rootDocument.createElement(
    'input',
  ) as HTMLInputElement;

  // Use the container as the date picker container
  editor.datePicker = editor.container;

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table.
   */
  editor.hot.rootDocument.addEventListener('mousedown', (event) => {
      if (
        event.target &&
        (event.target as HTMLElement).classList.contains('pika-day')
      ) {
        editor.hideDatepicker(editor);
      }
    },
  );
}
```

**What's happening:**
1. Initialize `parentDestroyed` flag to track editor lifecycle
2. Create an `input` element using `editor.hot.rootDocument.createElement()`
3. Use the editor container as the Pikaday container
4. Create event listener to handle clicks on datepicker days
5. The `editorFactory` helper handles container creation and DOM insertion

**Key concepts:**

### The `Event Listener` pattern
This is crucial! Without it:
1. User clicks cell to edit
2. Pikaday calendar opens
3. User clicks on a calendar day
4. Handsontable thinks user clicked "outside" the editor
5. Editor closes immediately!

**Solution:**
```typescript
editor.hot.rootDocument.addEventListener('mousedown', (event) => {
  if ((event.target as HTMLElement).classList.contains('pika-day')) {
    editor.hideDatepicker(editor);
  }
});
```


### Why `editor.hot.rootDocument.createElement()`?
- Handsontable might be in an iframe or shadow DOM
- `editor.hot.rootDocument` ensures correct document context
- Ensures compatibility across different environments

## Step 6: Editor - Get Date Picker Config (`getDatePickerConfig`)

Build the Pikaday configuration object with proper callbacks.

```typescript
getDatePickerConfig(editor) {
  const htInput = editor.input;
  const options: Pikaday.PikadayOptions = {};

  // Merge custom config from cell properties
  if (editor.cellProperties && editor.cellProperties.datePickerConfig) {
    Object.assign(options, editor.cellProperties.datePickerConfig);
  }
  const origOnSelect = options.onSelect;
  const origOnClose = options.onClose;

  // Configure Pikaday
  options.field = htInput;
  options.trigger = htInput;
  options.container = editor.datePicker;
  options.bound = false;
  options.keyboardInput = false;
  options.format = options.format ?? editor.getDateFormat(editor);
  options.reposition = options.reposition || false;
  options.isRTL = false;

  // Handle date selection
  options.onSelect = function (date) {
    let dateStr;

    if (!isNaN(date.getTime())) {
      dateStr = moment(date).format(editor.getDateFormat(editor));
    }
    editor.setValue(dateStr);

    if (origOnSelect) {
      origOnSelect.call(editor.pickaday, date);
    }

    if (Handsontable.helper.isMobileBrowser()) {
      editor.hideDatepicker(editor);
    }
  };

  // Handle date picker close
  options.onClose = () => {
    if (!editor.parentDestroyed) {
      editor.finishEditing(false);
    }
    if (origOnClose) {
      origOnClose();
    }
  };

  return options;
}
```

**What's happening:**
1. Start with empty options object
2. Merge custom config from `cellProperties.datePickerConfig` (allows per-column customization)
3. Store original callbacks to preserve them
4. Configure Pikaday with editor-specific settings
5. Set up `onSelect` to format date and save value
6. Set up `onClose` to finish editing

**Key configuration options:**
- `field`: The input element Pikaday attaches to
- `trigger`: Element that triggers the picker (same as field)
- `container`: Where to render the calendar (editor container)
- `bound: false`: Don't position relative to field
- `keyboardInput: false`: Disable direct keyboard input (handled via shortcuts)
- `reposition: false`: Don't auto-reposition (positioning is handled manually)

## Step 7: Editor - Show Datepicker (`showDatepicker`)

Initialize and display the Pikaday calendar when the editor opens.

```typescript
showDatepicker(editor, event) {
  const dateFormat = editor.getDateFormat(editor);
  // @ts-ignore
  const isMouseDown = editor.hot.view.isMouseDown();
  const isMeta = event && 'keyCode' in event
    ? Handsontable.helper.isFunctionKey((event as KeyboardEvent).keyCode)
    : false;
  let dateStr;

  editor.datePicker.style.display = 'block';

  // Create new Pikaday instance
  editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));

  // Configure Moment.js integration if available
  // @ts-ignore
  if (typeof editor.pickaday.useMoment === 'function') {
    // @ts-ignore
    editor.pickaday.useMoment(moment);
  }
  // @ts-ignore
  editor.pickaday._onInputFocus = function () {};

  // Handle existing value
  if (editor.originalValue) {
    dateStr = editor.originalValue;

    if (moment(dateStr, dateFormat, true).isValid()) {
      editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
    }

    if (editor.getValue() !== editor.originalValue) {
      editor.setValue(editor.originalValue);
    }

    if (!isMeta && !isMouseDown) {
      editor.setValue('');
    }
  } else if (editor.cellProperties.defaultDate) {
    dateStr = editor.cellProperties.defaultDate;

    if (moment(dateStr, dateFormat, true).isValid()) {
      editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
    }

    if (!isMeta && !isMouseDown) {
      editor.setValue('');
    }
  } else {
    editor.pickaday.gotoToday();
  }
}
```

**What's happening:**
1. Get date format for parsing
2. Check if mouse is down or function key pressed (for special behavior)
3. Show the date picker container
4. Create new Pikaday instance with configuration
5. Configure Moment.js integration
6. Disable input focus handler (focus is handled by the editor lifecycle)
7. Set initial date based on cell value, default date, or today

**Key concepts:**

### Why create Pikaday instance in `showDatepicker`?
- Pikaday instance is created fresh each time editor opens
- Allows per-edit configuration changes
- Ensures clean state for each edit session

### The `isMeta` and `isMouseDown` checks
- If function key (F2, etc.) or mouse is down, don't clear the input
- Preserves value when opening via keyboard or programmatically
- Provides better UX for keyboard users

## Step 8: Editor - Hide Datepicker (`hideDatepicker`)

Close the Pikaday calendar.

```typescript
hideDatepicker(editor) {
  editor.pickaday.hide();
}
```

## Step 9: Editor - After Open Hook (`afterOpen`)

Match the editor input dimensions to the cell and show the datepicker.

```typescript
afterOpen(editor, event) {
  const cellRect = editor.TD.getBoundingClientRect();

  editor.input.style.width = `${cellRect.width}px`;
  editor.input.style.height = `${cellRect.height}px`;
  editor.showDatepicker(editor, event);
}
```

**What's happening:**
1. Get the cell's bounding rectangle for exact dimensions
2. Set the input width and height to match the cell
3. Show the datepicker

**Why `getBoundingClientRect`?**
- Provides pixel-perfect dimensions matching the cell
- Works correctly regardless of cell padding, borders, or theme
- The CSS file handles the visual styling (borders, padding, focus states)

## Step 10: Editor - After Close Hook (`afterClose`)

Clean up the Pikaday instance when the editor closes.

```typescript
afterClose(editor) {
  if (editor.pickaday.destroy) {
    editor.pickaday.destroy();
  }
}
```

**Why this matters:**
- Pikaday creates DOM elements and event listeners
- Without cleanup, these accumulate over time
- Essential for long-running applications

## Step 11: Editor - Get Value and Set Value

Standard value management methods.

```typescript
getValue(editor) {
  return editor.input.value;
}

setValue(editor, value) {
  editor.input.value = value;
}
```

- Pikaday automatically updates `input.value` when a date is selected
- `getValue` and `setValue` read and write the input value directly
- Formatting is handled by Pikaday and the `onSelect` callback

## Step 12: Editor - Get Date Format (`getDateFormat`)

Helper method to get the date format for the current cell.

```typescript
getDateFormat(
  editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
) {
  return editor.cellProperties.dateFormat ?? DEFAULT_DATE_FORMAT;
}
```

## Step 13: Editor - Keyboard Shortcuts

Add keyboard navigation for date selection.

```typescript
shortcuts: [
  {
    keys: [['ArrowLeft']],
    callback: (editor, _event) => {
      editor.pickaday.adjustDate('subtract', 1);
      _event.preventDefault();
    },
  },
  {
    keys: [['ArrowRight']],
    callback: (editor, _event) => {
      editor.pickaday.adjustDate('add', 1);
      _event.preventDefault();
    },
  },
  {
    keys: [['ArrowUp']],
    callback: (editor, _event) => {
      editor.pickaday.adjustDate('subtract', 7);
      _event.preventDefault();
    },
  },
  {
    keys: [['ArrowDown']],
    callback: (editor, _event) => {
      editor.pickaday.adjustDate('add', 7);
      _event.preventDefault();
    },
  }
]
```

**What's happening:**
- **ArrowLeft**: Move back one day
- **ArrowRight**: Move forward one day
- **ArrowUp**: Move back one week (7 days)
- **ArrowDown**: Move forward one week (7 days)

## Step 14: Editor - Portal Positioning

Use portal positioning for better z-index handling.

```typescript
position: 'portal',
```

**Why portal instead of container?**
- Datepicker can extend beyond cell boundaries
- Portal ensures it's always on top
- Better for complex layouts

## Step 15: Editor Input Styling (CSS)

Style the editor input to match Handsontable's native editor appearance using CSS custom properties.

```css
.ht_editor_visible > input {
  width: 100%;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  outline: none;
  margin-top: -1px;
  margin-left: -1px;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent) !important;
  background-color: var(--ht-cell-editor-background-color, #ffffff) !important;
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px) !important;
  border: none !important;
  font-family: inherit;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
}
.ht_editor_visible > input:focus-visible {
  border: none !important;
  outline: none !important;
}
```

**What's happening:**
- Uses Handsontable's CSS custom properties (`--ht-cell-editor-*`) for theme compatibility
- `inset box-shadow` replaces borders for the blue editor highlight
- `-1px` margins correct portal positioning offset
- Inherits font properties from the table for consistency
- `:focus-visible` overrides prevent browser default focus styles

## Step 16: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition: Pick<
  CellProperties,
  'renderer' | 'validator' | 'editor'
> = {
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = moment(new Date(value), cellProperties.renderFormat).format(
      cellProperties.renderFormat,
    );
  }),

  editor: editorFactory<
    EditorPropertiesType,
    EditorMethodsType
  >({
    position: 'portal',
    shortcuts: [
      // ... keyboard shortcuts from Step 13
    ],
    init(editor) {
      // ... from Step 5
    },
    getDatePickerConfig(editor) {
      // ... from Step 6
    },
    hideDatepicker(editor) {
      // ... from Step 8
    },
    showDatepicker(editor, event) {
      // ... from Step 7
    },
    afterClose(editor) {
      // ... from Step 10
    },
    afterOpen(editor, event) {
      // ... from Step 9
    },
    getValue(editor) {
      // ... from Step 11
    },
    setValue(editor, value) {
      // ... from Step 11
    },
    getDateFormat(editor) {
      // ... from Step 12
    },
  }),
};
```

## Step 17: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'itemName', type: 'text', width: 130 },
    { data: 'category', type: 'text', width: 120 },
    { data: 'leadEngineer', type: 'text', width: 150 },
    {
      data: 'restockDate',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US,
      dateFormat: DATE_FORMAT_US,
      correctFormat: true,
      defaultDate: '01/01/2020',
      datePickerConfig: {
        firstDay: 0,
        showWeekNumber: true,
        disableDayFn(date: Date) {
          return date.getDay() === 0 || date.getDay() === 6;
        },
      },
    },
    {
      data: 'cost',
      type: 'numeric',
      width: 120,
      className: 'htRight',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US',
      },
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer and editor into the column config
- `renderFormat` - Format for displaying dates in cells
- `dateFormat` - Format for Pikaday date picker
- `datePickerConfig` - Additional Pikaday configuration options
- `defaultDate` - Default date when cell is empty
- `headerClassName: 'htLeft'` - Left-aligns all column headers

## How It Works - Complete Flow

1. **Initial Load**: Cell displays formatted date (e.g., "08/01/2025")
2. **User Double-Clicks or F2**: Editor opens, container positioned in portal
3. **After Open**: Input sized to match cell via `getBoundingClientRect`, `showDatepicker` called
4. **Show Datepicker**: Pikaday instance created, calendar displayed
5. **User Selects Date**: `onSelect` callback fires, formats date, saves value
6. **User Clicks Day**: Event listener detects click, hides datepicker, finishes editing
7. **After Close**: Pikaday instance destroyed, memory cleaned up
8. **Re-render**: Cell displays updated formatted date

## Migration from Built-in Date Cell Type

If you're currently using the built-in `date` cell type with Pikaday, here's how to migrate:

### Before (Built-in):
```typescript
columns: [{
  data: 'restockDate',
  type: 'date',
  dateFormat: 'MM/DD/YYYY',
  datePickerConfig: {
    firstDay: 0,
  }
}]
```

### After (Custom Editor):
```typescript
columns: [{
  data: 'restockDate',
  ...cellDefinition,  // Add the custom cell definition
  dateFormat: 'MM/DD/YYYY',
  renderFormat: 'MM/DD/YYYY',  // Add render format
  datePickerConfig: {
    firstDay: 0,
  }
}]
```

**Key differences:**
- Replace `type: "date"` with `...cellDefinition`
- Add `renderFormat` property (for cell display)
- Keep `dateFormat` and `datePickerConfig` (they work the same)

## Enhancements

### 1. Different Date Formats per Column

```typescript
columns: [
  {
    data: 'restockDate',
    ...cellDefinition,
    renderFormat: 'MM/DD/YYYY',  // US format
    dateFormat: 'MM/DD/YYYY',
  },
  {
    data: 'restockDate',
    ...cellDefinition,
    renderFormat: 'DD/MM/YYYY',  // EU format
    dateFormat: 'DD/MM/YYYY',
  }
]
```

### 2. Date Range Restrictions

```typescript
datePickerConfig: {
  minDate: new Date('2024-01-01'),
  maxDate: new Date('2024-12-31'),
  disableDayFn(date) {
    // Disable weekends
    return date.getDay() === 0 || date.getDay() === 6;
  }
}
```

### 3. Custom Date Formatting

Replace Moment.js with another library:

```typescript
import { format, parse } from 'date-fns';

// In renderer
renderer: rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = format(new Date(value), cellProperties.renderFormat);
})

// In getDatePickerConfig
options.format = 'MM/DD/YYYY'; // Pikaday format string
```

### 4. Localization

```typescript
import 'pikaday/css/pikaday.css';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

datePickerConfig: {
  i18n: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    months: ['Janvier', 'Février', 'Mars', ...],
    weekdays: ['Dimanche', 'Lundi', 'Mardi', ...],
    weekdaysShort: ['Dim', 'Lun', 'Mar', ...]
  }
}
```

## Accessibility

Pikaday has good keyboard support out of the box:

**Keyboard navigation:**
- **Arrow Keys**: Navigate dates (via the registered shortcuts)
- **Enter**: Select current date
- **Escape**: Close datepicker
- **Tab**: Navigate to next field
- **Page Up/Down**: Navigate months
- **Home/End**: Navigate to first/last day of month

**ARIA attributes:**
Pikaday automatically adds ARIA attributes for screen readers.

## Performance Considerations

### Why This Is Fast

1. **Lazy Initialization**: Pikaday instance created only when editor opens
2. **Efficient Cleanup**: Instance destroyed when editor closes
3. **Portal Positioning**: Better z-index handling without performance cost

---


## What you learned

You integrated the Pikaday date picker as a Handsontable cell editor. You used `editorFactory` with `position: 'portal'` for correct z-index handling, Moment.js for date formatting and parsing, and `cellProperties.datePickerConfig` to drive per-column Pikaday configuration.

## Next steps

- [Moment.js date](@/recipes/cell-types/moment-date/moment-date.md) - A date cell type combining Moment.js and Pikaday in a registered `moment-date` cell type.
- [Flatpickr](@/recipes/cell-types/flatpickr/flatpickr.md) - An alternative date picker using the Flatpickr library.
- [Date picker (Angular)](@/angular/recipes/cell-types/guide-datepicker-angular/guide-datepicker.md) - A date editor built with Angular components and the native HTML5 date input.
