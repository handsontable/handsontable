---
id: 3xxlonuv
title: Column filter
metaTitle: Column filter - JavaScript Data Grid | Handsontable
description: Filter your data by values or by a set of conditions.
permalink: /column-filter
canonicalUrl: /column-filter
tags:
  - filter
  - filtering
  - data filtering
  - dynamic filter
  - operator
  - criteria
  - conditions
  - expression
  - subset of data
  - excel filter
  - advanced filter
  - dropdown
react:
  id: vz7ct2bv
  metaTitle: Column filter - React Data Grid | Handsontable
searchCategory: Guides
---

# Column filter

Filter data by values or by a set of conditions, using Handsontable's intuitive user interface or
flexible API.

[[toc]]

## Overview

Filtering lets you quickly find the information that you're looking for, based on specific criteria.
This makes data analysis easier and faster, especially with large data sets.

Handsontable's built-in filtering interface resembles Excel's, so it's intuitive even to
non-technical users. And if you want to implement your own interface, you can easily filter data
programmatically, using Handsontable's API.

You can filter data by value, or use the built-in conditions, which are different for each of the
available column types.

## Filtering demo

Click on one of the column menu buttons (▼) and play around with filtering by selecting values or
conditions-based criteria.

After filtering, the column readjusts its width to the longest value displayed on screen. To disable
this behavior, set
[fixed column widths](@/guides/columns/column-width.md#set-the-column-width-as-a-constant).

::: only-for javascript

::: example #exampleFilterBasicDemo --html 1 --js 2

```html
<div id="exampleFilterBasicDemo"></div>
```

```js
// to import filtering as an individual module, see the 'Import the filtering module' section of this page
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleFilterBasicDemo');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleFilterBasicDemo :react

```jsx
// to import filtering as an individual module, see the 'Import the filtering module' section of this page
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleFilterBasicDemo'));
/* end:skip-in-preview */
```

:::

:::

## Enable filtering

To enable the filtering interface for all columns, you need to do two things:

1. Set the `filters` option to `true`.
2. Enable the interface by setting the `columnMenu` option to `true`.

Enabling the `filters` option without the interface can be useful if you plan to create your own
custom interface for filtering by using the API.

::: only-for javascript

```js
const configurationOptions = {
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable filtering
  filters={true}
  // enable the column menu
  dropdownMenu={true}
/>
```

:::

By default, the column menu presents the filtering interface along with other default items such as
**Insert column left**. To display only the filtering interface, pass an array of filter items in
the configuration.

::: only-for javascript

::: example #exampleShowFilterItemsOnly --html 1 --js 2

```html
<div id="exampleShowFilterItemsOnly"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleShowFilterItemsOnly');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu, but display only the filter menu items
  dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleShowFilterItemsOnly :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
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
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu, but display only the filter menu items
      dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleShowFilterItemsOnly'));
/* end:skip-in-preview */
```

:::

:::

### Enable filtering for individual columns

You have control over which columns are filterable and for which columns the column menu is enabled.
In the following demo, only the **Brand** column is filterable, while the other columns are not.
However, the **Model** column still has the column menu available in case you want to have some
useful items in the menu such as **Clear column**.

::: only-for javascript

::: example #exampleEnableFilterInColumns --html 1 --js 2

```html
<div id="exampleEnableFilterInColumns"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleEnableFilterInColumns');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // but display only the 'Filter by value' list and the 'OK' and 'Cancel' buttons
  dropdownMenu: {
    items: {
      filter_by_value: {
        // hide the 'Filter by value' list from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
      filter_action_bar: {
        // hide the 'OK' and 'Cancel' buttons from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
      clear_column: {
        // hide the 'Clear column' menu item from the first column
        hidden() {
          return this.getSelectedRangeLast().to.col < 1;
        },
      },
    },
  },
  // `afterGetColHeader()` is a Handsontable hook
  // it's fired after Handsontable appends information about a column header to the table header
  afterGetColHeader(col, TH) {
    // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
    if (col > 1) {
      const button = TH.querySelector('.changeType');

      if (!button) {
        return;
      }

      button.parentElement.removeChild(button);
    }
  },
  height: 'auto',
  example: 'exampleEnableFilterInColumns',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleEnableFilterInColumns :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
  const removeColumnMenuButton = (col, TH) => {
    if (col > 1) {
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
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // but display only the 'Filter by value' list and the 'OK' and 'Cancel' buttons
      dropdownMenu={{
        items: {
          filter_by_value: {
            // hide the 'Filter by value' list from all columns but the first one
            hidden() {
              return this.getSelectedRangeLast().to.col > 0;
            },
          },
          filter_action_bar: {
            // hide the 'OK' and 'Cancel' buttons from all columns but the first one
            hidden() {
              return this.getSelectedRangeLast().to.col > 0;
            },
          },
          clear_column: {
            // hide the 'Clear column' menu item from the first column
            hidden() {
              return this.getSelectedRangeLast().to.col < 1;
            },
          },
        },
      }}
      // `afterGetColHeader()` is a Handsontable hook
      // it's fired after Handsontable appends information about a column header to the table header
      afterGetColHeader={removeColumnMenuButton}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleEnableFilterInColumns'));
/* end:skip-in-preview */
```

:::

:::

## Filter different types of data

With its built-in cell types, Handsontable makes it easy to handle common data types like text,
numbers, and dates by providing numerous configuration options. In addition, the filtering feature
is designed to understand the underlying data and provides an adaptive interface that is tailored to
each data type.

::: only-for javascript

::: example #exampleFilterDifferentTypes --html 1 --js 2

```html
<div id="exampleFilterDifferentTypes"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleFilterDifferentTypes');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
      color: 'Black',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
      color: 'White',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
      color: 'Green',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
      color: 'Blue',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
      inStock: true,
      color: 'Black',
    },
  ],
  columns: [
    {
      title: 'Model',
      // set the type of the 'Model' column
      type: 'text', // 'text' is the default type, so you can omit this line
      data: 'model',
    },
    {
      title: 'Price',
      // set the type of the 'Price' column
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Sold on',
      // set the type of the 'Date' column
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      // set the type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      // set the type of the 'In stock' column
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
    {
      title: 'Size',
      // set the type of the 'Size' column
      type: 'dropdown',
      data: 'size',
      source: ['XS', 'S', 'M', 'L', 'XL'],
      className: 'htCenter',
    },
    {
      title: 'Color',
      // set the type of the 'Size' column
      type: 'autocomplete',
      data: 'color',
      source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
      className: 'htCenter',
    },
  ],
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 142,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleFilterDifferentTypes :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          model: 'Racing Socks',
          size: 'S',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
          color: 'Black',
        },
        {
          model: 'HL Mountain Shirt',
          size: 'XS',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
          color: 'White',
        },
        {
          model: 'Cycling Cap',
          size: 'L',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
          color: 'Green',
        },
        {
          model: 'Ski Jacket',
          size: 'M',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
          color: 'Blue',
        },
        {
          model: 'HL Goggles',
          size: 'XL',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
          inStock: true,
          color: 'Black',
        },
      ]}
      columns={[
        {
          title: 'Model',
          // set the type of the 'Model' column
          type: 'text', // 'text' is the default type, so you can omit this line
          data: 'model',
        },
        {
          title: 'Price',
          // set the type of the 'Price' column
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
        },
        {
          title: 'Sold on',
          // set the type of the 'Date' column
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          // set the type of the 'Time' column
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          // set the type of the 'In stock' column
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
        {
          title: 'Size',
          // set the type of the 'Size' column
          type: 'dropdown',
          data: 'size',
          source: ['XS', 'S', 'M', 'L', 'XL'],
          className: 'htCenter',
        },
        {
          title: 'Color',
          // set the type of the 'Size' column
          type: 'autocomplete',
          data: 'color',
          source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
          className: 'htCenter',
        },
      ]}
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      height={142}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleFilterDifferentTypes'));
/* end:skip-in-preview */
```

:::

:::

The following table contains all available filter operators for each built-in data type.

| Cell type                                                        | Available filter operators                                                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| All cell types                                                   | Default operators:<br><br>None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to                                                  |
| text<br>time<br>checkbox<br>dropdown<br>autocomplete<br>password | Default operators plus:<br><br>Begins with<br>Ends with<br>Contains<br>Does not contain                                                       |
| numeric                                                          | Default operators plus:<br><br>Greater than<br>Greater than or equal to<br>Less than<br>Less than or equal to<br>Is between<br>Is not between |
| date                                                             | Default operators plus:<br><br>Before<br>After<br>Is between<br>Tomorrow<br>Today<br>Yesterday                                                |

## Filter data on initialization

You can filter data on Handsontable's initialization. This lets you apply pre-defined filters every
time you launch your grid.

::: only-for javascript

To do this, you can use Handsontable's [`afterInit()`](@/api/hooks.md#afterinit) hook, along with
the API provided by the Filters plugin. For instance, the demo below demonstrates how you can start
with a pre-applied filter to display only items priced less than $200.

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
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
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
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

To do this, use the API provided by the [`Filters`](@/api/filters.md) plugin. For instance, the demo
below demonstrates how you can start with a pre-applied filter to display only items priced less
than $200.

::: example #exampleFilterOnInitialization :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);

  useEffect(() => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;
    // get the `Filters` plugin, so you can use its API
    const filters = handsontableInstance.getPlugin('Filters');

    // filter data by the 'Price' column (column at index 2)
    // to display only items that are less than ('lt') $200
    filters.addCondition(2, 'lt', [200]);
    filters.filter();
  }, []);

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleFilterOnInitialization'));
/* end:skip-in-preview */
```

:::

:::

## External quick filter

Handsontable's quick filter feature lets you search for a particular phrase in a specific column. To
accomplish this, use methods [`filters.addCondition()`](@/api/filters.md#addcondition) and
[`filters.filter()`](@/api/filters.md#filter).

::: only-for javascript

::: example #exampleQuickFilter --html 1 --js 2 --css 3

```html
<div class="controlsQuickFilter">
  <label for="columns" class="selectColumn">Select a column:</label>
  <select name="columns" id="columns">
    <option value="0">Brand</option>
    <option value="1">Model</option>
    <option value="2">Price</option>
    <option value="3">Date</option>
    <option value="4">Time</option>
    <option value="5">In stock</option>
  </select>
</div>
<div class="controlsQuickFilter">
  <input id="filterField" type="text" placeholder="Filter" />
</div>
<br />
<div id="exampleQuickFilter"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleQuickFilter');
const filterField = document.querySelector('#filterField');

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
  colHeaders: true,
  height: 'auto',
  filters: true,
  className: 'exampleQuickFilter',
  licenseKey: 'non-commercial-and-evaluation',
});

// add a filter input listener
filterField.addEventListener('keyup', function (event) {
  const filters = handsontableInstance.getPlugin('filters');
  const columnSelector = document.getElementById('columns');
  const columnValue = columnSelector.value;

  filters.removeConditions(columnValue);
  filters.addCondition(columnValue, 'contains', [event.target.value]);
  filters.filter();

  handsontableInstance.render();
});
```

```css
.controlsQuickFilter {
  margin: 0;
  padding: 0;
}

.selectColumn {
  color: gray;
}

#filterField {
  margin-top: 20px;
  padding: 2px 5px;
}
```

:::

:::

::: only-for react

::: example #exampleQuickFilter :react --js 1 --css 2

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);

  useEffect(() => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;
    const filterField = document.querySelector('#filterField');

    filterField.addEventListener('keyup', function (event) {
      const filtersPlugin = handsontableInstance.getPlugin('filters');
      const columnSelector = document.getElementById('columns');
      const columnValue = columnSelector.value;

      filtersPlugin.removeConditions(columnValue);
      filtersPlugin.addCondition(columnValue, 'contains', [event.target.value]);
      filtersPlugin.filter();

      handsontableInstance.render();
    });
  }, []);

  return (
    <>
      <div class="controlsQuickFilter">
        <label for="columns" class="selectColumn">
          Select a column:{' '}
        </label>
        <select name="columns" id="columns">
          <option value="0">Brand</option>
          <option value="1">Model</option>
          <option value="2">Price</option>
          <option value="3">Date</option>
          <option value="4">Time</option>
          <option value="5">In stock</option>
        </select>
      </div>
      <div class="controlsQuickFilter">
        <input id="filterField" type="text" placeholder="Filter" />
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '01:23 AM',
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
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
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
        filters={true}
        height="auto"
        className="exampleQuickFilter"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('exampleQuickFilter'));
```

```css
.controlsQuickFilter {
  margin: 0;
  padding: 0;
}

.selectColumn {
  color: white;
  mix-blend-mode: exclusion;
}

#filterField {
  margin: 20px 0px;
  padding: 2px 5px;
}
```

:::

:::

## Customize the filter button

The default button that opens the column menu can be styled with CSS by modifying
`button.changeType` and its `::before` pseudoclass that contains an HTML entity displaying an arrow
down icon.

::: only-for javascript

::: example #exampleCustomFilterButton --html 1 --js 2 --css 3

```html
<div id="exampleCustomFilterButton"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomFilterButton');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  // to differentiate this example's CSS from other examples on this page
  className: 'customFilterButtonExample1',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
.customFilterButtonExample1 .changeType {
  background: #e2e2e2;
  border-radius: 100%;
  width: 16px;
  color: #0075ff;
  height: 16px;
  padding: 3px 2px;
  border: none;
}

.customFilterButtonExample1 .changeType::before {
  content: '▼ ';
  zoom: 0.9;
}
```

:::

:::

::: only-for react

::: example #exampleCustomFilterButton :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      // to differentiate this example's CSS from other examples on this page
      className="customFilterButtonExample1"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomFilterButton'));
/* end:skip-in-preview */
```

```css
.customFilterButtonExample1 .changeType {
  background: #e2e2e2;
  border-radius: 100%;
  width: 16px;
  color: #0075ff;
  height: 16px;
  padding: 3px 2px;
  border: none;
}

.customFilterButtonExample1 .changeType::before {
  content: '▼ ';
  zoom: 0.9;
}
```

:::

:::

The column menu button is always visible, but if you want it to appear only when the mouse cursor is
over the header, apply additional styling to `th .relative:hover .changeType`.

::: only-for javascript

::: example #exampleCustomFilterButton2 --html 1 --js 2 --css 3

```html
<div id="exampleCustomFilterButton2"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomFilterButton2');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  // to differentiate this example's CSS from other examples on this page
  className: 'customFilterButtonExample2',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* hide the column menu button by default */
.customFilterButtonExample2 .changeType {
  visibility: hidden;
}

/* show the column menu button on hover */
.customFilterButtonExample2 th .relative:hover .changeType {
  visibility: visible;
}
```

:::

:::

::: only-for react

::: example #exampleCustomFilterButton2 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      // to differentiate this example's CSS from other examples on this page
      className="customFilterButtonExample2"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomFilterButton2'));
/* end:skip-in-preview */
```

```css
/* hide the column menu button by default */
.customFilterButtonExample2 .changeType {
  visibility: hidden;
}

/* show the column menu button on hover */
.customFilterButtonExample2 th .relative:hover .changeType {
  visibility: visible;
}
```

:::

:::

## Change the width of the filter menu

If the text data in your columns is too long to fit in the filters container, you can adjust the
column menu's width for better user experience. You can achieve this with by styling
`.htDropdownMenu table.htCore`.

```css
.handsontable .htDropdownMenu table.htCore {
  width: 300px !important;
}
```

## Exclude rows from filtering

You can exclude any number of top or bottom rows from filtering.

In the following demo, the first and the last row are [frozen](@/guides/rows/row-freezing.md), and
filtering doesn't affect them.

::: only-for javascript

::: example #exampleExcludeRowsFromFiltering --html 1 --js 2

```html
<div id="exampleExcludeRowsFromFiltering"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleExcludeRowsFromFiltering');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 2,
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
      className: 'htRight',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'numeric',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 200,
  colWidths: [120, 150, 120, 140, 120, 120],
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  minSpareRows: 1,
  colHeaders: true,
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  afterFilter() {
    let filtersRowsMap = this.getPlugin('filters').filtersRowsMap;

    filtersRowsMap.setValueAtIndex(0, false);
    filtersRowsMap.setValueAtIndex(filtersRowsMap.indexedValues.length - 1, false);
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleExcludeRowsFromFiltering :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const exclude = () => {
    let hotInstance = hotTableComponentRef.current.hotInstance;
    let filtersRowsMap = hotInstance.getPlugin('filters').filtersRowsMap;

    filtersRowsMap.setValueAtIndex(0, false);
    filtersRowsMap.setValueAtIndex(filtersRowsMap.indexedValues.length - 1, false);
  };

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={[
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 11,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 0,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 1,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: 3,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: 5,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 22,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 13,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 0,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: 14,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: 16,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 18,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 3,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 0,
        },
        {
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: 2,
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
          className: 'htRight',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'numeric',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height={200}
      colWidths={[120, 150, 120, 140, 120, 120]}
      fixedRowsTop={1}
      fixedRowsBottom={1}
      minSpareRows={1}
      colHeaders={true}
      filters={true}
      dropdownMenu={true}
      afterFilter={exclude}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleExcludeRowsFromFiltering'));
/* end:skip-in-preview */
```

:::

:::

## Server-side filtering

You can decide to use Handsontable as an intuitive filtering interface, but perform the actual
filtering on the server.

To help you with that, Handsontable's [`beforeFilter()`](@/api/hooks.md#beforefilter) hook allows
you to:

- Gather information about the filters that the user wants to apply, to send it to the server.
- Disable filtering on the front end, so it doesn't interfere with filtering on the server.

In the following demo, click on one of the column menu buttons (▼) and play around with filtering by
selecting values or conditions-based criteria. After you click **OK**, the ▼ button turns green to
indicate filtering, but the data is not filtered. Instead, the information about the specified
filters is logged to the console.

::: only-for javascript

::: example #exampleServerSideFilter --html 1 --js 2

```html
<div id="exampleServerSideFilter"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleServerSideFilter');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 'auto',
  // `beforeFilter()` is a Handsontable hook
  // it's fired after Handsontable gathers information about the filters, but before the filters are applied
  beforeFilter: function (conditionsStack) {
    // gather information about the filters
    console.log('The amount of filters: ' + conditionsStack.length);
    console.log('The last changed column index: ' + conditionsStack[0].column);
    console.log(
      'The amount of filters added to this column: ' + conditionsStack[0].conditions.length
    );
    // the list of filter conditions
    console.log(conditionsStack[0].conditions);

    // return `false` to disable filtering on the client side
    return false;
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleServerSideFilter :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '01:23 AM',
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
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      height="auto"
      // `beforeFilter()` is a Handsontable hook
      // it's fired after Handsontable gathers information about the filters, but before the filters are applied
      beforeFilter={function (conditionsStack) {
        // gather information about the filters
        console.log('The amount of filters: ' + conditionsStack.length);
        console.log('The last changed column index: ' + conditionsStack[0].column);
        console.log(
          'The amount of filters added to this column: ' + conditionsStack[0].conditions.length
        );
        // the list of filter conditions
        console.log(conditionsStack[0].conditions);

        // return `false` to disable filtering on the client side
        return false;
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleServerSideFilter'));
/* end:skip-in-preview */
```

:::

:::

## Control filtering programmatically

You can control filtering at the grid's runtime by using Handsontable's
[hooks](@/guides/getting-started/events-and-hooks.md) and [API methods](@/api/filters.md#methods).
This allows you to enable or disable filtering based on specific conditions. For example, you may
create a user interface outside of the grid to manage Handsontable's filtering behavior.

### Enable or disable filtering programmatically

To enable or disable filtering programmatically, use the
[`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
handsontableInstance.updateSettings({
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
});

handsontableInstance.updateSettings({
  // disable filtering
  filters: false,
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

hotTableComponentRef.current.hotInstance.updateSettings({
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
});

hotTableComponentRef.current.hotInstance.updateSettings({
  // disable filtering
  filters: false,
});
```

:::

You can also enable or disable filtering for specific columns. For example, to enable filtering only
for the first column:

::: only-for javascript

```js
handsontableInstance.updateSettings({
  // enable filtering, for all columns
  filters: true,
  // enable the column menu, for all columns
  // but display only the 'Filter by value' list and the 'OK' and 'Cancel' buttons
  dropdownMenu: {
    items: {
      filter_by_value: {
        // hide the 'Filter by value' list from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
      filter_action_bar: {
        // hide the 'OK' and 'Cancel' buttons from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
    },
  },
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

hotTableComponentRef.current.hotInstance.updateSettings({
  // enable filtering for all columns
  filters: true,
  // enable the column menu for all columns
  // but display only the 'Filter by value' list and the 'OK' and 'Cancel' buttons
  dropdownMenu: {
    items: {
      filter_by_value: {
        // hide the 'Filter by value' list from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
      filter_action_bar: {
        // hide the 'OK' and 'Cancel' buttons from all columns but the first one
        hidden() {
          return this.getSelectedRangeLast().to.col > 0;
        },
      },
    },
  },
});
```

:::

### Filter data programmatically

To filter data programmatically, use the [`Filters`](@/api/filters.md) plugin's API. Remember to
[enable filtering](#enable-filtering) first.

Mind that before you apply new filter conditions, you need to clear the previous ones with
[`filters.clearConditions()`](@/api/filters.md#clearconditions).

::: only-for javascript

::: example #exampleFilterThroughAPI1 --html 1 --js 2

```html
<div id="exampleFilterThroughAPI1"></div>

<div class="controls">
  <button class="filterBelow200">Show items &lt; $200</button>
  <br />
  <br />
  <button class="filterAbove200">Show items &gt; $200</button>
  <br />
  <br />
  <button class="clearAllFilters">Clear filters</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleFilterThroughAPI1');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

// get the `Filters` plugin, so you can use its API
const filters = handsontableInstance.getPlugin('Filters');

document.querySelector('.filterBelow200').addEventListener('click', function () {
  // clear any existing filters
  filters.clearConditions();
  // filter data by the 'Price' column (column at index 2)
  // to display only items that are less than ('lt') $200
  filters.addCondition(2, 'lt', [200]);
  filters.filter();
});

document.querySelector('.filterAbove200').addEventListener('click', function () {
  filters.clearConditions();
  // display only items that are more than ('gt') $200
  filters.addCondition(2, 'gt', [200]);
  filters.filter();
});

document.querySelector('.clearAllFilters').addEventListener('click', function () {
  filters.clearConditions();
  filters.filter();
});
```

:::

:::

::: only-for react

::: example #exampleFilterThroughAPI1 :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const filterBelow200 = () => {
    // get the `Filters` plugin, so you can use its API
    const filters = hotTableComponentRef.current.hotInstance.getPlugin('filters');

    // clear any existing filters
    filters.clearConditions();
    // filter data by the 'Price' column (column at index 2)
    // to display only items that are less than ('lt') $200
    filters.addCondition(2, 'lt', [200]);
    filters.filter();
  };

  const filterAbove200 = () => {
    // get the `Filters` plugin, so you can use its API
    const filters = hotTableComponentRef.current.hotInstance.getPlugin('filters');

    filters.clearConditions();
    // display only items that are more than ('gt') $200
    filters.addCondition(2, 'gt', [200]);
    filters.filter();
  };

  const clearAllFilters = () => {
    // get the `Filters` plugin, so you can use its API
    const filters = hotTableComponentRef.current.hotInstance.getPlugin('filters');

    // clear all filters
    filters.clearConditions();
    filters.filter();
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '01:23 AM',
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
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
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
        // enable filtering
        filters={true}
        // enable the column menu
        dropdownMenu={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={filterBelow200}>Show items &lt; $200</button>
        <br />
        <br />
        <button onClick={filterAbove200}>Show items &gt; $200</button>
        <br />
        <br />
        <button onClick={clearAllFilters}>Clear filters</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleFilterThroughAPI1'));
/* end:skip-in-preview */
```

:::

:::

## Import the filtering module

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use filtering, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules.md#import-the-base-module)
- The [`Filters`](@/api/filters.md) module
- The [`DropdownMenu`](@/api/dropdownMenu.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';

// import the filtering plugins
import { registerPlugin, Filters, DropdownMenu } from 'handsontable/plugins';

// register the filtering plugins
registerPlugin(Filters);
registerPlugin(DropdownMenu);
```

## Known limitations

At the moment, filtering comes with the following limitations:

- There is no easy way to add custom filter operators to the user interface.
- The list of values that you can filter by is generated automatically and there's no supported way
  of modifying it.

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
