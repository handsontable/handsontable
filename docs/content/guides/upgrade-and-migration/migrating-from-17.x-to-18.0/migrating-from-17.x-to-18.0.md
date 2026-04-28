---
id: m3p8x7q1
title: Migrating from 17.x to 18.0
metaTitle: Migrating from 17.x to 18.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 17.x to Handsontable 18.0.
permalink: /migration-from-17.x-to-18.0
canonicalUrl: /migration-from-17.x-to-18.0
pageClass: migration-guide
react:
  id: r4n9y2w5
  metaTitle: Migrate from 17.x to 18.0 - React Data Grid | Handsontable
angular:
  id: a6k1z8e3
  metaTitle: Migrate from 17.x to 18.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
menuTag: new
---

# Migrate from 17.x to 18.0

Migrate from Handsontable 17.x to Handsontable 18.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

## 1. Rename `columnHeaders` to `colHeaders` in export options

The export option `columnHeaders` has been renamed to `colHeaders` in the `ExportFile` plugin. This applies to both the CSV and XLSX export formats, as well as the per-sheet `sheets` configuration for multi-sheet XLSX exports.

Starting in version 17.0, passing `columnHeaders` still works as a silent legacy alias. In version 18.0, the legacy alias is removed - only `colHeaders` is accepted.

### What Changed

- The `columnHeaders` option in `downloadFile()`, `exportAsBlob()`, `exportAsString()`, and `downloadFileAsync()` is renamed to `colHeaders`.
- The `columnHeaders` key inside each entry of the `sheets` array (XLSX multi-sheet export) is renamed to `colHeaders`.

### How to Migrate

::: only-for javascript

```diff
 exportPlugin.downloadFile('csv', {
   bom: false,
   columnDelimiter: ',',
-  columnHeaders: true,
+  colHeaders: true,
   rowHeaders: true,
 });
```

:::

::: only-for react

```diff
 exportPlugin?.downloadFile('csv', {
   bom: false,
   columnDelimiter: ',',
-  columnHeaders: true,
+  colHeaders: true,
   rowHeaders: true,
 });
```

:::

::: only-for angular

```diff
 exportPlugin.downloadFile('csv', {
   bom: false,
   columnDelimiter: ',',
-  columnHeaders: true,
+  colHeaders: true,
   rowHeaders: true,
 });
```

:::

For multi-sheet XLSX exports, update each entry in the `sheets` array:

```diff
 await exportPlugin.downloadFileAsync('xlsx', {
   filename: 'Annual-Sales-Report',
   sheets: [
-    { instance: hotQ1, name: 'Q1 Sales', columnHeaders: true, rowHeaders: true },
-    { instance: hotQ2, name: 'Q2 Sales', columnHeaders: true, rowHeaders: true },
+    { instance: hotQ1, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
+    { instance: hotQ2, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
   ],
 });
```

### Related resources

- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)

## Summary of breaking changes

| Change | Action Required |
| --- | --- |
| `columnHeaders` export option removed | Replace `columnHeaders` with `colHeaders` in all `ExportFile` plugin calls |
