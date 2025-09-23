---
title: Filters
metaTitle: Filters - JavaScript Data Grid | Handsontable
permalink: /api/filters
canonicalUrl: /api/filters
searchCategory: API Reference
hotPlugin: true
editLink: false
id: 3alr8j85
description: Use the Filters plugin with its API members and methods to filter the view (not the source data) by a value or by a combination of conditions.
react:
  id: vxwvhi0e
  metaTitle: Filters - React Data Grid | Handsontable
angular:
  id: r2k7t5ab
  metaTitle: Filters - Angular Data Grid | Handsontable
---

# Plugin: Filters

[[toc]]

## Description

The plugin allows filtering the table data either by the built-in component or with the API.

See [the filtering demo](@/guides/columns/column-filter/column-filter.md) for examples.

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  colHeaders={true}
  rowHeaders={true}
  dropdownMenu={true}
  filters={true}
/>
```
:::

::: only-for angular
```ts
settings = {
  data: getData(),
  colHeaders: true,
  rowHeaders: true,
  dropdownMenu: true,
  filters: true,
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

## Options

### filters
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L2329

:::

_filters.filters : boolean_

The `filters` option configures the [`Filters`](@/api/filters.md) plugin.

You can set the `filters` option to one of the following:

| Setting | Description                                      |
| ------- | ------------------------------------------------ |
| `false` | Disable the [`Filters`](@/api/filters.md) plugin |
| `true`  | Enable the [`Filters`](@/api/filters.md) plugin  |

Read more:
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Plugins: `Filters`](@/api/filters.md)
- [`dropdownMenu`](#dropdownmenu)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `Filters` plugin
filters: true,
```

## Methods

### addCondition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L384

:::

_filters.addCondition(column, name, args, [operationId])_

Adds condition to the conditions collection at specified column index.

Possible predefined conditions:
 * `begins_with` - Begins with
 * `between` - Between
 * `by_value` - By value
 * `contains` - Contains
 * `date_after` - After a date
 * `date_before` - Before a date
 * `date_today` - Today
 * `date_tomorrow` - Tomorrow
 * `date_yesterday` - Yesterday
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
::: only-for javascript
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
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

<HotTable
  ref={hotRef}
  data={getData()}
  filters={true}
/>

// access to filters plugin instance
const hot = hotRef.current.hotInstance;
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
:::

::: only-for angular
```ts
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import {
  GridSettings,
  HotTableModule,
  HotTableComponent,
} from "@handsontable/angular-wrapper";

`@Component`({
  selector: "app-example",
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table themeName="ht-theme-main" [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent implements AfterViewInit {
  `@ViewChild`(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly gridSettings = <GridSettings>{
    data: this.getData(),
    filters: true,
  };

  ngAfterViewInit(): void {
    // Access to filters plugin instance
    const hot = this.hotTable.hotInstance;
    const filtersPlugin = hot.getPlugin("filters");

    // Add filter "Greater than" 95 to column at index 1
    filtersPlugin.addCondition(1, "gt", [95]);
    filtersPlugin.filter();

    // Add filter "By value" to column at index 1
    // In this case, all values that don't match will be filtered.
    filtersPlugin.addCondition(1, "by_value", [["ing", "ed", "as", "on"]]);
    filtersPlugin.filter();

    // Add filter "Begins with" with value "de" AND "Not contains" with value "ing"
    filtersPlugin.addCondition(1, "begins_with", ["de"], "conjunction");
    filtersPlugin.addCondition(1, "not_contains", ["ing"], "conjunction");
    filtersPlugin.filter();

    // Add filter "Begins with" with value "de" OR "Not contains" with value "ing"
    filtersPlugin.addCondition(1, "begins_with", ["de"], "disjunction");
    filtersPlugin.addCondition(1, "not_contains", ["ing"], "disjunction");
    filtersPlugin.filter();
  }

  private getData(): any[] {
    // Get some data
  }
}
```
:::

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| name | `string` |  | Condition short name. |
| args | `Array` |  | Condition arguments. |
| [operationId] | `string` | <code>&quot;conjunction&quot;</code> | `optional` `id` of operation which is performed on the column. |



### clearConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L579

:::

_filters.clearConditions([column])_

Clears all conditions previously added to the collection for the specified column index or, if the column index
was not passed, clear the conditions for all columns.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L1150

:::

_filters.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L328

:::

_filters.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L181

:::

_filters.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### exportConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L630

:::

_filters.exportConditions() ⇒ Array_

Exports filter conditions for all columns from the plugin.
The array represents the filter state for each column. For example:

```js
[
  {
    column: 1,
    operation: 'conjunction',
    conditions: [
      { name: 'gt', args: [95] },
    ]
  },
  {
    column: 7,
    operation: 'conjunction',
    conditions: [
      { name: 'contains', args: ['mike'] },
      { name: 'begins_with', args: ['m'] },
    ]
  },
]
```



### filter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L641

:::

_filters.filter()_

Filters data based on added filter conditions.

**Emits**: [`Hooks#event:beforeFilter`](@/api/hooks.md#beforefilter), [`Hooks#event:afterFilter`](@/api/hooks.md#afterfilter)  


### getDataMapAtColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L729

:::

_filters.getDataMapAtColumn([column]) ⇒ Array_

Returns handsontable source data with cell meta based on current selection.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` The physical column index. By default column index accept the value of the selected column. |


**Returns**: `Array` - Returns array of objects where keys as row index.  

### getSelectedColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L710

:::

_filters.getSelectedColumn() ⇒ Object | null_

Gets last selected column index.


**Returns**: `Object` | `null` - Returns `null` when a column is
not selected. Otherwise, returns an object with `visualIndex` and `physicalIndex` properties containing
the index of the column.  

### importConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L599

:::

_filters.importConditions(conditions)_

Imports filter conditions to all columns to the plugin. The method accepts
the array of conditions with the same structure as the [Filters#exportConditions](@/api/filters.md#exportconditions) method returns.
Importing conditions will replace the current conditions. Once replaced, the state of the condition
will be reflected in the UI. To apply the changes and filter the table, call
the [Filters#filter](@/api/filters.md#filter) method eventually.


| Param | Type | Description |
| --- | --- | --- |
| conditions | `Array` | Array of conditions. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L173

:::

_filters.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Filters#enablePlugin](@/api/filters.md#enableplugin) method is called.



### removeConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/filters/filters.js#L567

:::

_filters.removeConditions(column)_

Removes conditions at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


