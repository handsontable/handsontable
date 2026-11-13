---
type: explanation
title: Deprecation policy
metaTitle: Deprecation policy | Handsontable DataGrid for JavaScript
description: Handsontable DataGrid ensures that if API is marked deprecated, we commit to a grace period (at least 3 months) during which the deprecated feature still works.
permalink: /deprecation-policy
canonicalUrl: /deprecation-policy
react:
  metaTitle: Deprecation policy | Handsontable DataGrid for React
angular:
  metaTitle: Deprecation policy | Handsontable DataGrid for Angular
vue:
  metaTitle: Deprecation policy | Handsontable DataGrid for Vue
searchCategory: Guides
category: Upgrade and migration
menuTag: updated
---
This page explains how Handsontable DataGrid handles deprecated APIs -- including the grace period before removal and how you will be notified.

Deprecation occurs when better alternatives emerge that offer improved performance, security, or usability compared to existing implementations. It also helps maintain API consistency by removing redundant or inconsistent functions, creating a cleaner overall design. As web standards and the JavaScript ecosystem evolve, certain approaches become obsolete or suboptimal, requiring updates to stay current. Additionally, deprecation reduces maintenance complexity by phasing out rarely-used or problematic features, while addressing potential security vulnerabilities in older implementations. Rather than introducing breaking changes, deprecation provides a gradual migration path that gives developers time to adapt while clearly signaling the library's future direction.

After a Handsontable feature, a framework wrapper or any other part of the API is marked deprecated, we commit to a **grace period** **(at least 3 months)** during which the deprecated feature still works. We will not remove the feature immediately in the next minor or patch release. Instead, removal is deferred until a future **major release**, in accordance with semantic versioning.


[[toc]]

## Support

During the deprecation period:
*   We will fix **critical bugs** and **security vulnerabilities** in the deprecated feature.
*   We will not add new enhancements for deprecated APIs.
*   Full stability and long-term support are guaranteed only within LTS releases.

## Relation to LTS

Handsontable follows a **Long-Term Support (LTS)** model, where every even-numbered major release becomes an LTS release with ~30 months of support.
For more details, please visit [Long Term Support](@/guides/upgrade-and-migration/long-term-support/long-term-support.md).


## Deprecation notifications

We will announce deprecations and removals through release notes accompanied by blog posts. Additionally, deprecated features may show console warnings in development builds. Deprecated APIs will be clearly marked in our documentation with a recommended alternative (if possible).

For significant deprecations (especially those affecting many users), we will provide dedicated **Migration Guides**.

For more details about our versioning policy please visit [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)

## Removed in version 20.0

### Behaviors

| Removed | Deprecated in | Replacement | Migration guide |
| ------- | ------------- | ----------- | --------------- |
| Writing past the last column of an object data source, which added a property named after the column index | 19.0 | `setDataAtRowProp()` | [Migrate from 19.0 to 20.0 -> Writing past the last column](@/guides/upgrade-and-migration/migrating-from-19.0-to-20.0/migrating-from-19.0-to-20.0.md#writing-past-the-last-column-of-an-object-data-source-is-ignored) |

## Removed in version 19.0

### APIs

| Removed | Deprecated in | Replacement | Migration guide |
| ------- | ------------- | ----------- | --------------- |
| `saveManualColumnWidths()` and `loadManualColumnWidths()` (`ManualColumnResize`) | 18.0 | None. Both do nothing and log a deprecation warning. Persist widths in your application code, and restore them by passing an array to `manualColumnResize`. | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |
| `saveManualRowHeights()` and `loadManualRowHeights()` (`ManualRowResize`) | 18.0 | None. Both do nothing and log a deprecation warning. Persist heights in your application code, and restore them by passing an array to `manualRowResize`. | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |
| `Handsontable.helper.sanitize()` | 18.0 | The `sanitizer` option. The helper returned its input unchanged since 18.0. | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |
| `columnHeaders` (export options of the `exportFile` plugin) | 17.1 | `colHeaders` -- rename the key; the value keeps its meaning. | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |

### TypeScript types

| Removed | Deprecated in | Replacement | Migration guide |
| ------- | ------------- | ----------- | --------------- |
| `Settings` (exported from `handsontable/plugins/exportFile`) | 18.0 | `ExportFileSettings` | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |
| `DataProviderOptions` (exported from `handsontable/plugins/dataProvider`) | 18.0 | `DataProviderFetchOptions` | [Migrate from 18.1 to 19.0 -> Removed deprecated APIs](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#removed-deprecated-apis) |

## Removed in version 18.0

### Dependencies

The following dependencies were deprecated in version 17.0 and removed in version 18.0.

| Removed | Description | Migration guide |
| ------- | ----------- | --------------- |
| **numbro.js** | Handled numeric data formatting. Replace with [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat). | [Migrate from 17.1 to 18.0 -> Numeric formatting](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat) |
| **Pikaday** | Displayed a date picker. The `intl-date` cell type now uses the native browser date picker. | [Migrate from 17.1 to 18.0 -> Date/Time](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#migrate-date-and-time-cells-to-iso-8601-format) |
| **moment.js** | Parsed, validated, and displayed dates. The `intl-date` and `intl-time` cell types use the native `Intl.DateTimeFormat` API. | [Migrate from 17.1 to 18.0 -> Date/Time](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#migrate-date-and-time-cells-to-iso-8601-format) |
| **DOMPurify** | An XSS sanitizer for HTML. Use the `sanitizer` option to provide your own sanitizer function. | [Migrate from 17.1 to 18.0 -> HTML sanitization](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#replace-built-in-dompurify-with-a-custom-sanitizer) |

### APIs

| Removed | Deprecated in | Replacement | Migration guide |
| ------- | ------------- | ----------- | --------------- |
| `correctFormat` and `datePickerConfig` options | 17.0 | `valueParser` and `valueSetter` | [Migrate from 17.1 to 18.0 -> `correctFormat` option](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#correctformat-option) |
| `numericFormat.pattern` and `numericFormat.culture` | 17.0 | `Intl.NumberFormat` options and the `locale` option | [Migrate from 17.1 to 18.0 -> Numeric formatting](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat) |
| `handsontable/common` import subpath | -- (not in the API reference) | `handsontable`, `handsontable/base`, or `handsontable/settings`, depending on the type. Four types are removed | [Migrate from 17.1 to 18.0 -> Imports](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#replace-handsontablecommon-imports) |

## Removed in version 17.0

### APIs

| Removed | Deprecated in | Replacement | Migration guide |
| ------- | ------------- | ----------- | --------------- |
| `PersistentState` plugin, its `persistentState` option, and the `persistentStateSave`, `persistentStateLoad`, and `persistentStateReset` hooks | 16.1 | Persist state in your application code. The `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, and `loadManualRowHeights()` methods that relied on the plugin were deprecated in 18.0 and removed in 19.0 (see [Removed in version 19.0](#removed-in-version-19-0)). | [Changelog 17.x](@/guides/upgrade-and-migration/changelog-17/changelog-17.md) |
| `hot.undo()`, `hot.redo()`, `hot.clearUndo()`, `hot.isUndoAvailable()`, `hot.isRedoAvailable()`, and `hot.undoRedo` | Before 16.0 | `hot.getPlugin('undoRedo')` | [Changelog 17.x](@/guides/upgrade-and-migration/changelog-17/changelog-17.md) |

## List of current deprecations

The following APIs are deprecated. They keep working and print a one-time console warning. The Removal column names the version that drops each one.

### Methods

| Deprecated | Deprecated in | Removal | Replacement | Migration guide |
| ---------- | ------------- | ------- | ----------- | --------------- |
| `registerShortcuts()` (`Formulas`) | 19.0 | 20.0 | No-op. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut. Remove the call. | [Migrate from 18.1 to 19.0 -> Formulas shortcut methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#formulas-shortcut-methods) |
| `unregisterShortcuts()` (`Formulas`) | 19.0 | 20.0 | No-op. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut. Remove the call. | [Migrate from 18.1 to 19.0 -> Formulas shortcut methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#formulas-shortcut-methods) |
| `spliceCol()` (`Core`) | 19.0 | 20.0 | Read the column, splice it, and write it back with `populateFromArray()`; or use `alter()` for whole columns. | [Migrate from 18.1 to 19.0 -> spliceCol and spliceRow](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#splicecol-and-splicerow-are-deprecated) |
| `spliceRow()` (`Core`) | 19.0 | 20.0 | Read the row, splice it, and write it back with `populateFromArray()`; or use `alter()` for whole rows. | [Migrate from 18.1 to 19.0 -> spliceCol and spliceRow](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#splicecol-and-splicerow-are-deprecated) |
| `getStartMostColumnIndex()` (`MergedCellsCollection`) | 19.0 | 20.0 | None. The selection steps over merged cells by itself. Remove the call. | [Migrate from 18.1 to 19.0 -> `MergedCellsCollection` methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#four-mergedcellscollection-methods-are-deprecated) |
| `getEndMostColumnIndex()` (`MergedCellsCollection`) | 19.0 | 20.0 | None. The selection steps over merged cells by itself. Remove the call. | [Migrate from 18.1 to 19.0 -> `MergedCellsCollection` methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#four-mergedcellscollection-methods-are-deprecated) |
| `getTopMostRowIndex()` (`MergedCellsCollection`) | 19.0 | 20.0 | None. The selection steps over merged cells by itself. Remove the call. | [Migrate from 18.1 to 19.0 -> `MergedCellsCollection` methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#four-mergedcellscollection-methods-are-deprecated) |
| `getBottomMostRowIndex()` (`MergedCellsCollection`) | 19.0 | 20.0 | None. The selection steps over merged cells by itself. Remove the call. | [Migrate from 18.1 to 19.0 -> `MergedCellsCollection` methods](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#four-mergedcellscollection-methods-are-deprecated) |
| `iconsMap()` (`handsontable/themes/static/variables/helpers/iconsMap`) | 19.0 | 20.0 | `iconStyles(icons, scopeSelector)` from `handsontable/themes/static/variables/helpers/iconStyles`. `iconsMap()` already returns its output. | [Migrate from 18.1 to 19.0 -> Icons are rendered as `<i>` elements](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#icons-are-rendered-as-i-elements) |

### Language codes

| Deprecated | Deprecated in | Removal | Replacement | Migration guide |
| ---------- | ------------- | ------- | ----------- | --------------- |
| Language code `sr-SP` (`sr-SP.js`, `srSP`) | 19.0 | 20.0 | The `sr-Latn-RS` language code (`sr-Latn-RS.js`, `srLatnRS`). The phrases are the same. | [Language](@/guides/internationalization/language/language.md) |

### Constants

A constant does not print a console warning. Your editor shows it as deprecated.

| Deprecated | Deprecated in | Removal | Replacement | Migration guide |
| ---------- | ------------- | ------- | ----------- | --------------- |
| `NON_COMMERCIAL_LICENSE` (`@handsontable/angular-wrapper`) | 19.0 | 20.0 | Your own license key, passed as `license` in `HOT_GLOBAL_CONFIG`. The key the constant holds reads as invalid since 19.0. | [Migrate from 18.1 to 19.0 -> The `non-commercial-and-evaluation` license key](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#the-non-commercial-and-evaluation-license-key-no-longer-works) |

## Related

- [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)
- [Long-term support](@/guides/upgrade-and-migration/long-term-support/long-term-support.md)
