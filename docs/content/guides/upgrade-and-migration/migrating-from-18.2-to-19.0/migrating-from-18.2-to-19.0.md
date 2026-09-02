---
type: how-to
title: Migrating from 18.2 to 19.0
metaTitle: Migrating from 18.2 to 19.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.2 to Handsontable 19.0.
permalink: /migration-from-18.2-to-19.0
canonicalUrl: /migration-from-18.2-to-19.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.2 to 19.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.2 to 19.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.2 to 19.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrating from 18.2 to 19.0

[[toc]]

Migrate from Handsontable 18.2 to Handsontable 19.0.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

## Writing past the last column of an object data source is ignored

Writing to a column index that an object [`data`](@/api/options.md#data) source has no column for
used to add a property named after that index. It is now skipped: no value is written, and no
[`beforeChange`](@/api/hooks.md#beforechange) or [`afterChange`](@/api/hooks.md#afterchange) entry
is reported for it.

```js
const rows = [
  { id: 1, name: 'Ted Right' },
  { id: 2, name: 'Frank Honest' },
];

const hot = new Handsontable(container, {
  data: rows,
  dataSchema: { id: null, name: null },
  licenseKey: 'non-commercial-and-evaluation',
});

hot.setDataAtCell(0, 2, 'Boston');

// Before 19.0
rows[0]; // { 2: 'Boston', id: 1, name: 'Ted Right' }

// 19.0 and later
rows[0]; // { id: 1, name: 'Ted Right' }
```

This affects every write that can run past the last column: a
[paste](@/guides/cell-features/clipboard/clipboard.md),
[`populateFromArray()`](@/api/core.md#populatefromarray), and
[`setDataAtCell()`](@/api/core.md#setdataatcell) itself. It was deprecated in 18.2.0, with a
one-time console warning.

### Why this changed

An object data source cannot gain columns - its column count comes from the first row or from
[`dataSchema`](@/api/options.md#dataschema), and
[`alter()`](@/api/core.md#alter) refuses to add one. The value therefore had nowhere to be
displayed, and landed on a property your schema never declared. No column rendered it, yet
[`getSourceData()`](@/api/core.md#getsourcedata) returned it and
[`countSourceCols()`](@/api/core.md#countsourcecols) counted it, so it reached anything that
serialized the row - a save, a request payload, a schema validator.

### What to change

If you were reading those properties back, address the field by name instead:

```js
// Before 19.0 - the property was named after the column index
hot.setDataAtCell(0, 2, 'Boston');
hot.getSourceData()[0][2]; // 'Boston'

// 19.0 and later - name the field you mean
hot.setDataAtRowProp(0, 'city', 'Boston');
hot.getSourceData()[0].city; // 'Boston'
```

[`setDataAtRowProp()`](@/api/core.md#setdataatrowprop) is unchanged: the property you pass names the
field to write, so it never has to be resolved from a column, and it still writes fields the grid
shows no column for.

Array data sources are unchanged. There the index names a real array slot rather than a property, so
the write still lands - and where the grid is allowed to grow, the column is created as before.
