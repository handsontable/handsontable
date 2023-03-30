---
id: 3xxlonuv
title: Column filter
metaTitle: Column filter - JavaScript Data Grid | Handsontable
description: Filter your data by values or based on multiple criteria.
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

Filter your data by values or based on multiple criteria.

[[toc]]

## Overview

**The filter menu is part of the column menu.**

- Made of two parts: "filter by condition" and "filter by value"
- Filter lives in the [column menu], so you need to enable it first
- After filtering the data is trimming.
- Filtering and filtering don’t work with nested rows. We are mentioning this in our documentation:
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  height: 'auto',
  stretchH: 'all',
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
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      height="auto"
      stretchH="all"
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

To enable filtering for all columns:

1. Enable the column menu by settting [`dropdownMenu`](@/api/options.md#dropdownmenu) to `true`.
2. Enable the filter menu by settting [`filters`](@/api/options.md#filters) to `true`.

::: only-for javascript

```js
const configurationOptions = {
  // enable the column menu
  dropdownMenu: true,
  // enable the filter menu
  filters: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable the column menu
  dropdownMenu={true}
  // enable filtering
  filters={true}
/>
```

:::

To enable filtering without the other column menu items, configure the column menu to show the
filter items only.

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
  // enable the column menu
  // and configure it to show only the filter menu items
  dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
  // enable filtering for all columns
  filters: true,
  height: 'auto',
  stretchH: 'all',
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
  // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
  const removeColumnMenuButton = (col, TH) => {
    if (col == 0 || col == 2 || col == 4) {
      const button = TH.querySelector('.changeType');

      if (!button) {
        return;
      }

      button.parentElement.removeChild(button);
    }
  };

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
      // enable the column menu
      // and configure it to show only the filter menu items
      dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
      // enable filtering for all columns
      filters={true}
      height="auto"
      stretchH="all"
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

To enable filtering only for specific columns, hide the filter menu from those columns that you
don't want to filter. For example, in the following demo, you can filter only the **Brand** column.

::: only-for javascript

::: example #example3 --html 1 --js 2

```html
<div id="example3"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');
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
  // enable filtering for all columns
  filters: true,
  // enable the column menu for all columns
  // but hide the filter menu from all columns but the first one
  dropdownMenu: {
    items: {
      filter_by_value: {
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
      filter_action_bar: {
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
    },
  },
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example3 :react

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
      // enable filtering for all columns
      filters={true}
      // enable the column menu for all columns
      // but hide the filter menu from all columns but the first one
      dropdownMenu={{
        items: {
          filter_by_value: {
            hidden() {
              return this.getSelectedRangeLast().to.col > 0;
            },
          },
          filter_action_bar: {
            hidden() {
              return this.getSelectedRangeLast().to.col > 0;
            },
          },
        },
      }}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```

:::

:::

You can also remove the column menu button (▼) from the columns that you don't want to filter. For
that, use Handsontable's [`afterGetColHeader()`](@/api/hooks.md#aftergetcolheader) hook.

::: only-for javascript

::: example #example4 --html 1 --js 2

```html
<div id="example4"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example4');
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
  // enable the column menu for all columns
  dropdownMenu: true,
  // enable filtering for all columns
  filters: true,
  // `afterGetColHeader()` is a Handsontable hook
  // it's fired after Handsontable retrieves information about a column header
  // and appends it to the table header
  afterGetColHeader(col, TH) {
    // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
    if (col == 0 || col == 2 || col == 4) {
      const button = TH.querySelector('.changeType');

      if (!button) {
        return;
      }

      button.parentElement.removeChild(button);
    }
  },
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example4 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
  const removeColumnMenuButton = (col, TH) => {
    if (col == 0 || col == 2 || col == 4) {
      const button = TH.querySelector('.changeType');

      if (!button) {
        return;
      }

      button.parentElement.removeChild(button);
    }
  };

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
      // enable the column menu for all columns
      dropdownMenu={true}
      // enable filtering for all columns
      filters={true}
      // `afterGetColHeader()` is a Handsontable hook
      // it's fired after Handsontable retrieves information about a column header
      // and appends it to the table header
      afterGetColHeader={removeColumnMenuButton}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```

:::

:::

## Configure filtering

You can configure the filter menu by configuring the [column menu](@/guides/columns/column-menu.md).

## Filter different types of data

You can filter different types of data, based on which [`type`](@/api/options.md#type) you configure
for each column.

::: only-for javascript

::: example #example5 --html 1 --js 2

```html
<div id="example5"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example5');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
      color: 'Black',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
      color: 'White',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
      color: 'Green',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
      color: 'Blue',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
      color: 'Black',
    },
  ],
  columns: [
    {
      title: 'Model<br>(text)',
      // set the type of the 'Model' column
      type: 'text', // 'text' is the default type, so you can omit this line
      data: 'model',
    },
    {
      title: 'Price<br>(numeric)',
      // set the type of the 'Price' column
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
      className: 'htLeft',
    },
    {
      title: 'Sold on<br>(date)',
      // set the type of the 'Date' column
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time<br>(time)',
      // set the type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock<br>(checkbox)',
      // set the type of the 'In stock' column
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
    {
      title: 'Size<br>(dropdown)',
      // set the type of the 'Size' column
      type: 'dropdown',
      data: 'size',
      source: ['XS', 'S', 'M', 'L', 'XL'],
      className: 'htCenter',
    },
    {
      title: 'Color<br>(autocomplete)',
      // set the type of the 'Size' column
      type: 'autocomplete',
      data: 'color',
      source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
      className: 'htCenter',
    },
  ],
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example5 :react

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
          model: 'Racing Socks',
          size: 'S',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
          color: 'Black',
        },
        {
          model: 'HL Mountain Shirt',
          size: 'XS',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
          color: 'White',
        },
        {
          model: 'Cycling Cap',
          size: 'L',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
          color: 'Green',
        },
        {
          model: 'Ski Jacket',
          size: 'M',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
          color: 'Blue',
        },
        {
          model: 'HL Goggles',
          size: 'XL',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
          color: 'Black',
        },
      ]}
      columns={[
        {
          title: 'Model<br>(text)',
          // set the type of the 'Model' column
          type: 'text', // 'text' is the default type, so you can omit this line
          data: 'model',
        },
        {
          title: 'Price<br>(numeric)',
          // set the type of the 'Price' column
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
          className: 'htLeft',
        },
        {
          title: 'Sold on<br>(date)',
          // set the type of the 'Date' column
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time<br>(time)',
          // set the type of the 'Time' column
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock<br>(checkbox)',
          // set the type of the 'In stock' column
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
        {
          title: 'Size<br>(dropdown)',
          // set the type of the 'Size' column
          type: 'dropdown',
          data: 'size',
          source: ['XS', 'S', 'M', 'L', 'XL'],
          className: 'htCenter',
        },
        {
          title: 'Color<br>(autocomplete)',
          // set the type of the 'Size' column
          type: 'autocomplete',
          data: 'color',
          source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
          className: 'htCenter',
        },
      ]}
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example5'));
/* end:skip-in-preview */
```

:::

:::

Different types offer different filter criteria. By default, you can apply criteria listed in the
following table.

| Type                                                                                                                                                                                                                                                                                                | Available filter criteria                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`text`](@/guides/cell-types/cell-type.md)                                                                                                                                                                                                                                                          | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Begins with<br>Ends with<br>Contains<br>Does not contain                                                       |
| [`numeric`](@/guides/cell-types/numeric-cell-type.md)                                                                                                                                                                                                                                               | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Greater than<br>Greater than or equal to<br>Less than<br>Less than or equal to<br>Is between<br>Is not between |
| [`date`](@/guides/cell-types/date-cell-type.md)                                                                                                                                                                                                                                                     | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Before<br>After<br>Is between<br>Tomorrow<br>Today<br>Yesterday                                                |
| [`time`](@/guides/cell-types/time-cell-type.md)<br>[`checkbox`](@/guides/cell-types/checkbox-cell-type.md)<br>[`dropdown`](@/guides/cell-types/dropdown-cell-type.md)<br>[`autocomplete`](@/guides/cell-types/autocomplete-cell-type.md)<br>[`password`](@/guides/cell-types/password-cell-type.md) | Same as [`text`](@/guides/cell-types/cell-type.md)                                                                                                                                   |

## Filter data on initialization

You can filter your data on Handsontable's initialization. For that, use Handsontable's
[`afterInit()`](@/api/hooks.md#afterinit) hook, and the [`Filters`](@/api/filters.md) plugin's API.

For example, the following demo starts off with a filter that's already applied, so it only displays
items whose price is less than $200.

::: only-for javascript

::: example #exampleFilterOnInitialization --html 1 --js 2

```html
<div id="exampleFilterOnInitialization"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleFilterOnInitialization');
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  // `afterInit()` is a Handsontable hook: it's fired after the Handsontable instance is initiated
  afterInit() {
    const handsontableInstance = this;
    // get the `Filters` plugin, so you can use its API
    const filters = handsontableInstance.getPlugin('Filters');

    // filter data by the 'Price' column (column at index 2)
    // to display only items that are less than ('lt') $200
    filters.addCondition(2, 'lt', [200]);
    filters.filter();
  },
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleFilterOnInitialization :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const hotTableComponentRef = useRef(null);
const filterByPrice = () =>  {
  const handsontableInstance = hotTableComponentRef.current.hotInstance;
  // get the `Filters` plugin, so you can use its API
  const filters = handsontableInstance.getPlugin('Filters');

  // filter data by the 'Price' column (column at index 2)
  // to display only items that are less than ('lt') $200
  filters.addCondition(2, 'lt', [200]);
  filters.filter();
};

export const HandsontableComponent = () => {
  return (
    <HotTable
      ref={hotTableComponentRef}
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
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      // `afterInit()` is a Handsontable hook: it's fired after the Handsontable instance is initiated
      afterInit={filterByPrice}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(
  <HandsontableComponent />,
  document.getElementById('exampleFilterOnInitialization')
);
/* end:skip-in-preview */
```

:::

:::

## Filter data as you type

https://handsontable.com/docs/react-data-grid/column-filter/#filter-as-you-type Krzysiek: Z dema
filter as you type (https://handsontable.com/docs/react-data-grid/column-filter/#filter-as-you-type)
wyrzucic delay (200ms) - ale wczesniej upewnic sie u autora (Wojtek Szymanski) ze to bezpieczne

Demo z inputem nad tabelka filtrujacym content (jak w search) - jak tutaj
https://handsontable.com/docs/react-data-grid/searching-values/#simplest-use-case dzialajace bardzo
podobnie, ale zamiast kolorowania wynikow, odfiltrowuje je szukajacych wartosci we wszystkich
kolumnach

Dodatkowe demo: https://jsfiddle.net/aszymanski/q715uyg4/

## Add a custom filter icon

https://forum.handsontable.com/t/custom-filter-icon-and-context-menu/4073

Demo: Przycisk do sortowania widoczny tylko po najechaniu na header (on:hover) jako alternatywa do
domyslnego zachowania

## Change the size of the filter menu

Width: http://jsfiddle.net/handsoncode/zxguhohs/

Height:

- zrobic demo

## Exclude rows from filtering

You can exclude any number of top or bottom rows from filtering.

For example, if you [freeze](@/guides/rows/row-freezing.md) a row at the top (to display column
names), and freeze a row at the bottom (to display
[column summaries](@/guides/columns/column-summary.md)), you can prevent those frozen rows from
getting filtered, so they are always visible.

::: only-for javascript

::: example #exampleExcludeRows --html 1 --js 2

```html
<div id="exampleExcludeRows"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleExcludeRows');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Brand',
      model: 'Model',
      price: 'Price',
      sellDate: 'Date',
      sellTime: 'Time',
      inStock: 'In stock',
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 2,
    },
    {},
  ],
  columns: [
    {
      type: 'text',
      data: 'brand',
    },
    {
      type: 'text',
      data: 'model',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
      className: 'htLeft',
    },
    {
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'numeric',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 200,
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  colHeaders: true,
  columnSorting: true,
  // `afterColumnSort` is a Handsontable hook: it's fired after each filtering
  afterColumnSort() {
    const lastRowIndex = handsontableInstance.countRows() - 1;

    // after each filtering, take row 1 and change its index to 0
    handsontableInstance.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(0), 0);

    // after each filtering, take row 16 and change its index to 15
    handsontableInstance.rowIndexMapper.moveIndexes(
      handsontableInstance.toVisualRow(lastRowIndex),
      lastRowIndex
    );
  },
  cells(row, col, prop) {
    const lastRowIndex = this.instance.countRows() - 1;

    if (row === 0) {
      return {
        type: 'text',
        className: 'htCenter',
      };
    }
    if (row === lastRowIndex) {
      return {
        type: 'numeric',
        className: 'htCenter',
      };
    }
  },
  columnSummary: [
    {
      sourceColumn: 2,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 2,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
    {
      sourceColumn: 5,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 5,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleExcludeRows :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);
  const exclude = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;
    const lastRowIndex = handsontableInstance.countRows() - 1;

    // after each filtering, take row 1 and change its index to 0
    handsontableInstance.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(0), 0);
    // after each filtering, take row 16 and change its index to 15
    handsontableInstance.rowIndexMapper.moveIndexes(
      handsontableInstance.toVisualRow(lastRowIndex),
      lastRowIndex
    );
  };

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={[
        {
          brand: 'Brand',
          model: 'Model',
          price: 'Price',
          sellDate: 'Date',
          sellTime: 'Time',
          inStock: 'In stock',
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 11,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 0,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 1,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: 3,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 5,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 22,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 13,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: 14,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 16,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 18,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 3,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 2,
        },
        {},
      ]}
      columns={[
        {
          type: 'text',
          data: 'brand',
        },
        {
          type: 'text',
          data: 'model',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
          className: 'htLeft',
        },
        {
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
        },
        {
          type: 'numeric',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height={200}
      fixedRowsTop={1}
      fixedRowsBottom={1}
      colHeaders={true}
      columnSorting={true}
      // `afterColumnSort` is a Handsontable hook: it's fired after each filtering
      afterColumnSort={exclude}
      cells={(row, col, prop) => {
        if (row === 0) {
          return {
            type: 'text',
            className: 'htCenter',
          };
        }
        if (row === 15) {
          return {
            type: 'numeric',
            className: 'htCenter',
          };
        }
      }}
      columnSummary={[
        {
          sourceColumn: 2,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 2,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
        {
          sourceColumn: 5,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 5,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
      ]}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('exampleExcludeRows'));
/* end:skip-in-preview */
```

:::

:::

## Use filtering hooks

beforeFilter: http://jsfiddle.net/handsoncode/c8phv3dy/

## Filter passwords

Jesli w filter menu na liscie wynikow chcialbym widziec wizualne dane, a nie zrodlowe (co
szczegolnie bolesne jest w przypadku cell type: password), to czy mozemy to pokazac w postaci
customowego example?

## Server-side filtering

Block filtering on the front-end (to perform server-side filtering)

## Custom filter operators

https://mui.com/x/react-data-grid/filtering/#customize-the-operators

## Control filtering programmatically

### Enable or disable filtering programmatically

To enable or disable filtering programmatically, use the
[`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
handsontableInstance.updateSettings({
  // enable the column menu
  dropdownMenu: true,
  // enable the filter menu
  filters: true,
});

// disable filtering for all columns
handsontableInstance.updateSettings({
  filters: false,
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// enable filtering for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  // enable the column menu
  dropdownMenu: true,
  // enable the filter menu
  filters: true,
});

// disable filtering for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  filters: false,
});
```

:::

You can also enable or disable filtering for specific columns. For example:

### Filter data programmatically

https://handsontable.com/docs/react-data-grid/column-filter/#filter-from-the-outside-the-table

Through external buttons:

http://jsfiddle.net/8tvh9L1k/1/

Through checkboxes:

https://jsfiddle.net/kox9hLzu/1/

### Clear filter criteria for all columns at once

http://jsfiddle.net/wo1sqzz8/

https://jsfiddle.net/handsoncode/a5jgrxy4

### Filter a hidden column

https://forum.handsontable.com/t/filter-on-hidden-columns/4401

### Save filter settings

POPULAR

http://jsfiddle.net/AMBudnik/1ebkcdan/

https://forum.handsontable.com/t/save-filter-settings/669

### Reset filter settings

https://forum.handsontable.com/t/discard-reset-filter-by-clicking-reset-button/6124

### Clear filter settings automatically

### Get filtered rows

https://forum.handsontable.com/t/how-to-get-filterred-rows-in-afterfilter-hook/4753

### Uncheck "Filter by value" checkboxes by default

http://jsfiddle.net/s2tgjkvx/

### Get the "Filter by value" values as you type

https://jsfiddle.net/gqz3yLjc/

### Control the "Filter by value" list

Plus, najważniejsze i coś co pojawia się over and over... custom renderer vs. dane w filtrach + info
o tym, że nie ma API na kontrolowanie listy filter by value.

## Import the filtering module

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use filtering, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules.md#import-the-base-module)
- The [`DropdownMenu`](@/api/dropdownMenu.md) module
- The [`Filters`](@/api/filters.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';
// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';
// import the filtering plugins
import { registerPlugin, DropdownMenu, Filters } from 'handsontable/plugins';
// register the filtering plugins
registerPlugin(DropdownMenu);
registerPlugin(Filters);
```

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and
[Handsontable hooks](@/guides/getting-started/events-and-hooks.md) related to filtering, see the
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
