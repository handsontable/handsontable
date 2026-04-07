---
id: 7m8n2q4p
title: Hooks API reference
metaTitle: Hooks API reference - JavaScript Data Grid | Handsontable
description: Learn how Handsontable hooks work, and check the afterRemoveRow and afterRemoveCol firing behavior for consecutive and non-consecutive removals.
permalink: /api/hooks
canonicalUrl: /api/hooks
searchCategory: API Reference
react:
  id: h3k9v1rc
  metaTitle: Hooks API reference - React Data Grid | Handsontable
angular:
  id: d2w8x6la
  metaTitle: Hooks API reference - Angular Data Grid | Handsontable
---

[[toc]]

Handsontable hooks let you run custom logic before or after specific table actions.
Use hooks to observe operations, validate data, or adjust behavior around built-in workflows.

For a full walkthrough of hooks and the `source` argument, see [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md).

## Selected hooks

### afterRemoveCol

`afterRemoveCol(index, amount, physicalColumns, [source])`

Fired after one or more columns are removed.

When consecutive columns are removed, this hook is fired once with the `amount` reflecting the total number of removed columns.
When non-consecutive columns are removed (for example, by selecting columns with Ctrl/Cmd held), this hook is fired separately for each removed column, with `amount` equal to `1` each time.
This is by design.

| Param | Type | Description |
| --- | --- | --- |
| `index` | `number` | Visual index of starter column. |
| `amount` | `number` | An amount of removed columns. |
| `physicalColumns` | `Array<number>` | An array of physical columns removed from the data source. |
| `[source]` | `string` | String that identifies source of hook call. |

### afterRemoveRow

`afterRemoveRow(index, amount, physicalRows, [source])`

Fired after one or more rows are removed.

When consecutive rows are removed, this hook is fired once with the `amount` reflecting the total number of removed rows.
When non-consecutive rows are removed (for example, by selecting rows with Ctrl/Cmd held), this hook is fired separately for each removed row, with `amount` equal to `1` each time.
This is by design.

| Param | Type | Description |
| --- | --- | --- |
| `index` | `number` | Visual index of starter row. |
| `amount` | `number` | An amount of removed rows. |
| `physicalRows` | `Array<number>` | An array of physical rows removed from the data source. |
| `[source]` | `string` | String that identifies source of hook call. |
