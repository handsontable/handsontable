---
id: filters
title: Filters
sidebar_label: Filters
slug: /api/filters
---
## Description


The plugin allows filtering the table data either by the built-in component or with the API.

See [the filtering demo](https://handsontable.com/docs/demo-filtering.html) for examples.


**Example**  
```
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  colHeaders: true,
  rowHeaders: true,
  dropdownMenu: true,
  filters: true
});
```

## Members
### isEnabled
`filters.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#Filters+enablePlugin) method is called.



### enablePlugin
`filters.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`filters.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### addCondition
`filters.addCondition(column, name, args, [operationId])`

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
 * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default), i.e. for such operation: c1 AND c2 AND c3 AND c4 ... AND cn === TRUE, where c1 ... cn are conditions.
 * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection, i.e. for such operation: `c1 OR c2 OR c3 OR c4 ... OR cn` === TRUE, where c1, c2, c3, c4 ... cn are conditions.
 * `disjunctionWithExtraCondition` - **Disjunction** on first `n - 1`\* conditions from collection with an extra requirement computed from the last condition, i.e. for such operation: `c1 OR c2 OR c3 OR c4 ... OR cn-1 AND cn` === TRUE, where c1, c2, c3, c4 ... cn are conditions.

\* when `n` is collection size; it's used i.e. for one operation introduced from UI (when choosing from filter's drop-down menu two conditions with OR operator between them, mixed with choosing values from the multiple choice select)

**Note**: Mind that you cannot mix different types of operations (for instance, if you use `conjunction`, use it consequently for a particular column).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | <code>number</code> |  | Visual column index. |
| name | <code>string</code> |  | Condition short name. |
| args | <code>Array</code> |  | Condition arguments. |
| [operationId] | <code>string</code> | <code>&quot;conjunction&quot;</code> | `optional` `id` of operation which is performed on the column. |


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

### removeConditions
`filters.removeConditions(column)`

Removes conditions at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |



### clearConditions
`filters.clearConditions([column])`

Clears all conditions previously added to the collection for the specified column index or, if the column index
was not passed, clear the conditions for all columns.


| Param | Type | Description |
| --- | --- | --- |
| [column] | <code>number</code> | `optional` Visual column index. |



### filter
`filters.filter()`

Filters data based on added filter conditions.

**Emits**: <code>Hooks#event:beforeFilter</code>, <code>Hooks#event:afterFilter</code>  


### getSelectedColumn
`filters.getSelectedColumn() ⇒ object | null`

Gets last selected column index.


**Returns**: <code>object</code> \| <code>null</code> - Return `null` when column isn't selected otherwise
object containing information about selected column with keys `visualIndex` and `physicalIndex`.  

### getDataMapAtColumn
`filters.getDataMapAtColumn([column]) ⇒ Array`

Returns handsontable source data with cell meta based on current selection.


| Param | Type | Description |
| --- | --- | --- |
| [column] | <code>number</code> | `optional` The physical column index. By default column index accept the value of the selected column. |


**Returns**: <code>Array</code> - Returns array of objects where keys as row index.  

### destroy
`filters.destroy()`

Destroys the plugin instance.



