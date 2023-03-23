---
id: 3xxlonuv
title: Column filter
metaTitle: Column filter - JavaScript Data Grid | Handsontable
description: Filter your data by values and by sets of criteria.
permalink: /column-filter
canonicalUrl: /column-filter
tags:
  - filter
  - filtering
  - data filtering
react:
  id: vz7ct2bv
  metaTitle: Column filter - React Data Grid | Handsontable
searchCategory: Guides
---

# Column filter

Filter your data by values and by sets of criteria.

[[toc]]

## Overview

- Filter lives in the [dropdown menu]
- After filtering the data is trimming.
- Filtering and sorting don’t work with nested rows. We are mentioning this in our documentation: https://handsontable.com/docs/row-parent-child/#row-parent-child

## Filtering demo

## Enable filtering

Enable filtering only for specified columns: https://jsfiddle.net/handsoncode/ahg0dofj

You can also enable the dropdown menu only for specified columns:
https://jsfiddle.net/handsoncode/fwma1t7L
https://jsfiddle.net/cxygpLr9/

## Configure filtering

## Filter different types of data

There are different filter conditions for text, numeric and date types:
https://forum.handsontable.com/t/is-there-a-way-to-add-additional-filter-options/5721/3

Date has its own, but time has the same as text: https://forum.handsontable.com/t/filter-for-type-time/1353/3
https://forum.handsontable.com/t/how-to-apply-a-filter-to-a-date-column/3838

Checkbox has the same as text: https://forum.handsontable.com/t/gh-5632-filter-for-boolean/4655



## Add a custom filter icon

https://forum.handsontable.com/t/custom-filter-icon-and-context-menu/4073

## Change the width of the filter menu

http://jsfiddle.net/handsoncode/zxguhohs/

## Control filtering programmatically

### Enable or disable filtering programmatically

### Filter data programmatically

### Exclude rows from filtering

### Use filtering hooks

### Clear filter criteria for all columns at once

https://jsfiddle.net/handsoncode/a5jgrxy4

### Filter a hidden column programmatically

https://forum.handsontable.com/t/filter-on-hidden-columns/4401

### Save filter settings

https://forum.handsontable.com/t/save-filter-settings/669

### Block filtering on the front-end (to perform server-side filtering)

https://forum.handsontable.com/t/save-filter-settings/669

### Reset filter settings

https://forum.handsontable.com/t/discard-reset-filter-by-clicking-reset-button/6124

### Clear filter settings automatically

### Get filtered rows

https://forum.handsontable.com/t/how-to-get-filterred-rows-in-afterfilter-hook/4753

## Import the filtering module

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and
[Handsontable hooks](@/guides/getting-started/events-and-hooks.md) related to sorting, see the
following API reference pages:

- [`Filters`](@/api/filters.md)
- [`DropdownMenu`](@/api/dropdownMenu.md)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Filtering) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's
  forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to
  get help
