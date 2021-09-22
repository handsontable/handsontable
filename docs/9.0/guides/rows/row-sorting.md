---
title: Row sorting
metaTitle: Row sorting - Guide - Handsontable Documentation
permalink: /9.0/row-sorting
canonicalUrl: /row-sorting
---

# Row sorting

[[toc]]

## Overview

The column sorting plugin works as a proxy between the datasource and the Handsontable rendering module.
It can:
* Map indices of displayed rows `visual indices` to the indices of corresponding rows in the datasource `physical indices` and vice versa
* Alter the order of rows presented to a user without changing the datasource’s internal structure

The sort operation is performed using a [stable sort algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability) regardless of the browser you use or the size of the data set which you sort.

::: tip
The `columnSorting` and `multiColumnSorting` plugins shouldn't be enabled simultaneously.
:::

## Basic plugin configuration

The simplest way to enable the plugin is to set the `columnSorting` key to `true`. You will then be able to **use [the API methods](#api)** and **click on the header to sort**, as shown in the example below:

By default:

* No column will be sorted initially
* A sorting indicator will be enabled
* Empty cells won't be sorted
* The sort method will use default compare functions - read more about them [here](#default-compare-functions)

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Tesla', 'Model 3', 'BlueStar', 'USA', '★★★★'],
    ['Tesla', 'Model S', 'WhiteStar', 'USA', '★★★★★'],
    ['Mitsubishi', 'iMiEV', '', 'Japan', '★★'],
    ['Ford', 'Focus EV', '', 'USA', '★★'],
    ['Mitsubishi', 'iMiEV Sport', '', 'Japan', '★★'],
    ['Tesla', 'Roadster', 'DarkStar', 'USA', '★★★★★'],
    ['Volkswagen', 'e-Golf','', 'Germany', '★★'],
    ['Volkswagen', 'E-Up!', '', 'Germany', '★★'],
    ['Ford', 'C-Max Energi', '', 'USA', '★'],
    ['BYD', 'Denza', '', 'China', '★★★'],
    ['BYD', 'e5', '', 'China', '★★★'],
    ['BYD', 'e6', '', 'China', '★★★★']
  ],
  colHeaders: ['Brand', 'Model', 'Code name', 'Country of origin', 'Rank'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Extended plugin configuration

Plugin options can be customized by providing a configuration as an `object`.

Here is the list of possible options to set:

* `initialConfig` (`Object`) determines the initial sort status for some column. It contains the following keys:
  * `column` (`Number`) determines the visual index of the sorted column
  * `sortOrder` (`String`) determines the order that the column will be sorted in - possible values: `'asc'` and `'desc'`
* `indicator` (`Boolean`) defines whether the sorting order indicator is displayed - an arrow icon in the column header specifying the sorting order
* `sortEmptyCells` (`Boolean`) defines whether empty cells should take part in the sorting process
* `headerAction` (`Boolean`) defines whether clicking the header should sort the table
* `compareFunctionFactory` (`Function`) defines the compare function factory - described in more detail in [this section](#custom-compare-functions)

See the example plugin configuration below:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['Tesla', 'Model 3', 'BlueStar', 'USA', '★★★★'],
    ['Tesla', 'Model S', 'WhiteStar', 'USA', '★★★★★'],
    ['Mitsubishi', 'iMiEV', '', 'Japan', '★★'],
    ['Ford', 'Focus EV', '', 'USA', '★★'],
    ['Mitsubishi', 'iMiEV Sport', '', 'Japan', '★★'],
    ['Tesla', 'Roadster', 'DarkStar', 'USA', '★★★★★'],
    ['Volkswagen', 'e-Golf','', 'Germany', '★★'],
    ['Volkswagen', 'E-Up!', '', 'Germany', '★★'],
    ['Ford', 'C-Max Energi', '', 'USA', '★'],
    ['BYD', 'Denza', '', 'China', '★★★'],
    ['BYD', 'e5', '', 'China', '★★★'],
    ['BYD', 'e6', '', 'China', '★★★★']
  ],
  height: 320,
  colHeaders: ['Brand', 'Model', 'Code name', 'Country of origin', 'Rank'],
  columnSorting: {
    sortEmptyCells: true,
    initialConfig: {
      column: 2,
      sortOrder: 'asc'
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

::: tip
Options defined by the `columnSorting` key in the main Handsontable settings apply to the entire table. Most of them can also be set for a particular column, as described in [this section](#column-options).
:::

## Default compare functions - sorting different kinds of data

As in the native [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) method, our internal sorting algorithm uses the **compare function** - also known as a **comparator**. Different kinds of cells like [date, numeric, text](@/guides/cell-types/cell-type.md) are treated differently. Each of them has its own comparator for sorting a particular data type.

As a result, you can see that different types of data are sorted properly. `Handsontable` simply needs the declared data type for the column, as shown in the example below.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    { brand: 'Tesla', model: 'Model 3', maxSpeed: 141, range: 215, seats: 5, price: 32750, productionDate: '06/29/2007' },
    { brand: 'Tesla', model: 'Model S', maxSpeed: 139, range: 275, seats: 7, price: 71788, productionDate: '04/02/2012' },
    { brand: 'Mitsubishi', model: 'iMiEV', maxSpeed: 81, range: 99, seats: 4, price: 31426.9, productionDate: '09/11/2009' },
    { brand: 'Ford', model: 'Focus EV', maxSpeed: 85, range: 100, seats: 4, price: 12000, productionDate: '10/01/2011' },
    { brand: 'Mitsubishi', model: 'iMiEV Sport', maxSpeed: 84, range: 124, seats: 4, price: 15000, productionDate: '05/11/2007' },
    { brand: 'Tesla', model: 'Roadster', maxSpeed: 125, range: 244, seats: 2, price: 113904.5, productionDate: '02/17/2008' },
    { brand: 'Volkswagen', model: 'e-Golf', maxSpeed: 87, range: 118, seats: 5, price: 33012, productionDate: '10/05/2011' },
    { brand: 'Volkswagen', model: 'E-Up!', maxSpeed: 85, range: 80, seats: 3, price: 32258.75, productionDate: '11/09/2009' },
    { brand: 'Ford', model: 'C-Max Energi', maxSpeed: 115, range: 18, seats: 5, price: 27120, productionDate: '11/25/2014' },
    { brand: 'BYD', model: 'Denza', maxSpeed: 93, range: 157, seats: 5, price: 47600, productionDate: '10/01/2011' },
    { brand: 'BYD', model: 'e5', maxSpeed: 93, range: 136, seats: 5, price: 22966.92, productionDate: '07/19/2015' },
    { brand: 'BYD', model: 'e6', maxSpeed: 87, range: 199, seats: 5, price: 31440, productionDate: '06/22/2009' }
  ],
  width: '100%',
  height: 320,
  colHeaders: ['Brand', 'Model', 'Max speed<br>(in miles per hour)', 'Range<br>(in miles)', 'Seats', 'Price', 'Start of<br>production'],
  columns: [{
    data: 'brand' // 1st column is simple text, no special options here
  }, {
    data: 'model'// 2nd column is simple text, no special options here
  }, {
    data: 'maxSpeed',
    type: 'numeric'
  }, {
    data: 'range',
    type: 'numeric'
  }, {
    data: 'seats',
    type: 'numeric'
  }, {
    data: 'price',
    type: 'numeric',
    numericFormat: {
      pattern: '$ 0,0.00',
      culture: 'en-US'
    }
  }, {
    data: 'productionDate',
    type: 'date',
    dateFormat: 'MM/DD/YYYY',
    correctFormat: true,
    defaultDate: '01/01/1900'
  }],
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom compare functions

You can pass in your own custom compare function to the sorting algorithm. This function should look the same as an argument in the native [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters) method - read the [description here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Description). It is handled by the plugin when `compareFunctionFactory` is defined in the configuration. The **compare function factory** must be placed under this key. The factory takes the parameters `sortOrder` and `columnMeta` and returns the compare function.

The example below shows how the custom compare function factory should look:

```js
function compareFunctionFactory(sortOrder, columnMeta) {
  return function comparator(value, nextValue) {
    // Some value comparisons which will return -1, 0 or 1...
  };
};
```

The next section details how the plugin may be used just for certain columns.

## Plugin options for certain columns only

The plugin's options, such as `compareFunctionFactory`, `sortEmptyCells`, `headerAction`, `indicator`, can be set just for a particular column. This can be done by using [columns](@/api/metaSchema.md#columns) option. The example below demonstrates how to disable the indicator and **completely block sorting action for the first column**:

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    { brand: 'Tesla', model: 'Model 3', maxSpeed: 141, range: 215, seats: 5, price: 32750, productionDate: '06/29/2007' },
    { brand: 'Tesla', model: 'Model S', maxSpeed: 139, range: 275, seats: 7, price: 71788, productionDate: '04/02/2012' },
    { brand: 'Mitsubishi', model: 'iMiEV', maxSpeed: 81, range: 99, seats: 4, price: 31426.9, productionDate: '09/11/2009' },
    { brand: 'Ford', model: 'Focus EV', maxSpeed: 85, range: 100, seats: 4, price: 12000, productionDate: '10/01/2011' },
    { brand: 'Mitsubishi', model: 'iMiEV Sport', maxSpeed: 84, range: 124, seats: 4, price: 15000, productionDate: '05/11/2007' },
    { brand: 'Tesla', model: 'Roadster', maxSpeed: 125, range: 244, seats: 2, price: 113904.5, productionDate: '02/17/2008' },
    { brand: 'Volkswagen', model: 'e-Golf', maxSpeed: 87, range: 118, seats: 5, price: 33012, productionDate: '10/05/2011' },
    { brand: 'Volkswagen', model: 'E-Up!', maxSpeed: 85, range: 80, seats: 3, price: 32258.75, productionDate: '11/09/2009' },
    { brand: 'Ford', model: 'C-Max Energi', maxSpeed: 115, range: 18, seats: 5, price: 27120, productionDate: '11/25/2014' },
    { brand: 'BYD', model: 'Denza', maxSpeed: 93, range: 157, seats: 5, price: 47600, productionDate: '10/01/2011' },
    { brand: 'BYD', model: 'e5', maxSpeed: 93, range: 136, seats: 5, price: 22966.92, productionDate: '07/19/2015' },
    { brand: 'BYD', model: 'e6', maxSpeed: 87, range: 199, seats: 5, price: 31440, productionDate: '06/22/2009' }
  ],
  height: 320,
  colHeaders: ['Brand<br><b>(non-sortable)</b>', 'Model', 'Max speed<br>(in miles per hour)', 'Range<br>(in miles)', 'Seats', 'Price', 'Start of<br>production'],
  columns: [{
    data: 'brand', // 1st column is simple text, no special options here
    columnSorting: {
      indicator: false,
      headerAction: false,
      compareFunctionFactory(sortOrder, columnMeta) {
        return (value, nextValue) => 0; // Don't sort the first visual column.
      }
    }
  }, {
    data: 'model'// 2nd column is simple text, no special options here
  }, {
    data: 'maxSpeed',
    type: 'numeric'
  }, {
    data: 'range',
    type: 'numeric'
  }, {
    data: 'seats',
    type: 'numeric'
  }, {
    data: 'price',
    type: 'numeric',
    numericFormat: {
      pattern: '$ 0,0.00',
      culture: 'en-US'
    }
  }, {
    data: 'productionDate',
    type: 'date',
    dateFormat: 'MM/DD/YYYY',
    correctFormat: true,
    defaultDate: '01/01/1900'
  }],
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom sort implementation

The plugin exposes the `setSortConfig` method. Use this to set the internal sort state.

::: tip
The data set **won't be sorted** just by using this method. The `isSorted` and `getSortConfig` methods will return results corresponding to the previously set configuration.
:::

To use a custom sort implementation, you need to:
* Provide a callback for the `beforeColumnSort` hook, which will return `false`
* Sort data by yourself - for example, on the server-side
* Set the internal state of the sort by using the `setSortConfig` method

The code snippet below provides an example of a custom sort implementation:

```js
beforeColumnSort(currentSortConfig, destinationSortConfigs) {
  const columnSortPlugin = this.getPlugin('columnSorting');

  columnSortPlugin.setSortConfig(destinationSortConfigs);

  // const newData = ... // Calculated data set, ie. from an AJAX call.

  // this.loadData(newData); // Load a new data set.

  return false; // The blockade for the default sort action.
}
```

## Plugin hooks

The plugin provides two hooks:

* [beforeColumnSort](@/api/pluginHooks.md#beforecolumnsort) runs before the sort
  * The sort configuration obtained by the `getSortConfig` method within the callback will match the sort configuration preserved before the hook call
  * The callback for `beforeColumnSort` will return `false` and stop the table from being sorted, which results in the `afterColumnSort` hook not being called
* [afterColumnSort](@/api/pluginHooks.md#aftercolumnsort) always runs after sorting unless the callback for `beforeColumnSort` hook returns `false`

::: tip
Hooks are also run when you use the `clearSort` method or provide a configuration that won't be processed, causing validation to fail.
:::

## Plugin API

List of methods exposed by the plugin:

* [clearSort](@/api/columnSorting.md#clearsort)
* [getSortConfig](@/api/columnSorting.md#getsortconfig)
* [isSorted](@/api/columnSorting.md#issorted)
* [setSortConfig](@/api/columnSorting.md#setsortconfig)
* [sort](@/api/columnSorting.md#sort)
