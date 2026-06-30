---
title: Filters
metaTitle: Filters - JavaScript Data Grid | Handsontable
permalink: /api/filters
canonicalUrl: /api/filters
searchCategory: API Reference
hotPlugin: false
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

[[toc]]

## Description

Initializes the plugin and registers the column header hook needed to inject the filter UI.


## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L239

:::

_Filters.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L256

:::

_Filters.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L229

:::

_Filters.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L234

:::

_Filters.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L246

:::

_Filters.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### addCondition

::: ask-about-api addCondition|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L450

:::

_filters.addCondition(column, name, args, [operationId])_

Adds condition to the conditions collection at specified column index.

Possible predefined conditions:

| Condition | Description | Expected `args` |
|---|---|---|
| `begins_with` | Begins with | `[value: string]`, e.g. `['de']` |
| `between` | Between | `[from: number\|string, to: number\|string]`, e.g. `[10, 50]` |
| `by_value` | By value | `[[...values: Array]]`, e.g. `[['ing', 'ed', 'as']]`. The outer array wraps a single inner array that contains all values to **keep** (show) after filtering. |
| `contains` | Contains | `[value: string]`, e.g. `['ing']` |
| `date_after` | After a date (exclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
| `date_after_or_equal` | After or equal to a date (inclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
| `date_before` | Before a date (exclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
| `date_before_or_equal` | Before or equal to a date (inclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
| `date_today` | Today | `[]` |
| `date_tomorrow` | Tomorrow | `[]` |
| `date_yesterday` | Yesterday | `[]` |
| `empty` | Empty | `[]` |
| `ends_with` | Ends with | `[value: string]`, e.g. `['ing']` |
| `eq` | Equal | `[value: string\|number]`, e.g. `['John']` |
| `gt` | Greater than | `[value: number]`, e.g. `[95]` |
| `gte` | Greater than or equal | `[value: number]`, e.g. `[95]` |
| `intl_date_after` | After a date, exclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
| `intl_date_after_or_equal` | After or equal to a date, inclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
| `intl_date_before` | Before a date, exclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
| `intl_date_before_or_equal` | Before or equal to a date, inclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
| `intl_date_between` | Between dates (locale-aware) | `[fromDateString: string, toDateString: string]`, e.g. `['2023-01-01', '2023-12-31']` |
| `intl_date_today` | Today (locale-aware) | `[]` |
| `intl_date_tomorrow` | Tomorrow (locale-aware) | `[]` |
| `intl_date_yesterday` | Yesterday (locale-aware) | `[]` |
| `intl_time_after` | After a time (locale-aware) | `[timeString: string]`, e.g. `['12:00']` |
| `intl_time_before` | Before a time (locale-aware) | `[timeString: string]`, e.g. `['08:00']` |
| `intl_time_between` | Between times (locale-aware) | `[fromTimeString: string, toTimeString: string]`, e.g. `['08:00', '12:00']` |
| `lt` | Less than | `[value: number]`, e.g. `[10]` |
| `lte` | Less than or equal | `[value: number]`, e.g. `[10]` |
| `none` | None (no filter) | `[]` |
| `not_between` | Not between | `[from: number\|string, to: number\|string]`, e.g. `[10, 50]` |
| `not_contains` | Not contains | `[value: string]`, e.g. `['ing']` |
| `not_empty` | Not empty | `[]` |
| `neq` | Not equal | `[value: string\|number]`, e.g. `['John']` |

Possible operations on collection of conditions:
 * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default), i.e. for such operation: <br/> c1 AND c2 AND c3 AND c4 ... AND cn === TRUE, where c1 ... cn are conditions.
 * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.
 * `disjunctionWithExtraCondition` - **Disjunction** on first `n - 1`\* conditions from collection with an extra requirement computed from the last condition, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn-1 AND cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.

\* when `n` is collection size; it's used i.e. for one operation introduced from UI (when choosing from filter's drop-down menu two conditions with OR operator between them, mixed with choosing values from the multiple choice select)

**Note**: Mind that you cannot mix different types of operations (for instance, if you use `conjunction`, use it consequently for a particular column).

**Note**: If the number of conditions added programmatically via `addCondition()` exceeds the capacity of the
filter's dropdown UI (at most 2 regular conditions and 1 `by_value` condition per column), the extra conditions
will be applied to the data but will not be visible or editable in the dropdown menu.

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

// add filter "Begins with" with value "de" to column at index 1
filtersPlugin.addCondition(1, 'begins_with', ['de']);
filtersPlugin.filter();

// add filter "Between" 10 and 50 to column at index 1
filtersPlugin.addCondition(1, 'between', [10, 50]);
filtersPlugin.filter();

// add filter "By value" to column at index 1
// in this case all values that don't match will be filtered
filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
filtersPlugin.filter();

// add filter "Contains" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'contains', ['ing']);
filtersPlugin.filter();

// add filter "After a date" with value "1/1/2023" to column at index 1
filtersPlugin.addCondition(1, 'date_after', ['1/1/2023']);
filtersPlugin.filter();

// add filter "Before a date" with value "1/1/2023" to column at index 1
filtersPlugin.addCondition(1, 'date_before', ['1/1/2023']);
filtersPlugin.filter();

// add filter "Today" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_today', []);
filtersPlugin.filter();

// add filter "Tomorrow" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_tomorrow', []);
filtersPlugin.filter();

// add filter "Yesterday" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_yesterday', []);
filtersPlugin.filter();

// add filter "Empty" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'empty', []);
filtersPlugin.filter();

// add filter "Ends with" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'ends_with', ['ing']);
filtersPlugin.filter();

// add filter "Equal" with value "John" to column at index 1
filtersPlugin.addCondition(1, 'eq', ['John']);
filtersPlugin.filter();

// add filter "Greater than" 95 to column at index 1
filtersPlugin.addCondition(1, 'gt', [95]);
filtersPlugin.filter();

// add filter "Greater than or equal" 95 to column at index 1
filtersPlugin.addCondition(1, 'gte', [95]);
filtersPlugin.filter();

// add filter "Less than" 10 to column at index 1
filtersPlugin.addCondition(1, 'lt', [10]);
filtersPlugin.filter();

// add filter "Less than or equal" 10 to column at index 1
filtersPlugin.addCondition(1, 'lte', [10]);
filtersPlugin.filter();

// add filter "None" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'none', []);
filtersPlugin.filter();

// add filter "Not between" 10 and 50 to column at index 1
filtersPlugin.addCondition(1, 'not_between', [10, 50]);
filtersPlugin.filter();

// add filter "Not contains" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'not_contains', ['ing']);
filtersPlugin.filter();

// add filter "Not empty" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'not_empty', []);
filtersPlugin.filter();

// add filter "Not equal" with value "John" to column at index 1
filtersPlugin.addCondition(1, 'neq', ['John']);
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

// add filter "Begins with" with value "de" to column at index 1
filtersPlugin.addCondition(1, 'begins_with', ['de']);
filtersPlugin.filter();

// add filter "Between" 10 and 50 to column at index 1
filtersPlugin.addCondition(1, 'between', [10, 50]);
filtersPlugin.filter();

// add filter "By value" to column at index 1
// in this case all values that don't match will be filtered
filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
filtersPlugin.filter();

// add filter "Contains" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'contains', ['ing']);
filtersPlugin.filter();

// add filter "After a date" with value "1/1/2023" to column at index 1
filtersPlugin.addCondition(1, 'date_after', ['1/1/2023']);
filtersPlugin.filter();

// add filter "Before a date" with value "1/1/2023" to column at index 1
filtersPlugin.addCondition(1, 'date_before', ['1/1/2023']);
filtersPlugin.filter();

// add filter "Today" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_today', []);
filtersPlugin.filter();

// add filter "Tomorrow" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_tomorrow', []);
filtersPlugin.filter();

// add filter "Yesterday" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'date_yesterday', []);
filtersPlugin.filter();

// add filter "Empty" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'empty', []);
filtersPlugin.filter();

// add filter "Ends with" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'ends_with', ['ing']);
filtersPlugin.filter();

// add filter "Equal" with value "John" to column at index 1
filtersPlugin.addCondition(1, 'eq', ['John']);
filtersPlugin.filter();

// add filter "Greater than" 95 to column at index 1
filtersPlugin.addCondition(1, 'gt', [95]);
filtersPlugin.filter();

// add filter "Greater than or equal" 95 to column at index 1
filtersPlugin.addCondition(1, 'gte', [95]);
filtersPlugin.filter();

// add filter "Less than" 10 to column at index 1
filtersPlugin.addCondition(1, 'lt', [10]);
filtersPlugin.filter();

// add filter "Less than or equal" 10 to column at index 1
filtersPlugin.addCondition(1, 'lte', [10]);
filtersPlugin.filter();

// add filter "None" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'none', []);
filtersPlugin.filter();

// add filter "Not between" 10 and 50 to column at index 1
filtersPlugin.addCondition(1, 'not_between', [10, 50]);
filtersPlugin.filter();

// add filter "Not contains" with value "ing" to column at index 1
filtersPlugin.addCondition(1, 'not_contains', ['ing']);
filtersPlugin.filter();

// add filter "Not empty" with no arguments to column at index 1
filtersPlugin.addCondition(1, 'not_empty', []);
filtersPlugin.filter();

// add filter "Not equal" with value "John" to column at index 1
filtersPlugin.addCondition(1, 'neq', ['John']);
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
    <hot-table [settings]="gridSettings" />
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

    // Add filter "Begins with" with value "de" to column at index 1
    filtersPlugin.addCondition(1, "begins_with", ["de"]);
    filtersPlugin.filter();

    // Add filter "Between" 10 and 50 to column at index 1
    filtersPlugin.addCondition(1, "between", [10, 50]);
    filtersPlugin.filter();

    // Add filter "By value" to column at index 1
    // In this case, all values that don't match will be filtered.
    filtersPlugin.addCondition(1, "by_value", [["ing", "ed", "as", "on"]]);
    filtersPlugin.filter();

    // Add filter "Contains" with value "ing" to column at index 1
    filtersPlugin.addCondition(1, "contains", ["ing"]);
    filtersPlugin.filter();

    // Add filter "After a date" with value "1/1/2023" to column at index 1
    filtersPlugin.addCondition(1, "date_after", ["1/1/2023"]);
    filtersPlugin.filter();

    // Add filter "Before a date" with value "1/1/2023" to column at index 1
    filtersPlugin.addCondition(1, "date_before", ["1/1/2023"]);
    filtersPlugin.filter();

    // Add filter "Today" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "date_today", []);
    filtersPlugin.filter();

    // Add filter "Tomorrow" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "date_tomorrow", []);
    filtersPlugin.filter();

    // Add filter "Yesterday" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "date_yesterday", []);
    filtersPlugin.filter();

    // Add filter "Empty" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "empty", []);
    filtersPlugin.filter();

    // Add filter "Ends with" with value "ing" to column at index 1
    filtersPlugin.addCondition(1, "ends_with", ["ing"]);
    filtersPlugin.filter();

    // Add filter "Equal" with value "John" to column at index 1
    filtersPlugin.addCondition(1, "eq", ["John"]);
    filtersPlugin.filter();

    // Add filter "Greater than" 95 to column at index 1
    filtersPlugin.addCondition(1, "gt", [95]);
    filtersPlugin.filter();

    // Add filter "Greater than or equal" 95 to column at index 1
    filtersPlugin.addCondition(1, "gte", [95]);
    filtersPlugin.filter();

    // Add filter "Less than" 10 to column at index 1
    filtersPlugin.addCondition(1, "lt", [10]);
    filtersPlugin.filter();

    // Add filter "Less than or equal" 10 to column at index 1
    filtersPlugin.addCondition(1, "lte", [10]);
    filtersPlugin.filter();

    // Add filter "None" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "none", []);
    filtersPlugin.filter();

    // Add filter "Not between" 10 and 50 to column at index 1
    filtersPlugin.addCondition(1, "not_between", [10, 50]);
    filtersPlugin.filter();

    // Add filter "Not contains" with value "ing" to column at index 1
    filtersPlugin.addCondition(1, "not_contains", ["ing"]);
    filtersPlugin.filter();

    // Add filter "Not empty" with no arguments to column at index 1
    filtersPlugin.addCondition(1, "not_empty", []);
    filtersPlugin.filter();

    // Add filter "Not equal" with value "John" to column at index 1
    filtersPlugin.addCondition(1, "neq", ["John"]);
    filtersPlugin.filter();
  }

  private getData(): Array<*> {
    // Get some data
  }
}
```
:::

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| name | `string` |  | Condition short name. |
| args | `Array` |  | Condition arguments. The expected format depends on the condition - see the table above for details. |
| [operationId] | `string` | <code>&quot;conjunction&quot;</code> | `optional` `id` of operation which is performed on the column. |



### clearConditions

::: ask-about-api clearConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L863

:::

_filters.clearConditions([column])_

Clears all conditions previously added to the collection for the specified column index or, if the column index
was not passed, clear the conditions for all columns.


| Param | Type | Description |
| --- | --- | --- |
| [column] | `number` | `optional` Visual column index. |



### destroy

::: ask-about-api destroy|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L1165

:::

_filters.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L403

:::

_filters.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L273

:::

_filters.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### exportConditions

::: ask-about-api exportConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L907

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

::: ask-about-api filter|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L915

:::

_filters.filter()_

Filters data based on added filter conditions.

**Emits**: [`Hooks#event:beforeFilter`](@/api/hooks.md#beforefilter), [`Hooks#event:afterFilter`](@/api/hooks.md#afterfilter)  


### getDataMapAtColumn

::: ask-about-api getDataMapAtColumn|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L986

:::

_filters.getDataMapAtColumn(physicalColumn) ⇒ Array&lt;{meta: CellProperties, value: \*}&gt;_

Returns the full dataset for a column with cell meta for each row. The dataset is independent of
any index mapper - no matter if the data is filtered, sorted, or otherwise transformed all rows
are included.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumn | `number` | The physical column index. |


**Returns**: `Array<{meta: CellProperties, value: *}>` - Array of objects with `meta` and `value`, one per source row.  

### getSelectedColumn

::: ask-about-api getSelectedColumn|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L969

:::

_filters.getSelectedColumn() ⇒ Object | null_

Gets last selected column index.


**Returns**: `Object` | `null` - Returns `null` when a column is
not selected. Otherwise, returns an object with `visualIndex` and `physicalIndex` properties containing
the index of the column.  

### importConditions

::: ask-about-api importConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L879

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

::: ask-about-api isEnabled|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L268

:::

_filters.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Filters#enablePlugin](@/api/filters.md#enableplugin) method is called.



### removeConditions

::: ask-about-api removeConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L854

:::

_filters.removeConditions(column)_

Removes conditions at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin

::: ask-about-api updatePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/filters.ts#L396

:::

_filters.updatePlugin()_

Update plugin state after Handsontable settings update.


