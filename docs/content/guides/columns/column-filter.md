---
id: 3xxlonuv
title: Column filter
metaTitle: Column filter - JavaScript Data Grid | Handsontable
description: Filter your data by values or by sets of criteria.
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

Filter your data by values or by sets of criteria.

[[toc]]

## Overview

**The filter menu is part of the dropdown menu.**

- Filter lives in the [column menu], so you need to enable it first
- After filtering the data is trimming.
- Filtering and sorting don’t work with nested rows. We are mentioning this in our documentation:
  https://handsontable.com/docs/row-parent-child/#row-parent-child

## Filtering demo

- how to use
- describe UI: the icon turns green

::: only-for javascript

::: example #example1 --html 1 --js 2

```html
<div id="example1"></div>
```

```js
// to import filtering as an individual module, see the 'Import the filtering module' section of this page
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  // enable column headers
  colHeaders: true,
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example1 :react

```jsx
// to import filtering as an individual module, see the 'Import the filtering module' section of this page
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      // enable column headers
      colHeaders={true}
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};
/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```

:::

:::

## Enable filtering

To enable filtering for all columns, set the following options to `true`:

- [`colHeaders`](@/api/options.md#colheaders), to enable
  [column headers](@/guides/columns/column-header.md)
- [`dropdownMenu`](@/api/options.md#dropdownmenu), to enable the
  [column menu](@/guides/columns/column-menu.md)
- [`filters`](@/api/options.md#filters), to enable the filter menu

::: only-for javascript

```js
const configurationOptions = {
  // enable column headers
  colHeaders: true,
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable column headers
  colHeaders={true}
  // enable the column menu
  dropdownMenu={true}
  // enable filtering
  filters={true}
/>
```

:::

To enable filtering only for specific columns, you can disable the column menu for those columns by using the [`afterGetColHeader()`](@/api/hooks.md#aftergetcolheader) Handsontable hook.

https://jsfiddle.net/handsoncode/fwma1t7L

::: only-for javascript

::: example #example2 --html 1 --js 2

```html
<div id="example2"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
const container = document.querySelector('#example2');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  // enable sorting for all columns
  columnSorting: true,
  columns: [
    {
      title: 'Brand<br>(non-sortable)',
      type: 'text',
      data: 'brand',
      // disable sorting for the 'Brand' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'Model<br>(sortable)',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price<br>(non-sortable)',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
      className: 'htLeft',
      // disable sorting for the 'Price' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'Date<br>(sortable)',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time<br>(non-sortable)',
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
      // disable sorting for the 'Time' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'In stock<br>(sortable)',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example2 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
// register Handsontable's modules
registerAllModules();
export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      // enable sorting for all columns
      columnSorting={true}
      columns={[
        {
          title: 'Brand<br>(non-sortable)',
          type: 'text',
          data: 'brand',
          // disable sorting for the 'Brand' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'Model<br>(sortable)',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price<br>(non-sortable)',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
          className: 'htLeft',
          // disable sorting for the 'Price' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'Date<br>(sortable)',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time<br>(non-sortable)',
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
          // disable sorting for the 'Time' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'In stock<br>(sortable)',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};
/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```

:::

:::

You can also enable the column menu for all columns, but disable filtering for some of them:
https://jsfiddle.net/handsoncode/ahg0dofj

You can also enable filtering but get rid of the remaining column menu options: ???

## Configure filtering

## Filter different types of data

There are different filter conditions for text, numeric and date types:
https://forum.handsontable.com/t/is-there-a-way-to-add-additional-filter-options/5721/3

Date has its own, but time has the same as text:
https://forum.handsontable.com/t/filter-for-type-time/1353/3
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

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use sorting, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules.md#import-the-base-module)
- The [`DropdownMenu`](@/api/dropdownMenu.md) module
- The [`Filters`](@/api/filters.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';
// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';
// import the sorting plugins
import { registerPlugin, DropdownMenu, Filters } from 'handsontable/plugins';
// register the sorting plugins
registerPlugin(DropdownMenu);
registerPlugin(Filters);
```

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
