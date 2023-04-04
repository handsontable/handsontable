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
react:
  id: vz7ct2bv
  metaTitle: Column filter - React Data Grid | Handsontable
searchCategory: Guides
---

# Column filter

Filter your data by values or by a set of conditions.

[[toc]]

## Overview

With filtering, you can show the rows that you want to see and temporarily hide the rest. This lets
you quickly extract relevant data points, which is useful for analyzing large data sets.

You can filter data in different ways at the same time: by applying up to two filter conditions, and
by selecting as many values as you want. Handsontable displays the rows that match your criteria,
and [trims](@/guides/rows/row-trimming.md) the rest.

You can't use filtering with [nested data structures](@/guides/rows/row-parent-child.md)
([`NestedRows`](@/api/nestedRows.md)).

## Filtering demo

To try out filtering, see the following demo:

1. In the **Price** column, click on the column menu button (▼).
2. In **Filter by condition**, select **Greater than**, and type **100**.
3. As a second condition, select **Less than**, and type **1000**.
4. Press <kbd>**Enter**</kbd> to apply your filter. The menu button of the **Price** column turns
   green.

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
      className: 'htLeft',
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
          sellDate: 'Dec 2, 2023',
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
          className: 'htLeft',
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
ReactDOM.render(<App />, document.getElementById('exampleFilterBasicDemo'));
/* end:skip-in-preview */
```

:::

:::

To clear the filter:

1. Click on the green column menu button (▼).
2. In **Filter by condition**, select **None**.
3. Press <kbd>**Enter**</kbd> to display all the rows again.

## Enable filtering

The filter menu is part of the [column menu](@/guides/columns/column-menu.md), so you need to enable
two options: [`dropdownMenu`](@/api/options.md#dropdownmenu) and
[`filters`](@/api/options.md#filters).

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

To enable filtering without the default column menu items (**Insert column left** etc.), configure
the column menu to show the filter items only.

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
      className: 'htLeft',
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
          className: 'htLeft',
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
ReactDOM.render(<App />, document.getElementById('exampleShowFilterItemsOnly'));
/* end:skip-in-preview */
```

:::

:::

To enable filtering only for specific columns, hide the filter menu from the columns that you don't
want to filter. For example, in the following demo, you can filter only the **Brand** column.

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
      className: 'htLeft',
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

::: example #exampleEnableFilterInColumns :react

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
          className: 'htLeft',
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
ReactDOM.render(<App />, document.getElementById('exampleEnableFilterInColumns'));
/* end:skip-in-preview */
```

:::

:::

You can also remove the column menu button (▼) from the columns that you don't want to filter. For
that, use Handsontable's [`afterGetColHeader()`](@/api/hooks.md#aftergetcolheader) hook.

::: only-for javascript

::: example #exampleRemoveColumnMenuButton --html 1 --js 2

```html
<div id="exampleRemoveColumnMenuButton"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleRemoveColumnMenuButton');
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
      className: 'htLeft',
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

::: example #exampleRemoveColumnMenuButton :react

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
          className: 'htLeft',
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
ReactDOM.render(<App />, document.getElementById('exampleRemoveColumnMenuButton'));
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
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time<br>(time)',
      // set the type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
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
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time<br>(time)',
          // set the type of the 'Time' column
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
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
ReactDOM.render(<App />, document.getElementById('exampleFilterDifferentTypes'));
/* end:skip-in-preview */
```

:::

:::

Different types offer different comparison operators. For details, see the following table.

| Type                                                                                                                                                                                                                                                                                                | Available comparison operators                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`text`](@/guides/cell-types/cell-type.md)                                                                                                                                                                                                                                                          | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Begins with<br>Ends with<br>Contains<br>Does not contain                                                       |
| [`numeric`](@/guides/cell-types/numeric-cell-type.md)                                                                                                                                                                                                                                               | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Greater than<br>Greater than or equal to<br>Less than<br>Less than or equal to<br>Is between<br>Is not between |
| [`date`](@/guides/cell-types/date-cell-type.md)                                                                                                                                                                                                                                                     | None<br>Is empty<br>Is not empty<br>Is equal to<br>Is not equal to<br>Before<br>After<br>Is between<br>Tomorrow<br>Today<br>Yesterday                                                |
| [`time`](@/guides/cell-types/time-cell-type.md)<br>[`checkbox`](@/guides/cell-types/checkbox-cell-type.md)<br>[`dropdown`](@/guides/cell-types/dropdown-cell-type.md)<br>[`autocomplete`](@/guides/cell-types/autocomplete-cell-type.md)<br>[`password`](@/guides/cell-types/password-cell-type.md) | Same as [`text`](@/guides/cell-types/cell-type.md)                                                                                                                                   |

[about filtering passwords]

## Filter data on initialization

You can filter your data on Handsontable's initialization. This lets you apply default filters every
time you launch your grid.

To configure this, use Handsontable's [`afterInit()`](@/api/hooks.md#afterinit) hook and the
[`Filters`](@/api/filters.md) plugin's API. For example, the following demo starts off with a filter
that's already applied, so it only displays items whose price is less than $200.

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
      className: 'htLeft',
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
const filterBelow200 = () => {
  const handsontableInstance = hotTableComponentRef.current.hotInstance;
  // get the `Filters` plugin, so you can use its API
  const filters = handsontableInstance.getPlugin('Filters');

  // filter data by the 'Price' column (column at index 2)
  // to display only items that are less than ('lt') $200
  filters.addCondition(2, 'lt', [200]);
  filters.filter();
};

export const App = () => {
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
          className: 'htLeft',
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
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      // `afterInit()` is a Handsontable hook: it's fired after the Handsontable instance is initiated
      afterInit={filterBelow200}
      height="auto"
      stretchH="all"
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

## Filter data as you type

::: only-for javascript

::: example #exampleFilterAsYouType1 --html 1 --js 2

```html
<div class="controls">
  <input id="filter_field" type="search" placeholder="Filter" />
</div>
<div id="exampleFilterAsYouType1"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleFilterAsYouType1');
const filterField = document.querySelector('#filter_field');
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
      className: 'htLeft',
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});

// add a filter input listener
filterField.addEventListener('keyup', function (colIndex, event) {
  // get the `Filters` plugin, so you can use its API
  const filters = handsontableInstance.getPlugin('filters');
  filters.removeConditions(colIndex);
  filters.addCondition(colIndex, 'contains', [event.target.value]);
  filters.filter();

  console.log(filterResult);

  handsontableInstance.render();
});
```

:::

:::

::: only-for react

::: example #exampleFilterAsYouType1 :react

```jsx
import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  const data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ];
  let filterFieldKeyupCallback;

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    //  add a filter input listener
    filterFieldKeyupCallback = function (event) {
      // get the `Filters` plugin, so you can use its API
      const filters = hot.getPlugin('filters');
      const queryResult = search.query(event.target.value);

      console.log(queryResult);

      hot.render();
    };
  });

  return (
    <>
      <div className="controls">
        <input
          id="filter_field"
          type="search"
          placeholder="Filter"
          onKeyUp={(...args) => filterFieldKeyupCallback(...args)}
        />
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={true}
        search={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('exampleFilterAsYouType1'));
/* end:skip-in-preview */
```

:::

:::

## Customize the filter button

The filter menu is part of the [column menu](@/guides/columns/column-menu.md), so they both use the
same icon (▼). To modify or replace it, override Handsontable's CSS by editing a class called
`changeType`.

::: only-for javascript

::: example #exampleCustomFilterIcon --html 1 --js 2 --css 3

```html
<div id="exampleCustomFilterIcon"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomFilterIcon');
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
      className: 'htLeft',
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  // to differentiate this example's CSS from other examples on this page
  className: 'custom-filter-icon-example-1',
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
.custom-filter-icon-example-1 .changeType {
  border: 1px solid blue;
  background: white;
  border-radius: 50%;
  width: 20px;
  color: red;
}
```

:::

:::

::: only-for react

::: example #exampleCustomFilterIcon :react --js 1 --css 2

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
          className: 'htLeft',
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
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      // to differentiate this example's CSS from other examples on this page
      className="custom-filter-icon-example-1"
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomFilterIcon'));
/* end:skip-in-preview */
```

```css
.custom-filter-icon-example-1 .changeType {
  border: 1px solid blue;
  background: white;
  border-radius: 50%;
  width: 20px;
  color: red;
}

.custom-filter-icon-example-1 .changeType:hover {
  background-color: yellow;
}
```

:::

:::

To make the column menu button visible only on hover, override Handsontable's CSS by editing a class
called `relative`.

::: only-for javascript

::: example #exampleCustomFilterIcon2 --html 1 --js 2 --css 3

```html
<div id="exampleCustomFilterIcon2"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomFilterIcon2');
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
      className: 'htLeft',
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  // to differentiate this example's CSS from other examples on this page
  className: 'custom-filter-icon-example-2',
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
.custom-filter-icon-example-2 .changeType {
  visibility: hidden;
}

.custom-filter-icon-example-2 .relative:hover .changeType {
  visibility: visible;
}
```

:::

:::

::: only-for react

::: example #exampleCustomFilterIcon2 :react --js 1 --css 2

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
          className: 'htLeft',
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
      // enable the column menu
      dropdownMenu={true}
      // enable filtering
      filters={true}
      // to differentiate this example's CSS from other examples on this page
      className="custom-filter-icon-example-2"
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomFilterIcon2'));
/* end:skip-in-preview */
```

```css
.custom-filter-icon-example-2 .changeType {
  visibility: hidden;
}

.custom-filter-icon-example-2 .relative:hover .changeType {
  visibility: visible;
}
```

:::

:::

## Change the size of the filter menu

Width: http://jsfiddle.net/handsoncode/zxguhohs/

Height:

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
      sellTime: '01:23 AM',
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
      sellTime: '01:23 AM',
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
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  filters: true,
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

export const App = () => {
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
          sellTime: '01:23 AM',
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
          sellTime: '01:23 AM',
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
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      filters={true}
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
ReactDOM.render(<App />, document.getElementById('exampleExcludeRows'));
/* end:skip-in-preview */
```

:::

:::

## Use filtering hooks

You can run your code before or after filtering, using the following
[Handsontable hooks](@/guides/getting-started/events-and-hooks.md):

- [`beforeFilter()`](@/api/hooks.md#beforefilter)
- [`afterFilter()`](@/api/hooks.md#afterfilter)

For example, you can use [`beforeFilter()`](@/api/hooks.md#beforefilter) for server-side filtering,
or use [`afterFilter()`](@/api/hooks.md#afterfilter) to
[exclude rows from filtering](#exclude-rows-from-filtering).

::: only-for javascript

```js
const configurationOptions = {
  beforeFilter() {
    // add your code here
    return false; // to block front-end sorting
  },
  afterFilter() {
    // add your code here
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  beforeFilter={
    // add your code here
    return false; // to block front-end sorting
  }
  afterFilter={
    // add your code here
  }
/>
```

:::

## Custom filter operators

https://mui.com/x/react-data-grid/filtering/#customize-the-operators

## Control filtering programmatically

You can control filtering at the grid's runtime by using Handsontable's
[hooks](@/guides/getting-started/events-and-hooks.md) and [API methods](@/api/filters.md#methods).

This allows you to:

- Enable or disable filtering based on specified conditions. For example, you can disable filtering
  for very large data sets.
- Trigger filtering based on the state of another component in your application. For example, you
  can let the end user filter data by clicking on buttons outside of the grid.

### Enable or disable filtering programmatically

To enable or disable filtering programmatically, use the
[`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
// enable filtering for all columns
handsontableInstance.updateSettings({
  filters: true,
  // enable the column menu
  dropdownMenu: true,
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
  filters: true,
  // enable the column menu
  dropdownMenu: true,
});

// disable filtering for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  filters: false,
});
```

:::

You can also enable or disable filtering for specific columns. For example, to enable filtering only
for the first column:

::: only-for javascript

```js
handsontableInstance.updateSettings({
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
});
```

:::

### Filter data programmatically

What the demo shows:

- how to filter from outside of the table
- how to reset filter settings ("Clear all filters")

::: only-for javascript

::: example #exampleFilterThroughAPI1 --html 1 --js 2

```html
<div id="exampleFilterThroughAPI1"></div>

<div class="controls">
  <button class="filterBelow200">Filter for items below $200</button>
  <button class="filterAbove200">Filter for items above $200</button>
  <button class="clearAllFilters">Clear all filters</button>
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
      className: 'htLeft',
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
  // enable the column menu
  dropdownMenu: true,
  // enable filtering
  filters: true,
  height: 'auto',
  stretchH: 'all',
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
            className: 'htLeft',
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
        // enable the column menu
        dropdownMenu={true}
        // enable filtering
        filters={true}
        height="auto"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={filterBelow200}>Filter for items below $200</button>
        <br />
        <br />
        <button onClick={filterAbove200}>Filter for items above $200</button>
        <br />
        <br />
        <button onClick={clearAllFilters}>Clear all filters</button>
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
