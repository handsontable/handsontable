---
title: Searching values
metaTitle: Searching values - Guide - Handsontable Documentation
permalink: /next/searching-values
canonicalUrl: /searching-values
tags:
  - find values
  - highlight values
---

# Searching values

[[toc]]

The search plugin provides an easy interface to search data across Handsontable.

You should first enable the plugin by setting the `search` option to `true`. When enabled, `searchPlugin` exposes a new method `query(queryStr)`, where `queryStr` is a string to find within the table. By default, the search is case insensitive.

`query(queryStr, [callback], [queryMethod])` method does 2 things. First of all, it returns an array of search results. Every element is an objects containing 3 properties:

* `row` – index of the row where the value has been found
* `col` – index of the column where the value has been found
* `data` – the value that has been found

The second thing the `query` does is set the `isSearchResult` property for each cell. If a cell is in search results, then its `isSearchResult` is set to `true`, otherwise the property is set to `false`.

All you have to do now, is use the `query()` method inside search input listener and you're done.

## Search result class

By default the `searchPlugin` adds `htSearchResult` class to every cell which `isSearchResult` property is `true`. You can change this class using `searchResultClass` option.

If you wish to change the result class, you can use the `var searchPlugin = hot.getPlugin('search'); searchPlugin.setSearchResultClass(className);` method.

## Custom `queryMethod`

The `queryMethod` is responsible for determining whether a `queryStr` matches the value stored in a cell. It takes 2 arguments: `queryStr` and `cellData`. The first is a string passed to `query()` method. The second is a value returned by `getDataAtCell()`. The `queryMethod` function should return `true` if there is a match.

The default `queryMethod` is dead simple:

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

If you want to change the `queryMethod`, use `queryMethod` option. You can also pass the `queryMethod` as the third argument of `query()` method. To change the `queryMethod`, use `var searchPlugin = hot.getPlugin('search'); searchPlugin.setQueryMethod(myNewQueryMethod);`.

## Custom result callback

After calling `queryMethod` `searchPlugin` calls `callback(instance, rowIndex, colIndex, cellData, testResult)` for every cell.

Just as the `queryMethod`, you can override this callback, using `var searchPlugin = hot.getPlugin('search'); searchPlugin.setCallback(myNewCallbackFunction);`, or pass the `callback` as the second argument of `query()` method.

The default `callback` is responsible for setting the `isSearchResult` property.

```js
const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};
```

## Simplest use case

The example below:
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) [configuration option](@/guides/getting-started/setting-options.md) to `true`)
- Adds a search input listener
- Inside the search input listener, gets the [`Search`](@/api/search.md) plugin's instance
- Uses the [`Search`](@/api/search.md) plugin's [`query()`](@/api/search.md#query) method

::: example #example1 --html 1 --js 2
```html
<input id="search_field" type="search" placeholder="Search"/>
<div id="example1"></div>
```
```js
const container = document.querySelector('#example1');
const searchField = document.querySelector('#search_field');

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'yellow', 'gray']
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

// add a search input listener
Handsontable.dom.addEvent(searchField, 'keyup', function(event) {
  // get the `Search` plugin's instance
  const search = hot.getPlugin('search');
  // use the `Search` plugin's `query()` method
  const queryResult = search.query(this.value);

  console.log(queryResult);

  hot.render();
});
```
:::

## Custom search result class

You can style your search results with a custom CSS class, using the [`Search`](@/api/search.md) plugin's [`searchResultClass`](@/api/search.md) option.

The example below highlights its search results in bold red. To do this, it:
- Defines a custom CSS class called `my-custom-search-result-class`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) [configuration option](@/guides/getting-started/setting-options.md) to a configuration object)
- Sets the [`Search`](@/api/search.md) plugin's [`searchResultClass`](@/api/search.md) option to `'my-custom-search-result-class'`

::: example #example2 --css 1 --html 2 --js 3
````css
.my-custom-search-result-class{
  color: #ff0000;
  font-weight: 900;
}
````
```html
<input id="search_field2" type="search" placeholder="Search"/>
<div id="example2"></div>
```
```js
const container = document.querySelector('#example2');
const searchField = document.querySelector('#search_field2');

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'yellow', 'gray']
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: {
    // add your custom CSS class
    searchResultClass: 'my-custom-search-result-class'
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

Handsontable.dom.addEvent(searchField, 'keyup', function(event) {
  const search = hot.getPlugin('search');
  const queryResult = search.query(this.value);

  console.log(queryResult);
  hot.render();
});
```
:::

## Custom query method

You can add a custom query method, using the [`Search`](@/api/search.md) plugin's [`queryMethod`](@/api/search.md) option.

The example below searches only for exact search query matches. To do this, it:
- Defines a custom query method called `onlyExactMatch`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) [configuration option](@/guides/getting-started/setting-options.md) to a configuration object)
- Sets the [`Search`](@/api/search.md) plugin's [`queryMethod`](@/api/search.md) option to `onlyExactMatch`

::: example #example3 --html 1 --js 2
```html
<input id="search_field3" type="search" placeholder="Search"/>
<div id="example3"></div>
```
```js
const container = document.querySelector('#example3');
const searchField = document.querySelector('#search_field3');

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'white', 'gray']
];

// define your custom query method
function onlyExactMatch(queryStr, value) {
  return queryStr.toString() === value.toString();
};

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: {
    // add your custom query method
    queryMethod: onlyExactMatch
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

Handsontable.dom.addEvent(searchField, 'keyup', function(event) {
  const search = hot.getPlugin('search');
  // use the `Search`'s `query()` method
  const queryResult = search.query(this.value);

  console.log(queryResult);

  hot.render();
});
```
:::

## Custom callback

You can add a custom callback function, using the [`Search`](@/api/search.md) plugin's [`callback`](@/api/search.md) option.

The example below displays the number of matching search results. To do this, it:
- Defines a custom callback function called `searchResultCounter`
- Enables the [`Search`](@/api/search.md) plugin (by setting the [`search`](@/api/options.md#search) [configuration option](@/guides/getting-started/setting-options.md) to a configuration object)
- Sets the [`Search`](@/api/search.md) plugin's [`callback`](@/api/search.md) option to `searchResultCounter`

::: example #example4 --html 1 --js 2
```html
<input id="search_field4" type="search" placeholder="Search"/>
<p><span id="resultCount">0</span> results</p>
<div id="example4"></div>
```
```js
const container = document.querySelector('#example4');
const searchField = document.querySelector('#search_field4');
const resultCount = document.querySelector('#resultCount');

let searchResultCount = 0;

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'white', 'gray']
];

// define your custom callback function
function searchResultCounter(instance, row, col, value, result) {
  const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  DEFAULT_CALLBACK.apply(this, arguments);

  if (result) {
    searchResultCount++;
  }
}

const hot4 = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: {
    // add your custom callback function
    callback: searchResultCounter
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

Handsontable.dom.addEvent(searchField, 'keyup', function(event) {
  searchResultCount = 0;

  const search = hot4.getPlugin('search');
  const queryResult = search.query(this.value);

  console.log(queryResult);
  resultCount.innerText = searchResultCount.toString();
  hot4.render();
});
```
:::
