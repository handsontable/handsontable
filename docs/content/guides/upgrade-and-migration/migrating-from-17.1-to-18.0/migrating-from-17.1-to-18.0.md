---
type: how-to
id: m4hz9xy1
title: Migrating from 17.1 to 18.0
metaTitle: Migrating from 17.1 to 18.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 17.1 to Handsontable 18.0 -- remove Moment.js, Pikaday, Numbro.js, and DOMPurify dependencies, and update TypeScript imports.
permalink: /migration-from-17.1-to-18.0
canonicalUrl: /migration-from-17.1-to-18.0
pageClass: migration-guide
react:
  id: p8qn2wr5
  metaTitle: Migrate from 17.1 to 18.0 - React Data Grid | Handsontable
angular:
  id: k3jb6ts0
  metaTitle: Migrate from 17.1 to 18.0 - Angular Data Grid | Handsontable
vue:
  id: 205js05l
  metaTitle: Migrate from 17.1 to 18.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

Migrate from Handsontable 17.1 to Handsontable 18.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

## 1. Replace `handsontable/common` imports

The `handsontable/common` subpath is removed in version 18.0. It was never part of the official public API and was not documented, but some projects imported TypeScript types from it directly.

All types previously available at `handsontable/common` are now exported from the main entry points -- `handsontable` and `handsontable/base`. The new exports are a superset: every type that existed in `handsontable/common` is available in the new location.

### Who is affected

You are affected if your TypeScript source files contain any of these import patterns:

```typescript
import type { ... } from 'handsontable/common';
import { ... } from 'handsontable/common';
```

### How to migrate

Replace every `handsontable/common` import with an import from `handsontable` (or `handsontable/base` if you use [tree shaking](@/guides/tools-and-building/modules/modules.md)).

The table below lists the complete set of types that were available from `handsontable/common` and their new import location.

| Type | New import |
| --- | --- |
| `GridSettings` | `handsontable` |
| `Events` | `handsontable` |
| `HotInstance` | `handsontable` |
| `ColumnSettings` | `handsontable` |
| `CellProperties` | `handsontable` |
| `CellMeta` | `handsontable` |
| `CellValue` | `handsontable` |
| `CellChange` | `handsontable` |
| `ChangeSource` | `handsontable` |
| `RowObject` | `handsontable` |
| `SourceRowData` | `handsontable` |
| `SelectOptionsObject` | `handsontable` |
| `RangeType` | `handsontable` |
| `CellCoords` | `handsontable` |
| `CellRange` | `handsontable` |
| `IndexMapper` | `handsontable` |
| `HooksRegistry` | `handsontable` |

**Before:**

```typescript
import type { RowObject, CellChange, GridSettings } from 'handsontable/common';
```

**After:**

```typescript
import type { RowObject, CellChange, GridSettings } from 'handsontable';
```

Or, if you use the base module with tree shaking:

```typescript
import type { RowObject, CellChange, GridSettings } from 'handsontable/base';
```

### Quick fix with search and replace

To migrate an entire project at once, run a global find-and-replace in your editor or IDE:

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

::: tip

If you use `handsontable/base` throughout your project, replace `'handsontable'` in the replacement above with `'handsontable/base'`. Both entry points export the same set of types.

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

- `colHeaders` and `rowHeaders`
- Context menu item labels
- HTML pasted from the clipboard
- Dialog and notification content
- Select editor dropdown option values

### Who is affected

You are affected if any of the following apply:

- You pass user-supplied or third-party HTML in `colHeaders`, `rowHeaders`, context-menu labels, or select editor `selectOptions`.
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

## Summary of breaking changes

| Change | Who is affected | Action required |
| --- | --- | --- |
| `handsontable/common` subpath removed | Any project importing TypeScript types from `handsontable/common` | Replace `from 'handsontable/common'` with `from 'handsontable'` (or `from 'handsontable/base'`) |
| `numericFormat.pattern` and `numericFormat.culture` removed | Projects using Numbro.js-based numeric formatting | Migrate to `Intl.NumberFormat` options; move locale to `locale` option |
| Moment.js and Pikaday removed; ISO 8601 required for date/time cells | Projects using non-ISO date strings or string `dateFormat`/`timeFormat` | Convert source data to ISO 8601; use `intl-date`/`intl-time` with object `dateFormat`/`timeFormat` |
| `correctFormat` and `datePickerConfig` options removed | Projects using `correctFormat` or `datePickerConfig` on `date`/`time` cells | Remove both options; use `valueParser`/`valueSetter` for value correction |
| DOMPurify removed; no built-in HTML sanitization | Projects rendering untrusted user HTML | Add a `sanitizer` function (for example, using DOMPurify) to the Handsontable configuration |

## Related resources

- [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md)
- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)
- [Security](@/guides/security/security/security.md)

## Result

Your application now runs on Handsontable 18.0.
