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
category: Columns
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
[fixed column widths](@/guides/columns/column-width/column-width.md#set-the-column-width-as-a-constant).

::: only-for javascript

::: example #exampleFilterBasicDemo --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleFilterBasicDemo.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterBasicDemo.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterBasicDemo.ts)

:::

:::

::: only-for react

::: example #exampleFilterBasicDemo :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleFilterBasicDemo.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleFilterBasicDemo.tsx)

:::

:::

## Enable filtering

To enable the filtering interface for all columns, you need to do two things:

1. Set the `filters` option to `true`.
2. Enable the interface by setting the `dropdownMenu` option to `true`.

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

<span style="display: none;"></span>

By default, the column menu presents the filtering interface along with other default items such as
**Insert column left**. To display only the filtering interface, pass an array of filter items in
the configuration.

::: only-for javascript

::: example #exampleShowFilterItemsOnly --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleShowFilterItemsOnly.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleShowFilterItemsOnly.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleShowFilterItemsOnly.ts)

:::

:::

::: only-for react

::: example #exampleShowFilterItemsOnly :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleShowFilterItemsOnly.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleShowFilterItemsOnly.tsx)

:::

:::

### Enable filtering for individual columns

You have control over which columns are filterable and for which columns the column menu is enabled.
In the following demo, only the **Brand** column is filterable, while the other columns are not.
However, the **Model** column still has the column menu available in case you want to have some
useful items in the menu such as **Clear column**.

::: only-for javascript

::: example #exampleEnableFilterInColumns --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleEnableFilterInColumns.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleEnableFilterInColumns.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleEnableFilterInColumns.ts)

:::

:::

::: only-for react

::: example #exampleEnableFilterInColumns :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleEnableFilterInColumns.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleEnableFilterInColumns.tsx)

:::

:::

## Filter different types of data

With its built-in cell types, Handsontable makes it easy to handle common data types like text,
numbers, and dates by providing numerous configuration options. In addition, the filtering feature
is designed to understand the underlying data and provides an adaptive interface that is tailored to
each data type.

::: only-for javascript

::: example #exampleFilterDifferentTypes --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleFilterDifferentTypes.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterDifferentTypes.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterDifferentTypes.ts)

:::

:::

::: only-for react

::: example #exampleFilterDifferentTypes :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleFilterDifferentTypes.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleFilterDifferentTypes.tsx)

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

::: example #exampleFilterOnInitialization --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleFilterOnInitialization.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterOnInitialization.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterOnInitialization.ts)

:::

:::

::: only-for react

To do this, use the API provided by the [`Filters`](@/api/filters.md) plugin. For instance, the demo
below demonstrates how you can start with a pre-applied filter to display only items priced less
than $200.

::: example #exampleFilterOnInitialization :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleFilterOnInitialization.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleFilterOnInitialization.tsx)

:::

:::

## External quick filter

Handsontable's quick filter feature lets you search for a particular phrase in a specific column. To
accomplish this, use methods [`filters.addCondition()`](@/api/filters.md#addcondition) and
[`filters.filter()`](@/api/filters.md#filter).

::: only-for javascript

::: example #exampleQuickFilter --html 1 --js 2 --ts 3 --css 4

@[code](@/content/guides/columns/column-filter/javascript/exampleQuickFilter.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleQuickFilter.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleQuickFilter.ts)
@[code](@/content/guides/columns/column-filter/javascript/exampleQuickFilter.css)

:::

:::

::: only-for react

::: example #exampleQuickFilter :react --js 1 --css 2 --ts 3

@[code](@/content/guides/columns/column-filter/react/exampleQuickFilter.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleQuickFilter.css)
@[code](@/content/guides/columns/column-filter/react/exampleQuickFilter.tsx)

:::

:::

## Customize the filter button

The default button that opens the column menu can be styled with CSS by modifying
`button.changeType` variables and its `::before` pseudoclass that contains svg mask-image displaying an arrow
down icon.

::: only-for javascript

::: example #exampleCustomFilterButton --html 1 --js 2 --ts 3 --css 4

@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton.ts)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton.css)

:::

:::

::: only-for react

::: example #exampleCustomFilterButton :react --js 1 --css 2 --ts 3

@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton.css)
@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton.tsx)

:::

:::

The column menu button is always visible, but if you want it to appear only when the mouse cursor is
over the header, apply additional styling to `th .relative:hover .changeType`.

::: only-for javascript

::: example #exampleCustomFilterButton2 --html 1 --js 2 --ts 3 --css 4

@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton2.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton2.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton2.ts)
@[code](@/content/guides/columns/column-filter/javascript/exampleCustomFilterButton2.css)

:::

:::

::: only-for react

::: example #exampleCustomFilterButton2 :react --js 1 --css 2 --ts 3

@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton2.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton2.css)
@[code](@/content/guides/columns/column-filter/react/exampleCustomFilterButton2.tsx)

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

In the following demo, the first and the last row are [frozen](@/guides/rows/row-freezing/row-freezing.md), and
filtering doesn't affect them.

::: only-for javascript

::: example #exampleExcludeRowsFromFiltering --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleExcludeRowsFromFiltering.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleExcludeRowsFromFiltering.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleExcludeRowsFromFiltering.ts)

:::

:::

::: only-for react

::: example #exampleExcludeRowsFromFiltering :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleExcludeRowsFromFiltering.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleExcludeRowsFromFiltering.tsx)

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

::: example #exampleServerSideFilter --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleServerSideFilter.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleServerSideFilter.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleServerSideFilter.ts)

:::

:::

::: only-for react

::: example #exampleServerSideFilter :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleServerSideFilter.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleServerSideFilter.tsx)

:::

:::

## Control filtering programmatically

You can control filtering at the grid's runtime by using Handsontable's
[hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) and [API methods](@/api/filters.md#methods).
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

::: example #exampleFilterThroughAPI1 --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-filter/javascript/exampleFilterThroughAPI1.html)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterThroughAPI1.js)
@[code](@/content/guides/columns/column-filter/javascript/exampleFilterThroughAPI1.ts)

:::

:::

::: only-for react

::: example #exampleFilterThroughAPI1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-filter/react/exampleFilterThroughAPI1.jsx)
@[code](@/content/guides/columns/column-filter/react/exampleFilterThroughAPI1.tsx)

:::

:::

## Import the filtering module

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules/modules.md) that you need.

To use filtering, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules/modules.md#import-the-base-module)
- The [`Filters`](@/api/filters.md) module
- The [`DropdownMenu`](@/api/dropdownMenu.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

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

## Related keyboard shortcuts

| Windows                             | macOS                                  | Action            |  Excel  | Sheets  |
| ----------------------------------- | -------------------------------------- | ----------------- | :-----: | :-----: |
| <kbd>**Alt**</kbd>+<kbd>**A**</kbd> | <kbd>**Option**</kbd>+<kbd>**A**</kbd> | Clear all filters | &cross; | &cross; |

## API reference

For the list of [options](@/guides/getting-started/configuration-options/configuration-options.md), methods, and
[Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to filtering, see the
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
