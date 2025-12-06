---
id: 01620d5a
title: "Recipe: Date picker `pikaday`"
metaTitle: "Recipe: Date picker pikaday - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type using Pikaday for a powerful, customizable date picker experience directly inside your data grid. This guide serves as a migration path for users migrating from the built-in date cell type.
permalink: /recipes/pikaday
canonicalUrl: /recipes/pikaday
tags:
  - guides
  - tutorial
  - recipies
react:
  id: 9ac52da1
  metaTitle: Custom builds - React Data Grid | Handsontable
angular:
  id: b83502de
  metaTitle: Custom builds - Angular Data Grid | Handsontable
searchCategory: Recepies
category: Cells
---

# Pikaday Date Picker Cell - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom date picker cell using [Pikaday](https://github.com/Pikaday/Pikaday), a lightweight, no-dependencies date picker library. **This guide is essential for migration** - the built-in `date` cell type with Pikaday will be removed in the next Handsontable release. Use this recipe to maintain Pikaday functionality in your application.

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

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-pikaday/javascript/example1.js)
@[code](@/content/recipes/cells/guide-pikaday/javascript/example1.ts)

:::

:::

## Prerequisites

```bash
npm install @handsontable/pikaday moment
```

**Why these libraries?**
- `@handsontable/pikaday` - The Pikaday date picker library (Handsontable's fork)
- `moment` - Date formatting and parsing (can be replaced with date-fns, dayjs, etc.)

## Step 1: Import Dependencies

```typescript
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import moment from "moment";
import Pikaday from "@handsontable/pikaday";
import { CellProperties } from "handsontable/settings";

registerAllModules();
```

**What we're importing:**
- Handsontable core and styles
- Pikaday for date picker functionality
- Moment for date formatting and parsing

## Step 2: Define Date Formats

```typescript
const DATE_FORMAT_US = "MM/DD/YYYY";
const DEFAULT_DATE_FORMAT = DATE_FORMAT_US;
```

**Why constants?**
- Reusability across renderer and column configuration
- Single source of truth
- Easy to add more formats (EU, ISO, custom, etc.)

## Step 3: Create Style Copy Helper

This helper function copies styles from the cell to the input element for visual consistency. The input will looks the same regardless of theme you use. 

```typescript
const copyStyleFromElements = (
  source: HTMLElement,
  target: HTMLElement,
  keys: string[] = [],
  keysStartsWith: string[] = [],
) => {
  const computedStyle = getComputedStyle(source);
  Array.from(computedStyle)
    .filter((key) => {
      if (keys.length === 0 && keysStartsWith.length === 0) {
        return true;
      }
      if (keys.length > 0) {
        if (keys.includes(key)) {
          return true;
        }
      }
      if (keysStartsWith.length > 0) {
        if (keysStartsWith.some((startsWith) => key.startsWith(startsWith))) {
          return true;
        }
      }
      return false;
    }).forEach((key) =>
      target.style.setProperty(
        key,
        computedStyle.getPropertyValue(key),
        computedStyle.getPropertyPriority(key),
      )
    );
};
```

**What's happening:**
- Copies computed styles from source element to target element
- Filters by specific keys or keys that start with certain prefixes
- Ensures the input matches the cell's appearance

**Why this matters:**
- Makes the editor input visually match the cell
- Provides seamless editing experience
- Used in `afterOpen` to style the input

## Step 4: Define TypeScript Types

Define types for editor properties and methods to ensure type safety.

```typescript
type EditorPropertiesType = {
  input: HTMLInputElement;
  pickaday: Pikaday;
  eventManager: Handsontable.EventManager;
  datePicker: HTMLDivElement;
  parentDestroyed: boolean;
};

// Helper type to extract the editor type from factory callbacks
type FactoryEditorType<TProps, TMethods> = Parameters<
  Parameters<
    typeof Handsontable.editors.BaseEditor.factory<TProps, TMethods>
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

## Step 5: Create the Renderer

The renderer controls how the cell looks when not being edited.

```typescript
renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
  td.innerText = moment(new Date(value), cellProperties.renderFormat).format(
    cellProperties.renderFormat,
  );
  return td;
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
- See Step 13 for usage

**Error handling for production:**
```typescript
renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
  if (!value) {
    td.innerText = '';
    return td;
  }
  try {
    td.innerText = moment(new Date(value), cellProperties.renderFormat || DEFAULT_DATE_FORMAT).format(
      cellProperties.renderFormat || DEFAULT_DATE_FORMAT,
    );
  } catch (e) {
    td.innerText = 'Invalid date';
    td.style.color = 'red';
  }
  return td;
})
```

## Step 6: Editor - Initialize (`init`)

Create the input element and set up event handling to prevent clicks on the datepicker from closing the editor.

```typescript
init(editor) {
  editor.parentDestroyed = false;
  // Create the input element on init. This is a text input that date picker will be attached to.
  editor.input = editor.hot.rootDocument.createElement(
    "INPUT",
  ) as HTMLInputElement;

  // Use the container as the date picker container
  editor.datePicker = editor.container;

  /**
   * Prevent recognizing clicking on datepicker as clicking outside of table.
   */
  editor.eventManager = new Handsontable.EventManager(editor.container);
  editor.eventManager.addEventListener(
    document.body,
    "mousedown",
    (event) => {
      if (
        event.target &&
        (event.target as HTMLElement).classList.contains("pika-day")
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
4. Create event manager to handle clicks on datepicker days
5. The `Handsontable.editors.BaseEditor.factory` helper handles container creation and DOM insertion

**Key concepts:**

### The `eventManager` pattern
This is crucial! Without it:
1. User clicks cell to edit
2. Pikaday calendar opens
3. User clicks on a calendar day
4. Handsontable thinks user clicked "outside" the editor
5. Editor closes immediately!

**Solution:**
```typescript
editor.eventManager = new Handsontable.EventManager(editor.container);
editor.eventManager.addEventListener(document.body, "mousedown", (event) => {
  if ((event.target as HTMLElement).classList.contains("pika-day")) {
    editor.hideDatepicker(editor);
  }
});
```

**Why use `Handsontable.EventManager`?**
- Proper cleanup when editor is destroyed
- Consistent with Handsontable's event handling
- Prevents memory leaks
- `editor.container` is provided by `Handsontable.editors.BaseEditor.factory` helper

### Why `editor.hot.rootDocument.createElement()`?
- Handsontable might be in an iframe or shadow DOM
- `editor.hot.rootDocument` ensures correct document context
- Ensures compatibility across different environments

## Step 7: Editor - Get Date Picker Config (`getDatePickerConfig`)

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
  // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
  // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
  options.isRTL = false;
  
  // Handle date selection
  options.onSelect = function (date) {
    let dateStr;

    if (!isNaN(date.getTime())) {
      dateStr = moment(date).format(editor.getDateFormat(editor));
    }
    editor.setValue(dateStr);

    // Call original onSelect if provided
    if (origOnSelect) {
      origOnSelect.call(editor.pickaday, date);
    }

    // Auto-close on mobile
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
- `keyboardInput: false`: Disable direct keyboard input (we handle it via shortcuts)
- `reposition: false`: Don't auto-reposition (we handle positioning)

**Why `function` instead of arrow function for `onSelect`?**
- `this` context needs to be the Pikaday instance
- Arrow functions don't have their own `this`
- Regular function preserves `this` for `origOnSelect.call(editor.pickaday, date)`

## Step 8: Editor - Show Datepicker (`showDatepicker`)

Initialize and display the Pikaday calendar when the editor opens.

```typescript
showDatepicker(editor, event) {
  const dateFormat = editor.getDateFormat(editor);
  // TODO: view is not exported in the handsontable library d.ts, so we need to use @ts-ignore
  // @ts-ignore
  const isMouseDown = editor.hot.view.isMouseDown();
  const isMeta = event && "keyCode" in event
    ? Handsontable.helper.isFunctionKey((event as KeyboardEvent).keyCode)
    : false;
  let dateStr;

  editor.datePicker.style.display = "block";

  // Create new Pikaday instance
  editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));

  // Configure Moment.js integration if available
  // TODO: useMoment is not exported in the pikaday library d.ts, so we need to use @ts-ignore
  // @ts-ignore
  if (typeof editor.pickaday.useMoment === "function") {
    // @ts-ignore
    editor.pickaday.useMoment(moment);
  }
  // TODO: _onInputFocus is not exported in the pikaday library d.ts, so we need to use @ts-ignore
  // @ts-ignore
  editor.pickaday._onInputFocus = function () {};

  // Handle existing value
  if (editor.originalValue) {
    dateStr = editor.originalValue;

    if (moment(dateStr, dateFormat, true).isValid()) {
      editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
    }

    // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
    if (editor.getValue() !== editor.originalValue) {
      editor.setValue(editor.originalValue);
    }

    if (!isMeta && !isMouseDown) {
      editor.setValue("");
    }
  } else if (editor.cellProperties.defaultDate) {
    dateStr = editor.cellProperties.defaultDate;

    if (moment(dateStr, dateFormat, true).isValid()) {
      editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
    }

    if (!isMeta && !isMouseDown) {
      editor.setValue("");
    }
  } else {
    // if a default date is not defined, set a soft-default-date: display the current day and month in the
    // datepicker, but don't fill the editor input
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
6. Disable input focus handler (we handle focus ourselves)
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

### The `gotoToday()` fallback
- Shows current month/day in calendar
- Doesn't fill the input field
- Provides visual context without forcing a value

## Step 9: Editor - Hide Datepicker (`hideDatepicker`)

Close the Pikaday calendar.

```typescript
hideDatepicker(editor) {
  editor.pickaday.hide();
}
```

**What's happening:**
- Simply calls Pikaday's `hide()` method
- Used when date is selected or editor closes

## Step 10: Editor - After Open Hook (`afterOpen`)

Copy styles from cell to input and show the datepicker.

```typescript
afterOpen(editor, event) {
  copyStyleFromElements(editor.TD, editor.input, [
    "width",
    "height",
    "background",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "color",
    "box-sizing",
  ], ["border-", "padding-", "margin-"]);
  editor.showDatepicker(editor, event);
}
```

**What's happening:**
1. Copy styles from the cell (`editor.TD`) to the input element
2. Copy specific properties (width, height, fonts, colors)
3. Copy all border, padding, and margin properties
4. Show the datepicker

**Why this matters:**
- Makes the input visually match the cell
- Provides seamless editing experience
- User doesn't notice the transition

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- Ensures the input is ready before styling
- The `Handsontable.editors.BaseEditor.factory` helper handles positioning in `open`

## Step 11: Editor - After Close Hook (`afterClose`)

Clean up the Pikaday instance when the editor closes.

```typescript
afterClose(editor) {
  if (editor.pickaday.destroy) {
    editor.pickaday.destroy();
  }
}
```

**What's happening:**
- Called when the editor closes
- Destroys the Pikaday instance to free memory
- Prevents memory leaks

**Why this matters:**
- Pikaday creates DOM elements and event listeners
- Without cleanup, these accumulate over time
- Essential for long-running applications

## Step 12: Editor - Get Value and Set Value

Standard value management methods.

```typescript
getValue(editor) {
  return editor.input.value;
}

setValue(editor, value) {
  editor.input.value = value;
}
```

**What's happening:**
- `getValue`: Returns the current input value (formatted date string)
- `setValue`: Sets the input value (used to initialize editor)

**Why simple?**
- Pikaday automatically updates `input.value` when date is selected
- We just read/write the input value
- Formatting is handled by Pikaday and our `onSelect` callback

## Step 13: Editor - Get Date Format (`getDateFormat`)

Helper method to get the date format for the current cell.

```typescript
getDateFormat(
  editor: FactoryEditorType<EditorPropertiesType, EditorMethodsType>,
) {
  return editor.cellProperties.dateFormat ?? DEFAULT_DATE_FORMAT;
}
```

**What's happening:**
- Gets date format from `cellProperties.dateFormat`
- Falls back to `DEFAULT_DATE_FORMAT` if not specified
- Used by renderer and Pikaday configuration

## Step 14: Editor - Keyboard Shortcuts

Add keyboard navigation for date selection.

```typescript
shortcuts: [
  {
    keys: [["ArrowLeft"]],
    callback: (editor, _event) => {
      //@ts-ignore
      editor.pickaday.adjustDate("subtract", 1);
      _event.preventDefault();
    },
  },
  {
    keys: [["ArrowRight"]],
    callback: (editor, _event) => {
      //@ts-ignore
      editor.pickaday.adjustDate("add", 1);
      _event.preventDefault();
    },
  },
  {
    keys: [["ArrowUp"]],
    callback: (editor, _event) => {
      //@ts-ignore
      editor.pickaday.adjustDate("subtract", 7);
      _event.preventDefault();
    },
  },
  {
    keys: [["ArrowDown"]],
    callback: (editor, _event) => {
      //@ts-ignore
      editor.pickaday.adjustDate("add", 7);
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
- `preventDefault()` prevents default Handsontable behavior

**Why `@ts-ignore`?**
- `adjustDate` is not in Pikaday's TypeScript definitions
- It's a valid Pikaday method, just not typed
- This is a known limitation of the Pikaday types

## Step 15: Editor - Portal Positioning

Use portal positioning for better z-index handling.

```typescript
position: "portal",
```

**What's happening:**
- Editor container is rendered in a portal (outside table DOM)
- Better z-index handling for datepicker
- Prevents clipping issues

**Why portal instead of container?**
- Datepicker can extend beyond cell boundaries
- Portal ensures it's always on top
- Better for complex layouts

## Step 16: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition: Pick<
  CellProperties,
  "renderer" | "validator" | "editor"
> = {
  renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
    td.innerText = moment(new Date(value), cellProperties.renderFormat).format(
      cellProperties.renderFormat,
    );
    return td;
  }),

  editor: Handsontable.editors.BaseEditor.factory<
    EditorPropertiesType,
    EditorMethodsType
  >({
    position: "portal",
    shortcuts: [
      // ... keyboard shortcuts from Step 14
    ],
    init(editor) {
      // ... from Step 6
    },
    getDatePickerConfig(editor) {
      // ... from Step 7
    },
    hideDatepicker(editor) {
      // ... from Step 9
    },
    showDatepicker(editor, event) {
      // ... from Step 8
    },
    afterClose(editor) {
      // ... from Step 11
    },
    afterOpen(editor, event) {
      // ... from Step 10
    },
    getValue(editor) {
      // ... from Step 12
    },
    setValue(editor, value) {
      // ... from Step 12
    },
    getDateFormat(editor) {
      // ... from Step 13
    },
  }),
};
```

**What's happening:**
- **renderer**: Displays formatted date using `cellProperties.renderFormat`
- **editor**: Uses `Handsontable.editors.BaseEditor.factory` helper with all lifecycle methods
- **position**: Portal positioning for better z-index
- **shortcuts**: Keyboard navigation for date selection

**Note:** The `Handsontable.editors.BaseEditor.factory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 17: Use in Handsontable

```typescript
const container = document.querySelector("#example1")!;

const hotOptions: Handsontable.GridSettings = {
  data: [
    { id: 1, itemName: "Lunar Core", restockDate: "2025-08-01" },
    { id: 2, itemName: "Zero Thrusters", restockDate: "2025-09-15" },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Restock Date",
  ],
  autoRowSize: true,
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    {
      data: "itemName",
      type: "text",
      width: 150,
    },
    {
      data: "restockDate",
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US, // Custom property for renderer
      dateFormat: DATE_FORMAT_US,  // Custom property for editor
      correctFormat: true,
      defaultDate: "01/01/2020",
      // datePicker additional options
      // (see https://github.com/dbushell/Pikaday#configuration)
      datePickerConfig: {
        // First day of the week (0: Sunday, 1: Monday, etc)
        firstDay: 0,
        showWeekNumber: true,
        disableDayFn(date) {
          // Disable Sunday and Saturday
          return date.getDay() === 0 || date.getDay() === 6;
        },
      },
    },
  ],
  licenseKey: "non-commercial-and-evaluation",
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `...cellDefinition` - Spreads renderer and editor into the column config
- `renderFormat` - Format for displaying dates in cells
- `dateFormat` - Format for Pikaday date picker
- `datePickerConfig` - Additional Pikaday configuration options
- `defaultDate` - Default date when cell is empty

## How It Works - Complete Flow

1. **Initial Load**: Cell displays formatted date (e.g., "08/01/2025")
2. **User Double-Clicks or F2**: Editor opens, container positioned in portal
3. **After Open**: Styles copied from cell to input, `showDatepicker` called
4. **Show Datepicker**: Pikaday instance created, calendar displayed
5. **User Selects Date**: `onSelect` callback fires, formats date, saves value
6. **User Clicks Day**: Event manager detects click, hides datepicker, finishes editing
7. **After Close**: Pikaday instance destroyed, memory cleaned up
8. **Re-render**: Cell displays updated formatted date

## Migration from Built-in Date Cell Type

If you're currently using the built-in `date` cell type with Pikaday, here's how to migrate:

### Before (Built-in):
```typescript
columns: [{
  data: "restockDate",
  type: "date",
  dateFormat: "MM/DD/YYYY",
  datePickerConfig: {
    firstDay: 0,
  }
}]
```

### After (Custom Editor):
```typescript
columns: [{
  data: "restockDate",
  ...cellDefinition,  // Add the custom cell definition
  dateFormat: "MM/DD/YYYY",
  renderFormat: "MM/DD/YYYY",  // Add render format
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
    data: "restockDate",
    ...cellDefinition,
    renderFormat: "MM/DD/YYYY",  // US format
    dateFormat: "MM/DD/YYYY",
  },
  {
    data: "restockDate",
    ...cellDefinition,
    renderFormat: "DD/MM/YYYY",  // EU format
    dateFormat: "DD/MM/YYYY",
  }
]
```

### 2. Date Range Restrictions

```typescript
datePickerConfig: {
  minDate: new Date("2024-01-01"),
  maxDate: new Date("2024-12-31"),
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
renderer: Handsontable.renderers.factory(({ td, value, cellProperties }) => {
  td.innerText = format(new Date(value), cellProperties.renderFormat);
  return td;
})

// In getDatePickerConfig
options.format = 'MM/DD/YYYY'; // Pikaday format string
```

### 4. Time Picker Support

Pikaday doesn't support time, but you can combine with a time input:

```typescript
init(editor) {
  editor.input = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
  editor.timeInput = editor.hot.rootDocument.createElement("INPUT") as HTMLInputElement;
  editor.timeInput.type = "time";
  // ... rest of init
}

getValue(editor) {
  const date = editor.input.value;
  const time = editor.timeInput.value;
  return `${date} ${time}`;
}
```

### 5. Localization

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

### 6. Custom Styling

```typescript
afterOpen(editor, event) {
  copyStyleFromElements(editor.TD, editor.input, [
    "width",
    "height",
    "background",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "color",
    "box-sizing",
  ], ["border-", "padding-", "margin-"]);
  
  // Add custom styles
  editor.input.style.border = "2px solid #007bff";
  editor.input.style.borderRadius = "4px";
  
  editor.showDatepicker(editor, event);
}
```

## Accessibility

Pikaday has good keyboard support out of the box:

**Keyboard navigation:**
- **Arrow Keys**: Navigate dates (via our shortcuts)
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
4. **Event Manager**: Proper event cleanup prevents memory leaks

### The Show Datepicker Function

```typescript
showDatepicker(editor, event) {
  // Creates new instance each time
  editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));
  // ...
}
```

**Is this expensive?**
- **Fires on**: Editor open (not continuously)
- **DOM creation**: Pikaday creates calendar DOM once
- **Memory**: Instance destroyed in `afterClose`

**Performance verdict**: Very efficient!
- Minimal overhead per edit
- Proper cleanup prevents accumulation
- Portal positioning has no performance impact

---

**Congratulations!** You've created a production-ready Pikaday date picker cell with full customization options, keyboard navigation, and proper lifecycle management. This recipe ensures you can continue using Pikaday even after the built-in date cell type is removed!
