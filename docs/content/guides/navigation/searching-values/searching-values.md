---
type: how-to
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
angular:
  id: q7wwbzzr
  metaTitle: Searching values - Angular Data Grid | Handsontable
vue:
  id: bzxlya7r
  metaTitle: Searching values - Vue Data Grid | Handsontable
searchCategory: Guides
category: Navigation
---
Enable the [`Search`](@/api/search.md) plugin and call [`query()`](@/api/search.md#query) on each keystroke to highlight matching cells across the grid.

[[toc]]

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

::: only-for angular

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::

:::

::: only-for vue

::: tip

To use the Handsontable API, use a template ref on `HotTable` and read `hotRef.value.hotInstance`.

For more information, see [Referencing the Handsontable instance in Vue 3](@/guides/integrate-with-vue3/vue3-hot-reference/vue3-hot-reference.md).

:::

:::

The [`Search`](@/api/search.md) plugin lets you scan all cells in the grid and get back a list of matches. Enable it by setting the [`search`](@/api/options.md#search) option to `true` or to a configuration object.

Once enabled, the plugin exposes the [`query(queryStr)`](@/api/search.md#query) method. Call it with a search string whenever the user types. By default, the search is case-insensitive and matches partial cell values.

## Simplest use case

The example below:

- Enables the [`Search`](@/api/search.md) plugin by setting [`search`](@/api/options.md#search) to `true`
- Listens for `keyup` events on a search input
- Calls [`query()`](@/api/search.md#query) on each keystroke and re-renders the grid to apply highlighting

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

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/searching-values/angular/example1.ts)
@[code](@/content/guides/navigation/searching-values/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/navigation/searching-values/vue/example1.vue)

:::

:::

## Custom search result class

You can style search results with a custom CSS class, using the [`Search`](@/api/search.md) plugin's [`searchResultClass`](@/api/options.md#search) option.

::: tip

Always scope your custom class under the theme and `.handsontable` selectors (for example, `.ht-theme-main .handsontable .my-class`) to avoid conflicts with other styles. For more details, see the [Themes](@/guides/styling/themes/themes.md) guide.

:::

The example below highlights search results with a pink background and red text. To do this, it:

- Defines a custom CSS class called `my-class`, scoped to `.ht-theme-main .handsontable`
- Enables the [`Search`](@/api/search.md) plugin with a configuration object
- Sets [`searchResultClass`](@/api/options.md#search) to `'my-class'`

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

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/searching-values/angular/example2.ts)
@[code](@/content/guides/navigation/searching-values/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3 --css 1

@[code](@/content/guides/navigation/searching-values/react/example2.css)
@[code](@/content/guides/navigation/searching-values/vue/example2.vue)

:::

:::

## Custom query method

You can replace the built-in substring search with a custom query method, using the [`queryMethod`](@/api/options.md#search) option.

The example below searches only for exact matches. To do this, it:

- Defines a custom query method called `onlyExactMatch` that uses strict equality (`===`)
- Enables the [`Search`](@/api/search.md) plugin with a configuration object
- Sets [`queryMethod`](@/api/options.md#search) to `onlyExactMatch`

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

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/searching-values/angular/example3.ts)
@[code](@/content/guides/navigation/searching-values/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/navigation/searching-values/vue/example3.vue)

:::

:::

## Custom callback

You can add a custom callback function, using the [`Search`](@/api/search.md) plugin's [`callback`](@/api/options.md#search) option.

The example below displays the number of matching search results. To do this, it:

- Defines a custom callback function called `searchResultCounter` that counts matches and calls the default callback to preserve highlighting
- Enables the [`Search`](@/api/search.md) plugin with a configuration object
- Sets [`callback`](@/api/options.md#search) to `searchResultCounter`

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

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/searching-values/angular/example4.ts)
@[code](@/content/guides/navigation/searching-values/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/navigation/searching-values/vue/example4.vue)

:::

:::

## Result

After following these steps, typing in your search input highlights matching cells with the `htSearchResult` CSS class. The `query()` call returns an array of matching `{ row, col, data }` objects that you can use to build a results counter or navigate between matches.

## Related API

### How `query()` works

Calling [`query(queryStr, [callback], [queryMethod])`](@/api/search.md#query) does two things:

1. Iterates over every cell in the grid and tests each one using the `queryMethod`.
2. After each test, calls the `callback` to update cell metadata (`isSearchResult`).

It returns an array of result objects - one for each matching cell:

| Property | Type | Description |
| --- | --- | --- |
| `row` | `number` | Visual row index of the matching cell |
| `col` | `number` | Visual column index of the matching cell |
| `data` | `string\|number\|null` | Value of the matching cell |

After calling `query()`, call `hot.render()` to refresh visual highlighting.

### Search result class

After `query()` runs, every cell where `isSearchResult === true` automatically receives the CSS class `htSearchResult`. You can replace this class in two ways:

- At initialization: set `search: { searchResultClass: 'my-class' }`
- Programmatically: call `hot.getPlugin('search').setSearchResultClass('my-class')`

### `queryMethod` signature

The `queryMethod` function determines whether the query string matches a cell value. It is called once per cell during every `query()` call.

```js
function queryMethod(query, value, cellProperties) {
  // return true for a match, false otherwise
}
```

| Parameter | Type | Description |
| --- | --- | --- |
| `query` | `string` | The search string passed to `query()` |
| `value` | `string\|number\|null` | The cell value (from `getDataAtCell()`) |
| `cellProperties` | `object` | The cell's metadata object (includes `locale`, `type`, and other cell options) |

The built-in default performs a **case-insensitive, locale-aware substring match**:

```js
function defaultQueryMethod(query, value, cellProperties) {
  if (query === undefined || query === null || query.length === 0) {
    return false;
  }
  if (value === undefined || value === null) {
    return false;
  }

  return value.toString().toLocaleLowerCase(cellProperties.locale)
    .indexOf(query.toLocaleLowerCase(cellProperties.locale)) !== -1;
}
```

You can set a custom query method in three ways:

- At initialization: `search: { queryMethod: myQueryMethod }`
- Programmatically: `hot.getPlugin('search').setQueryMethod(myQueryMethod)`
- Per `query()` call: `searchPlugin.query(queryStr, callback, myQueryMethod)` (applies to that call only)

### `callback` signature

The `callback` function is called for **every cell** during a `query()` run, whether or not the cell matches. It is responsible for updating cell metadata so the renderer knows which cells to highlight.

```js
function callback(instance, row, col, data, testResult) {
  // update cell metadata based on testResult
}
```

| Parameter | Type | Description |
| --- | --- | --- |
| `instance` | `Handsontable` | The Handsontable instance |
| `row` | `number` | Visual row index |
| `col` | `number` | Visual column index |
| `data` | `string\|number\|null` | The cell value |
| `testResult` | `boolean` | `true` if the cell matches the query, `false` otherwise |

The built-in default sets the `isSearchResult` flag on each cell's metadata:

```js
function defaultCallback(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
}
```

If you override the callback to add custom logic (for example, to count results), call the default behavior manually so that cell highlighting still works.

You can set a custom callback in three ways:

- At initialization: `search: { callback: myCallback }`
- Programmatically: `hot.getPlugin('search').setCallback(myCallback)`
- Per `query()` call: `searchPlugin.query(queryStr, myCallback)` (applies to that call only)

### Per-cell `queryMethod` and `callback`

Both `queryMethod` and `callback` can be overridden for individual cells, columns, or rows using Handsontable's [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md) model. Set a `search` object directly in a `cell`, `columns`, or `rows` entry:

```js
handsontable({
  data: myData,
  search: true,
  columns: [
    {},
    // Column 1: exact match only, everything else uses the global queryMethod
    {
      search: {
        queryMethod(queryStr, value) {
          return queryStr.toString() === value.toString();
        }
      }
    }
  ]
});
```

You can also set it programmatically on a specific cell using [`setCellMeta()`](@/api/core.md#setcellmeta):

```js
hot.setCellMeta(row, col, 'search', {
  queryMethod(queryStr, value) {
    return queryStr.toString() === value.toString();
  }
});
```

Per-cell settings take precedence over the plugin-level `queryMethod` and `callback`. Only `queryMethod` and `callback` support per-cell overrides - `searchResultClass` does not.

### Plugin configuration options

**Configuration options**

<div class="boxes-list">

- [search](@/api/options.md#search)

</div>

**Plugins**

<div class="boxes-list">

- [Search](@/api/search.md)

</div>
