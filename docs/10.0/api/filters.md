---
title: Filters
metaTitle: Filters - Plugin - Handsontable Documentation
permalink: /10.0/api/filters
canonicalUrl: /api/filters
hotPlugin: true
editLink: false
---

# Filters

[[toc]]

## Description

The plugin allows filtering the table data either by the built-in component or with the API.

See [the filtering demo](@/guides/columns/column-filter.md) for examples.

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  colHeaders: true,
  rowHeaders: true,
  dropdownMenu: true,
  filters: true
});
```

## Options

### filters
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2794

:::

_filters.filters : boolean_

The [Filters](#filters) plugin allows filtering the table data either by the built-in component or with the API.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable filters
filters: true,
```

## Methods

### addCondition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L278

:::

_filters.addCondition(column, name, args, [operationId])_

Adds condition to the conditions collection at specified column index.

Possible predefined conditions:
 * `begins_with` - Begins with
 * `between` - Between
 * `by_value` - By value
 * `contains` - Contains
 * `empty` - Empty
 * `ends_with` - Ends with
 * `eq` - Equal
 * `gt` - Greater than
 * `gte` - Greater than or equal
 * `lt` - Less than
 * `lte` - Less than or equal
 * `none` - None (no filter)
 * `not_between` - Not between
 * `not_contains` - Not contains
 * `not_empty` - Not empty
 * `neq` - Not equal.

Possible operations on collection of conditions:
 * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default), i.e. for such operation: <br/> c1 AND c2 AND c3 AND c4 ... AND cn === TRUE, where c1 ... cn are conditions.
 * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.
 * `disjunctionWithExtraCondition` - **Disjunction** on first `n - 1`\* conditions from collection with an extra requirement computed from the last condition, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn-1 AND cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.

\* when `n` is collection size; it's used i.e. for one operation introduced from UI (when choosing from filter's drop-down menu two conditions with OR operator between them, mixed with choosing values from the multiple choice select)

**Note**: Mind that you cannot mix different types of operations (for instance, if you use `conjunction`, use it consequently for a particular column).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  filters: true
});

// access to filters plugin instance
const filtersPlugin = hot.getPlugin('filters');

// add filter "Greater than" 95 to column at index 1
filtersPlugin.addCondition(1, 'gt', [95]);
filtersPlugin.filter();

// add filter "By value" to column at index 1
// in this case all value's that don't match will be filtered.
filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
filtersPlugin.filter();

// add filter "Begins with" with value "de" AND "Not contains" with value "ing"
filtersPlugin.addCondition(1, 'begins_with', ['de'], 'conjunction');
filtersPlugin.addCondition(1, 'not_contains', ['ing'], 'conjunction');
filtersPlugin.filter();

// add filter "Begins with" with value "de" OR "Not contains" with value "ing"
filtersPlugin.addCondition(1, 'begins_with', ['de'], 'disjunction');
filtersPlugin.addCondition(1, 'not_contains', ['ing'], 'disjunction');
filtersPlugin.filter();
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| name | `string` |  | Condition short name. |
| args | `Array` |  | Condition arguments. |
| [operationId] | `string` | <code>&quot;conjunction&quot;</code> | `optional` `id` of operation which is performed on the column. |



### clearConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L370

:::

_filters.clearConditions([column])_

Clears all conditions previously added to the collection for the specified column index or, if the column index
was not passed, clear the conditions for all columns.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L875

:::

_filters.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L259

:::

_filters.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L147

:::

_filters.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### filter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L387

:::

_filters.filter()_

Filters data based on added filter conditions.

**Emits**: [`Hooks#event:beforeFilter`](@/api/hooks.md#beforefilter), [`Hooks#event:afterFilter`](@/api/hooks.md#afterfilter)  


### getDataMapAtColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L461

:::

_filters.getDataMapAtColumn([column]) ⇒ Array_

Returns handsontable source data with cell meta based on current selection.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` The physical column index. By default column index accept the value of the selected column. |


**Returns**: `Array` - Returns array of objects where keys as row index.  

### getSelectedColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L438

:::

_filters.getSelectedColumn() ⇒ object | null_

Gets last selected column index.


**Returns**: `object` | `null` - Return `null` when column isn't selected otherwise
object containing information about selected column with keys `visualIndex` and `physicalIndex`.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L139

:::

_filters.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Filters#enablePlugin](@/api/filters.md#enableplugin) method is called.



### removeConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/filters.js#L358

:::

_filters.removeConditions(column)_

Removes conditions at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


