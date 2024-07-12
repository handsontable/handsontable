---
id: fgjqkigc
title: Migrating from 12.4 to 13.0
metaTitle: Migrate from 12.4 to 13.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 12.4 to Handsontable 13.0, released on June 22, 2023.
permalink: /migration-from-12.4-to-13.0
canonicalUrl: /migration-from-12.4-to-13.0
pageClass: migration-guide
react:
  id: tvum3ibg
  metaTitle: Migrate from 12.4 to 13.0 - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 12.4 to 13.0

Migrate from Handsontable 12.4 to Handsontable 13.0, released on June 22, 2023.

[[toc]]

::: only-for javascript

## Update to Angular 12 or higher

Handsontable 13.0 is not compatible with Angular 11 and lower.

Officially, Handsontable 13.0 supports only Angular 14-16. Handsontable 13.0 was thoroughly tested and, to the best of our knowledge, works correctly with versions down to Angular 12, but this may change with no further notice.

To use Handsontable 13.0 with Angular, you need to update at least to Angular 12, but we recommend using the latest version of Angular.

If you're having any issues with Handsontable's [Angular wrapper](@/guides/integrate-with-angular/angular-installation/angular-installation.md), contact our
[technical support](https://handsontable.com/contact?category=technical_support) for help.

:::

## Stop using the `beforeAutofillInsidePopulate` hook

Handsontable 13.0 removes the [`beforeAutofillInsidePopulate`](https://handsontable.com/docs/12.4/javascript-data-grid/api/hooks/#beforeautofillinsidepopulate) hook,
which has been marked as deprecated since Handsontable [9.0.0](@/guides/upgrade-and-migration/changelog/changelog.md#deprecated-3).

Make sure you're not using this hook.

## Remove `direction` and `deltas` from your `populateFromArray()` calls

The [`populateFromArray()`](@/api/core.md#populatefromarray) method no longer accepts `direction` and `deltas` arguments, as they were used only by the
deprecated [`beforeAutofillInsidePopulate`](https://handsontable.com/docs/12.4/javascript-data-grid/api/hooks/#beforeautofillinsidepopulate) hook. Make sure that you
don't pass these arguments to [`populateFromArray()`](@/api/core.md#populatefromarray).

## Change from `getFirstNotHiddenIndex()` to `getNearestNotHiddenIndex()`

Handsontable 13.0 removes the [`getFirstNotHiddenIndex()`](https://handsontable.com/docs/12.4/javascript-data-grid/api/index-mapper/#getfirstnothiddenindex) method,
which has been marked as deprecated since Handsontable [12.1.0](@/guides/upgrade-and-migration/changelog/changelog.md#deprecated-2). Instead , use the new
[`getNearestNotHiddenIndex()`](@/api/indexMapper.md#getnearestnothiddenindex) method.

For more details, see the API reference:

- [`getFirstNotHiddenIndex()`](https://handsontable.com/docs/12.4/javascript-data-grid/api/index-mapper/#getfirstnothiddenindex)
- [`getNearestNotHiddenIndex()`](@/api/indexMapper.md#getnearestnothiddenindex)

#### Before

```js
handsontableInstance.getFirstNotHiddenIndex(0, 1, true, 1);
```

#### After

```js
handsontableInstance.getNearestNotHiddenIndex(0, 1, true);
```

## Replace `'insert_row'` and `'insert_col'` in your `alter()` calls

The [`alter()`](@/api/core.md#alter) method no longer accepts `'insert_row'` and `'insert_col'` arguments, which have been marked as deprecated since
Handsontable [12.2.0](@/guides/upgrade-and-migration/changelog/changelog.md#deprecated).

You can read more about this change on [our blog](https://handsontable.com/blog/handsontable-12.2.0).

#### Before

```js
// insert a row above row number 10
handsontableInstance.alter('insert_row', 10);

// insert a column before column number 10
handsontableInstance.alter('insert_col', 10);
```

#### After

```js
// insert a row below the last row
handsontableInstance.alter('insert_row_below');

// insert a row above row number 10
handsontableInstance.alter('insert_row_above', 10);

// insert a column after the last column
handsontableInstance.alter('insert_col_end');

// insert a column before column number 10
handsontableInstance.alter('insert_col_start', 10);
```

## The `beforeChange` hook is now fired before the `afterSetDataAtCell` and `afterSetDataAtRowProp` hooks

Handsontable 13.0 changes the order of execution for the following hooks:

- [`beforeChange`](@/api/hooks.md#beforechange)
- [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell)
- [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)

For more details on this change, see this pull request: [#10231](https://github.com/handsontable/handsontable/pull/10231).

#### Before

Up to Handsontable 12.4, the hooks were fired in the following order:

1. [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell) or [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)
2. [`beforeChange`](@/api/hooks.md#beforechange)

#### After

Since Handsontable 13.0, the hooks are fired in the following order:

1. [`beforeChange`](@/api/hooks.md#beforechange)
2. [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell) or [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)
