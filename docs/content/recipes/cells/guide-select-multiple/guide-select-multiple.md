---
id: 1c5546c8
title: "Recipe: Multiple Select Dropdown"
metaTitle:  "Recipe: Multiple Select Dropdown - JavaScript Data Grid | Handsontable"
description: Learn how to create a custom Handsontable cell type featuring a searchable, multi-select dropdown using the multiple-select-vanilla library.
permalink: /recipes/select-multiple
canonicalUrl: /recipes/select-multiple
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 44c6adde
  metaTitle: "Recipe: Multiple Select Dropdown - React Data Grid | Handsontable"
angular:
  id: 9b00d73d
  metaTitle: "Recipe: Multiple Select Dropdown - Angular Data Grid | Handsontable"
searchCategory: Recipes
category: Cells
---

# Multiple Select Dropdown Cell - Step-by-Step Guide

[[toc]]


## Overview


This guide shows how to create a custom multi-select dropdown cell using the [multiple-select-vanilla](https://github.com/leviwheatcroft/multiple-select-vanilla) library. Users can select multiple items from a dropdown list, with a clean, searchable interface.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Libraries:** `multiple-select-vanilla`

## What You'll Build

A cell that:
- Displays selected items as comma-separated text
- Opens a searchable multi-select dropdown when edited
- Handles array of objects as values
- Supports per-column option lists
- Provides filtering and selection features

## Prerequisites

```bash
npm install multiple-select-vanilla
```

## Complete Example

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cells/guide-select-multiple/javascript/example1.js)
@[code](@/content/recipes/cells/guide-select-multiple/javascript/example1.ts)

:::

:::

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import multipleSelect from 'multiple-select-vanilla';
import type { MultipleSelectInstance } from 'multiple-select-vanilla';

registerAllModules();
```

**About multiple-select-vanilla:**
- Fork of the popular Multiple Select plugin
- Pure JavaScript, no jQuery dependency
- Rich features: search, select all, keyboard navigation
- Accessible and mobile-friendly

## Step 2: Prepare Your Data

Define the data structure with arrays of objects for multi-select values:

```typescript
const data = [
  {
    id: 1,
    itemName: 'Product A',
    components: [
      { value: 'cpu', label: 'CPU' },
      { value: 'ram', label: 'RAM' }
    ]
  },
  {
    id: 2,
    itemName: 'Product B',
    components: [
      { value: 'gpu', label: 'GPU' }
    ]
  },
];

// Define available options
const components = [
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' },
  { value: 'gpu', label: 'GPU' },
  { value: 'ssd', label: 'SSD' },
  { value: 'hdd', label: 'HDD' },
];
```

**Data structure rationale:**

### Why `{ value, label }` objects?
- **Value**: Unique identifier, stored in database
- **Label**: Display text, shown to user
- **Flexibility**: Value can be ID, label can be localized text

**Example scenarios:**
```typescript
// IDs vs Names
{ value: '123', label: 'John Smith' }

// Codes vs Descriptions
{ value: 'US', label: 'United States' }

// Keys vs Localized Text
{ value: 'save', label: 'Ušetřit peníze' } // Czech
```

### Why arrays in data?
```typescript
components: [
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' }
]
```

- Represents multiple selections
- Easy to iterate and display
- Maps naturally to `<select multiple>`

## Step 3: Create the Renderer

Display selected items as comma-separated text.

```typescript
renderer: rendererFactory(({ td, value }) => {
  td.innerHTML = value.length > 0
    ? value.map((el: { label: string }) => el.label).join(', ')
    : 'No elements';

  return td;
})
```

**What's happening:**

### Array check
```typescript
value.length > 0
```
- Check if any items selected
- Show message if empty

### Extract labels
```typescript
value.map((el: { label: string }) => el.label)
```
- Get only the label from each object
- Example: `[{value: 'cpu', label: 'CPU'}]` → `['CPU']`

### Join with commas
```typescript
.join(', ')
```
- Convert array to string: `['CPU', 'RAM']` → `'CPU, RAM'`

**Enhanced renderer with badges:**
```typescript
renderer: Handsontable.renderers.factor(({ td, value }) => {
  if (!value || value.length === 0) {
    td.innerHTML = '<span style="color: #999;">No selection</span>';

    return td;
  }

  const badges = value
    .map((el: { label: string }) =>
      `<span style="
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #e3f2fd;
        border-radius: 12px;
        font-size: 12px;
        color: #1976d2;
      ">${el.label}</span>`
    )
    .join('');

  td.innerHTML = badges;

  return td;
})
```

## Step 4: Create the Validator (Optional)

```typescript
validator: (value, callback) => {
  // Accept any selection (even empty)
  callback(true);
}
```

**Custom validation examples:**

### Require at least one selection:
```typescript
validator: (value, callback) => {
  callback(Array.isArray(value) && value.length > 0);
}
```

### Limit maximum selections:
```typescript
validator: (value, callback) => {
  callback(Array.isArray(value) && value.length <= 3);
}
```

### Require specific item:
```typescript
validator: (value, callback) => {
  const hasRequired = value.some(el => el.value === 'cpu');

  callback(hasRequired);
}
```

## Step 5: Editor - Initialize (`init`)

Create the select element and initialize the multiple-select plugin.

```typescript
init(editor) {
  // Create select element
  editor.input = editor.hot.rootDocument.createElement('select') as HTMLSelectElement;
  editor.input.setAttribute('multiple', 'multiple');
  editor.input.setAttribute('data-multi-select', '');

  // Initialize multiple select plugin
  editor.multiselect = multipleSelect(editor.input) as MultipleSelectInstance;
}
```

**What's happening:**
1. Create a `<select>` element using `editor.hot.rootDocument.createElement()`
2. Set `multiple` attribute to allow multiple selections
3. Set custom `data-multi-select` attribute for CSS targeting
4. Initialize the multiple-select plugin on the select element
5. The `editorFactory` helper handles container creation and DOM insertion

**Key concepts:**

### The `multiple` attribute
```typescript
editor.input.setAttribute('multiple', 'multiple');
```
- Allows selecting multiple options
- Native HTML5 feature
- Without it, only single selection works

### Custom data attribute
```typescript
editor.input.setAttribute('data-multi-select', '');
```
- Optional marker for CSS targeting
- Helps identify multi-select elements
- Useful for custom styling

### Why initialize plugin in `init()`?
- Called once when editor is created
- Plugin instance is reused across all edits
- Better performance than recreating each time

### Empty `<select></select>` at creation
- No `<option>` elements yet
- Options added in `beforeOpen` method
- Different cells can have different options

## Step 6: Editor - Before Open Hook (`beforeOpen`)

Populate the dropdown with options for the current cell.

```typescript
beforeOpen(editor, { cellProperties }) {
  // Get options for this cell
  editor.input.innerHTML = cellProperties?.selectMultipleOptions?.map((
    el: { value: string; label: string },
  ) => `<option value="${el.value}">${el.label}</option>`).join('');

  // Tell plugin to refresh with new options
  editor.multiselect.refresh();
}
```

**What's happening:**
1. Get options from `cellProperties.selectMultipleOptions`
2. Generate `<option>` elements from the option objects
3. Set the innerHTML of the select element
4. Refresh the plugin to update its UI

**Key points:**
- `beforeOpen` is called before the editor opens
- `cellProperties.selectMultipleOptions` contains column-specific options
- `refresh()` must be called after changing select content
- Allows different columns to have different option lists

**Why generate options in `beforeOpen` not `init`?**
1. **Dynamic options**: Different cells can have different option lists
2. **Data-driven**: Options might depend on other cell values
3. **Performance**: Only create when needed

## Step 7: Editor - After Open Hook (`afterOpen`)

Open the multiselect dropdown when the editor is opened.

```typescript
afterOpen(editor) {
  editor.multiselect.open();
}
```

**What's happening:**
- Called after the editor container is positioned and shown
- Programmatically opens the multiselect dropdown
- User can immediately start selecting options

**Why `afterOpen` instead of `open`?**
- `afterOpen` runs after positioning is complete
- Ensures the select element is ready before opening
- The `editorFactory` helper handles positioning in `open`

**Note:** The `editorFactory` helper automatically positions the editor container over the cell, so we only need to open the dropdown.

## Step 8: Editor - Get Value (`getValue`)

Extract selected items from the dropdown.

```typescript
getValue(editor) {
  return Array.from(editor.input.options).filter((option) =>
    option.selected
  ).map((option) => ({ value: option.value, label: option.label }));
}
```

**What's happening:**
1. Get all options from the select element
2. Filter to keep only selected options
3. Map each option to an object with `value` and `label`
4. Return array of objects matching the data structure

**Breaking it down:**

### Get all options
```typescript
Array.from(editor.input.options)
```
- `editor.input.options` is an HTMLOptionsCollection
- Not a real array, so convert it
- Now we can use array methods

### Filter selected ones
```typescript
.filter((option) => option.selected)
```
- Keep only options where `selected` is `true`
- Native HTML property set by the plugin

### Convert to our data format
```typescript
.map((option) => ({ value: option.value, label: option.label }))
```
- Extract `value` and `label` (text content)
- Return array of objects matching our data structure

**Flow example:**
```
User selects: CPU, RAM

HTML state:
<option value="cpu" selected>CPU</option>
<option value="ram" selected>RAM</option>
<option value="gpu">GPU</option>

getValue() returns:
[
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' }
]
```

## Step 9: Editor - Set Value (`setValue`)

Set which items are selected when editor opens.

```typescript
setValue(editor, value) {
  // Handle Handsontable bug where value might be string
  // https://github.com/handsontable/handsontable/issues/3510
  value = typeof value === 'string' ? editor.originalValue : value;

  // Set selected state for each option
  Array.from(editor.input.options).forEach((option) =>
    option.selected = value.some((el: { value: string }) =>
      el.value === option.value
    )
  );

  // Update plugin UI
  editor.multiselect.refresh();
}
```

**What's happening:**
1. Handle Handsontable bug where rendered string is passed instead of array
2. Use `editor.originalValue` if value is a string
3. Iterate through all options and set `selected` property based on matches
4. Refresh the plugin to update the UI

**Key concepts:**

### The Handsontable quirk
```typescript
value = typeof value === 'string' ? editor.originalValue : value;
```

**Why is this needed?**
- Handsontable sometimes passes the **rendered** value (string) instead of actual value
- Related to [Handsontable issue #3510](https://github.com/handsontable/handsontable/issues/3510)
- `editor.originalValue` has the actual array from the data source
- This workaround ensures we always work with the array

**Without this fix:**
```typescript
// Cell value: [{ value: 'cpu', label: 'CPU' }]
// Renderer shows: 'CPU'
// setValue gets: 'CPU' (string) ❌ should be array
// Fix: Use editor.originalValue instead
```

### The matching logic
```typescript
option.selected = value.some((el: { value: string }) =>
  el.value === option.value
)
```
- `value.some()`: Check if array contains any matching element
- Compare `value` properties
- Set `option.selected` to true/false

**Flow example:**
```
Cell value: [
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' }
]

For each <option>:
  <option value="cpu">  → Check: "cpu" in array? YES → selected = true
  <option value="ram">  → Check: "ram" in array? YES → selected = true
  <option value="gpu">  → Check: "gpu" in array? NO  → selected = false
```

### Refresh UI
```typescript
editor.multiselect.refresh();
```
- Update plugin to show correct selections
- Without this, UI shows old state

## Step 10: Complete Cell Definition

Put it all together:

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = value.length > 0
      ? value.map((el: { label: string }) => el.label).join(', ')
      : 'No elements';
    return td;
  }),
  editor: editorFactory<{input: HTMLSelectElement, multiselect: MultipleSelectInstance}>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('select') as HTMLSelectElement;
      editor.input.setAttribute('multiple', 'multiple');
      editor.input.setAttribute('data-multi-select', '');
      editor.multiselect = multipleSelect(editor.input) as MultipleSelectInstance;
    },
    beforeOpen(editor, { cellProperties }) {
      editor.input.innerHTML = cellProperties?.selectMultipleOptions?.map((
        el: { value: string; label: string },
      ) => `<option value="${el.value}">${el.label}</option>`).join('');
      editor.multiselect.refresh();
    },
    afterOpen(editor) {
      editor.multiselect.open();
    },
    getValue(editor) {
      return Array.from(editor.input.options).filter((option) =>
        option.selected
      ).map((option) => ({ value: option.value, label: option.label }));
    },
    setValue(editor, value) {
      // https://github.com/handsontable/handsontable/issues/3510
      value = typeof value === "string" ? editor.originalValue : value;

      Array.from(editor.input.options).forEach((option) =>
        option.selected = value.some((el: { value: string }) =>
          el.value === option.value
        )
      );

      editor.multiselect.refresh();
    },
  }),
};
```

**What's happening:**
- **renderer**: Displays selected items as comma-separated text
- **editor**: Uses `editorFactory` helper with:
  - `init`: Creates select element and initializes multiple-select plugin
  - `beforeOpen`: Populates options from column config and refreshes plugin
  - `afterOpen`: Opens the multiselect dropdown
  - `getValue`: Returns selected options as array of objects
  - `setValue`: Sets selected state, handles Handsontable bug, refreshes plugin

**Note:** The `editorFactory` helper handles container creation, positioning, and lifecycle management automatically.

## Step 11: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;

const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data: [
    {
      id: 1,
      itemName: 'Lunar Core',
      components: [
        { value: '1', label: 'Component 1' },
        { value: '2', label: 'Component 2' }
      ],
      countries: [
        { value: 'US', label: 'United States of America (the)' }
      ]
    },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Components',
    'Countries',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    {
      data: 'countries',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: countries, // Custom property
    },
    {
      data: 'itemName',
      type: 'text',
    },
    {
      data: 'components',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: components, // Different options!
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key features:**
- Same cell definition for multiple columns
- Different options per column via `selectMultipleOptions`
- Type-safe (with proper TypeScript setup)

## How It Works - Complete Flow

1. **Initial Render**: Cell displays comma-separated labels (e.g., "Component 1, Component 2")
2. **User Double-Clicks or F2**: Editor opens, container positioned over cell
3. **Before Open**: `beforeOpen` populates options from `cellProperties.selectMultipleOptions` and refreshes plugin
4. **After Open**: `afterOpen` opens the multiselect dropdown automatically
5. **Current Values Selected**: Previously selected items are checked in the dropdown
6. **User Changes Selection**: User checks/unchecks options
7. **User Clicks Away or Presses Enter**: Editor closes
8. **GetValue Called**: Returns array of selected objects `[{value: '1', label: 'Component 1'}, ...]`
9. **Validation**: Validator runs (optional, if defined)
10. **Save**: New array saved to cell data
11. **Re-render**: Cell displays updated comma-separated labels

## Plugin Features

Multiple Select Vanilla provides many features out of the box:

### Search/Filter
```typescript
editor.multiselect = multipleSelect(editor.input, {
  filter: true, // Enable search box
  filterPlaceholder: 'Search...'
}) as MultipleSelectInstance;
```

### Select All Button
```typescript
editor.multiselect = multipleSelect(editor.input, {
  selectAll: true, // Add "Select All" checkbox
  selectAllText: 'All Components'
}) as MultipleSelectInstance;
```

### Custom Placeholder
```typescript
editor.multiselect = multipleSelect(editor.input, {
  placeholder: 'Choose components...'
}) as MultipleSelectInstance;
```

### Single Selection Limit
```typescript
editor.multiselect = multipleSelect(editor.input, {
  single: true, // Only one selection allowed
}) as MultipleSelectInstance;
```

### Maximum Selections
```typescript
editor.multiselect = multipleSelect(editor.input, {
  maxHeight: 300, // Dropdown max height
  minimumCountSelected: 3, // Show "3 items selected" instead of names
  countSelected: '# of % selected', // Custom format
}) as MultipleSelectInstance;
```

## Advanced Enhancements

### 1. Dynamic Options Based on Other Cells

```typescript
beforeOpen(editor, { row, cellProperties }) {
  const rowData = editor.hot.getDataAtRow(row);
  const category = rowData.category; // Category column

  // Different options based on category
  let options = cellProperties.selectMultipleOptions;

  if (category === 'Electronics') {
    options = electronicsComponents;
  } else if (category === 'Furniture') {
    options = furnitureComponents;
  }

  editor.input.innerHTML = options.map((el) =>
    `<option value="${el.value}">${el.label}</option>`
  ).join('');

  editor.multiselect.refresh();
}
```

### 2. Grouped Options

```typescript
const groupedOptions = [
  {
    label: 'Hardware',
    children: [
      { value: 'cpu', label: 'CPU' },
      { value: 'ram', label: 'RAM' }
    ]
  },
  {
    label: 'Storage',
    children: [
      { value: 'ssd', label: 'SSD' },
      { value: 'hdd', label: 'HDD' }
    ]
  }
];

beforeOpen(editor, { cellProperties }) {
  editor.input.innerHTML = groupedOptions.map(group =>
    `<optgroup label="${group.label}">
      ${group.children.map(opt =>
        `<option value="${opt.value}">${opt.label}</option>`
      ).join('')}
    </optgroup>`
  ).join('');

  editor.multiselect.refresh();
}
```

### 3. Icons in Options

```typescript
const optionsWithIcons = [
  { value: 'cpu', label: 'CPU', icon: '🔧' },
  { value: 'ram', label: 'RAM', icon: '💾' },
  { value: 'gpu', label: 'GPU', icon: '🎮' },
];

beforeOpen(editor, { cellProperties }) {
  editor.input.innerHTML = optionsWithIcons.map(opt =>
    `<option value="${opt.value}" data-icon="${opt.icon}">
      ${opt.icon} ${opt.label}
    </option>`
  ).join('');

  editor.multiselect.refresh();
}
```

<!--

### 4. Async Options Loading

TODO: prepare actual example how to make this async.

```typescript
async prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  // Show loading state
  editor.input.innerHTML = '<option>Loading...</option>';
  editor.multiselect.refresh();

  // Fetch options from API
  const options = await fetchOptionsFromAPI(cellProperties.optionsEndpoint);

  // Update with real options
  editor.input.innerHTML = options.map(el =>
    `<option value="${el.value}">${el.label}</option>`
  ).join('');

  editor.multiselect.refresh();
}
```

-->

### 4. Save on Every Selection Change

```typescript
afterInit(editor) {
  // Set up change listener after plugin is initialized
  editor.input.addEventListener('change', () => {
    // Auto-save on selection change
    editor.finishEditing();
  });
}
```

**Why `afterInit`?**
- Runs after the plugin is initialized
- Ensures the select element is fully set up
- Event listener attached after plugin creates its UI

## TypeScript Improvements

Add proper type definitions for cell properties:

```typescript
// Extend Handsontable's CellProperties type
declare module 'handsontable/settings' {
  interface CellProperties {
    selectMultipleOptions?: Array<{ value: string; label: string }>;
  }
}

// Now TypeScript knows about selectMultipleOptions
columns: [{
  data: 'components',
  ...cellDefinition,
  selectMultipleOptions: components, // ✅ Fully typed!
}]
```


## Accessibility

Multiple Select Vanilla has good accessibility support:

```typescript
editor.multiselect = multipleSelect(editor.input, {
  ariaLabel: 'Select components',
  ariaPlaceholder: 'No components selected'
}) as MultipleSelectInstance;
```

**Keyboard shortcuts:**
- **Arrow Up/Down**: Navigate options
- **Space**: Toggle selection
- **Enter**: Close dropdown (save)
- **Escape**: Close dropdown (cancel)
- **Type to search**: Filter options


---

**Congratulations!** You've created a powerful multi-select cell with search, keyboard navigation, and full customization options!
