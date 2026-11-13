---
type: how-to
title: Migrating from 17.1 to 18.0
metaTitle: Migrating from 17.1 to 18.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 17.1 to Handsontable 18.0 -- remove Moment.js, Pikaday, Numbro.js, and DOMPurify dependencies, install HyperFormula separately, and update TypeScript imports and removed type exports.
permalink: /migration-from-17.1-to-18.0
canonicalUrl: /migration-from-17.1-to-18.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 17.1 to 18.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 17.1 to 18.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 17.1 to 18.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

Migrate from Handsontable 17.1 to Handsontable 18.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

## 1. Replace `handsontable/common` imports

The `handsontable/common` subpath is removed in version 18.0. It was never part of the official public API reference, but some docs examples and projects imported TypeScript types from it directly.

Not every type has the same replacement. Nine types are now exported from `handsontable` or `handsontable/settings`, and four no longer exist.

### Who is affected

You are affected if your TypeScript source files contain any of these import patterns:

```typescript
import type { ... } from 'handsontable/common';
import { ... } from 'handsontable/common';
```

### How to migrate

Version 17.1 exported 13 types from `handsontable/common`. The table below lists each of them with its 18.0 replacement. If you use [tree shaking](@/guides/tools-and-building/modules/modules.md), import the types that `handsontable` exports from `handsontable/base` instead. Both entry points export the same set of these types.

| Type | 18.0 import |
| --- | --- |
| `CellValue` | `handsontable`. The type is now `unknown` instead of `any` (see [`CellValue` is now `unknown`](#cellvalue-is-now-unknown)). |
| `CellChange` | `handsontable` |
| `RowObject` | `handsontable` |
| `SelectOptionsObject` | `handsontable` |
| `SourceRowData` | `handsontable` |
| `ChangeSource` | `handsontable` |
| `RangeType` | `handsontable` |
| `OverlayType` | `handsontable` |
| `ColumnDataGetterSetterFunction` | `handsontable/settings`. `handsontable` and `handsontable/base` don't export it. |
| `SimpleCellCoords` | Removed. Use `{ row: number; col: number }`. The `CellCoords` class doesn't match this shape, because its `row` and `col` can be `null`. |
| `NumericFormatOptions` | Removed. Use `Intl.NumberFormat` options: `Intl.NumberFormatOptions`. |
| `NumbroFormatOptions` | Removed, together with Numbro.js. Use `Intl.NumberFormatOptions`. See [step 2](#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat). |
| `LabelOptions` | Removed, with no replacement. Declare the shape that you need. |

Types such as `GridSettings`, `Events`, `HotInstance`, `CellCoords`, and `CellRange` were never part of `handsontable/common`. Import them from `handsontable`.

**Before:**

```typescript
import type { RowObject, CellChange } from 'handsontable/common';
import type { ColumnDataGetterSetterFunction } from 'handsontable/common';
```

**After:**

```typescript
import type { RowObject, CellChange } from 'handsontable';
import type { ColumnDataGetterSetterFunction } from 'handsontable/settings';
```

Or, if you use the base module with tree shaking:

```typescript
import type { RowObject, CellChange } from 'handsontable/base';
```

### `CellValue` is now `unknown`

In version 17.1, `CellValue` was `any`. In version 18.0, it is `unknown`. Code that used a `CellValue` without checking its type stops compiling with `TS18046`.

```typescript
// Before (17.x)
import type { CellValue } from 'handsontable/common';

function format(value: CellValue) {
  return value.toFixed(2); // compiled, because CellValue was `any`
}

// After (18.0)
import type { CellValue } from 'handsontable';

function formatBroken(value: CellValue) {
  return value.toFixed(2); // TS18046: 'value' is of type 'unknown'
}

// Fix: narrow the value
function formatNarrowed(value: CellValue) {
  return typeof value === 'number' ? value.toFixed(2) : String(value);
}
```

If you know the type of the data, you can also cast the value: `(value as number).toFixed(2)`.

### Quick fix with search and replace

To migrate most of a project at once, run a global find-and-replace in your editor or IDE:

**Find:**
```
from 'handsontable/common'
```

**Replace:**
```
from 'handsontable'
```

If you use double quotes:

**Find:**
```
from "handsontable/common"
```

**Replace:**
```
from "handsontable"
```

After the replacement, the TypeScript compiler reports `TS2614` for the names that `handsontable` doesn't export: `ColumnDataGetterSetterFunction`, `SimpleCellCoords`, `NumericFormatOptions`, `NumbroFormatOptions`, and `LabelOptions`. Fix them with the table above.

::: tip

If you use `handsontable/base` throughout your project, replace `'handsontable'` in the replacement above with `'handsontable/base'`.

:::

For a full reference of all exported types and usage examples, see [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md).

## 2. Migrate numeric format from Numbro.js `pattern` and `culture` to `Intl.NumberFormat`

Handsontable 18.0 removes the Numbro.js library. The `numericFormat.pattern` and `numericFormat.culture` options no longer work.

### Who is affected

You are affected if your Handsontable configuration uses `numericFormat` with a `pattern` or `culture` property:

```javascript
numericFormat: {
  pattern: '0,0.00 $',
  culture: 'de-DE'
}
```

### How to migrate

Replace `pattern` and `culture` with `Intl.NumberFormat` options, and move the locale to the top-level `locale` option.

**Before:**

```javascript
columns: [{
  type: 'numeric',
  numericFormat: {
    pattern: '0,0.00 $',
    culture: 'de-DE'
  }
}]
```

**After:**

```javascript
columns: [{
  type: 'numeric',
  locale: 'de-DE',
  numericFormat: {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }
}]
```

Common `Intl.NumberFormat` style values:

| Style | Use case | Required extra option |
| --- | --- | --- |
| `'decimal'` | Plain numbers with grouping separators | -- |
| `'currency'` | Currency amounts | `currency: 'USD'` (ISO 4217 code) |
| `'percent'` | Percentage values | -- |
| `'unit'` | Physical measurements | `unit: 'kilometer'` (unit identifier) |

For the full list of options, see the [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) guide and [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options).

## 3. Migrate date and time cells to ISO 8601 format

Handsontable 18.0 removes Moment.js and Pikaday. The legacy `date` cell type (moment.js-based string `dateFormat`) and the legacy `time` cell type (moment.js-based string `timeFormat`) still accept the `date` and `time` keys as aliases, but their underlying implementations now use `Intl.DateTimeFormat` and require ISO 8601 source data.

### Who is affected

You are affected if any of the following apply:

- Your data source stores dates in non-ISO format (for example, `'15/05/2023'` or `'May 15, 2023'`).
- You use the `date` cell type with a string `dateFormat` (for example, `dateFormat: 'DD/MM/YYYY'`).
- You use the `time` cell type with a string `timeFormat` (for example, `timeFormat: 'h:mm:ss a'`).
- You use `datePickerConfig` (Pikaday-specific options).
- Your filters or sort operations rely on Moment.js to parse date strings.

### How to migrate -- date cells

**Before:**

```javascript
columns: [{
  type: 'date',
  dateFormat: 'DD/MM/YYYY'
}]

// Data (old format)
data: [
  { date: '15/05/2023' },
  { date: '22/09/2024' }
]
```

**After:**

```javascript
columns: [{
  type: 'intl-date',
  locale: 'en-GB',
  dateFormat: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
}]

// Data must be ISO 8601
data: [
  { date: '2023-05-15' },
  { date: '2024-09-22' }
]
```

The `date` key is the canonical name. The `intl-date` key is an alias for backward compatibility and continues to work without a warning, so you can migrate the data format and display format independently.

### How to migrate -- time cells

**Before:**

```javascript
columns: [{
  type: 'time',
  timeFormat: 'h:mm:ss a'
}]

// Data (old format)
data: [{ start: '2:30:00 PM' }]
```

**After:**

```javascript
columns: [{
  type: 'intl-time',
  locale: 'en-US',
  timeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
}]

// Data must be 24-hour format
data: [{ start: '14:30:00' }]
```

The `time` key is the canonical name. The `intl-time` key is an alias for backward compatibility and continues to work without a warning.

### Sorting and filtering dates

Filters and sort operations now require date values in ISO 8601 format (`YYYY-MM-DD`). If your data source stored dates in another format, convert the values before passing them to Handsontable.

### `correctFormat` option

The `correctFormat` option (which auto-corrected entered date and time values to match a Moment.js format string) is removed. The `date`, `time`, `intl-date`, and `intl-time` cell types work with ISO 8601 values and do not reformat input. Remove `correctFormat` from your configuration. To normalize or correct entered values, use the [`valueParser`](@/api/options.md#valueparser) or [`valueSetter`](@/api/options.md#valuesetter) options.

### `datePickerConfig` option

The `datePickerConfig` option (which passed options to Pikaday) no longer has any effect. The `date` and `intl-date` cell types use the browser's native date input. Remove `datePickerConfig` from your configuration.

## 4. Replace built-in DOMPurify with a custom sanitizer

Handsontable 18.0 removes the built-in DOMPurify dependency. HTML passed to the following surfaces is no longer sanitized automatically:

- `colHeaders`, `rowHeaders`, and `nestedHeaders` labels
- Context menu item labels
- HTML pasted from the clipboard
- Dialog and notification content
- Select editor dropdown option values
- `password` cells whose displayed value carries markup, through a custom `valueFormatter` or a `hashSymbol`

### Who is affected

You are affected if any of the following apply:

- You pass user-supplied or third-party HTML in `colHeaders`, `rowHeaders`, `nestedHeaders` labels, context-menu labels, or select editor `selectOptions`.
- You relied on Handsontable to strip `<script>` tags or event handlers from HTML passed to those surfaces.
- You use the `sanitizer` option or test sanitization behavior.

### How to migrate

If you pass untrusted HTML to headers or other configuration options, supply your own sanitizer via the [`sanitizer`](@/api/options.md#sanitizer) option. The function receives the raw HTML string and returns a sanitized string.

**Before (automatic DOMPurify behavior):**

```javascript
// DOMPurify was applied automatically in 17.x -- no configuration needed
new Handsontable(container, {
  colHeaders: ['<b>Name</b>', '<b>Score</b>', '<i>Status</i>']
});
```

**After (explicit sanitizer required):**

```javascript
import DOMPurify from 'dompurify';

new Handsontable(container, {
  sanitizer: (html) => DOMPurify.sanitize(html),
  colHeaders: ['<b>Name</b>', '<b>Score</b>', '<i>Status</i>']
});
```

You can use any sanitization library or write your own sanitizer function. The `sanitizer` option was introduced in version 17.0, so you can add it before upgrading to 18.0 to prepare your project.

::: warning
If you render untrusted user HTML without a `sanitizer`, your users are exposed to XSS attacks. Always sanitize untrusted HTML content.
:::

## 5. Update theme wrapper border variables

Handsontable 18.0 simplifies the table border theme variables. The `--ht-wrapper-border-radius` variable is renamed to `--ht-border-radius` (JS token `borderRadius`), and the `--ht-wrapper-border-width` and `--ht-wrapper-border-color` variables (JS tokens `wrapperBorderWidth` and `wrapperBorderColor`) are removed. Their defaults were `0px` and the base border color, so by default the table rendered no wrapper border.

### Who is affected

You are affected if any of the following apply:

- Your CSS overrides `--ht-wrapper-border-radius`, `--ht-wrapper-border-width`, or `--ht-wrapper-border-color`.
- You pass `wrapperBorderRadius`, `wrapperBorderWidth`, or `wrapperBorderColor` tokens to `registerTheme()` or `params()`.

### How to migrate

Rename the radius variable. Replace the removed width and color variables with a CSS `box-shadow` on the root wrapper (`.ht-root-wrapper`) if you relied on a visible wrapper border.

**Before:**

```css
.ht-theme-main {
  --ht-wrapper-border-radius: 8px;
  --ht-wrapper-border-width: 1px;
  --ht-wrapper-border-color: #a0aec0;
}
```

**After:**

```css
.ht-theme-main {
  --ht-border-radius: 8px;
}

/* Restore a visible wrapper border, if needed */
.ht-theme-main.ht-root-wrapper {
  box-shadow: 0 0 0 1px #a0aec0;
}
```

Handsontable puts the theme class on `.ht-root-wrapper` itself, so join the two classes without a space. Use an outer `box-shadow`, not an `inset` one: the outer shadow stays visible around the whole grid, including over frozen columns, while an `inset` shadow is hidden under the grid cells.

For the JS theme API, rename `wrapperBorderRadius` to `borderRadius` and remove `wrapperBorderWidth` and `wrapperBorderColor`.

**Before:**

```javascript
registerTheme('my-theme', {
  tokens: {
    wrapperBorderRadius: '8px',
    wrapperBorderWidth: '1px',
    wrapperBorderColor: ['colors.palette.200', 'colors.palette.700']
  }
});
```

**After:**

```javascript
registerTheme('my-theme', {
  tokens: {
    borderRadius: '8px'
  }
});
```

## 6. Update CSS selectors and DOM queries for the new wrapper structure

Handsontable 18.0 adds wrapper layout slots and a `layout` option that controls the order of UI elements rendered around the grid, such as pagination and dialogs. To support this, the built-in UI now mounts into dedicated wrapper containers, which changes the DOM structure that Handsontable renders around the grid.

The grid table itself is unchanged. Only the container elements between your root element and the grid table are different.

### Who is affected

You are affected if any of the following apply:

- Your CSS targets Handsontable's wrapper elements with direct-child (`>`), `:first-child`, `:only-child`, or `:nth-child()` selectors.
- Your JavaScript queries the DOM relative to `.ht-root-wrapper` or `.ht-grid` (for example, with `querySelector` or `children`).
- You traverse the DOM from the grid root element with a fixed number of `parentNode` or `firstElementChild` steps.

### What changed

**Before (17.1):**

```html
<div class="ht-root-wrapper">
  <div class="ht-grid">
    <div class="ht-wrapper handsontable"></div>
  </div>
</div>
```

**After (18.0):**

```html
<div class="ht-root-wrapper">
  <div class="ht-slot-top"></div>
  <div class="ht-grid">
    <div class="ht-grid-content">
      <div class="ht-wrapper handsontable"></div>
    </div>
  </div>
  <div class="ht-slot-bottom"></div>
  <div class="ht-overlay"></div>
</div>
```

Two changes can break existing selectors:

- A new `.ht-grid-content` element wraps the grid root element inside `.ht-grid`.
- New sibling containers (`.ht-slot-top`, `.ht-slot-bottom`, and `.ht-overlay`) are added inside `.ht-root-wrapper`, so `.ht-grid` is no longer the only child.

### How to migrate

Update selectors that assumed the old structure. Account for the new `.ht-grid-content` wrapper and the new sibling containers.

**Before:**

```css
.ht-root-wrapper > .ht-grid > .handsontable {
  border: 1px solid #a0aec0;
}

.ht-root-wrapper > :first-child {
  margin-top: 0;
}
```

**After:**

```css
.ht-grid-content > .handsontable {
  border: 1px solid #a0aec0;
}

.ht-grid {
  margin-top: 0;
}
```

For DOM queries, target the grid root element by its class instead of by position:

**Before:**

```javascript
const grid = wrapper.querySelector('.ht-grid').firstElementChild;
```

**After:**

```javascript
const grid = wrapper.querySelector('.ht-wrapper.handsontable');
```

Use class-based selectors instead of positional ones, so future layout slot additions do not break your code.

## 7. Install HyperFormula separately

Starting with Handsontable 18.0, the `handsontable` npm package no longer lists HyperFormula as a dependency. In 17.1 and earlier, it was an optional dependency, so your package manager usually installed it together with Handsontable, and your code could import it without a separate install. Version 17.0 deprecated this behavior, and version 18.0 completes the removal.

This change keeps HyperFormula, which is licensed separately, out of projects that don't use formulas. You also choose the HyperFormula version that fits your project.

### Who is affected

You are affected if you install Handsontable from npm, import it as an ES or CommonJS module, and use the [`Formulas`](@/api/formulas.md) plugin. That is, your configuration contains `formulas: { engine: ... }`, or your code imports `hyperformula`, which the Handsontable installation used to provide.

If your project doesn't use formulas, you don't need to change anything.

If you upgrade without installing HyperFormula, your `hyperformula` import fails with a "module not found" error from your bundler or runtime.

The UMD bundle `handsontable.full.js` (and its minified `handsontable.full.min.js`) still includes HyperFormula in 18.0. This step doesn't apply if you load that file.

### How to migrate

1. Install HyperFormula:

   ```bash
   npm install hyperformula
   ```

   Pick the HyperFormula version that matches your Handsontable version. For the compatible versions, see [HyperFormula version support](@/guides/formulas/formula-calculation/formula-calculation.md#hyperformula-version-support).

2. Keep your existing import and `formulas.engine` configuration. They stay the same:

   ```javascript
   import Handsontable from 'handsontable';
   import { HyperFormula } from 'hyperformula';

   const hot = new Handsontable(container, {
     data: [['=1+2']],
     formulas: {
       engine: HyperFormula,
     },
     licenseKey: 'non-commercial-and-evaluation',
   });
   ```

3. Check the HyperFormula license. HyperFormula is licensed separately from Handsontable. To set your own HyperFormula license key, see [License HyperFormula](@/guides/formulas/installation/installation.md#license-hyperformula).

For other ways to connect the engine, such as a pre-built instance shared between grids, see [Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods).

## 8. Replace removed plugin type exports

Handsontable 18.0 removes 110 exports from 39 plugin entry points (`handsontable/plugins/<name>`): 109 types and the `ColumnSorting` class that `multiColumnSorting` re-exported. The 18.0 type declarations list only the plugin class, the plugin constants, and a few named types. The removed names include `Settings` (38 entry points) and `DetailedSettings` (19 entry points).

### Who is affected

You are affected if your TypeScript source files import a type from a plugin entry point, or use the `Handsontable.plugins.<PluginName>.<Type>` namespace path:

```ts
import type { Settings } from 'handsontable/plugins/columnSorting';
import type { DetailedSettings } from 'handsontable/plugins/hiddenRows';

type SortSettings = Handsontable.plugins.ColumnSorting.Settings;
```

After you upgrade, the TypeScript compiler reports `TS2305` for the import (`Module '"handsontable/plugins/columnSorting"' has no exported member 'Settings'`) or `TS2694` for the namespace path. Some of your callback parameters can also lose their types and report `TS7006`.

### How to migrate

#### Replace `Settings`

In version 17.x, each plugin's `Settings` type described the value of the plugin's option. In version 18.0, take that type from `GridSettings`:

```ts
// Before (17.x)
import type { Settings } from 'handsontable/plugins/hiddenRows';

const hiddenRows: Settings = { rows: [1, 2], indicators: true };

// After (18.0)
import type Handsontable from 'handsontable/base';

const hiddenRows: Handsontable.GridSettings['hiddenRows'] = { rows: [1, 2], indicators: true };
```

The table lists the replacement for every removed `Settings` type. Three options have no named type in `GridSettings`, and three options have a different name than the plugin.

| Entry point `handsontable/plugins/...` | Replace `Settings` with |
| --- | --- |
| `autoColumnSize` | `Handsontable.GridSettings['autoColumnSize']` |
| `autoRowSize` | `Handsontable.GridSettings['autoRowSize']` |
| `autofill` | `Handsontable.GridSettings['fillHandle']` |
| `bindRowsWithHeaders` | `Handsontable.GridSettings['bindRowsWithHeaders']` |
| `collapsibleColumns` | `Handsontable.GridSettings['collapsibleColumns']` |
| `columnSorting` | `Handsontable.GridSettings['columnSorting']` |
| `columnSummary` | `Handsontable.GridSettings['columnSummary']` |
| `comments` | `Handsontable.GridSettings['comments']` |
| `contextMenu` | `Handsontable.GridSettings['contextMenu']` |
| `copyPaste` | `Handsontable.GridSettings['copyPaste']` |
| `customBorders` | `Handsontable.GridSettings['customBorders']` |
| `dataProvider` | `Handsontable.GridSettings['dataProvider']` |
| `dialog` | `Handsontable.GridSettings['dialog']` |
| `dragToScroll` | `Handsontable.GridSettings['dragToScroll']` |
| `dropdownMenu` | `Handsontable.GridSettings['dropdownMenu']` |
| `emptyDataState` | `Handsontable.GridSettings['emptyDataState']` |
| `filters` | `Handsontable.GridSettings['filters']` |
| `formulas` | `Handsontable.GridSettings['formulas']` |
| `hiddenColumns` | `Handsontable.GridSettings['hiddenColumns']` |
| `hiddenRows` | `Handsontable.GridSettings['hiddenRows']` |
| `loading` | `Handsontable.GridSettings['loading']` |
| `manualColumnFreeze` | `Handsontable.GridSettings['manualColumnFreeze']` |
| `manualColumnMove` | `Handsontable.GridSettings['manualColumnMove']` |
| `manualColumnResize` | `Handsontable.GridSettings['manualColumnResize']` |
| `manualRowMove` | `Handsontable.GridSettings['manualRowMove']` |
| `manualRowResize` | `Handsontable.GridSettings['manualRowResize']` |
| `mergeCells` | `Handsontable.GridSettings['mergeCells']` |
| `multiColumnSorting` | `Handsontable.GridSettings['multiColumnSorting']` |
| `multipleSelectionHandles` | `boolean` |
| `nestedHeaders` | `Handsontable.GridSettings['nestedHeaders']` |
| `nestedRows` | `Handsontable.GridSettings['nestedRows']` |
| `notification` | `boolean \| NotificationConfig`, with `NotificationConfig` from `handsontable/plugins/notification` |
| `pagination` | `Handsontable.GridSettings['pagination']` |
| `search` | `Handsontable.GridSettings['search']` |
| `stretchColumns` | `Handsontable.GridSettings['stretchH']` |
| `touchScroll` | `boolean` |
| `trimRows` | `Handsontable.GridSettings['trimRows']` |
| `undoRedo` | `Handsontable.GridSettings['undo']` |

Many of these options are typed `boolean | object` in 18.0. TypeScript no longer checks the detailed shape that `DetailedSettings` described.

#### Replace `DetailedSettings`

Version 18.0 removes `DetailedSettings` from 19 entry points. Remove the import and use the replacement for each plugin.

**`columnSummary`**

Use `SummaryEndpoint`. It describes one column summary endpoint.

```ts
// Before (17.x)
import type { DetailedSettings } from 'handsontable/plugins/columnSummary';

const columnSummary: DetailedSettings[] = [
  { sourceColumn: 0, type: 'sum', reversedRowCoords: true, destinationRow: 0, destinationColumn: 0 },
];

// After (18.0)
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

const columnSummary: SummaryEndpoint[] = [
  { sourceColumn: 0, type: 'sum', reversedRowCoords: true, destinationRow: 0, destinationColumn: 0 },
];
```

`SummaryEndpoint` has an index signature, so options that it doesn't list, such as `reversedRowCoords`, still compile. TypeScript doesn't check these options for typos.

**`contextMenu`**

The settings object of the `contextMenu` option no longer has a dedicated type. Remove the annotation and type the callback parameters yourself. To type a single menu item, use `MenuItemConfig`.

```ts
// Before (17.x)
import type { DetailedSettings } from 'handsontable/plugins/contextMenu';

const contextMenu: DetailedSettings = {
  callback(key, selection, clickEvent) {
    console.log(key, selection, clickEvent);
  },
  items: {
    row_above: {
      disabled() {
        return this.getSelectedLast()?.[0] === 0;
      },
    },
  },
};

// After (18.0)
import type Handsontable from 'handsontable/base';

const contextMenu = {
  callback(key: string, selection: unknown[], clickEvent?: Event) {
    console.log(key, selection, clickEvent);
  },
  items: {
    row_above: {
      disabled(this: Handsontable.Core) {
        return this.getSelectedLast()?.[0] === 0;
      },
    },
  },
};
```

The `clickEvent` parameter is optional, because `executeCommand()` can run a callback without an event.

**`formulas`**

Remove the type and the `as DetailedSettings` cast. The `formulas` option accepts the object as it is.

```ts
// Before (17.x)
import type { DetailedSettings } from 'handsontable/plugins/formulas';

const formulas = {
  engine: HyperFormula,
  namedExpressions: [{ name: 'ADDITIONAL_COST', expression: 100 }],
} as DetailedSettings;

// After (18.0)
const formulas = {
  engine: HyperFormula,
  namedExpressions: [{ name: 'ADDITIONAL_COST', expression: 100 }],
};
```

To keep a type annotation, use `Handsontable.GridSettings['formulas']`.

**Other plugins**

For `autoColumnSize`, `autofill`, `autoRowSize`, `collapsibleColumns`, `columnSorting`, `comments`, `copyPaste`, `customBorders`, `dropdownMenu`, `hiddenColumns`, `hiddenRows`, `mergeCells`, `multiColumnSorting`, `pagination`, and `search`, remove the import and take the type from `GridSettings`. The option of the `autofill` plugin is `fillHandle`.

In 17.x, some of these types were arrays of items (for example `DetailedSettings[]`). For an array-typed option such as `collapsibleColumns` or `customBorders`, use `Exclude<NonNullable<Handsontable.GridSettings['<option>']>, boolean>[number]` to get the type of one item.

```ts
// Before (17.x)
import type { DetailedSettings } from 'handsontable/plugins/hiddenRows';

const hiddenRows: DetailedSettings = { rows: [1, 2], indicators: true };

// After (18.0)
import type Handsontable from 'handsontable/base';

type HiddenRowsSettings = Exclude<NonNullable<Handsontable.GridSettings['hiddenRows']>, boolean>;

const hiddenRows: HiddenRowsSettings = { rows: [1, 2], indicators: true };
```

In 18.0, this alias is exactly `object`, so TypeScript accepts any object, including one with a misspelled key. To keep checking the shape, declare your own interface for the options that you use.

For `nestedHeaders`, use `NestedHeaderSettings`. Its `label` property is optional, where `DetailedSettings.label` was required.

```ts
// Before (17.x)
import type { DetailedSettings } from 'handsontable/plugins/nestedHeaders';

// After (18.0)
import type { NestedHeaderSettings } from 'handsontable/plugins/nestedHeaders';
```

#### Replace other removed plugin types

These removed types have a successor in 18.0:

| Removed type | Use instead |
| --- | --- |
| `Endpoint` from `columnSummary` | `SummaryEndpoint` from `handsontable/plugins/columnSummary` |
| `Config` from `columnSorting` | `ColumnSortingConfig` from `handsontable/plugins/columnSorting` |
| `Config` from `multiColumnSorting` | `ColumnSortingConfig` from `handsontable/plugins/columnSorting` |
| `SortOrderType` from `columnSorting` and `multiColumnSorting` | `Exclude<ColumnSortingConfig['sortOrder'], 'none'>`, because `ColumnSortingConfig['sortOrder']` also allows `'none'` |
| `ColumnSorting` from `multiColumnSorting` (the plugin class, re-exported in 17.x) | `ColumnSorting` from `handsontable/plugins/columnSorting` |
| `RangeType` from `copyPaste` | `RangeType` from `handsontable` |
| `ConditionName` from `filters` | `ConditionId['name']` from `handsontable/plugins/filters`, typed `string`. `ConditionId` itself is a condition object (`{ name: string; args: unknown[] }`). |
| `BorderOptions` from `customBorders` | `BorderSettings` from `handsontable/plugins/customBorders` |
| `_OperationType` from `filters` | `OperationType` from `handsontable/plugins/filters` |
| The 12 action types from `undoRedo` (`Action`, `ChangeAction`, `InsertRowAction`, and the others) | `UndoRedoAction` from `handsontable/plugins/undoRedo`. It is one shape for all actions. |

The remaining removed types have no replacement. Declare the shape in your project, or take it from `GridSettings`:

| Entry point `handsontable/plugins/...` | Removed, with no replacement |
| --- | --- |
| `autofill` | `Direction` |
| `columnSummary` | `Endpoints` |
| `comments` | `CommentConfig`, `CommentsRangeObject` |
| `contextMenu` | `SeparatorObject`, `Selection`, `MenuConfig`, `SubmenuConfig`, `SubmenuItemConfig` |
| `copyPaste` | `PasteModeType`, `CopyModeType` |
| `customBorders` | `BorderRange`, `BorderDescriptor`, `ComputedBorder` |
| `dialog` | `DialogConfig`, `TemplateOptions` |
| `dragToScroll` | `DOMBoundaries` |
| `dropdownMenu` | `SeparatorObject` |
| `emptyDataState` | `EmptyDataStateMessage`, `EmptyDataStateConfig` |
| `exportFile` | `Formats` |
| `filters` | `CellLikeData`, `FiltersConfig` |
| `formulas` | `NamedExpressions`, `HyperFormulaSettings` |
| `loading` | `LoadingConfig` |
| `mergeCells` | `MergeCellsSettings` |
| `pagination` | `PageSizeOption`, `PaginationData` |
| `search` | `SearchCallback`, `SearchQueryMethod` |

## 9. Replace removed `Handsontable.*` namespace types

Handsontable 18.0 removes 23 top-level types from the `Handsontable` namespace of `handsontable` and `handsontable/base`. The type spelling breaks: `Handsontable.CellCoords` as a type annotation fails with `TS2749`, `Handsontable.CellRange` with `TS2724`, and `Handsontable.EditorType` with `TS2694`. The runtime values stay, so `new Handsontable.CellCoords(0, 0)`, `Handsontable.themes.getTheme('main')`, and `Handsontable.hooks.add()` still compile. Some values are typed more loosely in 18.0. `Handsontable.version` is `string | undefined`, so `Handsontable.version.toString()` fails with `TS18048`. `Handsontable.EventManager` is `unknown`, so calling it fails with `TS18046`.

### Who is affected

You are affected if your TypeScript source files use a `Handsontable.<Type>` path as a type:

```ts
import Handsontable from 'handsontable';

const editor: Handsontable.EditorType = 'text';
let coords: Handsontable.CellCoords;
```

### How to migrate

Import the type by name from `handsontable` (or `handsontable/base`):

```ts
// Before (17.x)
import Handsontable from 'handsontable';

const editor: Handsontable.EditorType = 'text';

// After (18.0)
import type { EditorType } from 'handsontable';

const editor: EditorType = 'text';
```

These 21 types are named exports of `handsontable` in 18.0:

| Removed `Handsontable.*` type | Use instead |
| --- | --- |
| `CellCoords`, `CellRange` | `CellCoords`, `CellRange` |
| `CellType`, `EditorType`, `RendererType`, `ValidatorType` | The same name |
| `SelectOptionsObject`, `SourceRowData` | The same name |
| `BaseTheme`, `ThemeBuilder`, `ThemeColorScheme`, `ThemeColorsConfig`, `ThemeConfig`, `ThemeDensityConfig`, `ThemeDensitySizes`, `ThemeIconsConfig`, `ThemeLightDarkValue`, `ThemeParams`, `ThemeSizingConfig`, `ThemeTokenValue`, `ThemeTokensConfig` | The same name |

Two types are removed, and only one has a successor:

| Removed type | Use instead |
| --- | --- |
| `Handsontable.NumericFormatOptions` | `Intl.NumberFormatOptions` |
| `Handsontable.EventManager` | None. There is no public type, and `new Handsontable.EventManager(hot)` fails with `TS18046`. The value exists at runtime only on the `handsontable` entry. |

Nested type paths are removed too: `Handsontable.RecordTranslation.IndexMapper` (use `IndexMapper` from `handsontable`), `Handsontable.helper.*`, `Handsontable.languages.*`, and `Handsontable.cellTypes.<name>.*` fail with `TS2694` or `TS2749`. Most `Handsontable.plugins.<PluginName>.<Type>` paths are removed as well. A few still compile, such as `ColumnSorting.Config`, `ContextMenu.MenuItemConfig`, `ContextMenu.PredefinedMenuItemKey`, `Filters.ConditionId`, and `Filters.OperationType`. If the plugin entry point still exports the type, import it from `handsontable/plugins/<name>`. Examples are `CommentObject` from `comments`, `Settings` from `exportFile`, and the payload types of `dataProvider`. For the types that the entry points no longer export, see [Replace removed plugin type exports](#replace-removed-plugin-type-exports).

## Deprecated APIs

The changes in this section do not break an existing project. Handsontable 18.0 deprecates these APIs, and a later major release removes them.

### Stop calling deprecated resize-state methods

The following methods saved and loaded column or row sizes through the `PersistentState` plugin. Handsontable 17.0 removed `PersistentState` and the methods themselves, although the 17.x typings still declared them. Handsontable 18.0 brings them back as deprecated methods that do nothing and log a deprecation warning. Handsontable 19.0 [removes them](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis).

| Method | Plugin |
| --- | --- |
| `saveManualColumnWidths()` | `ManualColumnResize` |
| `loadManualColumnWidths()` | `ManualColumnResize` |
| `saveManualRowHeights()` | `ManualRowResize` |
| `loadManualRowHeights()` | `ManualRowResize` |

#### Who is affected

Projects that call any of these methods on the plugin instance. On 17.x the methods do not exist at runtime, so such a call throws a `TypeError`, and no working 17.x code depends on them. In 18.0 the same call logs a warning instead. For example:

```javascript
hot.getPlugin('manualColumnResize').saveManualColumnWidths();
hot.getPlugin('manualColumnResize').loadManualColumnWidths();
hot.getPlugin('manualRowResize').saveManualRowHeights();
hot.getPlugin('manualRowResize').loadManualRowHeights();
```

#### How to migrate

Remove all calls to these methods. If you need to persist column widths or row heights across page loads, store the `columnWidths` and `rowHeights` values yourself -- for example in `localStorage` -- and pass them back as initial configuration when the grid initializes.

## Summary of breaking changes

| Change | Who is affected | Action required |
| --- | --- | --- |
| `handsontable/common` subpath removed | Any project importing TypeScript types from `handsontable/common` | Replace `from 'handsontable/common'` with `from 'handsontable'` (or `from 'handsontable/base'`). `ColumnDataGetterSetterFunction` comes from `handsontable/settings`. `SimpleCellCoords`, `NumericFormatOptions`, `NumbroFormatOptions`, and `LabelOptions` are removed. `CellValue` is now `unknown` |
| `numericFormat.pattern` and `numericFormat.culture` removed | Projects using Numbro.js-based numeric formatting | Migrate to `Intl.NumberFormat` options; move locale to `locale` option |
| Moment.js and Pikaday removed; ISO 8601 required for date/time cells | Projects using non-ISO date strings or string `dateFormat`/`timeFormat` | Convert source data to ISO 8601; use `intl-date`/`intl-time` with object `dateFormat`/`timeFormat` |
| `correctFormat` and `datePickerConfig` options removed | Projects using `correctFormat` or `datePickerConfig` on `date`/`time` cells | Remove both options; use `valueParser`/`valueSetter` for value correction |
| DOMPurify removed; no built-in HTML sanitization | Projects rendering untrusted user HTML | Add a `sanitizer` function (for example, using DOMPurify) to the Handsontable configuration |
| `--ht-wrapper-border-radius` renamed to `--ht-border-radius`; `--ht-wrapper-border-width` and `--ht-wrapper-border-color` removed | Projects overriding these theme variables or passing the matching JS tokens | Rename to `--ht-border-radius` / `borderRadius`; recreate a wrapper border with `box-shadow` if needed |
| Wrapper DOM structure changed -- new `.ht-grid-content`, `.ht-slot-top`, `.ht-slot-bottom`, and `.ht-overlay` elements | Projects with CSS selectors or DOM queries targeting Handsontable's wrapper elements by position | Update selectors to be class-based; account for the new `.ht-grid-content` wrapper and sibling slot containers |
| HyperFormula no longer installed with the `handsontable` npm package | Projects that use the `Formulas` plugin and install Handsontable from npm | Run `npm install hyperformula`; keep `import { HyperFormula } from 'hyperformula'` and `formulas: { engine: HyperFormula }` |
| Plugin type exports removed, including `Settings` (38 entry points) and `DetailedSettings` (19 entry points) | TypeScript projects importing types from `handsontable/plugins/*` or using `Handsontable.plugins.*` type paths | Take the type from `Handsontable.GridSettings['<option>']`, or use the named replacement (see the tables in step 9) |
| `Handsontable.*` namespace types removed (`CellCoords`, `CellRange`, `EditorType`, `RendererType`, `ValidatorType`, `Theme*`, and others) | TypeScript projects using these `Handsontable.<Type>` paths as types | Import the type by name from `handsontable` |

## Result

Your application now runs on Handsontable 18.0.

## Related resources

- [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md)
- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)
- [Security](@/guides/security/security/security.md)
- [Install HyperFormula](@/guides/formulas/installation/installation.md)
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
