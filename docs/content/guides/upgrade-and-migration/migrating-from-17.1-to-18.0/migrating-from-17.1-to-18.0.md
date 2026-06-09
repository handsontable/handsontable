---
type: how-to
title: Migrating from 17.1 to 18.0
metaTitle: Migrating from 17.1 to 18.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 17.1 to Handsontable 18.0 -- update TypeScript imports from the removed handsontable/common subpath.
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
| `NumericFormatOptions` | `handsontable` |
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

## 2. Stop calling deprecated resize-state methods

The following methods previously saved and loaded column or row sizes through the `PersistentState` plugin. Because `PersistentState` was removed in Handsontable 17.0, these methods no longer do anything. They are now formally deprecated and will be removed in the next major release.

| Method | Plugin |
| --- | --- |
| `saveManualColumnWidths()` | `ManualColumnResize` |
| `loadManualColumnWidths()` | `ManualColumnResize` |
| `saveManualRowHeights()` | `ManualRowResize` |
| `loadManualRowHeights()` | `ManualRowResize` |

### Who is affected

You are affected if your code calls any of these methods directly on the plugin instance, for example:

```javascript
hot.getPlugin('manualColumnResize').saveManualColumnWidths();
hot.getPlugin('manualColumnResize').loadManualColumnWidths();
hot.getPlugin('manualRowResize').saveManualRowHeights();
hot.getPlugin('manualRowResize').loadManualRowHeights();
```

### How to migrate

Remove all calls to these methods. They produce no effect and will throw in a future release. If you need to persist column widths or row heights across page loads, store the `columnWidths` and `rowHeights` values yourself -- for example in `localStorage` -- and pass them back as initial configuration when the grid initializes.

## Summary of breaking changes

| Change | Who is affected | Action required |
| --- | --- | --- |
| `handsontable/common` subpath removed | Any project importing TypeScript types from `handsontable/common` | Replace `from 'handsontable/common'` with `from 'handsontable'` (or `from 'handsontable/base'`) |
| `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, `loadManualRowHeights()` now no-op | Any project calling these methods | Remove calls; implement custom persistence if needed |

## Related resources

- [TypeScript types](@/guides/tools-and-building/typescript-types/typescript-types.md)
- [Modules](@/guides/tools-and-building/modules/modules.md)

## Result

Your application now runs on Handsontable 18.0.
