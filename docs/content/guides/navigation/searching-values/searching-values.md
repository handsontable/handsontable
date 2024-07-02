---
id: ct5f32ig
title: Searching values
metaTitle: Searching values - JavaScript Data Grid | Handsontable
description: Search data across Handsontable, using built-in API methods and implementing your own search UI.
permalink: /searching-values
canonicalUrl: /searching-values
tags:
  - find values
  - highlight values
  - search values
react:
  id: 48lhnrbd
  metaTitle: Searching values - React Data Grid | Handsontable
searchCategory: Guides
category: Navigation
---

# Searching values

Search data across Handsontable, using the built-in API methods of the [`Search`](@/api/search.md) plugin, and implementing your own search UI.

[[toc]]

## Overview

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

The [`Search`](@/api/search.md) plugin provides an easy API to search data across Handsontable.

You should first enable the plugin by setting the [`search`](@/api/options.md#search) option to `true`. When enabled, the [`Search`](@/api/search.md) plugin exposes a new method [`query(queryStr)`](@/api/search.md#query), where [`queryStr`](@/api/search.md#query) is a string to find within the table. By default, the search is case insensitive.

[`query(queryStr, [callback], [queryMethod])`](@/api/search.md#query) method does 2 things. First of all, it returns an array of search results. Every element is an objects containing 3 properties:

- `row` – index of the row where the value has been found
- `col` – index of the column where the value has been found
- `data` – the value that has been found

The second thing the [`query()`](@/api/search.md#query) method does is set the `isSearchResult` property for each cell. If a cell is in search results, then its `isSearchResult` is set to `true`, otherwise the property is set to `false`.

All you have to do now, is use the [`query()`](@/api/search.md#query) method inside search input listener and you're done.

## Search result class

By default, the [`Search`](@/api/search.md) plugin adds `htSearchResult` class to every cell which `isSearchResult` property is `true`. You can change this class using [`searchResultClass`](@/api/options.md#search) configuration option.

To change the result class, you use the [`var searchPlugin = hot.getPlugin('search'); searchPlugin.setSearchResultClass(className);`](@/api/search.md#setsearchresultclass) method.

## Custom `queryMethod`

The [`queryMethod()`](@/api/search.md#query) function is responsible for determining whether a `queryStr` matches the value stored in a cell. It takes 2 arguments: `queryStr` and `cellData`. The first is a string passed to [`query()`](@/api/search.md#query) method. The second is a value returned by [`getDataAtCell()`](@/api/core.md#getdataatcell). The [`queryMethod()`](@/api/options.md#search) function should return `true` if there is a match.

The default [`queryMethod`](@/api/options.md#search) function is dead simple:

```js
const DEFAULT_QUERY_METHOD = function(query, value) {
  if (isUndefined(query) || query === null || !query.toLowerCase || query.length === 0) {
    return false;
  }
  if (isUndefined(value) || value === null) {
    return false;
  }

  return value.toString().toLowerCase().indexOf(query.toLowerCase()) !== -1;
};
```

If you want to change the [`queryMethod`](@/api/search.md#query), use the [`queryMethod`](@/api/options.md#search) option. You can also pass the [`queryMethod`](@/api/options.md#search) as the third argument of [`query()`](@/api/search.md#query) method. To change the [`queryMethod`](@/api/options.md#search), use [`var searchPlugin = hot.getPlugin('search'); searchPlugin.setQueryMethod(myNewQueryMethod);`](@/api/search.md#setquerymethod).

## Custom result callback

After calling [`queryMethod`](@/api/options.md#search) the [`Search`](@/api/search.md) plugin calls `callback(instance, rowIndex, colIndex, cellData, testResult)` for every cell.

Just as the [`queryMethod`](@/api/options.md#search), you can override this callback, using [`var searchPlugin = hot.getPlugin('search'); searchPlugin.setCallback(myNewCallbackFunction);`](@/api/search.md#setcallback), or passing your callback as the second argument of [`query()`](@/api/search.md#query) method.

The default `callback` is responsible for setting the `isSearchResult` property.

```js
const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};
```

## Simplest use case

The example below:
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) configuration option to `true`)
- Adds a search input listener
- Inside the search input listener, gets the [`Search`](@/api/search.md) plugin's instance
- Uses the [`Search`](@/api/search.md) plugin's [`query()`](@/api/search.md#query) method

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/navigation/searching-values/javascript/example1.html)
@[code](@/content/guides/navigation/searching-values/javascript/example1.js)
@[code](@/content/guides/navigation/searching-values/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/navigation/searching-values/react/example1.jsx)
@[code](@/content/guides/navigation/searching-values/react/example1.tsx)

:::

:::

## Custom search result class

You can style your search results with a custom CSS class, using the [`Search`](@/api/search.md) plugin's [`searchResultClass`](@/api/options.md#search) option.

The example below highlights its search results in bold red. To do this, it:
- Defines a custom CSS class called `my-custom-search-result-class`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) configuration option to an object)
- Sets the [`Search`](@/api/search.md) plugin's [`searchResultClass`](@/api/options.md#search) option to `'my-custom-search-result-class'`

::: only-for javascript

::: example #example2 --css 1 --html 2 --js 3 --ts 4

@[code](@/content/guides/navigation/searching-values/javascript/example2.css)
@[code](@/content/guides/navigation/searching-values/javascript/example2.html)
@[code](@/content/guides/navigation/searching-values/javascript/example2.js)
@[code](@/content/guides/navigation/searching-values/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/navigation/searching-values/react/example2.css)
@[code](@/content/guides/navigation/searching-values/react/example2.jsx)
@[code](@/content/guides/navigation/searching-values/react/example2.tsx)

:::

:::

## Custom query method

You can add a custom query method, using the [`Search`](@/api/search.md) plugin's [`queryMethod`](@/api/search.md#query).

The example below searches only for exact search query matches. To do this, it:
- Defines a custom query method called `onlyExactMatch`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) configuration option to an object)
- Sets the [`Search`](@/api/search.md) plugin's [`queryMethod`](@/api/options.md#search) option to `onlyExactMatch`

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/navigation/searching-values/javascript/example3.html)
@[code](@/content/guides/navigation/searching-values/javascript/example3.js)
@[code](@/content/guides/navigation/searching-values/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/navigation/searching-values/react/example3.jsx)
@[code](@/content/guides/navigation/searching-values/react/example3.tsx)

:::

:::

## Custom callback

You can add a custom callback function, using the [`Search`](@/api/search.md) plugin's [`callback`](@/api/search.md) option.

The example below displays the number of matching search results. To do this, it:
- Defines a custom callback function called `searchResultCounter`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) configuration option to an object)
- Sets the [`Search`](@/api/search.md) plugin's [`callback`](@/api/search.md) option to `searchResultCounter`

::: only-for javascript

::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/navigation/searching-values/javascript/example4.html)
@[code](@/content/guides/navigation/searching-values/javascript/example4.js)
@[code](@/content/guides/navigation/searching-values/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/navigation/searching-values/react/example4.jsx)
@[code](@/content/guides/navigation/searching-values/react/example4.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`search`](@/api/options.md#search)
- Plugins:
  - [`Search`](@/api/search.md)
