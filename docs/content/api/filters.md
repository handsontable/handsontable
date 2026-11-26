---
title: Filters
metaTitle: Filters | Handsontable DataGrid for JavaScript
permalink: /api/filters
canonicalUrl: /api/filters
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 3alr8j85
description: Use the Filters plugin with its API members and methods to filter the view (not the source data) by a value or by a combination of conditions.
react:
  id: vxwvhi0e
  metaTitle: Filters | Handsontable DataGrid for React
angular:
  id: r2k7t5ab
  metaTitle: Filters | Handsontable DataGrid for Angular
---

[[toc]]

See the [Column filter](@/guides/columns/column-filter/column-filter.md) guide for examples and configuration details.


## Description

Initializes the plugin and registers the column header hook needed to inject the filter UI.


## Options

### filters
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api filters|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3762

:::

_filters.filters : boolean | object_

The `filters` option configures the `Filters` plugin.

The option takes different values at the two levels it works at, so they are listed
separately below. At the grid level it switches the plugin on and carries its settings. Inside
[`columns`](@/api/options.md#columns), `false` takes that column out of filtering, and an object can set the
column's own `availableConditions`.

**At the grid level:**

| Setting   | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `false`   | Disable the `Filters` plugin                     |
| `true`    | Enable the `Filters` plugin                      |
| An object | Enable the `Filters` plugin with custom settings |

If you set the `filters` option to an object, you can configure the following settings.
`searchMode` and `filterFixedRows` are read once, for the whole grid, so they cannot be set per
column. `availableConditions` can be set at both levels:

| Property              | Possible values                         | Default     | Description                                                                                                                                                         |
| --------------------- | --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `searchMode`          | `'show'` \| `'apply'`                   | `'show'`    | Enable filtering only visible elements                                                                                                                              |
| `filterFixedRows`     | `true` \| `false`                       | `true`      | `true`: Filter the whole dataset, including the rows pinned by [`fixedRowsTop`](@/api/options.md#fixedrowstop) and [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)<br>`false`: Leave the pinned rows out of the filter |
| `availableConditions` | An array \| An object                   | `undefined` | The operators the **Filter by condition** lists offer. See below.                                                                                                  |

`availableConditions` takes one of three shapes:

| Shape                               | Description                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| An array of condition names         | Offer only these conditions, in this order. `'---------'` adds a separator.                                   |
| `{ exclude: [...] }`                | Offer the default list for the column's data type, minus these conditions.                                    |
| An object keyed by data type        | One of the two shapes above per data type: `text`, `numeric`, `date`, `intl-date`, `intl-time`, `intl-datetime`. |

The condition names are the ones `addCondition()` takes, for
example `'eq'`, `'gt'`, `'between'`, or `'not_between'`. A column whose type has no list of its
own (for example `dropdown`) uses the `text` list. **None** always stays first. A name the
column's data type does not offer is left out. The setting changes the lists only: a condition
added through `addCondition()` still filters, and its select
still shows it.

When the grid is created, and when the setting changes, a console warning names each condition
that no data type offers, each listed condition a column's data type does not offer, and each
data type key without a list of its own. Such a key is ignored; the other entries still apply.

A column's own `availableConditions` replaces the grid-level one for that column. The two are
not merged. A column whose own value is `undefined` uses the grid-level value.

Updating the `filters` option through [`updateSettings()`](@/api/core.md#updatesettings)
clears the filters that are applied. A `filters` object that leaves out `availableConditions`
keeps the previous value, and setting `filters` to `false` does not clear it either. Pass
`availableConditions: undefined` or `filters: true` to go back to the default lists.

`availableConditions` changes what the condition lists contain, not which parts the menu
shows. The [`dropdownMenu`](@/api/options.md#dropdownmenu) option decides that, so if its configuration leaves
out or hides `filter_by_condition`, the setting has nothing to act on.

Set `filterFixedRows` to `false` when the pinned rows hold totals or headings rather than data.
Those rows are then never hidden by a filter, and their values are not offered in the
**Filter by value** list.

`filterFixedRows` has no effect while the [`DataProvider`](@/api/dataProvider.md) plugin is
active: filtering then happens on the server, which knows nothing about frozen rows.

With `filterFixedRows: false` and a filter applied, the grid works out again which rows are
exempt when the rows change, on the next render. Inserting or removing a row (including through
[`updateData()`](@/api/core.md#updatedata)) always does it. Moving a row, sorting, or changing
`fixedRowsTop` or `fixedRowsBottom` does it only when a different row ends up frozen, so a sort
that keeps the frozen rows in place (the [`columnSorting`](@/api/options.md#columnsorting) default) costs
nothing. This is not a new filter: the conditions stay the same, the
[`beforeFilter`](@/api/hooks.md#beforefilter) and [`afterFilter`](@/api/hooks.md#afterfilter)
hooks do not fire, the selection does not move, and no undo step is recorded. Inside a
[`batch()`](@/api/core.md#batch), data read before the batch ends still reflects the previous
frozen rows.

**Inside `columns`:**

| Setting                             | Description                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `false`                             | Hide the filter controls in this column's dropdown menu                              |
| `{ availableConditions: ... }`      | Choose the operators this column's **Filter by condition** lists offer               |
| Anything else                       | No effect – the column keeps whatever the grid-level setting gave it                  |

The column's dropdown menu still opens, so entries such as **Clear column** stay available.
The plugin's API is not affected either: `addCondition()`
still filters such a column, the same way [`columnSorting`](@/api/options.md#columnsorting)'s `headerAction`
leaves sorting through the API working.

Inside `columns`, an object is read for `availableConditions` only. Any other key in it, such
as `searchMode` or `filterFixedRows`, is **ignored**, and logs a warning once per grid. Since
19.0, TypeScript rejects it too: a column's `filters` is typed `boolean` or
`{ availableConditions }`, and the grid-level object accepts only `searchMode`,
`filterFixedRows`, and `availableConditions`.

The switch is read from the column meta, which the [`cells`](@/api/options.md#cells) and [`cell`](@/api/options.md#cell)
options do not reach, so filtering cannot be turned off for a single cell. Filtering works on
whole columns, so there would be nothing for a per-cell value to mean.

Read more:
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [`dropdownMenu`](@/api/options.md#dropdownmenu)
- [`filterValueComparator`](@/api/options.md#filtervaluecomparator) – order the values in the **Filter by value** list

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `Filters` plugin
filters: true,

// enable it, and keep the frozen rows out of the filter
filters: {
  filterFixedRows: false,
},

// turn filtering off for the second column only
filters: true,
columns: [
  {},
  { filters: false },
],

// remove "Is not between" from every numeric column
filters: {
  availableConditions: {
    numeric: { exclude: ['not_between'] },
  },
},

// offer only a few operators in one column, in this order
filters: true,
columns: [
  { filters: { availableConditions: ['eq', 'neq', '---------', 'empty', 'not_empty'] } },
  {},
],

// WRONG: `filterFixedRows` is grid-level, so it is ignored here, warns, and does not compile
columns: [
  { filters: { filterFixedRows: false } },
],
```


### filterValueComparator
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span></p>

::: ask-about-api filterValueComparator|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3575

:::

_filters.filterValueComparator : function_

The `filterValueComparator` option sets the order of the values in the **Filter by value**
list of the `Filters` dropdown.

By default the list places blank cells first and then sorts the values with a built-in
comparator: numbers by value, text by character code, and `date`, `intl-date`, and
`intl-datetime` cells chronologically. Set `filterValueComparator` to a function to replace
that order. The function takes two cell values and returns a negative number, zero, or a
positive number, like the callback of `Array.prototype.sort()`.

The option cascades: set it at the grid level to order every column's list the same way,
or inside [`columns`](@/api/options.md#columns) to order one column. A column value overrides the grid value.
A custom comparator also overrides the cell type's own comparator.

Two details to know when you write the function:
- A blank cell (`null`, `undefined`, or `''`) reaches the comparator as an empty string `''`.
- The comparator only orders the list. It cannot add, hide, or remove a value, so it never
  changes which rows the filter keeps.

A value that is not a function is ignored, and the built-in order applies.

The list is built once per column, and the comparator is read from the cell meta of the
first row the list is built from. A per-cell value set through [`cells`](@/api/options.md#cells) or
[`cell`](@/api/options.md#cell) is therefore not a reliable way to configure it. Set it at the grid level or
inside `columns`.

Read more:
- [Column filter: Change the order of values in the filter list](@/guides/columns/column-filter/column-filter.md#change-the-order-of-values-in-the-filter-list)
- [`filters`](@/api/options.md#filters)

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// order the "Priority" column by severity rather than alphabetically
const priority = ['Critical', 'High', 'Medium', 'Low'];

filters: true,
columns: [
  {
    data: 'priority',
    filterValueComparator: (a, b) => priority.indexOf(a) - priority.indexOf(b),
  },
],

// order every column's list with a locale-aware text comparison
filters: true,
filterValueComparator: (a, b) => String(a).localeCompare(String(b), 'de'),
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L557

:::

_Filters.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L586

:::

_Filters.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L578

:::

_Filters.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L547

:::

_Filters.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L552

:::

_Filters.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L566

:::

_Filters.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### addCondition

::: ask-about-api addCondition|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L842

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
| `eq` | Equal | `[value: string\|number]`, e.g. `['John']`. On `date` and `intl-date` columns, pass an ISO 8601 date string, e.g. `['2023-01-01']`. |
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
| `none` | None (no filter) | `[]`. Matches every row, so it has no filtering effect. To clear a column's filter, use [`removeConditions()`](@/api/filters.md#removeconditions) instead. |
| `not_between` | Not between | `[from: number\|string, to: number\|string]`, e.g. `[10, 50]` |
| `not_contains` | Not contains | `[value: string]`, e.g. `['ing']` |
| `not_empty` | Not empty | `[]` |
| `neq` | Not equal | `[value: string\|number]`, e.g. `['John']`. On `date` and `intl-date` columns, pass an ISO 8601 date string, e.g. `['2023-01-01']`. |

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1258

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1867

:::

_filters.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L780

:::

_filters.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L627

:::

_filters.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### exportConditions

::: ask-about-api exportConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1419

:::

_filters.exportConditions() ⇒ Array_

Exports filter conditions for all columns from the plugin.
The array represents the filter state for each column and uses physical column indexes in each `column` property.
For example:

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1466

:::

_filters.filter()_

Filters data based on added filter conditions.

**Emits**: [`Hooks#event:beforeFilter`](@/api/hooks.md#beforefilter), [`Hooks#event:afterFilter`](@/api/hooks.md#afterfilter)  


### getAvailableConditions

::: ask-about-api getAvailableConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1455

:::

_filters.getAvailableConditions(column) ⇒ Array&lt;{name: string, inputsCount: number}&gt;_

Gets the filter conditions that a column offers, in the order the "Filter by condition" menu lists them.

The list follows the column's data type (`text`, `numeric`, `date`, `intl-date`, `intl-time`, or
`intl-datetime`, where any other type and a column whose cells have different types use the `text` list)
and the [`availableConditions`](@/api/options.md#filters) setting that applies to the column. It is the
list the column's menu shows, without the separators and without the "None" entry, which clears a filter
rather than adding one. Like the menu, it reads the data type from the rows no filter trims, so in a column
whose cells have different types the answer can change when a filter hides rows. A column with
`filters: false` still gets its list, because that setting hides the menu but not the filter.

Use it to build valid conditions for [Filters#addCondition](@/api/filters.md#addcondition), for example in a custom filter form.
The entries that [Filters#importConditions](@/api/filters.md#importconditions) takes name physical columns, so convert the index
with [Core#toPhysicalColumn](@/api/core.md#tophysicalcolumn) there. The "Filter by value" condition (`by_value`) is not in the
list, because it is not a menu entry.

**Since**: 19.0.0  
**Example**  
```js
const filtersPlugin = hot.getPlugin('filters');

filtersPlugin.getAvailableConditions(1);
// [
//   { name: 'empty', inputsCount: 0 },
//   { name: 'not_empty', inputsCount: 0 },
//   { name: 'eq', inputsCount: 1 },
//   ...
//   { name: 'between', inputsCount: 2 },
// ]
```

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array<{name: string, inputsCount: number}>` - The conditions, each with its name and the number of arguments it takes.  

### getDataMapAtColumn

::: ask-about-api getDataMapAtColumn|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1560

:::

_filters.getDataMapAtColumn(physicalColumn, [physicalRows]) ⇒ Array&lt;{row: number, meta: CellProperties, value: \*}&gt;_

Returns the full dataset for a column with cell meta for each row. The dataset is independent of
any index mapper - no matter if the data is filtered, sorted, or otherwise transformed all rows
are included, unless `physicalRows` narrows the read to specific rows, or `filterFixedRows` is
`false`, which drops the rows pinned by `fixedRowsTop` and `fixedRowsBottom` from the full read.

That single exclusion is what keeps pinned rows out of every consumer at once: `DataFilter`, the
`ConditionUpdateObserver` memo, and the has-conditions branch of `_getValueListDataAtColumn()`
all read the column through the same read as this method. A caller that passes `physicalRows`
has already chosen its rows and is left alone.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumn | `number` | The physical column index. |
| [physicalRows] | `Array<number>` | `optional` When provided, only these physical rows are read (in the given order) instead of every source row. |


**Returns**: `Array<{row: number, meta: CellProperties, value: *}>` - Array of objects with `row` (the physical
row index), `meta`, and `value`, one per read row. Consumers correlate rows through the `row` property -
the coordinate stamps on `meta` are shared with other readers and may change after this method returns.  

### getSelectedColumn

::: ask-about-api getSelectedColumn|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1533

:::

_filters.getSelectedColumn() ⇒ Object | null_

Gets the last selected column as an object with visual and physical indexes.


**Returns**: `Object` | `null` - Returns `null` when a column is
not selected. Otherwise, returns an object with `visualIndex` and `physicalIndex` properties containing
column indexes.  

### importConditions

::: ask-about-api importConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1275

:::

_filters.importConditions(conditions)_

Imports filter conditions to all columns to the plugin. The method accepts
the array of conditions with the same structure as the [Filters#exportConditions](@/api/filters.md#exportconditions) method returns.
The `column` property in each condition object must be a physical column index.
Importing conditions will replace the current conditions. Once replaced, the state of the condition
will be reflected in the UI. To apply the changes and filter the table, call
the [Filters#filter](@/api/filters.md#filter) method eventually.


| Param | Type | Description |
| --- | --- | --- |
| conditions | `Array` | Array of conditions keyed by physical column indexes. |



### isEnabled

::: ask-about-api isEnabled|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L622

:::

_filters.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Filters#enablePlugin](@/api/filters.md#enableplugin) method is called.



### removeConditions

::: ask-about-api removeConditions|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L1249

:::

_filters.removeConditions(column)_

Removes conditions at specified column index.

This is the programmatic equivalent of selecting the `None` operator in the column menu – both
clear the column's filter.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin

::: ask-about-api updatePlugin|Filters

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/filters.ts#L764

:::

_filters.updatePlugin()_

Update plugin state after Handsontable settings update.


