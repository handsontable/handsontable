---
id: demo-searching
title: Searching
sidebar_label: Searching
slug: /demo-searching
---

The search plugin provides an easy interface to search data across Handsontable.

You should first enable the plugin by setting the `search` option to `true`. When enabled, `searchPlugin` exposes a new method `query(queryStr)`, where `queryStr` is a string to find within the table. By default, the search is case insensitive.

`query(queryStr, [callback], [queryMethod])` method does 2 things. First of all, it returns an array of search results. Every element is an objects containing 3 properties:

*   `row` – index of the row where the value has been found
*   `col` – index of the column where the value has been found
*   `data` – the value that has been found

The second thing the `query` does is set the `isSearchResult` property for each cell. If a cell is in search results, then its `isSearchResult` is set to `true`, otherwise the property is set to `false`.

All you have to do now, is use the `query()` method inside search input listener and you're done.

### Search result class

By default the `searchPlugin` adds `htSearchResult` class to every cell which `isSearchResult` property is `true`. You can change this class using `searchResultClass` option.

If you wish to change the result class, you can use the `var searchPlugin = hot.getPlugin('search'); searchPlugin.setSearchResultClass(className);` method.

### Custom `queryMethod`

The `queryMethod` is responsible for determining whether a `queryStr` matches the value stored in a cell. It takes 2 arguments: `queryStr` and `cellData`. The first is a string passed to `query()` method. The second is a value returned by `getDataAtCell()`. The `queryMethod` function should return `true` if there is a match.

The default `queryMethod` is dead simple:

      `const DEFAULT_QUERY_METHOD = function(query, value) {
    if (isUndefined(query) || query === null || !query.toLowerCase || query.length === 0) {
      return false;
    }
    if (isUndefined(value) || value === null) {
      return false;
    }

    return value.toString().toLowerCase().indexOf(query.toLowerCase()) !== -1;
  };
};` 
    

If you want to change the `queryMethod`, use `queryMethod` option. You can also pass the `queryMethod` as the third argument of `query()` method. To change the `queryMethod`, use `var searchPlugin = hot.getPlugin('search'); searchPlugin.setQueryMethod(myNewQueryMethod);`.

### Custom result callback

After calling `queryMethod` `searchPlugin` calls `callback(instance, rowIndex, colIndex, cellData, testResult)` for every cell.

Just as the `queryMethod`, you can override this callback, using `var searchPlugin = hot.getPlugin('search'); searchPlugin.setCallback(myNewCallbackFunction);`, or pass the `callback` as the second argument of `query()` method.

The default `callback` is responsible for setting the `isSearchResult` property.

      `const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};` 
    

Find the following examples below:

*   [Simplest use case](#page-simplest-use-case)
*   [Custom search result class](#page-custom-search-result-class)
*   [Custom query method](#page-custom-query-method)
*   [Custom callback](#page-custom-callback)

### Simplest use case

Edit Log to console

var data = \[ \['Tesla', 2017, 'black', 'black'\], \['Nissan', 2018, 'blue', 'blue'\], \['Chrysler', 2019, 'yellow', 'black'\], \['Volvo', 2020, 'yellow', 'gray'\] \], example = document.getElementById('example1'), searchFiled = document.getElementById('search\_field'), hot; hot = new Handsontable(example, { data: data, colHeaders: true, search: true }); Handsontable.dom.addEvent(searchFiled, 'keyup', function (event) { var search = hot.getPlugin('search'); var queryResult = search.query(this.value); console.log(queryResult); hot.render(); });

### Custom search result class

Edit Log to console

.htCore td.customClass { color: #f8f8ff; background: #1E90FF; } var data = \[ \["Tesla", 2017, "black", "black"\], \["Nissan", 2018, "blue", "blue"\], \["Chrysler", 2019, "yellow", "black"\], \["Volvo", 2020, "white", "gray"\] \], example2 = document.getElementById("example2"), hot2, searchFiled2; hot2 = new Handsontable(example2,{ data: data, colHeaders: true, search: { searchResultClass: 'customClass' } }); searchFiled2 = document.getElementById('search\_field2'); Handsontable.dom.addEvent(searchFiled2, 'keyup', function (event) { var search = hot2.getPlugin('search'); var queryResult = search.query(this.value); console.log(queryResult); hot2.render(); });

### Custom query method

Edit Log to console

var data = \[ \["Tesla", 2017, "black", "black"\], \["Nissan", 2018, "blue", "blue"\], \["Chrysler", 2019, "yellow", "black"\], \["Volvo", 2020, "white", "gray"\] \], example3 = document.getElementById("example3"), hot3, searchFiled3; function onlyExactMatch(queryStr, value) { return queryStr.toString() === value.toString(); }; hot3 = new Handsontable(example3,{ data: data, colHeaders: true, search: { queryMethod: onlyExactMatch } }); searchFiled3 = document.getElementById('search\_field3'); Handsontable.dom.addEvent(searchFiled3, 'keyup', function(event) { var search = hot3.getPlugin('search'); var queryResult = search.query(this.value); console.log(queryResult); hot3.render(); });

### Custom callback

0 results

Edit Log to console

var data = \[ \["Tesla", 2017, "black", "black"\], \["Nissan", 2018, "blue", "blue"\], \["Chrysler", 2019, "yellow", "black"\], \["Volvo", 2020, "white", "gray"\] \], example4 = document.getElementById("example4"), hot4, searchFiled4, resultCount, searchResultCount = 0; function searchResultCounter(instance, row, col, value, result) { const DEFAULT\_CALLBACK = function(instance, row, col, data, testResult) { instance.getCellMeta(row, col).isSearchResult = testResult; }; DEFAULT\_CALLBACK.apply(this, arguments); if (result) { searchResultCount++; } } hot4 = new Handsontable(example4,{ data: data, colHeaders: true, search: { callback: searchResultCounter } }); searchFiled4 = document.getElementById('search\_field4'); resultCount = document.getElementById('resultCount'); Handsontable.dom.addEvent(searchFiled4, 'keyup', function(event) { searchResultCount = 0; var search = hot4.getPlugin('search'); var queryResult = search.query(this.value); console.log(queryResult); resultCount.innerText = searchResultCount.toString(); hot4.render(); });

