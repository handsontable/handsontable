---
title: Nested rows
permalink: /8.5/nested-rows
canonicalUrl: /nested-rows
---

# {{ $frontmatter.title }}

[[toc]]

::: warning
Sorting and filtering in Nested rows is currently not supported.
:::

## Overview

The **_Nested Rows_** plugin extends Handsontable with a new functionality - displaying nested structures in a two-dimensional data table.

## Quick Setup

To enable the plugin, simply set the `nestedRows` property to `true`.

```js
var hot = new Handsontable(container, {
  data: sourceDataObject,
  rowHeaders: true,
  nestedRows: true,
  contextMenu: true
});
```

Note that using all the functionalities provided by the plugin requires setting `rowHeaders` (enables the row headers) and `contextMenu` (enables the Handsontable’s context menu) to `true`, as the _collapse_ / _expand_ buttons are located in the row headers and row modification options (_add row_, _insert child_ etc.) are in the Context Menu.

## Preparing the data source

The data source has to have a certain structure to be used with the _Nested Rows_ plugin.

The plugin requires the data source to be an **array of objects**. Each object in the array represents a single _0-level_ entry. By _0-level_ I mean an entry which is not a child to any other entry.
If an entry has any child entries, we need to declare them (again) as an _array of objects_. To assign them to a row, we need to create a `__children` property in the parent element.

Take a look at this example:

::: example #example1
```js
var sourceDataObject = [
  {
    category: 'Best Rock Performance',
    artist: null,
    title: null,
    label: null,
    __children: [
      {
        title: 'Don\'t Wanna Fight',
        artist: 'Alabama Shakes',
        label: 'ATO Records'
      },
      {
        title: 'What Kind Of Man',
        artist: 'Florence & The Machine',
        label: 'Republic'
      },
      {
        title: 'Something From Nothing',
        artist: 'Foo Fighters',
        label: 'RCA Records'
      },
      {
        title: 'Ex\'s & Oh\'s',
        artist: 'Elle King',
        label: 'RCA Records'
      },
      {
        title: 'Moaning Lisa Smile',
        artist: 'Wolf Alice',
        label: 'RCA Records/Dirty Hit'
      }
    ]
  },
  {
    category: 'Best Metal Performance',
    __children: [
      {
        title: 'Cirice',
        artist: 'Ghost',
        label: 'Loma Vista Recordings'
      },
      {
        title: 'Identity',
        artist: 'August Burns Red',
        label: 'Fearless Records'
      },
      {
        title: '512',
        artist: 'Lamb Of God',
        label: 'Epic Records'
      },
      {
        title: 'Thank You',
        artist: 'Sevendust',
        label: '7Bros Records'
      },
      {
        title: 'Custer',
        artist: 'Slipknot',
        label: 'Roadrunner Records'
      },
    ]
  },
  {
    category: 'Best Rock Song',
    __children: [
      {
        title: 'Don\'t Wanna Fight',
        artist: 'Alabama Shakes',
        label: 'ATO Records',
      },
      {
        title: 'Ex\'s & Oh\'s',
        artist: 'Elle King',
        label: 'RCA Records',
      },
      {
        title: 'Hold Back The River',
        artist: 'James Bay',
        label: 'Republic',
      },
      {
        title: 'Lydia',
        artist: 'Highly Suspect',
        label: '300 Entertainment',
      },
      {
        title: 'What Kind Of Man',
        artist: 'Florence & The Machine',
        label: 'Republic',
      },
    ]
  },
  {
    category: 'Best Rock Album',
    __children: [
      {
        title: 'Drones',
        artist: 'Muse',
        label: 'Warner Bros. Records',
      }, {
        title: 'Chaos And The Calm',
        artist: 'James Bay',
        label: 'Republic',
      }, {
        title: 'Kintsugi',
        artist: 'Death Cab For Cutie',
        label: 'Atlantic',
      }, {
        title: 'Mister Asylum',
        artist: 'Highly Suspect',
        label: '300 Entertainment',
      }, {
        title: '.5: The Gray Chapter',
        artist: 'Slipknot',
        label: 'Roadrunner Records',
      }
    ]
  }
],
container = document.getElementById('example1'),
hot;

hot = new Handsontable(container, {
  data: sourceDataObject,
  rowHeaders: true,
  colHeaders: ['Category', 'Artist', 'Title', 'Album', 'Label'],
  nestedRows: true,
  contextMenu: true,
});
```
:::

In the example above we’ve created a data object consisting of 2016’s Grammy nominees of the “Rock” genre. As you can see, each _0-level_ entry declares a category, while their children declare nominees - they’re assigned under the `__children` properties.

Another thing to mention - the **first** 0-level object in the array needs to have all columns defined to display the table properly. They can be declared as `null` or `''` (an empty string), but they need to be defined. This is optional for the other objects.

## User interface

The _Nested Rows_ plugin user interface is placed in the row headers and the Handsontable’s context menu.

### Row headers

Each _parent_ row header contains a `+`/`-` button. It is used to collapse or expand its child rows.

Moreover, the child rows’ headers had been given a bigger indentation, so the user can clearly recognize the child and parent elements.

### Context Menu

The context menu has been extended with a few Nested Rows-related options, such as:

* Insert child row
* Detach from parent

Moreover, the “Insert row above” and “Insert row below” options were modified to work properly with the nested data structure.
