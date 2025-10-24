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
  - recipies
react:
  id: 44c6adde
  metaTitle: Custom builds - React Data Grid | Handsontable
angular:
  id: 9b00d73d
  metaTitle: Custom builds - Angular Data Grid | Handsontable
searchCategory: Recepies
category: Cells
---

# Multiple Select Dropdown Cell - Step-by-Step Guide

[[toc]]


## Overview

TBA

<!--


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

## Step 1: Import Dependencies

```typescript
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";
import { editorBaseFactory, rendererFactory } from "./src/factories";

// Multiple select library
import { multipleSelect, MultipleSelectInstance } from "multiple-select-vanilla";
import "multiple-select-vanilla/dist/styles/css/multiple-select.css";

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
    itemName: "Product A", 
    components: [
      { value: "cpu", label: "CPU" },
      { value: "ram", label: "RAM" }
    ]
  },
  { 
    id: 2, 
    itemName: "Product B", 
    components: [
      { value: "gpu", label: "GPU" }
    ]
  },
];

// Define available options
const components = [
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" },
  { value: "gpu", label: "GPU" },
  { value: "ssd", label: "SSD" },
  { value: "hdd", label: "HDD" },
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
{ value: "123", label: "John Smith" }

// Codes vs Descriptions
{ value: "US", label: "United States" }

// Keys vs Localized Text
{ value: "save", label: "Сохранить" } // Russian
```

### Why arrays in data?
```typescript
components: [
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" }
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
    ? value.map((el: { label: string }) => el.label).join(", ")
    : "No elements";
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
- Example: `[{value: "cpu", label: "CPU"}]` → `["CPU"]`

### Join with commas
```typescript
.join(", ")
```
- Convert array to string: `["CPU", "RAM"]` → `"CPU, RAM"`

**Enhanced renderer with badges:**
```typescript
renderer: rendererFactory(({ td, value }) => {
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
    .join("");
  
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

## Step 5: Editor - Define Types

```typescript
editor: editorBaseFactory<{
  wrapper: HTMLDivElement;
  input: HTMLSelectElement;
  multiselect: MultipleSelectInstance;
}>({
  // ... methods
})
```

**Type breakdown:**
- `wrapper` - Container div for positioning
- `input` - The `<select multiple>` element
- `multiselect` - Multiple Select plugin instance

**Why keep the plugin instance?**
- Need to call methods: `open()`, `refresh()`, `destroy()`
- Access current state
- Update options dynamically

## Step 6: Editor - Initialize (`init`)

Create the DOM structure and initialize the plugin.

```typescript
init(editor) {
  // Create wrapper div
  editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
  editor.wrapper.style.display = "none";
  editor.wrapper.classList.add("htSelectEditor");
  
  // Create select element
  editor.input = editor.hot.rootDocument.createElement("SELECT") as HTMLSelectElement;
  editor.input.setAttribute("multiple", "multiple");
  editor.input.setAttribute("data-multi-select", "");
  
  // Assemble DOM
  editor.wrapper.appendChild(editor.input);
  editor.hot.rootElement.appendChild(editor.wrapper);
  
  // Initialize multiple select plugin
  editor.multiselect = multipleSelect(editor.input) as MultipleSelectInstance;
}
```

**Key concepts:**

### The `multiple` attribute
```typescript
editor.input.setAttribute("multiple", "multiple");
```
- Allows selecting multiple options
- Native HTML5 feature
- Without it, only single selection works

### Custom data attribute
```typescript
editor.input.setAttribute("data-multi-select", "");
```
- Optional marker for CSS targeting
- Helps identify multi-select elements
- Useful for custom styling

### Why initialize plugin in `init()`?
- Called once when editor is created
- Plugin instance is reused
- Better performance than recreating

### Empty `<select></select>` at creation
- No `<option>` elements yet
- Options added in `prepare()` method
- Different cells can have different options

## Step 7: Editor - Prepare (`prepare`)

Populate the dropdown with options for the current cell.

```typescript
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  // Get options for this cell
  editor.input.innerHTML = cellProperties?.selectMultipleOptions?.map((
    el: { value: string; label: string },
  ) => `<option value="${el.value}">${el.label}</option>`).join("");
  
  // Tell plugin to refresh with new options
  editor.multiselect.refresh();
}
```

**What's happening:**

### Read cell-specific options
```typescript
cellProperties?.selectMultipleOptions
```
- Custom property set in column configuration
- Different columns can have different options
- Optional chaining handles missing property

### Generate `<option>` elements
```typescript
.map((el: { value: string; label: string }) => 
  `<option value="${el.value}">${el.label}</option>`
)
```
- Convert option objects to HTML
- Each option has value (stored) and text (displayed)

### The `refresh()` method
```typescript
editor.multiselect.refresh();
```
- Tells plugin "options have changed, update UI"
- Without this, plugin shows old options
- Must be called after changing `<select>` content

**Why generate options in `prepare()` not `init()`?**
1. **Dynamic options**: Different cells can have different option lists
2. **Data-driven**: Options might depend on other cell values
3. **Performance**: Only create when needed

**Example of dynamic options:**
```typescript
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  // Get options based on another column's value
  const rowData = editor.hot.getDataAtRow(row);
  const category = rowData.category;
  
  // Different options for different categories
  const options = category === 'electronics' 
    ? electronicsComponents 
    : furnitureComponents;
  
  editor.input.innerHTML = options.map((el) => 
    `<option value="${el.value}">${el.label}</option>`
  ).join("");
  
  editor.multiselect.refresh();
}
```

## Step 8: Editor - Get Value (`getValue`)

Extract selected items from the dropdown.

```typescript
getValue(editor) {
  return Array.from(editor.input.options).filter((option) =>
    option.selected
  ).map((option) => ({ value: option.value, label: option.label }));
}
```

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
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" }
]
```

## Step 9: Editor - Set Value (`setValue`)

Set which items are selected when editor opens.

```typescript
setValue(editor, value) {
  // Handle Handsontable bug where value might be string
  value = typeof value === "string" ? editor.originalValue : value;
  
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

**Key concepts:**

### The Handsontable quirk
```typescript
value = typeof value === "string" ? editor.originalValue : value;
```

**Why is this needed?**
- Handsontable sometimes passes the **rendered** value (string) instead of actual value
- Related to [Handsontable issue #3510](https://github.com/handsontable/handsontable/issues/3510)
- `editor.originalValue` has the actual array from the data source
- This workaround ensures we always work with the array

**Without this fix:**
```typescript
// Cell value: [{ value: "cpu", label: "CPU" }]
// Renderer shows: "CPU"
// setValue gets: "CPU" (string) ❌ should be array
// Fix: Use editor.originalValue instead
```

### Check each option
```typescript
Array.from(editor.input.options).forEach((option) => ...)
```
- Iterate through all options
- Set `selected` property for matching ones

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
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" }
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

## Step 10: Editor - Open (`open`)

Position the editor and open the dropdown.

```typescript
open(editor) {
  const rect = editor.getEditedCellRect();
  editor.wrapper.style =
    `display: block;
     min-height: 200px;
     border: none;
     box-sizing: border-box;
     margin: 0;
     padding: 0 4px;
     position: absolute;
     top: ${rect.top}px;
     left: ${rect.start}px;
     width: ${rect.width}px;
     height: ${rect.height}px;`;
  
  editor.multiselect.open();
}
```

**Key styling:**

### `min-height: 200px`
```typescript
min-height: 200px;
```
- Ensures dropdown has space to show options
- Otherwise might be squished to cell height
- Allows plugin to display its UI properly

**Why not set `height: 200px`?**
- `min-height` allows growth if needed
- `height: ${rect.height}px` would constrain to cell height
- Plugin positions its dropdown absolutely anyway

### The `open()` method
```typescript
editor.multiselect.open();
```
- Programmatically opens the dropdown
- Like user clicking on it
- Shows options list immediately

**User experience:**
1. User double-clicks cell
2. Editor positions over cell
3. Dropdown opens automatically
4. User can immediately start selecting

## Step 11: Editor - Focus and Close

```typescript
focus(editor) {
  editor.input.focus();
}

close(editor) {
  editor.wrapper.style.display = "none";
}
```

**Focus method:**
- Called when validation fails
- Keeps editor open
- User can try again

**Close method:**
- Hide wrapper
- Plugin handles its own dropdown closing
- No need to explicitly close plugin

## Step 12: Complete Cell Definition

```typescript
const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = value.length > 0
      ? value.map((el: { label: string }) => el.label).join(", ")
      : "No elements";
    return td;
  }),
  
  editor: editorBaseFactory<{
    wrapper: HTMLDivElement;
    input: HTMLSelectElement;
    multiselect: MultipleSelectInstance;
  }>({
    init(editor) {
      editor.wrapper = editor.hot.rootDocument.createElement("DIV") as HTMLDivElement;
      editor.wrapper.style.display = "none";
      editor.wrapper.classList.add("htSelectEditor");
      
      editor.input = editor.hot.rootDocument.createElement("SELECT") as HTMLSelectElement;
      editor.input.setAttribute("multiple", "multiple");
      editor.input.setAttribute("data-multi-select", "");
      
      editor.wrapper.appendChild(editor.input);
      editor.hot.rootElement.appendChild(editor.wrapper);
      
      editor.multiselect = multipleSelect(editor.input) as MultipleSelectInstance;
    },
    
    prepare(editor, row, col, prop, td, originalValue, cellProperties) {
      editor.input.innerHTML = cellProperties?.selectMultipleOptions?.map((
        el: { value: string; label: string },
      ) => `<option value="${el.value}">${el.label}</option>`).join("");
      editor.multiselect.refresh();
    },
    
    getValue(editor) {
      return Array.from(editor.input.options)
        .filter((option) => option.selected)
        .map((option) => ({ value: option.value, label: option.label }));
    },
    
    setValue(editor, value) {
      value = typeof value === "string" ? editor.originalValue : value;
      Array.from(editor.input.options).forEach((option) =>
        option.selected = value.some((el: { value: string }) =>
          el.value === option.value
        )
      );
      editor.multiselect.refresh();
    },
    
    open(editor) {
      const rect = editor.getEditedCellRect();
      editor.wrapper.style = `
        display: block;
        min-height: 200px;
        border: none;
        box-sizing: border-box;
        margin: 0;
        padding: 0 4px;
        position: absolute;
        top: ${rect.top}px;
        left: ${rect.start}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
      `;
      editor.multiselect.open();
    },
    
    focus(editor) {
      editor.input.focus();
    },
    
    close(editor) {
      editor.wrapper.style.display = "none";
    },
  }),
};
```

## Step 13: Use in Handsontable

```typescript
const components = [
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" },
  { value: "gpu", label: "GPU" },
  { value: "ssd", label: "SSD" },
];

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
];

new Handsontable(container, {
  data: [
    { 
      id: 1, 
      itemName: "Product A",
      components: [
        { value: "cpu", label: "CPU" },
        { value: "ram", label: "RAM" }
      ],
      countries: [
        { value: "us", label: "United States" }
      ]
    },
  ],
  colHeaders: [
    "ID",
    "Item Name",
    "Components",
    "Countries",
  ],
  rowHeaders: true,
  columns: [
    { data: "id", type: "numeric", width: 150 },
    { data: "itemName", type: "text", width: 150 },
    {
      data: "components",
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: components, // Custom property
    },
    {
      data: "countries",
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: countries, // Different options!
    },
  ],
  licenseKey: "non-commercial-and-evaluation",
});
```

**Key features:**
- Same cell definition for multiple columns
- Different options per column
- Type-safe (with proper TypeScript setup)

## How It Works - Complete Flow

1. **Initial Render**: Cell shows "CPU, RAM"
2. **User Double-Clicks**: Editor opens over cell
3. **Prepare Called**: Options populated from `selectMultipleOptions`
4. **Dropdown Opens**: Plugin shows searchable list
5. **Current Values Selected**: CPU and RAM are checked
6. **User Changes Selection**: Checks GPU, unchecks RAM
7. **User Clicks Away**: Editor closes
8. **GetValue Called**: Returns `[{value: "cpu", ...}, {value: "gpu", ...}]`
9. **Validation**: Validator runs (optional)
10. **Save**: New array saved to data
11. **Re-render**: Cell shows "CPU, GPU"

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
prepare(editor, row, col, prop, td, originalValue, cellProperties) {
  const rowData = editor.hot.getDataAtRow(row);
  const category = rowData[1]; // Category column
  
  // Different options based on category
  let options = cellProperties.selectMultipleOptions;
  if (category === 'Electronics') {
    options = electronicsComponents;
  } else if (category === 'Furniture') {
    options = furnitureComponents;
  }
  
  editor.input.innerHTML = options.map((el) =>
    `<option value="${el.value}">${el.label}</option>`
  ).join("");
  
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

prepare(editor, ...) {
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

prepare(editor, ...) {
  editor.input.innerHTML = optionsWithIcons.map(opt =>
    `<option value="${opt.value}" data-icon="${opt.icon}">
      ${opt.icon} ${opt.label}
    </option>`
  ).join('');
  
  editor.multiselect.refresh();
}
```

### 4. Async Options Loading

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

### 5. Save on Every Selection Change

```typescript
init(editor) {
  // ... existing code ...
  
  editor.input.addEventListener('change', () => {
    // Auto-save on selection change
    editor.finishEditing();
  });
}
```

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

## Troubleshooting

### Dropdown not showing
- **Problem**: `min-height` not set
- **Solution**: Set `min-height: 200px` on wrapper in `open()`

### Options not updating
- **Problem**: Forgot to call `refresh()`
- **Solution**: Call `editor.multiselect.refresh()` after changing options

### Wrong values saved
- **Problem**: Not handling string value bug
- **Solution**: Add `value = typeof value === "string" ? editor.originalValue : value;`

### Dropdown closes immediately
- **Problem**: Click-outside detection
- **Solution**: Multiple Select handles this, but ensure proper z-index

### Plugin throws errors
- **Problem**: Plugin not properly initialized
- **Solution**: Check that `multipleSelect()` is called in `init()`

## Performance Considerations

### Large Option Lists

For 100+ options:

```typescript
// Enable virtual scrolling (if supported by library)
editor.multiselect = multipleSelect(editor.input, {
  maxHeight: 300,
  filter: true, // Essential for large lists
  filterPlaceholder: 'Search...'
}) as MultipleSelectInstance;
```

### Avoid Recreating Plugin

```typescript
// ❌ Don't do this
open(editor) {
  editor.multiselect.destroy();
  editor.multiselect = multipleSelect(editor.input);
  editor.multiselect.open();
}

// ✅ Do this
open(editor) {
  editor.multiselect.open(); // Reuse existing instance
}
```

## Comparison: Multiple Select vs Native `<select multiple>`

| Feature | Multiple Select | Native `<select>` |
|---------|----------------|-------------------|
| Search/filter | ✅ Built-in | ❌ None |
| Select all | ✅ Built-in | ❌ Manual |
| Visual design | ✅ Modern | ⚠️ Browser-dependent |
| Mobile UX | ✅ Good | ✅ Native |
| Keyboard nav | ✅ Full | ✅ Native |
| Bundle size | ⚠️ ~15KB | ✅ 0KB |
| Accessibility | ✅ Good | ✅ Native |
| Customization | ✅ Extensive | ❌ Limited |

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

## Complete Example

See the full working example in [select-multiple.html](./select-multiple.html) and [select-multiple.ts](./select-multiple.ts).

## Next Steps

- Review [color picker](./guide-color-picker.md) for single-value selections
- Check [input range](./guide-input-range.md) for numeric sliders
- Read [general documentation](./new-cell-definitions.md) for more patterns

---

**Congratulations!** You've created a powerful multi-select cell with search, keyboard navigation, and full customization options!


-->