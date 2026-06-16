import { isEmpty } from '../../helpers/mixed';
import { isObjectEqual } from '../../helpers/object';
import type { HotInstance } from '../../core/types';

/**
 * @alias Options
 * @class Options
 * @description
 *
 * [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) let you heavily customize your Handsontable instance. For example, you can:
 *
 * - Enable and disable built-in features
 * - Enable and configure additional [plugins](@/api/plugins.md)
 * - Personalize Handsontable's look
 * - Adjust Handsontable's behavior
 * - Implement your own custom features
 *
 * ::: only-for javascript
 *
 * To apply [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), pass them as
 * a second argument of the [Handsontable constructor](@/guides/getting-started/installation/installation.md#initialize-handsontable),
 * using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):
 *
 * Read more on the [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) page.
 *
 * ```js
 * const container = document.getElementById('example');
 *
 * const hot = new Handsontable(container, {
 *   // configuration options, in the object literal notation
 *   licenseKey: 'non-commercial-and-evaluation',
 *   data: [
 *     ['A1', 'B1', 'C1', 'D1', 'E1'],
 *     ['A2', 'B2', 'C2', 'D2', 'E2'],
 *     ['A3', 'B3', 'C3', 'D3', 'E3'],
 *     ['A4', 'B4', 'C4', 'D4', 'E4'],
 *     ['A5', 'B5', 'C5', 'D5', 'E5'],
 *   ],
 *   width: 400,
 *   height: 300,
 *   colHeaders: true,
 *   rowHeaders: true,
 *   customBorders: true,
 *   dropdownMenu: true,
 *   multiColumnSorting: true,
 *   filters: true,
 *   manualRowMove: true,
 * });
 * ```
 * :::
 *
 * ::: only-for react
 *
 * To apply configuration options, pass them as individual props
 * of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component)
 * or [`HotColumn`](@/guides/columns/react-hot-column/react-hot-column.md) components.
 *
 * Read more on the [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md) page.
 *
 * ```jsx
 * <HotTable
 *   // configuration options, in the object literal notation
 *   licenseKey='non-commercial-and-evaluation'
 *   data={[
 *     ['A1', 'B1', 'C1', 'D1', 'E1'],
 *     ['A2', 'B2', 'C2', 'D2', 'E2'],
 *     ['A3', 'B3', 'C3', 'D3', 'E3'],
 *     ['A4', 'B4', 'C4', 'D4', 'E4'],
 *     ['A5', 'B5', 'C5', 'D5', 'E5'],
 *   ]}
 *   width={400}
 *   height={300}
 *   colHeaders={true}
 *   rowHeaders={true}
 *   customBorders={true}
 *   dropdownMenu={true}
 *   multiColumnSorting={true}
 *   filters={true}
 *   manualRowMove={true}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: [
 *     ["A1", "B1", "C1", "D1", "E1"],
 *     ["A2", "B2", "C2", "D2", "E2"],
 *     ["A3", "B3", "C3", "D3", "E3"],
 *     ["A4", "B4", "C4", "D4", "E4"],
 *     ["A5", "B5", "C5", "D5", "E5"],
 *   ],
 *   width: 400,
 *   height: 300,
 *   colHeaders: true,
 *   rowHeaders: true,
 *   customBorders: true,
 *   dropdownMenu: true,
 *   multiColumnSorting: true,
 *   filters: true,
 *   manualRowMove: true,
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings" />
 * ```
 * :::
 *
 * Depending on your needs, you can apply [configuration options](@/api/options.md) to different elements of your grid:
 * - [The entire grid](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options)
 * - [Individual columns](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
 * - [Individual rows](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
 * - [Individual cells](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
 * - [Individual grid elements, based on any logic you implement](@/guides/getting-started/configuration-options/configuration-options.md#implementing-custom-logic)
 *
 * Read more:
 * - [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
 */
export default (): Record<string, unknown> => {
  return {

    /**
     * Information on which of the meta properties were added automatically.
     * For example: setting the `renderer` property directly won't extend the `_automaticallyAssignedMetaProps`
     * entry, but setting a `type` will modify it to `Set(3) {'renderer', 'editor', 'validator', ...}`.
     *
     * @private
     * @type {Set}
     * @default undefined
     */
    _automaticallyAssignedMetaProps: undefined,

    /**
     * The `activeHeaderClassName` option lets you add a CSS class name
     * to every currently-active, currently-selected header (when a whole column or row is selected).
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * Read more:
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @since 0.38.2
     * @default 'ht__active_highlight'
     * @category Core
     *
     * @example
     * ```js
     * // add an `ht__active_highlight` CSS class name
     * // to every currently-active, currently-selected header
     * activeHeaderClassName: 'ht__active_highlight',
     * ```
     */
    activeHeaderClassName: 'ht__active_highlight',

    /**
     * The `allowEmpty` option determines whether Handsontable accepts the following values:
     * - `null`
     * - `undefined`
     * - `''`
     *
     * You can set the `allowEmpty` option to one of the following:
     *
     * | Setting          | Description                                                                                                                          |
     * | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
     * | `true` (default) | - Accept `null`, `undefined` and `''` values<br>- Mark cells that contain `null`, `undefined` or `''` values as `valid`              |
     * | `false`          | - Don't accept `null`, `undefined` and `''` values<br>- Mark cells that contain `null`, `undefined` or `''` values with as `invalid` |
     *
     * ::: tip
     * To use the [`allowEmpty`](#allowempty) option, you need to set the [`validator`](#validator) option (or the [`type`](#type) option).
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // allow empty values in each cell of the entire grid
     * allowEmpty: true,
     *
     * // or
     * columns: [
     *   {
     *     type: 'date',
     *     dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
     *     // allow empty values in each cell of the 'date' column
     *     allowEmpty: true
     *   }
     * ],
     *
     * // or, using the `cells` option
     * cells(row, col) {
     *   if (col === 2) {
     *     return { allowEmpty: false };
     *   }
     * },
     * ```
     */
    allowEmpty: true,

    /**
     * The `allowHtml` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells' [`source`](#source) data
     * is treated as HTML.
     *
     * You can set the `allowHtml` option to one of the following:
     *
     * | Setting           | Description                                         |
     * | ----------------- | --------------------------------------------------- |
     * | `false` (default) | The [`source`](#source) data is not treated as HTML |
     * | `true`            | The [`source`](#source) data is treated as HTML     |
     *
     * __Warning:__ Setting the `allowHtml` option to `true` can cause serious XSS vulnerabilities.
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
     * - [`source`](#source)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: ['<strong>foo</strong>', '<strong>bar</strong>']
     *   // use HTML in the `source` list
     *   allowHtml: true,
     *   },
     * ],
     * ```
     */
    allowHtml: false,

    /**
     * If set to `true`, the `allowInsertColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
     * - **Insert column left**
     * - **Insert column right**
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the 'Insert column left' and 'Insert column right' menu items from the context menu
     * allowInsertColumn: false,
     * ```
     */
    allowInsertColumn: true,

    /**
     * If set to `true`, the `allowInsertRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
     * - **Insert row above**
     * - **Insert row below**
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the 'Insert row above' and 'Insert row below' menu items from the context menu
     * allowInsertRow: false,
     * ```
     */
    allowInsertRow: true,

    /**
     * The `allowInvalid` option determines whether Handsontable accepts values
     * that were marked as `invalid` by the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md).
     *
     * You can set the `allowInvalid` option to one of the following:
     *
     * | Setting          | Description                                                                                                                                                                        |
     * | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | - Accept `invalid` values<br>- Allow the user to close the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) with `invalid` values<br>- Save `invalid` values into the data source                   |
     * | `false`          | - Don't accept `invalid` values<br>- Don't allow the user to close the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) with `invalid` values<br>- Don't save `invalid` values into the data source |
     *
     * Setting the `allowInvalid` option to `false` can be useful when used with the [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode).
     *
     * Read more:
     * - [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
     * - [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
     * - [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // don't accept `invalid` values
     * // don't allow the user to close the cell editor
     * // don't save `invalid` values into the data source
     * allowInvalid: false,
     * ```
     */
    allowInvalid: true,

    /**
     * If set to `true`, the `allowRemoveColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
     * - **Remove column**
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * Read more:
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the 'Remove column' menu item from the context menu
     * allowRemoveColumn: false,
     * ```
     */
    allowRemoveColumn: true,

    /**
     * If set to `true`, the `allowRemoveRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md):
     * - **Remove row**
     *
     * Read more:
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the 'Remove row' menu item from the context menu
     * allowRemoveRow: false,
     * ```
     */
    allowRemoveRow: true,

    /**
     * If set to `true`, the accessibility-related ARIA tags will be added to the table. If set to `false`, they
     * will be omitted.
     * Defaults to `true`.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     * @since 14.0.0
     */
    ariaTags: true,

    /**
     * The `autoColumnSize` option configures the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin.
     *
     * You can set the `autoColumnSize` option to one of the following:
     *
     * | Setting   | Description                                                                                  |
     * | --------- | -------------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin                               |
     * | `true`    | Enable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin with the default configuration |
     * | An object | Enable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin and modify the plugin options  |
     *
     * If you set the `autoColumnSize` option to an object, you can set the following [`AutoColumnSize`](@/api/autoColumnSize.md) plugin options:
     *
     * | Property                | Possible values                 | Description                                                                                                    |
     * | ----------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
     * | `syncLimit`             | A number \| A percentage string | The number/percentage of columns to keep in sync<br>(default: `50`)                                            |
     * | `useHeaders`            | `true` \| `false`               | When calculating column widths:<br>`true`: use column headers<br>`false`: don't use column headers          |
     * | `samplingRatio`         | A number                        | The number of samples of the same length to be used in column width calculations                               |
     * | `allowSampleDuplicates` | `true` \| `false`               | When calculating column widths:<br>`true`: Allow duplicate samples<br>`false`: Don't allow duplicate samples |
     *
     * By default, the `autoColumnSize` option is set to `undefined`,
     * but the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin acts as enabled.
     * To disable the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin completely,
     * set the `autoColumnSize` option to `false`.
     *
     * Using the [`colWidths`](#colWidths) option forcibly disables the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin.
     *
     * Read more:
     * - [Plugins: `AutoColumnSize`](@/api/autoColumnSize.md)
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default undefined
     * @category AutoColumnSize
     *
     * @example
     * ```js
     * autoColumnSize: {
     *   // keep 40% of columns in sync (the rest of columns: async)
     *   syncLimit: '40%',
     *   // when calculating column widths, use column headers
     *   useHeaders: true,
     *   // when calculating column widths, use 10 samples of the same length
     *   samplingRatio: 10,
     *   // when calculating column widths, allow duplicate samples
     *   allowSampleDuplicates: true
     * },
     * ```
     */
    autoColumnSize: undefined,

    /**
     * The `autoRowSize` option configures the [`AutoRowSize`](@/api/autoRowSize.md) plugin.
     *
     * You can set the `autoRowSize` option to one of the following:
     *
     * | Setting   | Description                                                                            |
     * | --------- | -------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`AutoRowSize`](@/api/autoRowSize.md) plugin                               |
     * | `true`    | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin with the default configuration |
     * | An object | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin and modify the plugin options  |
     *
     * To give Handsontable's scrollbar a proper size, set the `autoRowSize` option to `true`.
     *
     * If you set the `autoRowSize` option to an object, you can set the following [`AutoRowSize`](@/api/autoRowSize.md) plugin options:
     *
     * | Property    | Possible values                 | Description                                                       |
     * | ----------- | ------------------------------- | ----------------------------------------------------------------- |
     * | `syncLimit` | A number \| A percentage string | The number/percentage of rows to keep in sync<br>(default: `500`) |
     *
     * Using the [`rowHeights`](#rowHeights) option forcibly disables the [`AutoRowSize`](@/api/autoRowSize.md) plugin.
     *
     * Read more:
     * - [Plugins: `AutoRowSize`](@/api/autoRowSize.md)
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default undefined
     * @category AutoRowSize
     *
     * @example
     * ```js
     * autoRowSize: {
     *   // keep 40% of rows in sync (the rest of rows: async)
     *   syncLimit: '40%'
     * },
     * ```
     */
    autoRowSize: undefined,

    /**
     * | Setting           | Description                                                                                                                                                                                                                                  |
     * | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false` (default) | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> doesn't do anything.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> doesn't do anything.                                                                    |
     * | `true`            | When you select a bottom-most cell, pressing <kbd>**↓**</kbd> takes you to the top-most cell of the next column.<br><br>When you select a top-most cell, pressing <kbd>**↑**</kbd> takes you to the bottom-most cell of the previous column. |
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // when you select a bottom-most cell, pressing ⬇ doesn't do anything
     * // when you select a top-most cell, pressing ⬆ doesn't do anything
     * autoWrapCol: false, // default setting
     *
     * // when you select a bottom-most cell, pressing ⬇ takes you to the top-most cell of the next column
     * // when you select a top-most cell, pressing ⬆ takes you to the bottom-most cell of the previous column
     * autoWrapCol: true,
     * ```
     */
    autoWrapCol: false,

    /**
     * | Setting           | Description                                                                                                                                                                                                                                                                                                        |
     * | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `false` (default) | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) doesn't do anything.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) doesn't do anything.                                                  |
     * | `true`            | When you select the first cell of a row, pressing <kbd>**←**</kbd>* (or <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>\*\*) takes you to the last cell of the row above.<br><br>When you select the last cell of a row, pressing <kbd>**→**</kbd>* (or <kbd>**Tab**</kbd>**) takes you to the first cell of the row below. |
     *
     * \* The exact key depends on your [`layoutDirection`](#layoutdirection) configuration.<br>
     * \*\* Unless [`tabNavigation`](#tabnavigation) is set to `false`.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // when you select the first cell of a row, pressing ⬅ (or Shift+Tab) doesn't do anything
     * // when you select the last cell of a row, pressing ➡ (or Tab) doesn't do anything
     * autoWrapRow: false, // default setting
     *
     * // when you select the first cell of a row, pressing ⬅ (or Shift+Tab) takes you to the last cell of the row above
     * // when you select the last cell of a row, pressing ➡ (or Tab) takes you to the first cell of the row below
     * autoWrapRow: true,
     * ```
     */
    autoWrapRow: false,

    /**
     * @description
     * The `bindRowsWithHeaders` option configures the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin.
     *
     * When enabled, each row stays permanently linked to its row header label, regardless of row sorting or row moving.
     * Normally, row headers display the visual row index and update as rows are reordered; with this plugin enabled,
     * the header travels with the data row it was originally assigned to.
     *
     * You can set the `bindRowsWithHeaders` option to one of the following:
     *
     * | Setting | Description                                                                  |
     * | ------- | ---------------------------------------------------------------------------- |
     * | `false` | Disable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin |
     * | `true`  | Enable the the [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) plugin  |
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * Read more:
     * - [Plugins: `BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)
     *
     * @memberof Options#
     * @type {boolean|string}
     * @default undefined
     * @category BindRowsWithHeaders
     *
     * @example
     * ```js
     * // enable the `BindRowsWithHeaders` plugin
     * bindRowsWithHeaders: true
     * ```
     */
    bindRowsWithHeaders: undefined,

    /**
     * The `cell` option lets you apply [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual cells.
     *
     * The `cell` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options),
     * and the [`columns`](#columns) options.
     *
     * Read more:
     * - [Configuration options: Setting cell options](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
     * - [`columns`](#columns)
     *
     * @memberof Options#
     * @type {Array[]}
     * @default []
     * @category Core
     *
     * @example
     * ```js
     * // set the `cell` option to an array of objects
     * cell: [
     *   // make the cell with coordinates (0, 0) read-only
     *   {
     *     row: 0,
     *     col: 0,
     *     readOnly: true
     *   }
     * ],
     * ```
     */
    cell: [],

    /**
     * @description
     * The `cells` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to
     * individual grid elements (columns, rows, cells), based on any logic you implement.
     *
     * The `cells` option overwrites all other options (including options set by [`columns`](#columns) and [`cell`](#cell)).
     * It takes the following parameters:
     *
     * | Parameter | Required | Type             | Description                                                                                                                                                                                                                                                                                                                             |
     * | --------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `row`     | Yes      | Number           | A physical row index                                                                                                                                                                                                                                                                                                                    |
     * | `column`  | Yes      | Number           | A physical column index                                                                                                                                                                                                                                                                                                                 |
     * | `prop`    | No       | String \| Number | If [`data`](#data) is set to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same number as `column`.<br><br>If [`data`](#data) is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for the column's data object. |
     *
     * Read more:
     * - [Configuration options: Implementing custom logic](@/guides/getting-started/configuration-options/configuration-options.md#implement-custom-logic)
     * - [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
     * - [`columns`](#columns)
     * - [`cell`](#cell)
     *
     * @memberof Options#
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the `cells` option to your custom function
     * cells(row, column, prop) {
     *   const cellProperties = { readOnly: false };
     *   const visualRowIndex = this.instance.toVisualRow(row);
     *   const visualColIndex = this.instance.toVisualColumn(column);
     *
     *   if (visualRowIndex === 0 && visualColIndex === 0) {
     *     cellProperties.readOnly = true;
     *   } else {
     *     cellProperties.readOnly = false;
     *   }
     *
     *   return cellProperties;
     * },
     * ```
     */
    cells: undefined,

    /**
     * The `checkedTemplate` option lets you configure what value
     * a checked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.
     *
     * You can set the `checkedTemplate` option to one of the following:
     *
     * | Setting          | Description                                                                                                                                                                              |
     * | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the [`getDataAtCell`](@/api/core.md#getDataAtCell) method for this cell returns `true`                  |
     * | A string         | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is checked,<br>the [`getDataAtCell`](@/api/core.md#getDataAtCell) method for this cell returns a string of your choice |
     *
     * ::: warning
     * When you set `checkedTemplate` to a custom string value (e.g. `'Yes'`), using `true` in your data source to
     * represent a checked state is no longer valid. Only the exact custom string value matches a checked checkbox.
     * Pair `checkedTemplate` with [`uncheckedTemplate`](#uncheckedTemplate) to define both states explicitly.
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
     * - [`getDataAtCell()`](@/api/core.md#getDataAtCell)
     * - [`uncheckedTemplate`](#uncheckedTemplate)
     *
     * @memberof Options#
     * @type {boolean|string|number}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // set the `type` of each cell in this column to `checkbox`
     *     // when checked, the cell's value is `true`
     *     // when unchecked, the cell's value is `false`
     *     type: 'checkbox',
     *   },
     *   {
     *     // set the `type` of each cell in this column to `checkbox`
     *     type: 'checkbox',
     *     // when checked, the cell's value is `'Yes'`
     *     checkedTemplate: 'Yes',
     *     // when unchecked, the cell's value is `'No'`
     *     uncheckedTemplate: 'No'
     *  }
     * ],
     * ```
     */
    checkedTemplate: undefined,

    /**
     * The `className` option lets you add CSS class names to every currently-selected element.
     *
     * You can set the `className` option to one of the following:
     *
     * | Setting             | Description                                                      |
     * | ------------------- | ---------------------------------------------------------------- |
     * | A string            | Add a single CSS class name to every currently-selected element  |
     * | An array of strings | Add multiple CSS class names to every currently-selected element |
     *
     * ::: tip
     * Don't change the `className` metadata of the [column summary](@/guides/columns/column-summary/column-summary.md) row.
     * To style the summary row, use the class name assigned automatically by the [`ColumnSummary`](@/api/columnSummary.md) plugin: `columnSummaryResult`.
     * :::
     *
     * To apply different CSS class names on different levels, use Handsontable's [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration).
     *
     * Read more:
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`TableClassName`](#TableClassName)
     *
     * @memberof Options#
     * @type {string|string[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add a `your-class-name` CSS class name
     * // to every currently-selected element
     * className: 'your-class-name',
     *
     * // add `first-class-name` and `second-class-name` CSS class names
     * // to every currently-selected element
     * className: ['first-class-name', 'second-class-name'],
     * ```
     */
    className: undefined,

    /**
     * The `colHeaders` option configures your grid's column headers.
     *
     * You can set the `colHeaders` option to one of the following:
     *
     * | Setting  | Description                                                          |
     * | -------- | -------------------------------------------------------------------- |
     * | `true`   | Enable the default column headers ('A', 'B', 'C', ...)               |
     * | `false`  | Disable column headers                                               |
     * | An array | Define your own column headers (e.g. `['One', 'Two', 'Three', ...]`) |
     * | A function | Define your own column headers, using a function                     |
     *
     * Read more:
     * - [Column header](@/guides/columns/column-header/column-header.md)
     *
     * @memberof Options#
     * @type {boolean|string[]|Function}
     * @default null
     * @category Core
     *
     * @example
     * ```js
     * // enable the default column headers
     * colHeaders: true,
     *
     * // set your own column headers
     * colHeaders: ['One', 'Two', 'Three'],
     *
     * // set your own column headers, using a function
     * colHeaders: function(visualColumnIndex) {
     *   return `${visualColumnIndex} + : AB`;
     * },
     * ```
     */
    colHeaders: null,

    /**
     * @description
     * The `collapsibleColumns` option configures the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin.
     *
     * You can set the `collapsibleColumns` option to one of the following:
     *
     * | Setting              | Description                                                                                       |
     * | -------------------- | ------------------------------------------------------------------------------------------------- |
     * | `false`              | Disable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                            |
     * | `true`               | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin                             |
     * | An array of objects  | Enable the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin for selected column headers |
     *
     * When using an array of objects, specify the header to make collapsible using `row` and `col`.
     * The `row` value is a negative integer that counts header levels from the bottom of the header area:
     * `-1` is the header row closest to the data, `-2` is one level above, and so on.
     * This option requires the [`nestedHeaders`](#nestedHeaders) plugin to be configured.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * Read more:
     * - [Plugins: `CollapsibleColumns`](@/api/collapsibleColumns.md)
     * - [`nestedHeaders`](#nestedHeaders)
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default undefined
     * @category CollapsibleColumns
     *
     * @example
     * ```js
     * // enable column collapsing for all headers
     * collapsibleColumns: true,
     *
     * // enable column collapsing for selected headers
     * collapsibleColumns: [
     *   {row: -4, col: 1, collapsible: true},
     *   {row: -3, col: 5, collapsible: true}
     * ],
     * ```
     */
    collapsibleColumns: undefined,

    /**
     * @description
     * The `columnHeaderHeight` option configures the height of column headers.
     *
     * You can set the `columnHeaderHeight` option to one of the following:
     *
     * | Setting  | Description                                         |
     * | -------- | --------------------------------------------------- |
     * | A number | Set the same height for every column header         |
     * | An array | Set different heights for individual column headers |
     *
     * @memberof Options#
     * @type {number|number[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the same height for every column header
     * columnHeaderHeight: 25,
     *
     * // set different heights for individual column headers
     * columnHeaderHeight: [25, 30, 55],
     * ```
     */
    columnHeaderHeight: undefined,

    /**
     * @description
     * The `columns` option lets you apply any other [configuration options](@/guides/getting-started/configuration-options/configuration-options.md) to individual columns (or ranges of columns).
     *
     * You can set the `columns` option to one of the following:
     * - An array of objects (each object represents one column)
     * - A function that returns an array of objects
     *
     * The `columns` option overwrites the [top-level grid options](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     *
     * When you use `columns`, the [`startCols`](#startCols), [`minCols`](#minCols), and [`maxCols`](#maxCols) options are ignored.
     *
     * Read more:
     * - [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
     * - [`startCols`](#startCols)
     * - [`minCols`](#minCols)
     * - [`maxCols`](#maxCols)
     * - [`data`](#data)
     *
     * @memberof Options#
     * @type {object[]|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the `columns` option to an array of objects
     * // each object represents one column
     * columns: [
     *   {
     *     // column options for the first (by physical index) column
     *     type: 'numeric',
     *     numericFormat: {
     *       style: 'currency',
     *       currency: 'USD',
     *       minimumFractionDigits: 2,
     *       maximumFractionDigits: 2
     *     }
     *   },
     *   {
     *     // column options for the second (by physical index) column
     *     type: 'text',
     *     readOnly: true
     *   }
     * ],
     *
     * // or set the `columns` option to a function, based on physical indexes
     * columns(index) {
     *   return {
     *     type: index > 0 ? 'numeric' : 'text',
     *     readOnly: index < 1
     *   }
     * }
     * ```
     */
    columns: undefined,

    /**
     * @description
     * The `columnSorting` option configures the [`ColumnSorting`](@/api/columnSorting.md) plugin.
     *
     * You can set the `columnSorting` option to one of the following:
     *
     * | Setting    | Description                                                                                                                            |
     * | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true`     | Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin with the default configuration                                             |
     * | `false`    | Disable the [`ColumnSorting`](@/api/columnSorting.md) plugin                                                                           |
     * | An object  | - Enable the [`ColumnSorting`](@/api/columnSorting.md) plugin<br>- Modify the [`ColumnSorting`](@/api/columnSorting.md) plugin options |
     *
     * If you set the `columnSorting` option to an object,
     * you can set the following [`ColumnSorting`](@/api/columnSorting.md) plugin options:
     *
     * | Option                   | Possible settings                                                                                                                                |
     * | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header  |
     * | `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
     * | `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
     * | `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                                |
     *
     * If you set the `columnSorting` option to an object,
     * you can also sort individual columns at Handsontable's initialization.
     * In the `columnSorting` object, add an object named `initialConfig`,
     * with the following properties:
     *
     * | Option      | Possible settings   | Description                                                      |
     * | ----------- | ------------------- | ---------------------------------------------------------------- |
     * | `column`    | A number            | The index of the column that you want to sort at initialization  |
     * | `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |
     *
     * Read more:
     * - [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
     * - [Rows sorting: Custom compare functions](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)
     * - [`multiColumnSorting`](#multiColumnSorting)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category ColumnSorting
     *
     * @example
     * ```js
     * // enable the `ColumnSorting` plugin
     * columnSorting: true
     *
     * // enable the `ColumnSorting` plugin with custom configuration
     * columnSorting: {
     *   // sort empty cells as well
     *   sortEmptyCells: true,
     *   // display the arrow icon in the column header
     *   indicator: true,
     *   // disable clicking on the column header to sort the column
     *   headerAction: false,
     *   // add a custom compare function
     *   compareFunctionFactory(sortOrder, columnMeta) {
     *     return function(value, nextValue) {
     *       // some value comparisons which will return -1, 0 or 1...
     *     }
     *   }
     * }
     *
     * // enable the `ColumnSorting` plugin with an initial sort order:
     * // sort column 1 in ascending order at initialization
     * columnSorting: {
     *   initialConfig: {
     *     column: 1,
     *     sortOrder: 'asc'
     *   }
     * }
     * ```
     */
    columnSorting: undefined,

    /**
     * @description
     * The `columnSummary` option configures the [`ColumnSummary`](@/api/columnSummary.md) plugin.
     *
     * You can set the `columnSummary` option to an array of objects.
     * Each object configures a single column summary, using the following properties:
     *
     * | Property                 | Possible values                                                         | Description                                                                                                                  |
     * | ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
     * | `sourceColumn`           | A number                                                                | [Column to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize)                     |
     * | `ranges`                 | An array                                                                | [Ranges of rows to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize)             |
     * | `type`                   | `'sum'` \| `'min'` \| `'max'` \| `'count'` \| `'average'` \| `'custom'` | [Summary function](@/guides/columns/column-summary/column-summary.md#step-3-calculate-your-summary)                                         |
     * | `destinationRow`         | A number                                                                | [Destination cell's row coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates)    |
     * | `destinationColumn`      | A number                                                                | [Destination cell's column coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
     * | `forceNumeric`           | `true`  \| `false`                                                      | [Treat non-numerics as numerics](@/guides/columns/column-summary/column-summary.md#force-numeric-values)                                  |
     * | `reversedRowCoords`      | `true`  \| `false`                                                      | [Reverse row coordinates](@/guides/columns/column-summary/column-summary.md#step-5-make-room-for-the-destination-cell)                      |
     * | `suppressDataTypeErrors` | `true`  \| `false`                                                      | [Suppress data type errors](@/guides/columns/column-summary/column-summary.md#throw-data-type-errors)                                    |
     * | `readOnly`               | `true`  \| `false`                                                      | Make summary cell [read-only](@/api/options.md#readonly)                                                                                           |
     * | `roundFloat`             | `true`  \| `false`  \| A number                                         | [Round summary result](@/guides/columns/column-summary/column-summary.md#round-a-column-summary-result)                                  |
     * | `customFunction`         | A function                                                              | [Custom summary function](@/guides/columns/column-summary/column-summary.md#implement-a-custom-summary-function)                         |
     *
     * Read more:
     * - [Column summary](@/guides/columns/column-summary/column-summary.md)
     * - [Plugins: `ColumnSummary`](@/api/columnSummary.md)
     *
     * @memberof Options#
     * @type {object[]|Function}
     * @default undefined
     * @category ColumnSummary
     *
     * @example
     * ```js
     * columnSummary: [
     *   {
     *     sourceColumn: 0,
     *     ranges: [
     *       [0, 2], [4], [6, 8]
     *     ],
     *     type: 'custom',
     *     destinationRow: 4,
     *     destinationColumn: 1,
     *     forceNumeric: true,
     *     reversedRowCoords: true,
     *     suppressDataTypeErrors: false,
     *     readOnly: true,
     *     roundFloat: false,
     *     customFunction(endpoint) {
     *        return 100;
     *     }
     *   }
     * ],
     * ```
     */
    columnSummary: undefined,

    /**
     * The `colWidths` option sets columns' widths, in pixels.
     *
     * The default column width is 50px. To change it, set the `colWidths` option to one of the following:
     *
     * | Setting     | Description                                                                                          | Example                                                           |
     * | ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
     * | A number    | Set the same width for every column                                                                  | `colWidths: 100`                                                  |
     * | A string    | Set the same width for every column                                                                  | `colWidths: '100px'`                                              |
     * | An array    | Set widths separately for each column                                                                | `colWidths: [100, 120, undefined]`                                |
     * | A function  | Set column widths dynamically,<br>on each render                                                     | `colWidths(visualColumnIndex) { return visualColumnIndex * 10; }` |
     * | `undefined` | Used by the [modifyColWidth](@/api/hooks.md#modifyColWidth) hook,<br>to detect column width changes. | `colWidths: undefined`                                            |
     *
     * Setting `colWidths` even for a single column disables the {@link AutoColumnSize} plugin
     * for all columns. For this reason, if you use `colWidths`, we recommend you set a width for each one
     * of your columns. Otherwise, every column with an undefined width defaults back to 50px,
     * which may cut longer columns names.
     *
     * Read more:
     * - [Column width](@/guides/columns/column-width/column-width.md)
     * - [Hooks: `modifyColWidth`](@/api/hooks.md#modifyColWidth)
     * - [`autoColumnSize`](#autoColumnSize)
     *
     * @memberof Options#
     * @type {number|number[]|string|string[]|Array<undefined>|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set every column's width to 100px
     * colWidths: 100,
     *
     * // set every column's width to 100px
     * colWidths: '100px',
     *
     * // set the first (by visual index) column's width to 100
     * // set the second (by visual index) column's width to 120
     * // set the third (by visual index) column's width to `undefined`, so that it defaults to 50px
     * // set any other column's width to the default 50px (note that longer cell values and column names can get cut)
     * colWidths: [100, 120, undefined],
     *
     * // set each column's width individually, using a function
     * colWidths(visualColumnIndex) {
     *   return visualColumnIndex * 10;
     * },
     * ```
     */
    colWidths: undefined,

    /**
     * The `commentedCellClassName` option lets you add a CSS class name to cells
     * that have comments.
     *
     * Read more:
     * - [Comments](@/guides/cell-features/comments/comments.md)
     * - [`comments`](#comments)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default 'htCommentCell'
     * @category Core
     *
     * @example
     * ```js
     * // add a `has-comment` CSS class name
     * // to each cell that has a comment
     * commentedCellClassName: 'has-comment',
     * ```
     */
    commentedCellClassName: 'htCommentCell',

    /**
     * @description
     * The `comments` option configures the [`Comments`](@/api/comments.md) plugin.
     *
     * You can set the `comments` option to one of the following:
     *
     * | Setting   | Description                                                                                                                                                                           |
     * | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true`    | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)                                 |
     * | `false`   | Disable the [`Comments`](@/api/comments.md) plugin                                                                                                                                    |
     * | An object | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)<br>- Configure comment settings |
     *
     * If you set the `comments` option to an object, you can configure the following comment options:
     *
     * | Option         | Possible settings           | Description                                         |
     * | -------------- | --------------------------- | --------------------------------------------------- |
     * | `displayDelay` | A number (default: `250`)   | Display comments after a delay (in milliseconds)    |
     * | `readOnly`     | `true` \| `false` (default) | `true`: Make comments read-only                     |
     * | `style`        | An object                   | Set comment boxes' `width` and `height` (in pixels) |
     *
     * Read more:
     * - [Comments](@/guides/cell-features/comments/comments.md)
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     * - [`width`](#width)
     * - [`height`](#height)
     * - [`readOnly`](#readOnly)
     * - [`commentedCellClassName`](#commentedCellClassName)
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category Comments
     *
     * @example
     * ```js
     * // enable the `Comments` plugin
     * comments: true,
     *
     * // enable the `Comments` plugin
     * // and configure its settings
     * comments: {
     *   // display all comments with a 1-second delay
     *   displayDelay: 1000,
     *   // make all comments read-only
     *   readOnly: true,
     *   // set the default size of all comment boxes
     *   style: {
     *     width: 300,
     *     height: 100
     *   }
     * }
     * ```
     */
    comments: false,

    /**
     * @description
     * The `contextMenu` option configures the [`ContextMenu`](@/api/contextMenu.md) plugin.
     *
     * You can set the `contextMenu` option to one of the following:
     *
     * | Setting   | Description                                                                                                                                                                                             |
     * | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`ContextMenu`](@/api/contextMenu.md) plugin                                                                                                                                                |
     * | `true`    | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)                 |
     * | An array  | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)              |
     * | An object | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Apply a [custom context menu configuration](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration) |
     *
     * Read more:
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     * - [Context menu: Context menu with default options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)
     * - [Context menu: Context menu with specific options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
     * - [Context menu: Context menu with fully custom configuration options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration)
     * - [Plugins: `ContextMenu`](@/api/contextMenu.md)
     *
     * @memberof Options#
     * @type {boolean|string[]|object}
     * @default undefined
     * @category ContextMenu
     *
     * @example
     * ```js
     * // enable the `ContextMenu` plugin
     * // use the default context menu options
     * contextMenu: true,
     *
     * // enable the `ContextMenu` plugin
     * // and modify individual context menu options
     * contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],
     *
     * // enable the `ContextMenu` plugin
     * // and apply a custom context menu configuration
     * contextMenu: {
     *   items: {
     *     'option1': {
     *       name: 'Option 1'
     *     },
     *     'option2': {
     *       name: 'Option 2',
     *       submenu: {
     *         items: [
     *           {
     *             key: 'option2:suboption1',
     *             name: 'Suboption 1',
     *             callback: function(key, options) {
     *               ...
     *             }
     *           },
     *           ...
     *         ]
     *       }
     *     }
     *   }
     * },
     * ```
     */
    contextMenu: undefined,

    /**
     * @description
     * The `copyable` option determines whether a cell's value can be copied to the clipboard or not.
     *
     * You can set the `copyable` option to one of the following:
     *
     * | Setting                                                                                                        | Description                                                                                                            |
     * | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default)                                                                                               | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add the cell's value to the clipboard         |
     * | `false`<br>(default for the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) [cell type](#type))        | - On pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, add an empty string (`""`) to the clipboard   |
     *
     * Read more:
     * - [Clipboard](@/guides/cell-features/clipboard/clipboard.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [Password cell type](@/guides/cell-types/password-cell-type/password-cell-type.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // enable copying for each cell of the entire grid
     * copyable: true,
     *
     * // enable copying for individual columns
     * columns: [
     *   {
     *     // enable copying for each cell of this column
     *     copyable: true
     *   },
     *   {
     *     // disable copying for each cell of this column
     *     copyable: false
     *   }
     * ]
     *
     * // enable copying for specific cells
     * cell: [
     *   {
     *     col: 0,
     *     row: 0,
     *     // disable copying for cell (0, 0)
     *     copyable: false,
     *   }
     * ],
     * ```
     */
    copyable: true,

    /**
     * The `copyPaste` option configures the [`CopyPaste`](@/api/copyPaste.md) plugin.
     *
     * You can set the `copyPaste` option to one of the following:
     *
     * | Setting           | Description                                                                                                            |
     * | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default)  | Enable the [`CopyPaste`](@/api/copyPaste.md) plugin with the default configuration                                     |
     * | `false`           | Disable the [`CopyPaste`](@/api/copyPaste.md) plugin                                                                   |
     * | An object         | - Enable the [`CopyPaste`](@/api/copyPaste.md) plugin<br>- Modify the [`CopyPaste`](@/api/copyPaste.md) plugin options |
     *
     * ##### copyPaste: Additional options
     *
     * If you set the `copyPaste` option to an object, you can set the following `CopyPaste` plugin options:
     *
     * | Option                   | Possible settings                                  | Description                                                                                                                                                                                         |
     * | ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `columnsLimit`           | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
     * | `rowsLimit`              | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
     * | `pasteMode`              | `'overwrite'` \| `'shift_down'` \| `'shift_right'` | When pasting:<br>`'overwrite'`: overwrite the currently-selected cells<br>`'shift_down'`: move the currently-selected cells down<br>`'shift_right'`: move the currently-selected cells to the right |
     * | `copyColumnHeaders`      | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with their nearest column headers                                                                                                         |
     * | `copyColumnGroupHeaders` | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with all their related columns headers                                                                                                    |
     * | `copyColumnHeadersOnly`  | Boolean (default: `false`)                         | `true`: add a context menu option for copying column headers nearest to the selected cells (without copying cells)                                                                    |
     * | `uiContainer`            | An HTML element                                    | The UI container for the secondary focusable element                                                                                                                                                |
     *
     * Read more:
     * - [Plugins: `CopyPaste`](@/api/copyPaste.md)
     * - [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default true
     * @category CopyPaste
     *
     * @example
     * ```js
     * // enable the plugin with the default configuration
     * copyPaste: true // set by default
     *
     * // disable the plugin
     * copyPaste: false,
     *
     * // enable the plugin with a custom configuration
     * copyPaste: {
     *   // set a maximum number of columns that can be copied
     *   columnsLimit: 25,
     *
     *   // set a maximum number of rows that can be copied
     *   rowsLimit: 50,
     *
     *   // set the paste behavior
     *   pasteMode: 'shift_down',
     *
     *   // add the option to copy cells along with their nearest column headers
     *   copyColumnHeaders: true,
     *
     *   // add the option to copy cells along with all their related columns headers
     *   copyColumnGroupHeaders: true,
     *
     *   // add the option to copy just column headers (without copying cells)
     *   copyColumnHeadersOnly: true,
     *
     *   // set a UI container
     *   uiContainer: document.body,
     * },
     * ```
     */
    copyPaste: true,

    /**
     * The `currentColClassName` option lets you add a CSS class name
     * to each cell of the currently-visible, currently-selected columns.
     *
     * Read more:
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add a `your-class-name` CSS class name
     * // to each cell of the currently-visible, currently-selected columns
     * currentColClassName: 'your-class-name',
     * ```
     */
    currentColClassName: undefined,

    /**
     * The `currentHeaderClassName` option lets you add a CSS class name
     * to every currently-visible, currently-selected header.
     *
     * Read more:
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default 'ht__highlight'
     * @category Core
     *
     * @example
     * ```js
     * // add an `ht__highlight` CSS class name
     * // to every currently-visible, currently-selected header
     * currentHeaderClassName: 'ht__highlight',
     * ```
     */
    currentHeaderClassName: 'ht__highlight',

    /**
     * The `currentRowClassName` option lets you add a CSS class name
     * to each cell of the currently-visible, currently-selected rows.
     *
     * Read more:
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add a `your-class-name` CSS class name
     * // to each cell of the currently-visible, currently-selected rows
     * currentRowClassName: 'your-class-name',
     * ```
     */
    currentRowClassName: undefined,

    /**
     * @description
     * The `customBorders` option configures the [`CustomBorders`](@/api/customBorders.md) plugin.
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * (and add its menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)),
     * set the `customBorders` option to `true`.
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * and add a predefined border around a particular cell,
     * set the `customBorders` option to an array of objects.
     * Each object represents a border configuration for one cell, and has the following properties:
     *
     * | Property | Sub-properties                | Types                                                 | Description                                                       |
     * | -------- | ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
     * | `row`    | -                             | `row`: Number                                         | The cell's row coordinate.                                        |
     * | `col`    | -                             | `col`: Number                                         | The cell's column coordinate.                                     |
     * | `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
     * | `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
     * | `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
     * | `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * and add a predefined border around a range of cells,
     * set the `customBorders` option to an array of objects.
     * Each object represents a border configuration for a single range of cells, and has the following properties:
     *
     * | Property | Sub-properties                               | Types                                                            | Description                                                                                  |
     * | -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
     * | `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default):<br>- `from` selects the range's top-left corner.<br>- `to` selects the range's bottom-right corner.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: <br>- `from` selects the range's top-right corner.<br>- `to` selects the range's bottom-left corner. |
     * | `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
     * | `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
     * | `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
     * | `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |
     *
     * Read more:
     * - [Formatting cells: Custom cell borders](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders)
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     * - [Plugins: `CustomBorders`](@/api/customBorders.md)
     * - [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
     * - [`layoutDirection`](#layoutDirection)
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category CustomBorders
     *
     * @example
     * ```js
     * // enable the `CustomBorders` plugin
     * customBorders: true,
     *
     * // enable the `CustomBorders` plugin
     * // and add a predefined border for a particular cell
     * customBorders: [
     *   // add an object with a border configuration for one cell
     *   {
     *     // set the cell's row coordinate
     *     row: 2,
     *     // set the cell's column coordinate
     *     col: 2,
     *     // set the left/right border's width and color
     *     start: {
     *       width: 2,
     *       color: 'red'
     *     },
     *     // set the right/left border's width, color and style
     *     end: {
     *       width: 1,
     *       color: 'green',
     *       style: 'dashed'
     *     },
     *     // set the top border's width and color
     *     top: '',
     *     // set the bottom border's width and color
     *     bottom: ''
     *   }
     * ],
     *
     * // enable the `CustomBorders` plugin
     * // and add a predefined border for a range of cells
     * customBorders: [
     *   // add an object with a border configuration for one range of cells
     *   {
     *     // select a range of cells
     *     range: {
     *       // set the range's top-left corner
     *       from: {
     *         row: 1,
     *         col: 1
     *       },
     *       // set the range's bottom-right corner
     *       to: {
     *         row: 3,
     *         col: 4
     *       }
     *     },
     *     // set the left/right border's width, color and style
     *     start: {
     *       width: 2,
     *       color: 'red',
     *       style: 'dashed'
     *     },
     *     // set the right/left border's width and color
     *     end: {},
     *     // set the top border's width and color
     *     top: {},
     *     // set the bottom border's width and color
     *     bottom: {}
     *   }
     * ],
     * ```
     */
    customBorders: false,

    /**
     * @description
     * The `data` option sets the initial [data](@/guides/getting-started/binding-to-data/binding-to-data.md) of your Handsontable instance.
     *
     * Handsontable's data is bound to your source data by reference (i.e. when you edit Handsontable's data, your source data alters as well).
     *
     * You can set the `data` option:
     * - Either to an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
     * - Or to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects).
     *
     * If you don't set the `data` option (or set it to `null`), Handsontable renders as an empty 5x5 grid by default.
     *
     * When used inside the [`columns`](#columns) option, `data` has a different meaning: it acts as a property name
     * (or a dot-separated path) pointing to the field in each data row object that this column reads from and writes to.
     * In this context, `data` is not the full dataset but a column accessor string.
     *
     * Read more:
     * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
     * - [`dataSchema`](#dataSchema)
     * - [`startRows`](#startRows)
     * - [`startCols`](#startCols)
     *
     * @memberof Options#
     * @type {Array[]|object[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as an array of arrays
     * data: [
     *   ['A', 'B', 'C'],
     *   ['D', 'E', 'F'],
     *   ['G', 'H', 'J']
     * ]
     *
     * // as an array of objects
     * data: [
     *   {id: 1, name: 'Ted Right'},
     *   {id: 2, name: 'Frank Honest'},
     *   {id: 3, name: 'Joan Well'},
     *   {id: 4, name: 'Gail Polite'},
     *   {id: 5, name: 'Michael Fair'},
     * ]
     *
     * // as a column accessor inside `columns`
     * columns: [
     *   { data: 'id' },
     *   { data: 'name' }
     * ]
     * ```
     */
    data: undefined,

    /**
     * @description
     * When set, the table loads data from an async provider (e.g. a REST API) instead of a static `data` array.
     * Use the **object** form with every key defined: **`rowId`**, **`fetchRows`**, **`onRowsCreate`**, **`onRowsUpdate`**,
     * and **`onRowsRemove`**. All five are required on that object so paging, row identity, and create, update, and remove
     * map cleanly to your backend. Pair with **`pagination`** for server-side paging.
     * Valid cell edits apply at once; if **`onRowsUpdate`** fails or **`beforeRowsMutation`** blocks the update, affected cells roll back.
     *
     * @since 17.1.0
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * dataProvider: {
     *   rowId: 'id',
     *   fetchRows: async (queryParameters, { signal }) => {
     *     const { page, pageSize, sort, filters } = queryParameters;
     *     const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
     *
     *     if (sort) {
     *       params.set('sortBy', sort.prop);
     *       params.set('sortDir', sort.order);
     *     }
     *
     *     const res = await fetch(`/api/products?${params}`, { signal });
     *     const json = await res.json();
     *
     *     return { rows: json.data, totalRows: json.total };
     *   },
     *   onRowsCreate: async ({ position, referenceRowId, rowsAmount }) => { ... },
     *   onRowsUpdate: async (rows) => { ... },
     *   onRowsRemove: async (rowIds) => { ... },
     * },
     * ```
     */
    dataProvider: undefined,

    /**
     * @description
     * If `true`, Handsontable will interpret the dots in the columns mapping as a nested object path. If your dataset contains
     * the dots in the object keys and you don't want Handsontable to interpret them as a nested object path, set this option to `false`.
     *
     * The option only works when defined in the global table settings.
     *
     * @since 14.4.0
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // All dots are interpreted as nested object paths
     * dataDotNotation: true,
     * data: [
     *   { id: 1, name: { first: 'Ted', last: 'Right' }, user: { address: '1234 Any Street' } },
     * ],
     * columns={[
     *   { data: 'name.first' },
     *   { data: 'user.address' },
     * ]},
     * ```
     * ```js
     * // All dots are interpreted as simple object keys
     * dataDotNotation: false,
     * data: [
     *   { id: 1, 'name.first': 'Ted', 'user.address': '1234 Any Street' },
     * ],
     * columns={[
     *   { data: 'name.first' },
     *   { data: 'user.address' },
     * ]},
     * ```
     */
    dataDotNotation: true,

    /**
     * @description
     * When the [`data`](#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects)
     * (or is empty), the `dataSchema` option defines the structure of new rows.
     *
     * Using the `dataSchema` option, you can start out with an empty grid.
     *
     * You can set the `dataSchema` option to one of the following:
     * - An object
     * - A function
     *
     * Read more:
     * - [Binding to data: Array of objects with custom data schema](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects-with-custom-data-schema)
     * - [Binding to data: Function data source and schema](@/guides/getting-started/binding-to-data/binding-to-data.md#function-data-source-and-schema)
     * - [`data`](#data)
     *
     * @memberof Options#
     * @type {object|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // with `dataSchema`, you can start with an empty grid
     * data: null,
     * dataSchema: {id: null, name: {first: null, last: null}, address: null},
     * colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
     * columns: [
     *   {data: 'id'},
     *   {data: 'name.first'},
     *   {data: 'name.last'},
     *   {data: 'address'}
     * ],
     * startRows: 5,
     * minSpareRows: 1
     * ```
     */
    dataSchema: undefined,

    /**
     * Configures the date format for date cells using an
     * [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
     * options object.
     *
     * The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.
     *
     * ::: tip Source data format
     * Source data must be in ISO 8601 date format (`YYYY-MM-DD`). Otherwise operations such
     * as sorting and filtering can be unstable or unpredictable. The `dateFormat` object affects only how dates are
     * displayed; the underlying value should remain ISO.
     * :::
     *
     * **Style shortcuts:**
     *
     * | Property     | Possible values                                    | Description                                              |
     * | ------------ | -------------------------------------------------- | -------------------------------------------------------- |
     * | `dateStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Date formatting style (expands to weekday, day, month, year, era) |
     *
     * **Date-time component options:**
     *
     * | Property                 | Possible values                                                                 | Description                          |
     * | ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
     * | `weekday`                | `'long'`, `'short'`, `'narrow'`                                                 | Representation of the weekday        |
     * | `era`                    | `'long'`, `'short'`, `'narrow'`                                                 | Representation of the era            |
     * | `year`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the year           |
     * | `month`                  | `'numeric'`, `'2-digit'`, `'long'`, `'short'`, `'narrow'`                       | Representation of the month          |
     * | `day`                    | `'numeric'`, `'2-digit'`                                                        | Representation of the day            |
     * | `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am", "noon")       |
     * | `hour`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the hour           |
     * | `minute`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the minute         |
     * | `second`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the second         |
     * | `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits            |
     * | `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display                 |
     *
     * **Locale and other options:**
     *
     * | Property          | Possible values                                    | Description                    |
     * | ----------------- | -------------------------------------------------- | ------------------------------ |
     * | `localeMatcher`   | `'best fit'` (default), `'lookup'`                  | Locale matching algorithm      |
     * | `calendar`        | `'chinese'`, `'gregory'`, `'persian'`, etc.        | Calendar to use                |
     * | `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, etc.                 | Numbering system               |
     * | `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`) | Time zone for formatting       |
     * | `hour12`          | `true`, `false`                                    | Use 12-hour vs 24-hour time   |
     * | `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                 | Hour cycle                     |
     * | `formatMatcher`   | `'basic'`, `'best fit'` (default)                  | Format matching algorithm      |
     *
     * For complete reference, see [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).
     *
     * Read more:
     * - [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
     * - [`locale`](@/api/options.md#locale)
     *
     * @memberof Options#
     * @type {Intl.DateTimeFormatOptions}
     * @default { year: 'numeric', month: '2-digit', day: '2-digit' }
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'date',
     *     locale: 'en-US',
     *     dateFormat: {
     *       dateStyle: 'short'
     *     }
     *   }
     * ]
     * ```
     */
    dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },

    /**
     * Configures the time format for `intl-time` cells using an
     * [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
     * options object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.
     *
     * ::: tip Source data format
     * Source data must be in 24-hour time format (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`), matching
     * the HTML `input type="time"` value. Otherwise operations such as sorting and filtering can be unstable or unpredictable.
     * The `timeFormat` object affects only how times are displayed; the underlying value should remain in that format.
     * :::
     *
     * **Style shortcuts:**
     *
     * | Property     | Possible values                                    | Description                                              |
     * | ------------ | -------------------------------------------------- | -------------------------------------------------------- |
     * | `timeStyle`  | `'full'`, `'long'`, `'medium'`, `'short'`          | Time formatting style (expands to hour, minute, second, timeZoneName) |
     *
     * **Time component options:**
     *
     * | Property                 | Possible values                                                                 | Description                          |
     * | ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
     * | `hour`                   | `'numeric'`, `'2-digit'`                                                        | Representation of the hour           |
     * | `minute`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the minute         |
     * | `second`                 | `'numeric'`, `'2-digit'`                                                        | Representation of the second         |
     * | `fractionalSecondDigits` | `1`, `2`, `3`                                                                   | Fraction-of-second digits            |
     * | `dayPeriod`              | `'narrow'`, `'short'`, `'long'`                                                 | Day period (e.g. "am", "noon")       |
     * | `timeZoneName`           | `'long'`, `'short'`, `'shortOffset'`, `'longOffset'`, `'shortGeneric'`, `'longGeneric'` | Time zone display                 |
     *
     * **Locale and other options:**
     *
     * | Property          | Possible values                                    | Description                    |
     * | ----------------- | -------------------------------------------------- | ------------------------------ |
     * | `localeMatcher`   | `'best fit'` (default), `'lookup'`                  | Locale matching algorithm      |
     * | `timeZone`        | IANA time zone (e.g. `'UTC'`, `'America/New_York'`) | Time zone for formatting       |
     * | `hour12`          | `true`, `false`                                    | Use 12-hour vs 24-hour time   |
     * | `hourCycle`       | `'h11'`, `'h12'`, `'h23'`, `'h24'`                 | Hour cycle                     |
     * | `formatMatcher`   | `'basic'`, `'best fit'` (default)                  | Format matching algorithm      |
     *
     * For complete reference, see [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).
     *
     * Read more:
     * - [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)
     * - [`locale`](@/api/options.md#locale)
     *
     * @memberof Options#
     * @type {object}
     * @default { hour: '2-digit', minute: '2-digit' }
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'intl-time',
     *     locale: 'en-US',
     *     timeFormat: {
     *       timeStyle: 'medium'
     *     }
     *   }
     * ]
     * ```
     */
    timeFormat: { hour: '2-digit', minute: '2-digit' },

    /**
     * The `defaultDate` option configures the date pre-selected in the date picker editor
     * when opening an empty [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell for editing.
     *
     * The option accepts a string in ISO 8601 format (`YYYY-MM-DD`).
     *
     * ::: tip
     * `defaultDate` affects only the date picker's initial selection when the cell is empty.
     * It does not automatically populate empty cells with this date - the cell's value remains empty
     * until the user confirms a selection.
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
     * - [`dateFormat`](#dateFormat)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'date',
     *     defaultDate: '2015-02-02'
     *   }
     * ],
     * ```
     */
    defaultDate: undefined,

    /**
     * @description
     * The `disableVisualSelection` option configures how
     * [selection](@/guides/cell-features/selection/selection.md) is shown.
     *
     * You can set the `disableVisualSelection` option to one of the following:
     *
     * | Setting           | Description                                                                                         |
     * | ----------------- | --------------------------------------------------------------------------------------------------- |
     * | `false` (default) | - Show single-cell selection<br>- Show range selection<br>- Show header selection                   |
     * | `true`            | - Don't show single-cell selection<br>- Don't show range selection<br>- Don't show header selection |
     * | `'current'`       | - Don't show single-cell selection<br>- Show range selection<br>- Show header selection             |
     * | `'area'`          | - Show single-cell selection<br>- Don't show range selection<br>- Show header selection             |
     * | `'header'`        | - Show single-cell selection<br>- Show range selection<br>- Don't show header selection             |
     * | An array          | A combination of `'current'`, `'area'`, and/or `'header'`                                           |
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * When set to any non-`false` value, the second-click deselect behavior
     * (Ctrl/Cmd+click on an already-selected cell removing it from a multi-cell selection)
     * is also skipped. Without visible feedback, toggling layers off can cause unexpected
     * highlight jumps.
     *
     * Read more:
     * - [Selection](@/guides/cell-features/selection/selection.md)
     *
     * @memberof Options#
     * @type {boolean|string|string[]}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // don't show single-cell selection
     * // don't show range selection
     * // don't show header selection
     * disableVisualSelection: true,
     *
     * // don't show single-cell selection
     * // show range selection
     * // show header selection
     * disableVisualSelection: 'current',
     *
     * // don't show single-cell selection
     * // don't show range selection
     * // show header selection
     * disableVisualSelection: ['current', 'area'],
     * ```
     */
    disableVisualSelection: false,

    /**
     * @description
     * The `dialog` option configures the [`Dialog`](@/api/dialog.md) plugin.
     *
     * You can set the `dialog` option to one of the following:
     *
     * | Setting   | Description                                                                 |
     * | --------- | --------------------------------------------------------------------------- |
     * | `false`   | Disable the [`Dialog`](@/api/dialog.md) plugin                              |
     * | `true`    | Enable the [`Dialog`](@/api/dialog.md) plugin with default options          |
     *
     * ##### dialog: Additional options
     *
     * | Option                   | Possible settings                                                                                                               | Description                             |
     * | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------|
     * | `template`               | Object with the template configuration (default: `null`).                                                                       | The template of the dialog allows to use prebuild templates |
     * | `template.type`          | The type of the template ('confirm')                                                                                            | The type of the template                |
     * | `template.title`         | The title of the template                                                                                                       | The title of the template               |
     * | `template.description`   | The description of the template                                                                                                 | The description of the template         |
     * | `template.buttons`       | Array of objects with the buttons configuration (default: `[]`)                                                                 | The buttons of the template             |
     * | `template.buttons.text`  | The text of the button                                                                                                          | The text of the button                  |
     * | `template.buttons.type`  | The type of the button ('primary' | 'secondary')                                                                                | The type of the button                  |
     * | `template.buttons.callback` | The callback function to trigger when the button is clicked                                                                  | The callback function to trigger when the button is clicked |
     * | `content`                | A string, HTMLElement or DocumentFragment (default: `''`)                                                                       | The content of the dialog               |
     * | `customClassName`        | A string (default: `''`)                                                                                                        | The custom class name of the dialog     |
     * | `background`             | One of the options: `'solid'` or `'semi-transparent'` (default: `'solid'`)                                                      | The background of the dialog            |
     * | `contentBackground`      | Boolean (default: `false`)                                                                                                      | Whether to show the content background  |
     * | `animation`              | Boolean (default: `true`)                                                                                                       | Whether to show the animation           |
     * | `closable`               | Boolean (default: `false`)                                                                                                      | Whether to make the dialog closable     |
     * | `a11y`                   | Object with accessibility options (default: `{ role: 'dialog', ariaLabel: 'Dialog', ariaLabelledby: '', ariaDescribedby: '' }`) | Accessibility options for the dialog    |
     * | `a11y.role`              | The role of the dialog ('dialog' | 'alertdialog')                                                                               | The role of the dialog                  |
     * | `a11y.ariaLabel`         | The label of the dialog                                                                                                         | The label of the dialog                 |
     * | `a11y.ariaLabelledby`    | The ID of the element that labels the dialog                                                                                    | The ID of the element that labels the dialog |
     * | `a11y.ariaDescribedby`   | The ID of the element that describes the dialog                                                                                 | The ID of the element that describes the dialog |
     *
     * Read more:
     * - [Plugins: `Dialog`](@/api/dialog.md)
     *
     * @since 16.1.0
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category Dialog
     *
     * @example
     * ::: only-for javascript
     * ```js
     * // enable the Dialog plugin with default option
     * dialog: true,
     *
     * // enable the Dialog plugin with custom configuration
     * dialog: {
     *   content: 'Dialog content',
     *   customClassName: 'custom-dialog',
     *   background: 'semi-transparent',
     *   contentBackground: false,
     *   animation: false,
     *   closable: true,
     *   a11y: {
     *     role: 'dialog',
     *     ariaLabel: 'Dialog',
     *     ariaLabelledby: 'titleID',
     *     ariaDescribedby: 'descriptionID',
     *   }
     * }
     *
     * // enable the Dialog plugin using a template
     * dialog: {
     *   template: {
     *     type: 'confirm',
     *     title: 'Confirm',
     *     description: 'Do you want change the value?',
     *     buttons: [
     *       {
     *         text: 'Ok',
     *         type: 'primary',
     *         callback: () => {
     *           console.log('Ok');
     *         }
     *       },
     *     ],
     *   },
     * }
     * ```
     * :::
     *
     * ::: only-for react
     * ```jsx
     * // enable the Dialog plugin with default option
     * <HotTable
     *   dialog={true}
     * />
     *
     * // enable the Dialog plugin with custom configuration
     * <HotTable
     *   dialog={{
     *     content: 'Dialog content',
     *     customClassName: 'custom-dialog',
     *     background: 'semi-transparent',
     *     contentBackground: false,
     *     animation: false,
     *     closable: true,
     *     a11y: {
     *       role: 'dialog',
     *       ariaLabel: 'Dialog',
     *       ariaLabelledby: 'titleID',
     *       ariaDescribedby: 'descriptionID',
     *     }
     *   }
     *   }}
     * />
     *
     * // enable the Dialog plugin using a template
     * <HotTable
     *   dialog={{
     *     template: {
     *       type: 'confirm',
     *       title: 'Confirm',
     *       description: 'Do you want change the value?',
     *     }
     *   }}
     * />
     * ```
     * :::
     *
     * ::: only-for angular
     * ```ts
     * settings = {
     *   dialog: {
     *     content: 'Dialog content',
     *     customClassName: 'custom-dialog',
     *     background: 'semi-transparent',
     *     contentBackground: false,
     *     animation: false,
     *     closable: true,
     *     a11y: {
     *       role: 'dialog',
     *       ariaLabel: 'Dialog',
     *       ariaLabelledby: 'titleID',
     *       ariaDescribedby: 'descriptionID',
     *     }
     *   }
     * };
     *
     * // enable the Dialog plugin using a template
     * settings = {
     *   dialog: {
     *     template: {
     *       type: 'confirm',
     *       title: 'Confirm',
     *       description: 'Do you want change the value?',
     *     }
     *   }
     * };
     * ```
     *
     * ```html
     * <hot-table [settings]="settings" />
     * ```
     * :::
     *
     */
    dialog: false,

    /**
     * @description
     * The `dragToScroll` option configures the [`DragToScroll`](@/api/dragToScroll.md) plugin.
     *
     * You can set the `dragToScroll` option to one of the following:
     *
     * | Setting          | Description                                                                                                                                 |
     * | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | Enable with default auto-scroll settings                                                                                                    |
     * | `false`          | Disable the plugin entirely                                                                                                                 |
     * | Object           | Enable with custom auto-scroll settings (see below)                                                                                        |
     *
     * When passing an object, the following properties control the auto-scroll speed:
     *
     * ```js
     * dragToScroll: {
     *   interval: {
     *     min: 20,   // Fastest scroll interval in ms (reached at rampDistance)
     *     max: 500,  // Slowest scroll interval in ms (applied at the viewport edge)
     *   },
     *   rampDistance: 120,  // Pixels outside the edge over which speed ramps up
     * },
     * ```
     *
     * The viewport scrolls periodically while the mouse pointer stays outside the
     * viewport edge. Speed follows a logarithmic curve: slow at the edge, fast when
     * far outside. The active selection (regular drag-select or autofill drag)
     * extends to follow the scroll.
     *
     * Read more:
     * - [Plugins: `DragToScroll`](@/api/dragToScroll.md)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default true
     * @category DragToScroll
     *
     * @example
     * ```js
     * // Enable with default settings
     * dragToScroll: true,
     *
     * // Enable with custom scroll speed
     * dragToScroll: {
     *   interval: { min: 60, max: 300 },
     *   rampDistance: 60,
     * },
     *
     * // Disable
     * dragToScroll: false,
     * ```
     */
    dragToScroll: true,

    /**
     * The `dropdownMenu` option configures the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.
     *
     * You can set the `dropdownMenu` option to one of the following:
     *
     * | Setting   | Description                                                                                                                                                                                  |
     * | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin                                                                                                                                   |
     * | `true`    | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)    |
     * | An array  | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) |
     * | An object | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Apply a custom dropdown menu configuration                                                                                  |
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It is not possible to show or hide the dropdown menu icon for individual columns using this option.
     *
     * Read more:
     * - [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
     * - [Plugins: `DropdownMenu`](@/api/dropdownMenu.md)
     *
     * @memberof Options#
     * @type {boolean|object|string[]}
     * @default undefined
     * @category DropdownMenu
     *
     * @example
     * ```js
     * // enable the `DropdownMenu` plugin
     * // use the default context menu options
     * dropdownMenu: true,
     *
     * // enable the `DropdownMenu` plugin
     * // and modify individual context menu options
     * dropdownMenu: ['---------', 'undo', 'redo'],
     *
     * // enable the `DropdownMenu` plugin
     * // and apply a custom dropdown menu configuration
     * dropdownMenu: {
     *   items: {
     *     'option1': {
     *       name: 'Option 1'
     *     },
     *     'option2': {
     *       name: 'Option 2',
     *       submenu: {
     *         items: [
     *           {
     *             key: 'option2:suboption1',
     *             name: 'Suboption 1',
     *             callback(key, options) {
     *               ...
     *             }
     *           },
     *           ...
     *         ]
     *       }
     *     }
     *   }
     * },
     * ```
     */
    dropdownMenu: undefined,

    /**
     * The `editor` option sets a [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) for a cell.
     *
     * You can set the `editor` option to one of the following [cell editor aliases](@/guides/cell-functions/cell-editor/cell-editor.md):
     *
     * | Alias               | Cell editor function                                                       |
     * | ------------------- | -------------------------------------------------------------------------- |
     * | A custom alias      | Your [custom cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) function |
     * | `'autocomplete'`    | `AutocompleteEditor`                                                       |
     * | `'base'`            | `BaseEditor`                                                               |
     * | `'checkbox'`        | `CheckboxEditor`                                                           |
     * | `'date'`            | `DateEditor`                                                               |
     * | `'intl-date'`       | `IntlDateEditor`                                                           |
     * | `'dropdown'`        | `DropdownEditor`                                                           |
     * | `'handsontable'`    | `HandsontableEditor`                                                       |
     * | `'numeric'`         | `NumericEditor`                                                            |
     * | `'password'`        | `PasswordEditor`                                                           |
     * | `'select'`          | `SelectEditor`                                                             |
     * | `'text'`            | `TextEditor`                                                               |
     * | `'time'`            | `TimeEditor`                                                               |
     * | `'intl-time'`       | `IntlTimeEditor`                                                           |
     *
     * To disable editing cells through cell editors,
     * set the `editor` option to `false`.
     * You'll still be able to change cells' content through Handsontable's API
     * or through plugins (e.g. [`CopyPaste`](@/api/copyPaste.md)), though.
     *
     * To set the [`editor`](#editor), [`renderer`](#renderer), and [`validator`](#validator)
     * options all at once, use the [`type`](#type) option.
     *
     * Read more:
     * - [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
     * - [Cell type](@/guides/cell-types/cell-type/cell-type.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [`type`](#type)
     *
     * @memberof Options#
     * @type {string|Function|boolean}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // use the `numeric` editor for each cell of the entire grid
     * editor: 'numeric',
     *
     * // apply the `editor` option to individual columns
     * columns: [
     *   {
     *     // use the `autocomplete` editor for each cell of this column
     *     editor: 'autocomplete'
     *   },
     *   {
     *     // disable editing cells through cell editors for each cell of this column
     *     editor: false
     *   }
     * ]
     * ```
     */
    editor: undefined,

    /**
     * @description
     * The `emptyDataState` option configures the [`EmptyDataState`](@/api/emptyDataState.md) plugin.
     *
     * You can set the `emptyDataState` option to one of the following:
     *
     * | Setting   | Description                                                                        |
     * | --------- | ---------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                     |
     * | `true`    | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                      |
     * | An object | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin with custom settings |
     *
     * If you set the `emptyDataState` option to an object, you can configure the following settings:
     *
     * | Property  | Possible values                    | Description                                         |
     * | --------  | ---------------------------------- | --------------------------------------------------- |
     * | `message` | `string` \| `object` \| `function` | Message to display in the empty data state overlay. |
     *
     * If you set the `message` option to an object, it have following properties:
     *
     * | Property      | Possible values | Description                                             |
     * | ------------- | --------------- | ------------------------------------------------------- |
     * | `title`       | `string`        | Title to display in the empty data state overlay.       |
     * | `description` | `string`        | Description to display in the empty data state overlay. |
     * | `buttons`     | `array`         | Buttons to display in the empty data state overlay.     |
     * | `loading`     | `boolean`       | When `true`, shows a loading spinner (used for server fetch state). |
     *
     * If you set the `message` option to a function, the `source` argument can be `"unknown"`, `"filters"`, or `"loading"`.
     * With [[Options#dataProvider]], the `"loading"` branch follows DataProvider fetch hooks (`beforeDataProviderFetch`,
     * `afterDataProviderFetch`, and related hooks) using the same rules as server-backed loading in the DataProvider plugin.
     * Internal refetches (for example after column sort or CRUD) set `skipLoading` on [[Hooks#beforeDataProviderFetch]] so the
     * EmptyDataState plugin can omit the loading overlay for those requests.
     *
     * If you set the `buttons` option to an array, each item requires following properties:
     *
     * | Property   | Possible values          | Description                                                  |
     * | ---------- | ------------------------ | ------------------------------------------------------------ |
     * | `text`     | `string`                 | Text to display in the button.                        |
     * | `type`     | 'primary' \| 'secondary' | Type of the button.                                   |
     * | `callback` | `function`               | Callback function to call when the button is clicked. |
     *
     * Read more:
     * - [Plugins: `EmptyDataState`](@/api/emptyDataState.md)
     *
     * @since 16.2.0
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category EmptyDataState
     *
     * @example
     * ```js
     * // Enable empty data state plugin with default messages
     * emptyDataState: true,
     *
     * // Enable empty data state plugin with custom message
     * emptyDataState: {
     *   message: 'No data available',
     * },
     *
     * // Enable empty data state plugin with custom message and buttons for any source
     * emptyDataState: {
     *   message: {
     *     title: 'No data available',
     *     description: 'There’s nothing to display yet.',
     *     buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
     *   },
     * },
     *
     * // Enable empty data state plugin with custom message and buttons for specific source
     * emptyDataState: {
     *   message: (source) => {
     *     switch (source) {
     *       case "filters":
     *         return {
     *           title: 'No data available',
     *           description: 'There’s nothing to display yet.',
     *           buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
     *         };
     *       case "loading":
     *         return {
     *           title: 'Loading data',
     *           description: 'Please wait.',
     *         };
     *       default:
     *         return {
     *           title: 'No data available',
     *           description: 'There’s nothing to display yet.',
     *         };
     *     }
     *   },
     * },
     * ```
     */
    emptyDataState: false,

    /**
     * The `enterBeginsEditing` option configures the action of the <kbd>**Enter**</kbd> key.
     *
     * You can set the `enterBeginsEditing` option to one of the following:
     *
     * | Setting          | Description                                                                                                                                                                                               |
     * | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | - On pressing <kbd>**Enter**</kbd> once, enter the editing mode of the active cell<br>- On pressing <kbd>**Enter**</kbd> twice, move to another cell,<br>as configured by the [`enterMoves`](#enterMoves) setting |
     * | `false`          | - On pressing <kbd>**Enter**</kbd> once, move to another cell,<br>as configured by the [`enterMoves`](#enterMoves) setting                                                                                    |
     *
     * Read more:
     * - [`enterMoves`](#enterMoves)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // press Enter once to start editing
     * // press Enter twice to move to another cell
     * enterBeginsEditing: true,
     *
     * // press Enter once to move to another cell
     * enterBeginsEditing: false,
     * ```
     */
    enterBeginsEditing: true,

    /**
     * The `enterCommits` option configures whether the <kbd>**Enter**</kbd> key closes the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @since 17.0.0
     * @category Core
     * @example
     * ```js
     * columns: [{
     *   type: 'multiselect',
     *   // press Enter to close the `multiSelect` editor and Space to select an option
     *   enterCommits: true,
     * }, {
     *   type: 'multiselect',
     *   // press Enter to select an option
     *   enterCommits: false,
     * }],
     * ],
     * ```
     */
    enterCommits: true,

    /**
     * The `enterMoves` option configures the action of the <kbd>**Enter**</kbd> key.
     *
     * If the [`enterBeginsEditing`](#enterBeginsEditing) option is set to `true`,
     * the `enterMoves` setting applies to the **second** pressing of the <kbd>**Enter**</kbd> key.
     *
     * If the [`enterBeginsEditing`](#enterBeginsEditing) option is set to `false`,
     * the `enterMoves` setting applies to the **first** pressing of the <kbd>**Enter**</kbd> key.
     *
     * You can set the `enterMoves` option to an object with the following properties
     * (or to a function that returns such an object):
     *
     * | Property | Type   | Description                                                                                                                                              |
     * | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `col`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `col` columns left |
     * | `row`    | Number | - On pressing <kbd>**Enter**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, move selection `row` rows up          |
     *
     * Read more:
     * - [`enterBeginsEditing`](#enterBeginsEditing)
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {col: 0, row: 1}
     * @category Core
     *
     * @example
     * ```js
     * // on pressing Enter, move selection 1 column right and 1 row down
     * // on pressing Shift+Enter, move selection 1 column left and 1 row up
     * enterMoves: {col: 1, row: 1},
     *
     * // the same setting, as a function
     * // `event` is a DOM Event object received on pressing Enter
     * // you can use it to check whether the user pressed Enter or Shift+Enter
     * enterMoves(event) {
     *   return {col: 1, row: 1};
     * },
     * ```
     */
    enterMoves: { col: 0, row: 1 },

    /**
     * The `exportFile` option configures the [`ExportFile`](@/api/exportFile.md) plugin.
     *
     * You can set the `exportFile` option to one of the following:
     *
     * | Setting     | Description                                                                                |
     * | ----------- | ------------------------------------------------------------------------------------------ |
     * | `undefined` | Use the [`ExportFile`](@/api/exportFile.md) plugin with the default configuration          |
     * | An object   | Enable the [`ExportFile`](@/api/exportFile.md) plugin and modify the plugin options        |
     *
     * If you set the `exportFile` option to an object, you can configure the following options:
     *
     * | Option    | Type     | Default | Description                                                                         |
     * | --------- | -------- | ------- | ----------------------------------------------------------------------------------- |
     * | `engines` | `Object` | –       | A map of format keys to their engine constructors. Pass `{ xlsx: ExcelJS }` to enable XLSX export via [ExcelJS](https://github.com/exceljs/exceljs). |
     *
     * Read more:
     * - [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
     * - [Plugins: `ExportFile`](@/api/exportFile.md)
     *
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @since 17.1.0
     * @category ExportFile
     *
     * @example
     * ```js
     * import ExcelJS from 'exceljs';
     *
     * // enable XLSX export
     * exportFile: {
     *   engines: { xlsx: ExcelJS },
     * },
     * ```
     */
    exportFile: undefined,

    /**
     * The `fillHandle` option configures the [Autofill](@/api/autofill.md) plugin.
     *
     * You can set the `fillHandle` option to one the following:
     *
     * | Setting        | Description                                                                |
     * | -------------- | -------------------------------------------------------------------------- |
     * | `true`         | - Enable autofill in all directions<br>- Add the fill handle               |
     * | `false`        | Disable autofill                                                           |
     * | `'vertical'`   | - Enable vertical autofill<br>- Add the fill handle                        |
     * | `'horizontal'` | - Enable horizontal autofill<br>- Add the fill handle                      |
     * | An object      | - Enable autofill<br>- Add the fill handle<br>- Configure autofill options |
     *
     * If you set the `fillHandle` option to an object, you can configure the following autofill options:
     *
     * | Option          | Possible settings              | Description                                                                                               |
     * | --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
     * | `autoInsertRow` | `true` (default) \| `false`    | `true`: When you reach the grid's bottom, add new rows<br>`false`: When you reach the grid's bottom, stop |
     * | `direction`     | `'vertical'` \| `'horizontal'` | `'vertical'`: Enable vertical autofill<br>`'horizontal'`: Enable horizontal autofill                      |
     *
     * Read more:
     * - [AutoFill values](@/guides/cell-features/autofill-values/autofill-values.md)
     *
     * @memberof Options#
     * @type {boolean|string|object}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // enable autofill in all directions
     * // with `autoInsertRow` enabled
     * fillHandle: true,
     *
     * // enable vertical autofill
     * // with `autoInsertRow` enabled
     * fillHandle: 'vertical',
     *
     * // enable horizontal autofill
     * // with `autoInsertRow` enabled
     * fillHandle: 'horizontal',
     *
     * // enable autofill in all directions
     * // with `autoInsertRow` disabled
     * fillHandle: {
     *   autoInsertRow: false,
     * },
     *
     * // enable vertical autofill
     * // with `autoInsertRow` disabled
     * fillHandle: {
     *   autoInsertRow: false,
     *   direction: 'vertical'
     * },
     * ```
     */
    fillHandle: {
      autoInsertRow: false,
    },

    /**
     * The `filter` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
     * lists are updated by the end user's input.
     *
     * You can set the `filter` option to one of the following:
     *
     * | Setting          | Description                                                                                                           |
     * | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | When the end user types into the input area, only options matching the input are displayed                            |
     * | `false`          | When the end user types into the input area, all options are displayed<br>(options matching the input are put in bold |
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [`source`](#source)
     * - [`filteringCaseSensitive`](#filteringCaseSensitive)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: ['A', 'B', 'C'],
     *   // when the end user types in `A`, display only the A option
     *   // when the end user types in `B`, display only the B option
     *   // when the end user types in `C`, display only the C option
     *   filter: true
     * }],
     * ```
     */
    filter: true,

    /**
     * The `filteringCaseSensitive` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells'
     * search inputs are case-sensitive.
     *
     * You can set the `filteringCaseSensitive` option to one of the following:
     *
     * | Setting           | Description                                                                                        |
     * | ----------------- | -------------------------------------------------------------------------------------------------- |
     * | `false` (default) | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is not case-sensitive |
     * | `true`            | [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells' input is case-sensitive     |
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [`source`](#source)
     * - [`filter`](#filter)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'autocomplete',
     *     source: [ ... ],
     *     // match case while searching autocomplete options
     *     filteringCaseSensitive: true
     *   },
     *   {
     *     type: 'multiselect',
     *     source: [ ... ],
     *     // match case while searching multiSelect options
     *     filteringCaseSensitive: true
     *   }
     * ],
     * ```
     */
    filteringCaseSensitive: false,

    /**
     * The `filters` option configures the [`Filters`](@/api/filters.md) plugin.
     *
     * You can set the `filters` option to one of the following:
     *
     * | Setting   | Description                                                          |
     * | --------- | -------------------------------------------------------------------- |
     * | `false`   | Disable the [`Filters`](@/api/filters.md) plugin                     |
     * | `true`    | Enable the [`Filters`](@/api/filters.md) plugin                      |
     * | An object | Enable the [`Filters`](@/api/filters.md) plugin with custom settings |
     *
     * If you set the `filters` option to an object, you can configure the following settings:
     *
     * | Property                 | Possible values   | Description                            |
     * | ------------------------ | ----------------- | -------------------------------------- |
     * | `searchMode` | `'show'` \| `'apply'` | Enable filtering only visible elements |
     *
     * If filers is set to `true`, the `searchMode` option is set to `'show'` by default.
     *
     * Read more:
     * - [Column filter](@/guides/columns/column-filter/column-filter.md)
     * - [Plugins: `Filters`](@/api/filters.md)
     * - [`dropdownMenu`](#dropdownMenu)
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Filters
     *
     * @example
     * ```js
     * // enable the `Filters` plugin
     * filters: true,
     * ```
     */
    filters: undefined,

    /**
     * The `filterSelectedItems` option configures whether the selected items are filtered out of the dropdown, when using the search input of the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // filter out the selected items from the dropdown
     * filterSelectedItems: true,
     *
     * // keep the selected items in the dropdown
     * filterSelectedItems: false,
     */
    filterSelectedItems: true,

    /**
     * `fixedColumnsLeft` is a legacy option.
     *
     * If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), `fixedColumnsLeft` acts like the [`fixedColumnsStart`](#fixedColumnsStart) option.
     *
     * If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, using `fixedColumnsLeft` throws an error.
     *
     * Use [`fixedColumnsStart`](#fixedColumnsStart), which works in any layout direction.
     *
     * Read more:
     * - [`fixedColumnsStart`](#fixedcolumnsstart)
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze the first 3 columns from the left
     * fixedColumnsLeft: 3,
     * ```
     */
    fixedColumnsLeft: 0,

    /**
     * If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default), the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the left-hand edge of the grid.
     *
     * If your grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL, the `fixedColumnsStart` option sets the number of [frozen columns](@/guides/columns/column-freezing/column-freezing.md) at the right-hand edge of the grid.
     *
     * Read more:
     * - [Column freezing](@/guides/columns/column-freezing/column-freezing.md)
     * - [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
     * - [`fixedColumnsLeft`](#fixedcolumnsleft)
     * - [`layoutDirection`](#layoutDirection)
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // when `layoutDirection` is set to `inherit` (default)
     * // freeze the first 3 columns from the left or from the right
     * // depending on your HTML document's `dir` attribute
     * layoutDirection: 'inherit',
     * fixedColumnsStart: 3,
     *
     * // when `layoutDirection` is set to `rtl`
     * // freeze the first 3 columns from the right
     * // regardless of your HTML document's `dir` attribute
     * layoutDirection: 'rtl',
     * fixedColumnsStart: 3,
     *
     * // when `layoutDirection` is set to `ltr`
     * // freeze the first 3 columns from the left
     * // regardless of your HTML document's `dir` attribute
     * layoutDirection: 'ltr',
     * fixedColumnsStart: 3,
     * ```
     */
    fixedColumnsStart: 0,

    /**
     * The `fixedRowsBottom` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md)
     * at the bottom of the grid.
     *
     * ::: tip
     * For the bottom frozen rows area to appear with a scroll separator, you must also set the [`height`](#height) option
     * in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
     * no vertical scrollbar is created and the fixed bottom rows area is not displayed.
     * :::
     *
     * Read more:
     * - [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
     * - [`height`](#height)
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze the bottom 3 rows
     * fixedRowsBottom: 3,
     * ```
     */
    fixedRowsBottom: 0,

    /**
     * The `fixedRowsTop` option sets the number of [frozen rows](@/guides/rows/row-freezing/row-freezing.md) at the top of the grid.
     *
     * ::: tip
     * For the top frozen rows area to be visually separated from the scrollable body, you must also set the [`height`](#height) option
     * in Handsontable's configuration. If the grid expands to fill its parent container without a defined height,
     * no vertical scrollbar is created and the fixed top rows area is not displayed.
     * :::
     *
     * Read more:
     * - [Row freezing](@/guides/rows/row-freezing/row-freezing.md)
     * - [`height`](#height)
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze the top 3 rows
     * fixedRowsTop: 3,
     * ```
     */
    fixedRowsTop: 0,

    /**
     * The `formulas` option configures the [`Formulas`](@/api/formulas.md) plugin.
     *
     * The [`Formulas`](@/api/formulas.md) plugin uses the [HyperFormula](https://handsontable.github.io/hyperformula/) calculation engine.
     * To install [HyperFormula](https://handsontable.github.io/hyperformula/), read the following:
     * - [Formula calculation: Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods)
     *
     * You can set the `formulas` option to an object with the following properties:
     *
     * | Property    | Possible values                                                                                                                                                                                                        |
     * | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `engine`    | `HyperFormula` \|<br>A [HyperFormula](https://handsontable.github.io/hyperformula/) instance \|<br>A [HyperFormula configuration](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html) object |
     * | `sheetId`   | A number                                                                                                                                                                                                               |
     * | `sheetName` | A string                                                                                                                                                                                                               |
     *
     * Read more:
     * - [Plugins: `Formulas`](@/api/formulas.md)
     * - [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
     * - [HyperFormula documentation: Client-side installation](https://handsontable.github.io/hyperformula/guide/client-side-installation)
     * - [HyperFormula documentation: Configuration options](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html)
     *
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Formulas
     *
     * @example
     * ```js
     * // either add the `HyperFormula` class
     * formulas: {
     *   // set `engine` to `HyperFormula`
     *   engine: HyperFormula,
     *   sheetId: 1,
     *   sheetName: 'Sheet 1'
     * }
     *
     * // or, add a HyperFormula instance
     * // initialized with the `'internal-use-in-handsontable'` license key
     * const hyperformulaInstance = HyperFormula.buildEmpty({
     *   licenseKey: 'internal-use-in-handsontable',
     * });
     *
     * formulas: {
     *   // set `engine` to a HyperFormula instance
     *   engine: hyperformulaInstance,
     *   sheetId: 1,
     *   sheetName: 'Sheet 1'
     * }
     *
     * // or, add a HyperFormula configuration object
     * formulas: {
     *   // set `engine` to a HyperFormula configuration object
     *   engine: {
     *     hyperformula: HyperFormula // or `engine: hyperformulaInstance`
     *     leapYear1900: false,       // this option comes from HyperFormula
     *     // add more HyperFormula configuration options
     *   },
     *   sheetId: 1,
     *   sheetName: 'Sheet 1'
     * }
     *
     * // use the same HyperFormula instance in multiple Handsontable instances
     *
     * // a Handsontable instance `hot1`
     * formulas: {
     *   engine: HyperFormula,
     *   sheetId: 1,
     *   sheetName: 'Sheet 1'
     * }
     *
     * // a Handsontable instance `hot2`
     * formulas: {
     *   engine: hot1.getPlugin('formulas').engine,
     *   sheetId: 1,
     *   sheetName: 'Sheet 1'
     * }
     * ```
     */
    formulas: undefined,

    /**
     * The `fragmentSelection` option configures text selection settings.
     *
     * You can set the `fragmentSelection` option to one of the following:
     *
     * | Setting           | Description                                        |
     * | ----------------- | ------------------------------------------------- |
     * | `false` (default) | Disable text selection                            |
     * | `true`            | Enable text selection in multiple cells at a time |
     * | `'cell'`          | Enable text selection in one cell at a time       |
     *
     * @memberof Options#
     * @type {boolean|string}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable text selection in multiple cells at a time
     * fragmentSelection: true,
     *
     * // enable text selection in one cell a time
     * fragmentSelection: 'cell',
     * ```
     */
    fragmentSelection: false,

    /**
     * The `hashLength` option sets a fixed display length for the hash mask used by the
     * [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type.
     *
     * By default, the hash length equals the actual value length. Set `hashLength` to a positive
     * integer to always display that many hash symbols regardless of the real value length.
     *
     * @memberof Options#
     * @type {number}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'password',
     *     hashLength: 10,
     *   },
     * ],
     * ```
     */
    hashLength: undefined,

    /**
     * The `hashRevealDelay` option enables a brief character-reveal on each keystroke in the
     * [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type editor.
     *
     * When set to a positive number (milliseconds), each typed character stays visible for that
     * duration and is then replaced by the `hashSymbol`. This lets the user confirm what they
     * typed without permanently exposing the value. Requires `type: 'password'`.
     *
     * @since 17.2.0
     * @memberof Options#
     * @type {number}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'password',
     *     hashRevealDelay: 1000,
     *   },
     * ],
     * ```
     */
    hashRevealDelay: undefined,

    /**
     * The `hashSymbol` option sets the character used as the hash mask in the
     * [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type renderer.
     *
     * Defaults to `'*'`. You can use any character, HTML entity, or string.
     *
     * @memberof Options#
     * @type {string}
     * @default '*'
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'password',
     *     hashSymbol: '•',
     *   },
     * ],
     * ```
     */
    hashSymbol: '*',

    /**
     * The `headerClassName` option allows adding one or more class names to the column headers' inner `div` element.
     * It can be used to align the labels in the column headers to left, center or right by setting this option to
     * `htLeft`, `htCenter`, or `htRight` respectively.
     *
     * @since 14.5.0
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // Adding class names to all column headers
     * headerClassName: 'htRight my-class',
     *
     * columns: [
     *  {
     *    // Adding class names to the column header of a single column
     *    headerClassName: 'htRight my-class',
     *  }
     * ]
     * ```
     */
    headerClassName: undefined,

    /**
     * The `height` option configures the height of your grid.
     *
     * You can set the `height` option to one of the following:
     *
     * | Setting                                                                    | Example                    |
     * | -------------------------------------------------------------------------- | -------------------------- |
     * | A number of pixels                                                         | `height: 500`              |
     * | A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `height: '75vw'`           |
     * | `'auto'`                                                                   | `height: 'auto'`           |
     * | A function that returns a valid number or string                           | `height() { return 500; }` |
     *
     * ### How `'auto'` differs from leaving `height` unset
     *
     * When you set `height: 'auto'`, Handsontable writes `height: auto; overflow: clip;`
     * as inline styles on the root element. The grid then grows to match its content height.
     * No internal vertical scrollbar is created, so the page itself scrolls when the grid
     * exceeds the viewport.
     *
     * When you leave `height` unset, Handsontable does not touch the root element's inline
     * styles. Sizing is governed by your CSS, and the nearest ancestor with `overflow: auto`
     * or `overflow: hidden` becomes the scroll parent. If no such ancestor exists, the window
     * scrolls. See the [Grid size](@/guides/getting-started/grid-size/grid-size.md) guide for
     * details.
     *
     * ::: tip
     * With `height: 'auto'`, every row is laid out in the DOM at once. Row-level
     * virtualization is effectively disabled. Avoid `'auto'` for large datasets and set a
     * numeric `height` instead, so Handsontable can virtualize off-screen rows.
     * :::
     *
     * Read more:
     * - [Grid size](@/guides/getting-started/grid-size/grid-size.md)
     *
     * @memberof Options#
     * @type {number|'auto'|string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the grid's height to 500px
     * height: 500,
     *
     * // set the grid's height to 75vh
     * height: '75vh',
     *
     * // let the grid grow to fit all its rows (no internal vertical scroll)
     * height: 'auto',
     *
     * // set the grid's height to 500px, using a function
     * height() {
     *   return 500;
     * },
     * ```
     */
    height: undefined,

    /**
     * The `hiddenColumns` option configures the [`HiddenColumns`](@/api/hiddenColumns.md) plugin.
     *
     * You can set the `hiddenColumns` option to one of the following:
     *
     * | Setting   | Description                                                                                  |
     * | --------- | -------------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin                                 |
     * | `true`    | Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin with the default plugin options  |
     * | An object | - Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin<br>- Modify the plugin options |
     *
     * If you set the `hiddenColumns` to an object, you can set the following [`HiddenColumns`](@/api/hiddenColumns.md) plugin options:
     *
     * | Property           | Possible values     | Description                                                                                                                                             |
     * | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `columns`          | An array of indexes | An array of indexes of columns that are hidden at initialization                                                                                        |
     * | `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden columns into account<br>`false`: when copying or pasting data, don't take hidden columns into account |
     * | `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden columns<br>`false`: display UI markers                                                    |
     *
     * Read more:
     * - [Plugins: `HiddenColumns`](@/api/hiddenColumns.md)
     * - [Column hiding](@/guides/columns/column-hiding/column-hiding.md)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category HiddenColumns
     *
     * @example
     * ```js
     * // enable the `HiddenColumns` plugin
     * hiddenColumns: true,
     *
     * // enable `HiddenColumns` plugin, and modify the plugin options
     * hiddenColumns: {
     *   // set columns that are hidden by default
     *   columns: [5, 10, 15],
     *   // when copying or pasting data, take hidden columns into account
     *   copyPasteEnabled: true,
     *   // show where hidden columns are
     *   indicators: true
     * }
     * ```
     */
    hiddenColumns: undefined,

    /**
     * The `hiddenRows` option configures the [`HiddenRows`](@/api/hiddenRows.md) plugin.
     *
     * You can set the `hiddenRows` option to one of the following:
     *
     * | Setting   | Description                                                                            |
     * | --------- | -------------------------------------------------------------------------------------- |
     * | `false`   | Disable the [`HiddenRows`](@/api/hiddenRows.md) plugin                                 |
     * | `true`    | Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin with the default plugin options  |
     * | An object | - Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin<br>- Modify the plugin options |
     *
     * If you set the `hiddenRows` to an object, you can set the following [`HiddenRows`](@/api/hiddenRows.md) plugin options:
     *
     * | Property           | Possible values     | Description                                                                                                                                       |
     * | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `rows   `          | An array of indexes | An array of indexes of rows that are hidden at initialization                                                                                     |
     * | `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden rows into account<br>`false`: when copying or pasting data, don't take hidden rows into account |
     * | `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden rows<br>`false`: display UI markers                                                 |
     *
     * Read more:
     * - [Plugins: `HiddenRows`](@/api/hiddenRows.md)
     * - [Row hiding](@/guides/rows/row-hiding/row-hiding.md)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category HiddenRows
     *
     * @example
     * ```js
     * // enable the `HiddenRows` plugin
     * hiddenRows: true,
     *
     * // enable `HiddenRows` plugin, and modify the plugin options
     * hiddenRows: {
     *   // set rows that are hidden by default
     *   rows: [5, 10, 15],
     *   // when copying or pasting data, take hidden rows into account
     *   copyPasteEnabled: true,
     *   // show where hidden rows are
     *   indicators: true
     * }
     * ```
     */
    hiddenRows: undefined,

    /**
     * The `initialState` option configures the grid's initial state.
     * This object accepts any grid configuration option. In case of conflicts between
     * `initialState` and table settings, the table settings take precedence.
     * Note: The `initialState` option is ignored when passed to the
     * [`updateSettings()`](@/api/core.md#updatesettings) method.
     *
     * @since 16.1.0
     * @memberof Options#
     * @type {object | undefined}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * initialState: {
     *   // configure initial column order
     *   manualColumnMove: [1, 0],
     * },
     * ```
     */
    initialState: undefined,

    /**
     * The `invalidCellClassName` option lets you add a CSS class name to cells
     * that were marked as `invalid` by the [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md).
     *
     * Read more:
     * - [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default 'htInvalid'
     * @category Core
     *
     * @example
     * ```js
     * // add a `highlight-error` CSS class name
     * // to every `invalid` cell`
     * invalidCellClassName: 'highlight-error',
     * ```
     */
    invalidCellClassName: 'htInvalid',

    /**
     * The `imeFastEdit` option allows using the "fast edit" feature for the IME users. It's disabled by default
     * because of its incompatibility with some of the accessibility features.
     *
     * Enabling this option can make a negative impact on how some screen readers handle reading the table cells.
     *
     * @since 14.0.0
     * @memberof Options#
     * @type {boolean}
     * @category Core
     */
    imeFastEdit: false,

    /**
     * The `isEmptyCol` option lets you define your own custom method
     * for checking if a column at a given visual index is empty.
     *
     * The `isEmptyCol` setting overwrites the built-in [`isEmptyCol`](@/api/core.md#isEmptyCol) method.
     * The function receives a visual column index and must return a `boolean`.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * @memberof Options#
     * @type {Function}
     * @param {number} col Visual column index.
     * @returns {boolean}
     * @category Core
     *
     * @example
     * ```js
     * // overwrite the built-in `isEmptyCol` method
     * isEmptyCol(visualColumnIndex) {
     *    // your custom method
     *    ...
     * },
     * ```
     */
    isEmptyCol(this: HotInstance, col: number) {
      let row;
      let value;
      const hasExplicitSchema = !!this.getSettings().dataSchema;
      const schema = this.getSchema() as Record<string | number, unknown>;
      const prop = this.colToProp(col);
      const rowLen = this.countRows();

      for (row = 0; row < rowLen; row++) {
        value = this.getDataAtCell(row, col);

        if (isEmpty(value) === false) {
          if (typeof value === 'object') {
            if (isObjectEqual(schema[prop] as object | unknown[], value as object | unknown[]) === false) {
              return false;
            }

            continue;
          }

          if (hasExplicitSchema && schema[prop] === value) {
            continue;
          }

          return false;
        }
      }

      return true;
    },

    /**
     * The `isEmptyRow` option lets you define your own custom method
     * for checking if a row at a given visual index is empty.
     *
     * The `isEmptyRow` setting overwrites the built-in [`isEmptyRow`](@/api/core.md#isEmptyRow) method.
     * The function receives a visual row index and must return a `boolean`.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * @memberof Options#
     * @type {Function}
     * @param {number} row Visual row index.
     * @returns {boolean}
     * @category Core
     *
     * @example
     * ```js
     * // overwrite the built-in `isEmptyRow` method
     * isEmptyRow(visualRowIndex) {
     *    // your custom method
     *    ...
     * },
     * ```
     */
    isEmptyRow(this: HotInstance, row: number) {
      let col;
      let value;
      const hasExplicitSchema = !!this.getSettings().dataSchema;
      const schema = this.getSchema() as Record<string | number, unknown>;
      const colLen = this.countCols();

      for (col = 0; col < colLen; col++) {
        value = this.getDataAtCell(row, col);

        if (isEmpty(value) === false) {
          const prop = this.colToProp(col);

          if (typeof value === 'object') {
            if (isObjectEqual(schema[prop] as object | unknown[], value as object | unknown[]) === false) {
              return false;
            }

            continue;
          }

          if (hasExplicitSchema && schema[prop] === value) {
            continue;
          }

          return false;
        }
      }

      return true;
    },

    /**
     * @description
     * The `label` option configures [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cells` labels.
     *
     * You can set the `label` option to an object with the following properties:
     *
     * | Property    | Possible values                   | Description                                                                                                                                                                                                             |
     * | ----------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `position`  | `'after'` (default) \| `'before'` | `'after'`: place the label to the right of the checkbox<br>`'before'`: place the label to the left of the checkbox                                                                                                      |
     * | `value`     | A string \| A function            | The label's text                                                                                                                                                                                                        |
     * | `separated` | `false` (default) \| `true`       | `false`: don't separate the label from the checkbox<br>`true`: separate the label from the checkbox                                                                                                                     |
     * | `property`  | A string                          | - A [`data`](#data) object property name that's used as the label's text <br>- Works only when the [`data`](#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects) |
     *
     * Read more:
     * - [Checkbox cell type: Checkbox labels](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-labels)
     *
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   type: 'checkbox',
     *   // add 'My label:' after the checkbox
     *   label: { position: 'before', value: 'My label: ', separated: true }
     * }],
     * ```
     */
    label: undefined,

    /**
     * The `language` option configures Handsontable's [language](@/guides/internationalization/language/language.md) settings.
     *
     * This option controls the language used for all built-in UI strings, including context menu labels,
     * column sorting labels, validation messages, and other user-visible text. It does not affect the locale
     * used for number or date formatting - use the [`locale`](#locale) option for that.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * You can set the `language` option to one of the following:
     *
     * | Setting             | Description                 |
     * | ------------------- | --------------------------- |
     * | `'en-US'` (default) | English - United States     |
     * | `'ar-AR'`           | Arabic - Global<br><br>To properly render this language, set the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) to RTL. |
     * | `'cs-CZ'`           | Czech - Czech Republic      |
     * | `'de-CH'`           | German - Switzerland        |
     * | `'de-DE'`           | German - Germany            |
     * | `'es-MX'`           | Spanish - Mexico            |
     * | `'fa-IR'`           | Persian - Iran              |
     * | `'fr-FR'`           | French - France             |
     * | `'hr-HR'`           | Croatian - Croatia          |
     * | `'it-IT'`           | Italian - Italy             |
     * | `'ja-JP'`           | Japanese - Japan            |
     * | `'ko-KR'`           | Korean - Korea              |
     * | `'lv-LV'`           | Latvian - Latvia            |
     * | `'nb-NO'`           | Norwegian (Bokmål) - Norway |
     * | `'nl-NL'`           | Dutch - Netherlands         |
     * | `'pl-PL'`           | Polish - Poland             |
     * | `'pt-BR'`           | Portuguese - Brazil         |
     * | `'ru-RU'`           | Russian - Russia            |
     * | `'sr-SP'`           | Serbian (Latin) - Serbia    |
     * | `'zh-CN'`           | Chinese - China             |
     * | `'zh-TW'`           | Chinese - Taiwan            |
     *
     * Read more:
     * - [Language](@/guides/internationalization/language/language.md)
     * - [`locale`](#locale)
     * - [`layoutDirection`](#layoutdirection)
     *
     * @memberof Options#
     * @type {string}
     * @default 'en-US'
     * @category Core
     *
     * @example
     * ```js
     * // set Handsontable's language to Polish
     * language: 'pl-PL',
     * ```
     */
    language: 'en-US',

    /**
     * The `layoutDirection` option configures whether Handsontable renders from the left to the right, or from the right to the left.
     *
     * You can set the layout direction only at Handsontable's [initialization](@/guides/getting-started/installation/installation.md#initialize-handsontable). Any change of the `layoutDirection` option after the initialization (e.g. using the [`updateSettings()`](@/api/core.md#updatesettings) method) is ignored.
     *
     * You can set the `layoutDirection` option only [for the entire grid](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * You can't set it for individual columns, rows, or cells.
     *
     * You can set the `layoutDirection` option to one of the following strings:
     *
     * | Setting             | Description                                                                                                                                                                                  |
     * | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `inherit` (default) | Set Handsontable's layout direction automatically,<br>based on the value of your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute  |
     * | `rtl`               | Render Handsontable from the right to the left,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `ltr` |
     * | `ltr`               | Render Handsontable from the left to the right,<br>even when your HTML document's [`dir`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) attribute is set to `rtl` |
     *
     * Read more:
     * - [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
     * - [Language](@/guides/internationalization/language/language.md)
     * - [`language`](#language)
     * - [`locale`](#locale)
     * - [`fixedColumnsStart`](#fixedcolumnsstart)
     * - [`customBorders`](#customBorders)
     *
     * @memberof Options#
     * @type {string}
     * @default 'inherit'
     * @category Core
     *
     * @example
     * ```js
     * // inherit Handsontable's layout direction
     * // from the value of your HTML document's `dir` attribute
     * layoutDirection: 'inherit',
     *
     * // render Handsontable from the right to the left
     * // regardless of your HTML document's `dir`
     * layoutDirection: 'rtl',
     *
     * // render Handsontable from the left to the right
     * // regardless of your HTML document's `dir`
     * layoutDirection: 'ltr',
     * ```
     */
    layoutDirection: 'inherit',

    /**
     * The `layout` option configures the order of plugin UI elements within the user-orderable
     * wrapper slots rendered around the grid: `top` and `bottom`. Each slot takes an ordered array
     * of element keys (for example `'pagination'`). Keys you list are placed first in that order;
     * any remaining elements follow by their default weight. The grid and the overlays layer (the
     * modal layer, such as the dialog) are not orderable through this option. The license
     * notification is not orderable either; it always renders last in the `bottom` slot.
     *
     * @since 18.0.0
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // render pagination above a custom 'summary' element registered in the bottom slot
     * layout: {
     *   bottom: ['pagination', 'summary'],
     * },
     * ```
     */
    layout: undefined,

    /**
     * The `licenseKey` option sets your Handsontable license key.
     *
     * You can set the `licenseKey` option to one of the following:
     *
     * | Setting                                                                                                 | Description                                                                                       |
     * | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
     * | A string with your [commercial license key](@/guides/getting-started/license-key/license-key.md#commercial-license) | For [commercial use](@/guides/technical-specification/software-license/software-license.md#commercial-use)         |
     * | `'non-commercial-and-evaluation'`                                                                       | For [non-commercial use](@/guides/technical-specification/software-license/software-license.md#non-commercial-use) |
     *
     * Read more:
     * - [License key](@/guides/getting-started/license-key/license-key.md)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // for commercial use
     * licenseKey: 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx', // your commercial license key
     *
     * // for non-commercial use
     * licenseKey: 'non-commercial-and-evaluation',
     * ```
     */
    licenseKey: undefined,

    /**
     * The `locale` option configures Handsontable's [locale](@/guides/internationalization/locale/locale.md) settings.
     *
     * You can set the `locale` option to any valid and canonicalized Unicode BCP 47 locale tag,
     * both for the [entire grid](@/guides/internationalization/locale/locale.md#set-the-grid-s-locale),
     * and for [individual columns](@/guides/internationalization/locale/locale.md#set-a-column-s-locale).
     *
     * Read more:
     * - [Locale](@/guides/internationalization/locale/locale.md)
     * - [`language`](#language)
     * - [`layoutDirection`](#layoutdirection)
     *
     * @memberof Options#
     * @type {string}
     * @default 'en-US'
     * @category Core
     *
     * @example
     * ```js
     * // set the entire grid's locale to Polish
     * locale: 'pl-PL',
     *
     * // set individual columns' locales
     * columns: [
     *   {
     *     // set the first column's locale to Polish
     *     locale: 'pl-PL',
     *   },
     *   {
     *     // set the second column's locale to German
     *     locale: 'de-DE',
     *   },
     * ],
     * ```
     */
    locale: 'en-US',

    /**
     * @description
     * The `loading` option configures the [`Loading`](@/api/loading.md) plugin.
     *
     * Loading plugin, automatically loads [`Dialog`](@/api/dialog.md) plugin.
     *
     * You can set the `loading` option to one of the following:
     *
     * | Setting   | Description                                                                 |
     * | --------- | --------------------------------------------------------------------------- |
     * | `false`   | Disable the [`Loading`](@/api/loading.md) plugin                           |
     * | `true`    | Enable the [`Loading`](@/api/loading.md) plugin with default configuration |
     * | An object | - Enable the [`Loading`](@/api/loading.md) plugin<br>- Apply custom configuration |
     *
     * If you set the `loading` option to an object, you can configure the following loading options:
     *
     * | Option        | Possible settings | Description                                               |
     * | ------------- | ----------------- | --------------------------------------------------------- |
     * | `icon`        | A string          | Custom loading icon to display (default: `<svg />`)       |
     * | `title`       | A string          | Custom loading title to display (default: `'Loading...'`) |
     * | `description` | A string          | Custom loading description to display (default: `''`)     |
     *
     * Read more:
     * - [Plugins: `Loading`](@/api/loading.md)
     * @since 16.1.0
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category Loading
     *
     * @example
     * ```js
     * // enable the `Loading` plugin with default configuration
     * loading: true,
     *
     * // enable the `Loading` plugin with custom configuration
     * loading: {
     *   icon: 'A custom loading icon in SVG format',
     *   title: 'Custom loading title',
     *   description: 'Custom loading description',
     * }
     * ```
     */
    loading: false,

    /**
     * @description
     * The `notification` option configures the [`Notification`](@/api/notification.md) plugin.
     *
     * You can set the `notification` option to one of the following:
     *
     * | Setting   | Description                                                                 |
     * | --------- | --------------------------------------------------------------------------- |
     * | `false`   | Disable the [`Notification`](@/api/notification.md) plugin                |
     * | `true`    | Enable the plugin with default options                                      |
     * | An object | Enable the plugin and set `stackLimit` and `animation`                      |
     *
     * ##### notification: Additional options
     *
     * | Option        | Type      | Default | Description |
     * | ------------- | --------- | ------- | ----------- |
     * | `stackLimit`  | `number`  | `10`    | Maximum visible toasts per corner. Extra requests are queued. |
     * | `animation`   | `boolean` | `true`  | Fade and slide animation when toasts appear. |
     *
     * Read more:
     * - [Plugins: `Notification`](@/api/notification.md)
     *
     * @since 17.1.0
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category Notification
     *
     * @example
     * ```js
     * notification: true,
     * ```
     */
    notification: false,

    /**
     * The `manualColumnFreeze` option configures the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin.
     *
     * You can set the `manualColumnFreeze` option to one of the following:
     *
     * | Setting  | Description                                                            |
     * | -------- | ---------------------------------------------------------------------- |
     * | `true`   | Enable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin  |
     * | `false`  | Disable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin |
     *
     * Read more:
     * - [Column freezing](@/guides/columns/column-freezing/column-freezing.md#user-triggered-freeze)
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category ManualColumnFreeze
     *
     * @example
     * ```js
     * // enable the `ManualColumnFreeze` plugin
     * manualColumnFreeze: true,
     * ```
     */
    manualColumnFreeze: undefined,

    /**
     * The `manualColumnMove` option configures the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin.
     *
     * You can set the `manualColumnMove` option to one of the following:
     *
     * | Setting  | Description                                                                                                        |
     * | -------- | ------------------------------------------------------------------------------------------------------------------ |
     * | `true`   | Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                  |
     * | `false`  | Disable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                 |
     * | An array | - Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin<br>- Move individual columns at initialization |
     *
     * Read more:
     * - [Column moving](@/guides/columns/column-moving/column-moving.md)
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualColumnMove
     *
     * @example
     * ```js
     * // enable the `ManualColumnMove` plugin
     * manualColumnMove: true,
     *
     * // enable the `ManualColumnMove` plugin
     * // at initialization, move column 0 to 1
     * // at initialization, move column 1 to 4
     * // at initialization, move column 2 to 6
     * manualColumnMove: [1, 4, 6],
     * ```
     */
    manualColumnMove: undefined,

    /**
     * @description
     * The `manualColumnResize` option configures the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin.
     *
     * You can set the `manualColumnResize` option to one of the following:
     *
     * | Setting  | Description                                                                                                           |
     * | -------- | --------------------------------------------------------------------------------------------------------------------- |
     * | `true`   | Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                 |
     * | `false`  | Disable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                |
     * | An array | - Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin<br>- Set initial widths of individual columns |
     *
     * Read more:
     * - [Column width: Column stretching](@/guides/columns/column-width/column-width.md#column-stretching)
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualColumnResize
     *
     * @example
     * ```js
     * // enable the `manualColumnResize` plugin
     * manualColumnResize: true,
     *
     * // enable the `manualColumnResize` plugin
     * // set the initial width of column 0 to 40 pixels
     * // set the initial width of column 1 to 50 pixels
     * // set the initial width of column 2 to 60 pixels
     * manualColumnResize: [40, 50, 60],
     * ```
     */
    manualColumnResize: undefined,

    /**
     * @description
     * The `manualRowMove` option configures the [`ManualRowMove`](@/api/manualRowMove.md) plugin.
     *
     * You can set the `manualRowMove` option to one of the following:
     *
     * | Setting  | Description                                                                                               |
     * | -------- | --------------------------------------------------------------------------------------------------------- |
     * | `true`   | Enable the [`ManualRowMove`](@/api/manualRowMove.md) plugin                                               |
     * | `false`  | Disable the [`ManualRowMove`](@/api/manualRowMove.md) plugin                                              |
     * | An array | - Enable the [`ManualRowMove`](@/api/manualRowMove.md) plugin<br>- Move individual rows at initialization |
     *
     * Read more:
     * - [Row moving](@/guides/rows/row-moving/row-moving.md)
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualRowMove
     *
     * @example
     * ```js
     * // enable the `ManualRowMove` plugin
     * manualRowMove: true,
     *
     * // enable the `ManualRowMove` plugin
     * // at initialization, move row 1 to 0
     * // at initialization, move row 4 to 1
     * // at initialization, move row 6 to 2
     * manualRowMove: [1, 4, 6],
     * ```
     */
    manualRowMove: undefined,

    /**
     * @description
     * The `manualRowResize` option configures the [`ManualRowResize`](@/api/manualRowResize.md) plugin.
     *
     * You can set the `manualRowResize` option to one of the following:
     *
     * | Setting  | Description                                                                                                   |
     * | -------- | ------------------------------------------------------------------------------------------------------------- |
     * | `true`   | Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                               |
     * | `false`  | Disable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                              |
     * | An array | - Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin<br>- Set initial heights of individual rows |
     *
     * Read more:
     * - [Row height: Adjust the row height manually](@/guides/rows/row-height/row-height.md#adjust-the-row-height-manually)
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualRowResize
     *
     * @example
     * ```js
     * // enable the `ManualRowResize` plugin
     * manualRowResize: true,
     *
     * // enable the `ManualRowResize` plugin
     * // set the initial height of row 0 to 40 pixels
     * // set the initial height of row 1 to 50 pixels
     * // set the initial height of row 2 to 60 pixels
     * manualRowResize: [40, 50, 60],
     * ```
     */
    manualRowResize: undefined,

    /**
     * The `maxCols` option sets a maximum number of columns.
     *
     * The `maxCols` option is used:
     * - At initialization: if the `maxCols` value is lower than the initial number of columns,
     * Handsontable trims columns from the right.
     * - At runtime: for example, when inserting columns.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // set the maximum number of columns to 300
     * maxCols: 300,
     * ```
     */
    maxCols: Infinity,

    /**
     * The `maxRows` option sets a maximum number of rows.
     *
     * The `maxRows` option is used:
     * - At initialization: if the `maxRows` value is lower than the initial number of rows,
     * Handsontable trims rows from the bottom.
     * - At runtime: for example, when inserting rows.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // set the maximum number of rows to 300
     * maxRows: 300,
     * ```
     */
    maxRows: Infinity,

    /**
     * The `maxSelections` option sets a maximum number of selections for the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.
     *
     * @since 17.0.0
     * @memberof Options#
     * @type {number}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   // set the `type` of each cell in this column to `multiSelect`
     *   type: 'multiselect',
     *   // set the maximum number of selections to 3
     *   maxSelections: 3,
     * }],
     * ```
     */
    maxSelections: undefined,

    /**
     * @description
     * The `mergeCells` option configures the [`MergeCells`](@/api/mergeCells.md) plugin.
     *
     * You can set the `mergeCells` option to one of the following:
     *
     * | Setting               | Description                                                                                         |
     * | --------------------- | --------------------------------------------------------------------------------------------------- |
     * | `true`                | Enable the [`MergeCells`](@/api/mergeCells.md) plugin                                               |
     * | `false`               | Disable the [`MergeCells`](@/api/mergeCells.md) plugin                                              |
     * | An array of objects   | - Enable the [`MergeCells`](@/api/mergeCells.md) plugin<br>- Merge specific cells at initialization |
     * | { virtualized: true } | Enable the [`MergeCells`](@/api/mergeCells.md) plugin with enabled virtualization mode              |
     *
     *
     * To merge specific cells at Handsontable's initialization,
     * set the `mergeCells` option to an array of objects, with the following properties:
     *
     * | Property  | Description                                                |
     * | --------- | ---------------------------------------------------------- |
     * | `row`     | The row index of the merged section's beginning            |
     * | `col`     | The column index of the merged section's beginning         |
     * | `rowspan` | The width (as a number of rows) of the merged section      |
     * | `colspan` | The height (as a number of columns ) of the merged section |
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     * It has no effect when set in the [`columns`](#columns), [`cells`](#cells), or [`cell`](#cell) options.
     *
     * Read more:
     * - [Merge cells](@/guides/cell-features/merge-cells/merge-cells.md)
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category MergeCells
     *
     * @example
     * ```js
     * // enable the `MergeCells` plugin
     * mergeCells: true,
     *
     * // enable the `MergeCells` plugin
     * // and merge specific cells at initialization
     * mergeCells: [
     *   // merge cells from cell (1,1) to cell (3,3)
     *   {row: 1, col: 1, rowspan: 3, colspan: 3},
     *   // merge cells from cell (3,4) to cell (2,2)
     *   {row: 3, col: 4, rowspan: 2, colspan: 2},
     *   // merge cells from cell (5,6) to cell (3,3)
     *   {row: 5, col: 6, rowspan: 3, colspan: 3}
     * ],
     *
     * // enable the `MergeCells` plugin with enabled virtualization mode
     * // and merge specific cells at initialization
     * mergeCells: {
     *   virtualized: true,
     *   cells: [
     *     // merge cells from cell (1,1) to cell (3,3)
     *     {row: 1, col: 1, rowspan: 3, colspan: 3},
     *     // merge cells from cell (3,4) to cell (2,2)
     *     {row: 3, col: 4, rowspan: 2, colspan: 2},
     *     // merge cells from cell (5,6) to cell (3,3)
     *     {row: 5, col: 6, rowspan: 3, colspan: 3}
     *   ],
     * },
     * ```
     */
    mergeCells: false,

    /**
     * The `minCols` option sets a minimum number of columns.
     *
     * The `minCols` option is used:
     * - At initialization: if the `minCols` value is higher than the initial number of columns,
     * Handsontable adds empty columns to the right.
     * - At runtime: for example, when removing columns.
     *
     * The `minCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
     * When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
     * you can only have as many columns as defined in:
     * - The first data row
     * - The [`dataSchema`](#dataSchema) option
     * - The [`columns`](#columns) option
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // set the minimum number of columns to 10
     * minCols: 10,
     * ```
     */
    minCols: 0,

    /**
     * Alias for the [`rowHeights`](#rowHeights) option.
     *
     * See the [`rowHeights`](#rowHeights) option description for more information.
     *
     * @since 16.2.0
     * @memberof Options#
     * @type {number|number[]|string|string[]|Array<undefined>|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set every row's minimum height to 100px
     * minRowHeights: 100,
     *
     * // set every row's minimum height to 100px
     * minRowHeights: '100px',
     *
     * // set the first (by visual index) row's minimum height to 100
     * // set the second (by visual index) row's minimum height to 120
     * // set any other row's minimum height to the default height value
     * minRowHeights: [100, 120],
     *
     * // set each row's minimum height individually, using a function
     * minRowHeights(visualRowIndex) {
     *   return visualRowIndex * 10;
     * },
     * ```
     */
    minRowHeights: undefined,

    /**
     * The `minRows` option sets a minimum number of rows.
     *
     * The `minRows` option is used:
     * - At initialization: if the `minRows` value is higher than the initial number of rows,
     * Handsontable adds empty rows at the bottom.
     * - At runtime: for example, when removing rows.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // set the minimum number of rows to 10
     * minRows: 10,
     * ```
     */
    minRows: 0,

    /**
     * The `minSpareCols` option sets a minimum number of empty columns
     * at the grid's right-hand end.
     *
     * If there already are other empty columns at the grid's right-hand end,
     * they are counted into the `minSpareCols` value.
     *
     * The total number of columns can't exceed the [`maxCols`](#maxCols) value.
     *
     * The `minSpareCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays).
     * When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects),
     * you can only have as many columns as defined in:
     * - The first data row
     * - The [`dataSchema`](#dataSchema) option
     * - The [`columns`](#columns) option
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // at Handsontable's initialization, add at least 3 empty columns on the right
     * minSpareCols: 3,
     * ```
     */
    minSpareCols: 0,

    /**
     * The `minSpareRows` option sets a minimum number of empty rows
     * at the bottom of the grid.
     *
     * If there already are other empty rows at the bottom,
     * they are counted into the `minSpareRows` value.
     *
     * The total number of rows can't exceed the [`maxRows`](#maxRows) value.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // at Handsontable's initialization, add at least 3 empty rows at the bottom
     * minSpareRows: 3,
     * ```
     */
    minSpareRows: 0,

    /**
     * @description
     * The `multiColumnSorting` option configures the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin.
     *
     * You can set the `multiColumnSorting` option to one of the following:
     *
     * | Setting    | Description                                                                                                                                                |
     * | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true`     | Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin with the default configuration                                                       |
     * | `false`    | Disable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin                                                                                     |
     * | An object  | - Enable the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin<br>- Modify the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options |
     *
     * If you set the `multiColumnSorting` option to an object,
     * you can set the following [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin options:
     *
     * | Option                   | Possible settings                                                                                                                                |
     * | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `indicator`              | `true`: Display the arrow icon in the column header, to indicate a sortable column<br>`false`: Don't display the arrow icon in the column header |
     * | `headerAction`           | `true`: Enable clicking on the column header to sort the column<br>`false`: Disable clicking on the column header to sort the column             |
     * | `sortEmptyCells`         | `true`: Sort empty cells as well<br>`false`: Place empty cells at the end                                                                        |
     * | `compareFunctionFactory` | A [custom compare function](@/guides/rows/rows-sorting/rows-sorting.md#add-a-custom-comparator)                                                               |
     *
     * If you set the `multiColumnSorting` option to an object,
     * you can also sort individual columns at Handsontable's initialization.
     * In the `multiColumnSorting` object, add an object named `initialConfig`,
     * with the following properties:
     *
     * | Option      | Possible settings   | Description                                                      |
     * | ----------- | ------------------- | ---------------------------------------------------------------- |
     * | `column`    | A number            | The index of the column that you want to sort at initialization  |
     * | `sortOrder` | `'asc'` \| `'desc'` | The sorting order:<br>`'asc'`: ascending<br>`'desc'`: descending |
     *
     * Read more:
     * - [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
     * - [`columnSorting`](#columnSorting)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category MultiColumnSorting
     *
     * @example
     * ```js
     * // enable the `MultiColumnSorting` plugin
     * multiColumnSorting: true
     *
     * // enable the `MultiColumnSorting` plugin with custom configuration
     * multiColumnSorting: {
     *   // sort empty cells as well
     *   sortEmptyCells: true,
     *   // display the arrow icon in the column header
     *   indicator: true,
     *   // disable clicking on the column header to sort the column
     *   headerAction: false,
     *   // add a custom compare function
     *   compareFunctionFactory(sortOrder, columnMeta) {
     *     return function(value, nextValue) {
     *       // some value comparisons which will return -1, 0 or 1...
     *     }
     *   }
     * }
     *
     * // enable the `MultiColumnSorting` plugin with a multi-column initial sort order:
     * // sort column 1 ascending first, then column 2 descending
     * multiColumnSorting: {
     *   initialConfig: [
     *     { column: 1, sortOrder: 'asc' },
     *     { column: 2, sortOrder: 'desc' }
     *   ]
     * }
     * ```
     */
    multiColumnSorting: undefined,

    /**
     * When set to `true`, the `navigableHeaders` option lets you navigate [row headers](@/guides/rows/row-header/row-header.md) and [column headers](@/guides/columns/column-header/column-header.md), using the arrow keys or the <kbd>**Tab**</kbd> key (if the [`tabNavigation`](#tabNavigation) option is set to `true`).
     *
     * @since 14.0.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // you can navigate row and column headers with the keyboard
     * navigableHeaders: true,
     *
     * // default behavior: you can't navigate row and column headers with the keyboard
     * navigableHeaders: false,
     * ```
     */
    navigableHeaders: false,

    /**
     * When set to `false`, the `tabNavigation` option changes the behavior of the
     * <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts. The Handsontable
     * no more captures that shortcuts to make the grid navigation available (`tabNavigation: true`)
     * but returns control to the browser so the native page navigation is possible.
     *
     * @since 14.0.0
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // you can't navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
     * tabNavigation: false,
     *
     * // default behavior: you can navigate row and column headers using <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keyboard shortcuts
     * tabNavigation: true,
     * ```
     */
    tabNavigation: true,

    /**
     * @description
     * The `nestedHeaders` option configures the [`NestedHeaders`](@/api/nestedHeaders.md) plugin.
     *
     * You can set the `nestedHeaders` option to one of the following:
     *
     * | Setting           | Description                                                                                                                           |
     * | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false` (default) | Disable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin                                                                          |
     * | `true`            | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Don't configure any nested headers                                 |
     * | Array of arrays   | - Enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin<br>- Configure headers that are nested on Handsontable's initialization |
     *
     * If you set the `nestedHeaders` option to an array of arrays, each array configures one row of
     * nested headers (top row first). Within a row, headers are listed left to right.
     *
     * Each array element configures one header, and can be one of the following:
     *
     * | Array element | Description                                               |
     * | ------------- | --------------------------------------------------------- |
     * | A string      | The header's label                                        |
     * | An object     | A header configuration object (see the properties below) |
     *
     * A header configuration object accepts the following properties:
     *
     * | Property          | Type      | Description                                                                                                                                                                                                                                                                                          |
     * | ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `label`           | `string`  | The header's label.                                                                                                                                                                                                                                                                                  |
     * | `colspan`         | `number`  | The number of data columns the header spans (an integer greater than `1`). Groups the columns it covers.                                                                                                                                                                                             |
     * | `rowspan`         | `number`  | The number of header rows the header spans (an integer greater than `1`).                                                                                                                                                                                                                            |
     * | `headerClassName` | `string`  | One or more space-separated CSS class names added to the header element (for example, `'htRight'`).                                                                                                                                                                                                  |
     * | `visibleWhen`     | `string`  | For a header inside a collapsible group, sets in which collapse state the header (and its columns) stays visible: `'collapsed'` (visible only while the group is collapsed), `'expanded'` (visible only while the group is expanded), or `'always'` (visible in both states). When omitted, a header in such a group defaults to `'expanded'` - it is hidden when the group collapses. At least one column of a group always stays visible. |
     * | `splittable`      | `boolean` | Controls what a group does when a column move (with the [`ManualColumnMove`](#manualcolumnmove) plugin) makes its columns non-adjacent. When `false` (default), the group stays one banner and adopts a column moved into its span as a child. When `true`, the group keeps its identity and renders as several same-label banners (it splits). Meaningful only on a header that spans columns. |
     *
     * ::: tip
     * A header group is made collapsible through the [`collapsibleColumns`](#collapsibleColumns) option, not through
     * `nestedHeaders`. Once a group is collapsible, mark the column(s) you want to keep visible when it collapses
     * with `visibleWhen: 'always'` (or `'collapsed'`); the remaining columns are hidden on collapse by default.
     * :::
     *
     * ::: tip
     * When `nestedHeaders` is configured, the `label` defined in the [`columns`](#columns) option for the same
     * column is replaced by the `label` from `nestedHeaders`. The `nestedHeaders` label takes precedence.
     * :::
     *
     * Read more:
     * - [Plugins: `NestedHeaders`](@/api/nestedHeaders.md)
     * - [Column groups: Nested headers](@/guides/columns/column-groups/column-groups.md#nested-headers)
     * - [Column groups: Choose which columns stay visible when collapsed](@/guides/columns/column-groups/column-groups.md#choose-which-columns-stay-visible-when-collapsed)
     *
     * @memberof Options#
     * @type {boolean|Array[]}
     * @default undefined
     * @category NestedHeaders
     *
     * @example
     * ```js
     * // group headers with `label` and `colspan`
     * nestedHeaders: [
     *   ['A', {label: 'B', colspan: 8}, 'C'],
     *   ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
     *   ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
     * ],
     *
     * // choose which columns stay visible when a collapsible group is collapsed:
     * // unmarked headers (Jan, Feb, Mar) are hidden on collapse; `Total` appears only when collapsed
     * nestedHeaders: [
     *   ['Region', {label: 'Q1 2025', colspan: 4}],
     *   ['Region', 'Jan', 'Feb', 'Mar', {label: 'Total', visibleWhen: 'collapsed'}]
     * ],
     * collapsibleColumns: true,
     * ```
     */
    nestedHeaders: undefined,

    /**
     * @description
     * The `nestedRows` option configures the [`NestedRows`](@/api/nestedRows.md) plugin.
     *
     * You can set the `nestedRows` option to one of the following:
     *
     * | Setting           | Description                                            |
     * | ----------------- | ------------------------------------------------------ |
     * | `false` (default) | Disable the [`NestedRows`](@/api/nestedRows.md) plugin |
     * | `true`            | Enable the [`NestedRows`](@/api/nestedRows.md) plugin  |
     *
     * Read more:
     * - [Plugins: `NestedRows`](@/guides/rows/row-parent-child/row-parent-child.md)
     *
     * @example
     * ```js
     * // enable the `NestedRows` plugin
     * nestedRows: true,
     * ```
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category NestedRows
     */
    nestedRows: undefined,

    /**
     * The `noWordWrapClassName` option lets you add a CSS class name
     * to each cell that has the [`wordWrap`](#wordWrap) option set to `false`.
     *
     * Read more:
     * - [`wordWrap`](#wordWrap)
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default 'htNoWrap'
     * @category Core
     *
     * @example
     * ```js
     * // add an `is-noWrapCell` CSS class name
     * // to each cell that doesn't wrap content
     * noWordWrapClassName: 'is-noWrapCell',
     * ```
     */
    noWordWrapClassName: 'htNoWrap',

    /**
     * Configures the number format for [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
     * cells, including currency, units, precision, and other display options.
     *
     * Since v17.0.0, this option accepts all properties of the
     * [`Intl.NumberFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
     * object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.
     *
     * **Style options:**
     *
     * | Property          | Possible values                                           | Description                                                    |
     * | ----------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
     * | `style`           | `'decimal'` (default), `'currency'`, `'percent'`, `'unit'`| The formatting style to use                                    |
     * | `currency`        | ISO 4217 currency codes (e.g., `'USD'`, `'EUR'`, `'PLN'`) | Required when `style` is `'currency'`                          |
     * | `currencyDisplay` | `'symbol'` (default), `'narrowSymbol'`, `'code'`, `'name'`| How to display the currency                                    |
     * | `currencySign`    | `'standard'` (default), `'accounting'`                    | Use parentheses for negative values in accounting format       |
     * | `unit`            | Unit identifiers (e.g., `'kilometer'`, `'liter'`)         | Required when `style` is `'unit'`                              |
     * | `unitDisplay`     | `'short'` (default), `'narrow'`, `'long'`                 | How to display the unit                                        |
     *
     * **Notation options:**
     *
     * | Property          | Possible values                                               | Description                                              |
     * | ----------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
     * | `notation`        | `'standard'` (default), `'scientific'`, `'engineering'`, `'compact'` | The formatting notation                           |
     * | `compactDisplay`  | `'short'` (default), `'long'`                                 | Display style for compact notation (e.g., `1.5M` vs `1.5 million`) |
     *
     * **Sign and grouping options:**
     *
     * | Property          | Possible values                                                     | Description                                        |
     * | ----------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
     * | `signDisplay`     | `'auto'` (default), `'never'`, `'always'`, `'exceptZero'`, `'negative'` | When to display the sign                       |
     * | `useGrouping`     | `true`, `false` (default), `'always'`, `'auto'`, `'min2'`           | Whether to use grouping separators (e.g., `1,000`) |
     *
     * **Digit options:**
     *
     * | Property                  | Possible values | Description                                                   |
     * | ------------------------- | --------------- | ------------------------------------------------------------- |
     * | `minimumIntegerDigits`    | `1` to `21`     | Minimum number of integer digits (pads with zeros)            |
     * | `minimumFractionDigits`   | `0` to `100`    | Minimum number of fraction digits                             |
     * | `maximumFractionDigits`   | `0` to `100`    | Maximum number of fraction digits                             |
     * | `minimumSignificantDigits`| `1` to `21`     | Minimum number of significant digits                          |
     * | `maximumSignificantDigits`| `1` to `21`     | Maximum number of significant digits                          |
     *
     * **Rounding options:**
     *
     * | Property              | Possible values                                                                                     | Description                          |
     * | --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
     * | `roundingMode`        | `'halfExpand'` (default), `'ceil'`, `'floor'`, `'expand'`, `'trunc'`, `'halfCeil'`, `'halfFloor'`, `'halfTrunc'`, `'halfEven'` | Rounding algorithm |
     * | `roundingPriority`    | `'auto'` (default), `'morePrecision'`, `'lessPrecision'`                                            | Priority between fraction and significant digits |
     * | `roundingIncrement`   | `1`, `2`, `5`, `10`, `20`, `25`, `50`, `100`, `200`, `250`, `500`, `1000`, `2000`, `2500`, `5000`    | Increment for rounding (e.g., nickel rounding) |
     * | `trailingZeroDisplay` | `'auto'` (default), `'stripIfInteger'`                                                              | Whether to strip trailing zeros for integers |
     *
     * **Locale options:**
     *
     * | Property          | Possible values                                           | Description                                        |
     * | ----------------- | --------------------------------------------------------- | -------------------------------------------------- |
     * | `localeMatcher`   | `'best fit'` (default), `'lookup'`                        | Locale matching algorithm                          |
     * | `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, `'deva'`, `'thai'`, etc.    | Numbering system to use                            |
     *
     * For complete reference, see [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options).
     *
     * This option affects only the displayed output in the cell renderer.
     * It has no effect on the numeric cell editor. In the source data, numeric values
     * are stored as JavaScript numbers.
     *
     * Read more:
     * - [`locale`](@/api/options.md#locale)
     * - [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
     * - [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
     * - [Third-party licenses](@/guides/technical-specification/third-party-licenses/third-party-licenses.md)
     *
     * @memberof Options#
     * @since 0.35.0
     * @type {object}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'numeric',
     *     locale: 'en-US',
     *     numericFormat: {
     *       style: 'currency',
     *       currency: 'USD',
     *     }
     *   }
     * ],
     * ```
     */
    numericFormat: undefined,

    /**
     * If the `observeDOMVisibility` option is set to `true`,
     * Handsontable rerenders every time it detects that the grid was made visible in the DOM.
     *
     * Handsontable uses a `MutationObserver` to watch for CSS changes (such as `display: none` being removed)
     * on the container element and its ancestors. When visibility is restored after being hidden,
     * Handsontable automatically triggers a rerender to ensure correct layout and dimensions.
     * Set this option to `false` if you want to control rendering manually (e.g. by calling `render()` yourself).
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // don't rerender the grid on visibility changes
     * observeDOMVisibility: false,
     * ```
     */
    observeDOMVisibility: true,

    /**
     * The `outsideClickDeselects` option determines what happens to the current [selection](@/guides/cell-features/selection/selection.md)
     * when you click outside of the grid.
     *
     * You can set the `outsideClickDeselects` option to one of the following:
     *
     * | Setting          | Description                                                                                              |
     * | ---------------- | -------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | On a mouse click outside of the grid, clear the current [selection](@/guides/cell-features/selection/selection.md) |
     * | `false`          | On a mouse click outside of the grid, keep the current [selection](@/guides/cell-features/selection/selection.md)  |
     * | A function       | A function that takes the click event target and returns a boolean                                       |
     *
     * @memberof Options#
     * @type {boolean|Function}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // on a mouse click outside of the grid, clear the current selection
     * outsideClickDeselects: true,
     *
     * // on a mouse click outside of the grid, keep the current selection
     * outsideClickDeselects: false,
     *
     * // take the click event target and return `false`
     * outsideClickDeselects(event) {
     *   return false;
     * }
     *
     * // take the click event target and return `true`
     * outsideClickDeselects(event) {
     *   return false;
     * }
     * ```
     */
    outsideClickDeselects: true,

    /**
     * @description
     * The `pagination` option configures the [`Pagination`](@/api/pagination.md) plugin.
     *
     * You can set the `pagination` option to one of the following:
     *
     * | Setting                          | Description                                                                                   |
     * | -------------------------------- | --------------------------------------------------------------------------------------------- |
     * | `false`                          | Disable the [`Pagination`](@/api/pagination.md) plugin                                            |
     * | `true`                           | Enable the [`Pagination`](@/api/pagination.md) plugin                                             |
     *
     * ##### pagination: Additional options
     *
     * If you set the `pagination` option to an object, you can set the following `Pagination` plugin options:
     *
     * | Option                   | Possible settings                                  | Description                                                                                                                                                      |
     * | ------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `pageSize`               | A number or `auto` (default: `10`)                 | Sets the number of rows displayed per page. If `'auto'` is set, the page size will be calculated to match all rows to the currently set table's viewport height  |
     * | `pageSizeList`           | An array (default: `['auto', 5, 10, 20, 50, 100]`) | Defines the selectable values for page size in the UI                                                                                                            |
     * | `initialPage`            | A number (default: `1`)                            | Specifies which page to display on initial load                                                                                                                  |
     * | `showPageSize`           | Boolean (default: `true`)                          | Controls visibility of the "page size" section                                                                                                                   |
     * | `showCounter`            | Boolean (default: `true`)                          | Controls visibility of the "page counter" section (e.g., "1 - 10 of 50");                                                                                        |
     * | `showNavigation`         | Boolean (default: `true`)                          | Controls visibility of the "page navigation" section                                                                                                             |
     * | `uiContainer`            | An HTML element (default: `null`)                  | The container element where the pagination UI will be installed. If not provided, the pagination container will be injected below the root table element.        |
     *
     * Read more:
     * - [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)
     * - [Plugins: `Pagination`](@/api/pagination.md)
     *
     * @since 16.1.0
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Pagination
     *
     * @example
     * ```js
     * // enable the `Pagination` plugin
     * pagination: true,
     * ```
     */
    pagination: undefined,

    /**
     * The `placeholder` option lets you display placeholder text in every empty cell.
     *
     * You can set the `placeholder` option to one of the following:
     *
     * | Setting            | Example        | Description                                                           |
     * | ------------------ | -------------- | --------------------------------------------------------------------- |
     * | A non-empty string | `'Empty cell'` | Display `Empty cell` text in empty cells                              |
     * | A non-string value | `000`          | Display `000` text in empty cells (non-string values get stringified) |
     *
     * Read more:
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // display 'Empty cell' text
     * // in every empty cell of the entire grid
     * placeholder: 'Empty cell',
     *
     * // or
     * columns: [
     *   {
     *     data: 'date',
     *     dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
     *     // display 'Empty date cell' text
     *     // in every empty cell of the `date` column
     *     placeholder: 'Empty date cell'
     *   }
     * ],
     * ```
     */
    placeholder: undefined,

    /**
     * The `placeholderCellClassName` option lets you add a CSS class name to cells
     * that contain [`placeholder`](#placeholder) text.
     *
     * Read more:
     * - [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
     * - [`placeholder`](#placeholder)
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`TableClassName`](#TableClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string}
     * @default 'htPlaceholder'
     * @category Core
     *
     * @example
     * ```js
     * // add a `has-placeholder` CSS class name
     * // to each cell that contains `placeholder` text
     * placeholderCellClassName: 'has-placeholder',
     * ```
     */
    placeholderCellClassName: 'htPlaceholder',

    /**
     * The `preventOverflow` option configures preventing Handsontable
     * from overflowing outside of its parent element.
     *
     * When enabled, Handsontable caps its own dimensions to match the parent container's size in the specified direction,
     * preventing the grid from extending beyond the visible bounds of its parent.
     * This is useful when the parent element has `overflow: hidden` or a fixed size and you want the grid to fit within it.
     *
     * You can set the `preventOverflow` option to one of the following:
     *
     * | Setting           | Description                      |
     * | ----------------- | -------------------------------- |
     * | `false` (default) | Don't prevent overflowing        |
     * | `'horizontal'`      | Prevent horizontal overflowing |
     * | `'vertical'`        | Prevent vertical overflowing   |
     *
     * @memberof Options#
     * @type {string|boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // prevent horizontal overflowing
     * preventOverflow: 'horizontal',
     * ```
     */
    preventOverflow: false,

    /**
     * The `preventWheel` option configures preventing the `wheel` event's default action
     * on overlays.
     *
     * You can set the `preventWheel` option to one of the following:
     *
     * | Setting           | Description                                      |
     * | ----------------- | ------------------------------------------------ |
     * | `false` (default) | Don't prevent the `wheel` event's default action |
     * | `true`            | Prevent the `wheel` event's default action       |
     *
     * @memberof Options#
     * @private
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // don't prevent the `wheel` event's default action
     * preventWheel: false,
     * ```
     */
    preventWheel: false,

    /**
     * @description
     * The `readOnly` option determines whether a [cell](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-specific-cells),
     * [comment](@/guides/cell-features/comments/comments.md#make-a-comment-read-only), [column](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-columns)
     * or the [entire grid](@/guides/cell-features/disabled-cells/disabled-cells.md#read-only-grid) is editable or not. You can configure it as follows:
     *
     * | Setting           | Description                                                                                                                |
     * | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
     * | `false` (default) | Set as editable                                                                                                           |
     * | `true`            | - Set as read-only<br>- Add the [`readOnlyCellClassName`](#readOnlyCellClassName) CSS class name (by default: `htDimmed`) |
     *
     * `readOnly` cells can't be changed by the [`populateFromArray()`](@/api/core.md#populatefromarray) method.
     *
     * Read more:
     * - [Disabled cells](@/guides/cell-features/disabled-cells/disabled-cells.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // make the entire grid read-only
     * const configurationOptions = {
     *   columnSorting: true,
     * };
     *
     * // make the third column read-only
     * const configurationOptions = {
     *   columns: [
     *     {},
     *     {},
     *     {
     *       readOnly: true,
     *     },
     *   ],
     * };
     *
     * // make a specific cell read-only
     * const configurationOptions = {
     *   cell: [
     *     {
     *       row: 0,
     *       col: 0,
     *       readOnly: true,
     *     },
     * };
     * ```
     */
    readOnly: false,

    /**
     * The `readOnlyCellClassName` option lets you add a CSS class name to [read-only](#readOnly) cells.
     *
     * Read more:
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`TableClassName`](#TableClassName)
     *
     * @memberof Options#
     * @type {string}
     * @default 'htDimmed'
     * @category Core
     *
     * @example
     * ```js
     * // add a `is-readOnly` CSS class name
     * // to every read-only cell
     * readOnlyCellClassName: 'is-readOnly',
     * ```
     */
    readOnlyCellClassName: 'htDimmed',

    /**
     * The `renderAllRows` option controls Handsontable's [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md).
     * You can configure it as follows:
     *
     * | Setting           | Description                                                                                                                                                                                     |
     * | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false` (default) | Enable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md), rendering only the visible rows for optimal performance with large datasets.                                                  |
     * | `true`            | Disable [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)<br>(render all rows of the grid), rendering all rows in the dataset for consistent rendering and screen reader accessibility. |
     *
     * Setting `renderAllRows` to `true` overwrites the [`viewportRowRenderingOffset`](#viewportRowRenderingOffset) setting.
     *
     * Read more:
     * - [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // disable row virtualization
     * renderAllRows: true,
     * ```
     */
    renderAllRows: false,

    /**
     * The `renderAllColumns` option configures Handsontable's [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md).
     *
     * You can set the `renderAllColumns` option to one of the following:
     *
     * | Setting           | Description                                                                                                                                                                                                                      |
     * | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `false` (default) | Enable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md), rendering only visible columns for better performance with many columns.                                                                              |
     * | `true`            | Disable [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)<br>(render all columns of the grid), rendering all columns in the dataset, and ensuring all columns are available regardless of horizontal scrolling. |
     *
     * Setting `renderAllColumns` to `true` overwrites the [`viewportColumnRenderingOffset`](#viewportColumnRenderingOffset) setting.
     *
     * Read more:
     * - [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
     *
     * @since 14.1.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // disable column virtualization
     * renderAllColumns: true,
     * ```
     */
    renderAllColumns: false,

    /**
     * @description
     * The `renderer` option sets a [cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) for a cell.
     *
     * You can set the `renderer` option to one of the following:
     * - A custom renderer function
     * - One of the following [cell renderer aliases](@/guides/cell-functions/cell-renderer/cell-renderer.md):
     *
     * | Alias               | Cell renderer function                                                         |
     * | ------------------- | ------------------------------------------------------------------------------ |
     * | A custom alias      | Your [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) function |
     * | `'autocomplete'`    | `AutocompleteRenderer`                                                         |
     * | `'base'`            | `BaseRenderer`                                                                 |
     * | `'checkbox'`        | `CheckboxRenderer`                                                             |
     * | `'date'`            | `DateRenderer`                                                                 |
     * | `'intl-date'`       | `IntlDateRenderer`                                                             |
     * | `'dropdown'`        | `DropdownRenderer`                                                             |
     * | `'html'`            | `HtmlRenderer`                                                                 |
     * | `'numeric'`         | `NumericRenderer`                                                              |
     * | `'password'`        | `PasswordRenderer`                                                             |
     * | `'text'`            | `TextRenderer`                                                                 |
     * | `'time'`            | `TimeRenderer`                                                                 |
     * | `'intl-time'`       | `IntlTimeRenderer`                                                             |
     *
     * To set the [`renderer`](#renderer), [`editor`](#editor), and [`validator`](#validator)
     * options all at once, use the [`type`](#type) option.
     *
     * Read more:
     * - [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
     * - [Cell type](@/guides/cell-types/cell-type/cell-type.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [`type`](#type)
     *
     * @memberof Options#
     * @type {string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // use the `numeric` renderer for each cell of the entire grid
     * renderer: `'numeric'`,
     *
     * // add a custom renderer function
     * renderer(hotInstance, td, row, column, prop, value, cellProperties) {
     *   // your custom renderer's logic
     *   ...
     * }
     *
     * // apply the `renderer` option to individual columns
     * columns: [
     *   {
     *     // use the `autocomplete` renderer for each cell of this column
     *     renderer: 'autocomplete'
     *   },
     *   {
     *     // use the `myCustomRenderer` renderer for each cell of this column
     *     renderer: 'myCustomRenderer'
     *   }
     * ]
     * ```
     */
    renderer: undefined,

    /**
     * @description
     * The `valueFormatter` option sets a custom function for formatting cell values before display.
     *
     * Unlike the [`renderer`](#renderer) option, which is responsible for the complete cell rendering process
     * (DOM structure, performance-optimized content insertion via `innerText`/`innerHTML`, a11y attributes, applying
     * styles from `className`, `readOnlyCellClassName`, `textEllipsis`, and other options), the `valueFormatter`
     * focuses solely on transforming the cell's value.
     *
     * The `valueFormatter` function is called by the rendering engine right before the actual renderer function is
     * called. Separating the value formatting from the renderer logic allows for more flexibility and reuse.
     * This simplifies common formatting use cases where you only need to transform
     * the displayed value (e.g., adding units, formatting dates, or applying custom text transformations).
     *
     * **When to use `valueFormatter` vs `renderer`:**
     *
     * | Use case                                          | Recommended option   |
     * | ------------------------------------------------- | -------------------- |
     * | Transform displayed value (add prefix, units)     | `valueFormatter`     |
     * | Custom date/number/text formatting                | `valueFormatter`     |
     * | Modify DOM structure (add icons, custom elements) | `renderer`           |
     *
     * The function receives the raw value and cell properties, and should return the formatted value
     * to be displayed. The formatting can be applied to a single cell, column, or the entire grid.
     *
     * **Function signature:**
     * ```js
     * valueFormatter(value, cellProperties) => formattedValue
     * ```
     *
     * | Parameter        | Type       | Description                                    |
     * | ---------------- | ---------- | ---------------------------------------------- |
     * | `value`          | `*`        | The raw cell value                             |
     * | `cellProperties` | `object`   | The cell's meta object (see {@link Core#getCellMeta}) |
     * | Returns          | `*`        | The formatted value to display                 |
     *
     * Read more:
     * - [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     *
     * @memberof Options#
     * @since 17.0.0
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add a currency symbol to numeric values
     * valueFormatter(value, cellProperties) {
     *   if (value === null || value === undefined) {
     *     return '';
     *   }
     *
     *   return `$${value}`;
     * }
     *
     * // format dates in a custom format
     * valueFormatter(value, cellProperties) {
     *   if (!value) {
     *     return '';
     *   }
     *
     *   const date = new Date(value);
     *
     *   return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
     * }
     *
     * // apply valueFormatter to individual columns
     * columns: [
     *   {
     *     // add "kg" suffix to weight values
     *     valueFormatter(value) {
     *       return value ? `${value} kg` : '';
     *     }
     *   },
     *   {
     *     // format percentages
     *     valueFormatter(value) {
     *       return value !== null ? `${(value * 100).toFixed(1)}%` : '';
     *     }
     *   }
     * ]
     * ```
     */
    valueFormatter: undefined,

    /**
     * @description
     * The `valueParser` option sets a custom function for converting editor output into the source data format.
     *
     * Unlike [`valueFormatter`](#valueformatter), which formats values for display, `valueParser` runs only when a
     * value comes from the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) - after the user finishes
     * editing. It maps whatever the editor returns (e.g. a localized date string, a formatted number) into the
     * canonical shape stored in the data source (e.g. ISO date string, raw number).
     *
     * **When to use `valueParser` vs `valueFormatter`:**
     *
     * | Use case                               | Option           |
     * | -------------------------------------- | ---------------- |
     * | Display: raw value -> shown text       | `valueFormatter` |
     * | Edit: editor value -> source data      | `valueParser`    |
     *
     * **Function signature:**
     * ```js
     * valueParser(value, cellProperties) => sourceValue
     * ```
     *
     * | Parameter        | Type     | Description                                    |
     * | ---------------- | -------- | ---------------------------------------------- |
     * | `value`          | `*`      | The value produced by the editor               |
     * | `cellProperties` | `object` | The cell's meta object (see {@link Core#getCellMeta}) |
     * | Returns          | `*`      | The value to store in the source data          |
     *
     * Read more:
     * - [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
     * - [`editor`](#editor)
     * - [`renderer`](#renderer)
     * - [`valueFormatter`](#valueformatter)
     * - [`sourceDataValidator`](#sourcedatavalidator)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     *
     * @memberof Options#
     * @since 17.0.0
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // parse editor string to ISO date (e.g. intl-date: display format => source format)
     * valueParser(value, cellProperties) {
     *   if (value == null || value === '') {
     *     return null;
     *   }
     *
     *   const date = new Date(value);
     *
     *   return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
     * }
     *
     * // parse formatted number string to number
     * valueParser(value, cellProperties) {
     *   if (value == null || value === '') {
     *     return null;
     *   }
     *
     *   const num = Number(value.replace(/[^\d.-]/g, ''));
     *
     *   return Number.isNaN(num) ? value : num;
     * }
     *
     * // apply valueParser per column
     * columns: [
     *   { data: 'date', valueParser: (value) => value ? new Date(value).toISOString().slice(0, 10) : null },
     *   { data: 'amount', valueParser: (value) => value != null ? Number(value) : null }
     * ]
     * ```
     */
    valueParser: undefined,

    /**
     * The `rowHeaders` option configures your grid's row headers.
     *
     * You can set the `rowHeaders` option to one of the following:
     *
     * | Setting    | Description                                                       |
     * | ---------- | ----------------------------------------------------------------- |
     * | `true`     | Enable the default row headers ('1', '2', '3', ...)               |
     * | `false`    | Disable row headers                                               |
     * | An array   | Define your own row headers (e.g. `['One', 'Two', 'Three', ...]`) |
     * | A function | Define your own row headers, using a function                     |
     *
     * Read more:
     * - [Row header](@/guides/rows/row-header/row-header.md)
     *
     * @memberof Options#
     * @type {boolean|string[]|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // enable the default row headers
     * rowHeaders: true,
     *
     * // set your own row headers
     * rowHeaders: ['One', 'Two', 'Three'],
     *
     * // set your own row headers, using a function
     * rowHeaders: function(visualRowIndex) {
     *   return `${visualRowIndex}: AB`;
     * },
     * ```
     */
    rowHeaders: undefined,

    /**
     * @description
     * The `rowHeaderWidth` option configures the width of row headers.
     *
     * You can set the `rowHeaderWidth` option to one of the following:
     *
     * | Setting  | Description                                     |
     * | -------- | ----------------------------------------------- |
     * | A number | Set the same width for every row header         |
     * | An array | Set different widths for individual row headers |
     *
     * @memberof Options#
     * @type {number|number[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the same width for every row header
     * rowHeaderWidth: 25,
     *
     * // set different widths for individual row headers
     * rowHeaderWidth: [25, 30, 55],
     * ```
     */
    rowHeaderWidth: undefined,

    /**
     * The `rowHeights` option sets rows' heights, in pixels.
     *
     * In the rendering process, the default row height is `classic: 26px`, `main: 29px`, `horizon: 37px` or whatever is defined in the used theme (based on the line height, vertical padding and cell borders).
     * You can change it to equal or greater than the default value, by setting the `rowHeights` option to one of the following:
     *
     * | Setting     | Description                                                                                         | Example                                                      |
     * | ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
     * | A number    | Set the same height for every row                                                                   | `rowHeights: 100`                                            |
     * | A string    | Set the same height for every row                                                                   | `rowHeights: '100px'`                                        |
     * | An array    | Set heights separately for each row                                                                 | `rowHeights: [100, 120, undefined]`                          |
     * | A function  | Set row heights dynamically,<br>on each render                                                      | `rowHeights(visualRowIndex) { return visualRowIndex * 10; }` |
     * | `undefined` | Used by the [modifyRowHeight](@/api/hooks.md#modifyRowHeight) hook,<br>to detect row height changes | `rowHeights: undefined`                                      |
     *
     * The `rowHeights` option also sets the minimum row height that can be set
     * via the {@link ManualRowResize} and {@link AutoRowSize} plugins (if they are enabled).
     *
     * Read more:
     * - [Row height](@/guides/rows/row-height/row-height.md)
     *
     * @memberof Options#
     * @type {number|number[]|string|string[]|Array<undefined>|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set every row's height to 100px
     * rowHeights: 100,
     *
     * // set every row's height to 100px
     * rowHeights: '100px',
     *
     * // set the first (by visual index) row's height to 100
     * // set the second (by visual index) row's height to 120
     * // set the third (by visual index) row's height to `undefined`
     * // set any other row's height to the default height value
     * rowHeights: [100, 120, undefined],
     *
     * // set each row's height individually, using a function
     * rowHeights(visualRowIndex) {
     *   return visualRowIndex * 10;
     * },
     * ```
     */
    rowHeights: undefined,

    /**
     * @description
     * The `search` option enables and configures the [`Search`](@/api/search.md) plugin.
     *
     * | Setting           | Description                                                                    |
     * | ----------------- | ------------------------------------------------------------------------------ |
     * | `false` (default) | Disable the [`Search`](@/api/search.md) plugin                                 |
     * | `true`            | Enable the [`Search`](@/api/search.md) plugin with the default configuration   |
     * | An object         | Enable the [`Search`](@/api/search.md) plugin and apply a custom configuration |
     *
     * When set to an object, the following properties are supported:
     *
     * | Property            | Type       | Default                          | Description                                                                                                                                                        |
     * | ------------------- | ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `searchResultClass` | `string`   | `'htSearchResult'`               | CSS class name applied to every cell where `isSearchResult === true`.                                                                                              |
     * | `queryMethod`       | `Function` | Case-insensitive substring match | Tests whether the query string matches a cell value. Signature: `(queryStr: string, value: string\|number\|null, cellProperties: object) => boolean`.              |
     * | `callback`          | `Function` | Sets `isSearchResult` on cell metadata | Called for every cell after each test. Signature: `(instance: Handsontable, row: number, col: number, data: string\|number\|null, testResult: boolean) => void`. |
     *
     * Default `queryMethod` behavior: case-insensitive, locale-aware substring match using `toLocaleLowerCase()` with `cellProperties.locale`.
     *
     * Default `callback` behavior: sets `instance.getCellMeta(row, col).isSearchResult = testResult` on every cell.
     *
     * **Per-cell overrides:** `queryMethod` and `callback` can also be set on individual cells, columns, or rows
     * using the cascading configuration model. A cell-level `search.queryMethod` or `search.callback` takes
     * precedence over the plugin-level setting for that cell. `searchResultClass` does not support per-cell overrides.
     *
     * Read more:
     * - [Searching values](@/guides/navigation/searching-values/searching-values.md)
     * - [Custom query method](@/guides/navigation/searching-values/searching-values.md#custom-query-method)
     * - [Custom callback](@/guides/navigation/searching-values/searching-values.md#custom-callback)
     * - [Per-cell overrides](@/guides/navigation/searching-values/searching-values.md#per-cell-querymethod-and-callback)
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category Search
     *
     * @example
     * ```js
     * // Enable with the default configuration
     * search: true,
     *
     * // Enable with a custom configuration
     * search: {
     *   // Apply a custom CSS class to matching cells instead of 'htSearchResult'
     *   searchResultClass: 'customClass',
     *   // Replace the built-in substring match with exact matching
     *   queryMethod(queryStr, value, cellProperties) {
     *     if (!queryStr || queryStr.length === 0) return false;
     *     if (value === undefined || value === null) return false;
     *
     *     return queryStr.toString() === value.toString();
     *   },
     *   // Count results while preserving default highlighting
     *   callback(instance, row, col, data, testResult) {
     *     // Preserve the default isSearchResult flag so highlighting still works
     *     instance.getCellMeta(row, col).isSearchResult = testResult;
     *
     *     if (testResult) {
     *       // Custom logic: e.g., increment a result counter
     *     }
     *   }
     * },
     *
     * // Override queryMethod for a specific column only (per-cell via cascading config)
     * columns: [
     *   {},
     *   {
     *     search: {
     *       queryMethod(queryStr, value) {
     *         return queryStr.toString() === value.toString(); // exact match for column 1
     *       }
     *     }
     *   }
     * ],
     * ```
     */
    search: false,

    /**
     * The `searchInput` option configures whether the [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) editor's search input is visible.
     *
     * @since 17.0.0
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     * @example
     * ```js
     * columns: [{
     *   type: 'multiselect',
     *   // hide the `multiSelect` editor's search input
     *   searchInput: false,
     * }],
     * ```
     */
    searchInput: true,

    /**
     * @description
     * The `selectionMode` option configures how [selection](@/guides/cell-features/selection/selection.md) works.
     *
     * You can set the `selectionMode` option to one of the following:
     *
     * | Setting      | Description                                                  |
     * | ------------ | ------------------------------------------------------------ |
     * | `'single'`   | Allow the user to select only one cell at a time.            |
     * | `'range'`    | Allow the user to select one range of cells at a time.       |
     * | `'multiple'` | Allow the user to select multiple ranges of cells at a time. |
     *
     * Read more:
     * - [Selection: Selecting ranges](@/guides/cell-features/selection/selection.md#select-ranges)
     *
     * @memberof Options#
     * @type {string}
     * @default 'multiple'
     * @category Core
     *
     * @example
     * ```js
     * // you can only select one cell at at a time
     * selectionMode: 'single',
     *
     * // you can select one range of cells at a time
     * selectionMode: 'range',
     *
     * // you can select multiple ranges of cells at a time
     * selectionMode: 'multiple',
     * ```
     */
    selectionMode: 'multiple',

    /**
     * The `selectOptions` option configures options that the end user can choose from in [`select`](@/guides/cell-types/select-cell-type/select-cell-type.md) cells.
     *
     * You can set the `selectOptions` option to one of the following:
     *
     * | Setting                         | Description                                                                   |
     * | ------------------------------- | ----------------------------------------------------------------------------- |
     * | An array of strings             | Each string is one option's value and label                                   |
     * | An object with key-string pairs | - Each key is one option's value<br>- The key's string is that option's label |
     * | A function                      | A function that returns an object with key-string pairs                       |
     *
     * Read more:
     * - [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)
     *
     * @memberof Options#
     * @type {string[]|object|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // set the `type` of each cell in this column to `select`
     *     type: 'select',
     *     // set the first option's value and label to `A`
     *     // set the second option's value and label to `B`
     *     // set the third option's value and label to `C`
     *     selectOptions: ['A', 'B', 'C'],
     *   },
     *   {
     *     // set the `type` of each cell in this column to `select`
     *     type: 'select',
     *     selectOptions: {
     *       // set the first option's value to `value1` and label to `Label 1`
     *       value1: 'Label 1',
     *       // set the second option's value to `value2` and label to `Label 2`
     *       value2: 'Label 2',
     *       // set the third option's value to `value3` and label to `Label 3`
     *       value3: 'Label 3',
     *     },
     *   },
     *   {
     *     // set the `type` of each cell in this column to `select`
     *     type: 'select',
     *     // set `selectOption` to a function that returns available options as an object
     *     selectOptions(visualRow, visualColumn, prop) {
     *       return {
     *         value1: 'Label 1',
     *         value2: 'Label 2',
     *         value3: 'Label 3',
     *       };
     *   },
     * ],
     * ```
     */
    selectOptions: undefined,

    /**
     * @description
     * The `skipColumnOnPaste` option determines whether you can paste data into a given column.
     *
     * You can only apply the `skipColumnOnPaste` option to an entire column, using the [`columns`](#columns) option. This option is not supported for the global table level settings.
     *
     * You can set the `skipColumnOnPaste` option to one of the following:
     *
     * | Setting           | Description                                                                                           |
     * | ----------------- | ----------------------------------------------------------------------------------------------------- |
     * | `false` (default) | Enable pasting data into this column                                                                  |
     * | `true`            | - Disable pasting data into this column<br>- On pasting, paste data into the next column to the right |
     *
     * Read more:
     * - [Configuration options: Setting column options](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // disable pasting data into this column
     *     skipColumnOnPaste: true
     *   }
     * ],
     * ```
     */
    skipColumnOnPaste: false,

    /**
     * @description
     *
     * The `skipRowOnPaste` option determines whether you can paste data into a given row.
     *
     * You can only apply the `skipRowOnPaste` option to an entire row, using the [`cells`](#cells) option. This option is not supported for the global table level settings.
     *
     * You can set the `skipRowOnPaste` option to one of the following:
     *
     * | Setting           | Description                                                                         |
     * | ----------------- | ----------------------------------------------------------------------------------- |
     * | `false` (default) | Enable pasting data into this row                                                   |
     * | `true`            | - Disable pasting data into this row<br>- On pasting, paste data into the row below |
     *
     * Read more:
     * - [Configuration options: Setting row options](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * cells(row, column) {
     *  const cellProperties = {};
     *
     *  // disable pasting data into row 1
     *  if (row === 1) {
     *    cellProperties.skipRowOnPaste = true;
     *  }
     *
     *  return cellProperties;
     * }
     * ```
     */
    skipRowOnPaste: false,

    /**
     * The `sortByRelevance` option configures whether [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells'
     * lists are sorted in the same order as provided in the [`source`](#source) option.
     *
     * You can set the `sortByRelevance` option to one of the following:
     *
     * | Setting          | Description                                                                  |
     * | ---------------- | ---------------------------------------------------------------------------- |
     * | `true` (default) | Sort options in the same order as provided in the [`source`](#source) option |
     * | `false`          | Sort options alphabetically                                                  |
     *
     * Read more:
     * - [`source`](#source)
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: ['D', 'C', 'B', 'A'],
     *   // sort the `autocomplete` option in this order: D, C, B, A
     *   sortByRelevance: true
     * }],
     * ```
     */
    sortByRelevance: true,

    /**
     * The `sourceSortFunction` option sets a function to sort the options available in [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells.
     *
     * @since 17.0.0
     * @memberof Options#
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   // set the `type` of each cell in this column to `multiSelect`
     *   type: 'multiselect',
     *   // set options available in every `multiSelect` cell of this column
     *   source: ['A', 'B', 'C', 'D'],
     *   // sort the `multiSelect` options in this order: D, C, B, A
     *   sourceSortFunction: (entries) => {
     *     return entries.sort((a, b) => b.localeCompare(a));
     *   }
     * }],
     * ```
     */
    sourceSortFunction: undefined,

    /**
     * The `source` option sets options available in [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cells.
     *
     * You can set the `source` option to one of the following:
     *
     * - An array of string values
     * - An array of objects with `key` and `value` properties
     * - A function
     *
     * Note: When defining the `source` option as an array of objects with `key` and `value` properties, the data format for that cell
     * needs to be an object with `key` and `value` properties as well.
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
     * - [`strict`](#strict)
     * - [`allowHtml`](#allowHtml)
     * - [`filter`](#filter)
     * - [`sortByRelevance`](#sortByRelevance)
     *
     * @memberof Options#
     * @type {Array|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set `source` to an array of string values
     * columns: [{
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: ['A', 'B', 'C', 'D']
     * }],
     *
     * // set `source` to an array of objects with `key` and `value` properties
     * columns: [{
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: [{
     *     key: 'A',
     *     value: 'Label A'
     *   }, {
     *     key: 'B',
     *     value: 'Label B'
     *   }]
     * }],
     *
     * // set `source` to a function
     * columns: [{
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // for every `autocomplete` cell in this column, fetch data from an external source
     *   source(query, callback) {
     *     fetch('https://example.com/query?q=' + query, function(response) {
     *       callback(response.items);
     *     })
     *   }
     * }],
     * ```
     */
    source: undefined,

    /**
     * @description
     * If the [`data`](#data) option is not set, the `startCols` option sets the initial number of empty columns.
     *
     * The `startCols` option works only in Handsontable's constructor and only when [`data`](#data) is not provided.
     *
     * ::: tip
     * When [`minSpareCols`](#minSpareCols) is set alongside `startCols`, the `startCols` columns count toward the
     * minimum number of spare columns. As a result, the total initial column count will be the maximum of
     * `startCols` and `minSpareCols`.
     * :::
     *
     * @memberof Options#
     * @type {number}
     * @default 5
     * @category Core
     *
     * @example
     * ```js
     * // start with 15 empty columns
     * startCols: 15,
     * ```
     */
    startCols: 5,

    /**
     * @description
     * If the [`data`](#data) option is not set, the `startRows` option sets the initial number of empty rows.
     *
     * The `startRows` option works only in Handsontable's constructor and only when [`data`](#data) is not provided.
     *
     * ::: tip
     * When [`minSpareRows`](#minSpareRows) is set alongside `startRows`, the `startRows` rows count toward the
     * minimum number of spare rows. As a result, the total initial row count will be the maximum of
     * `startRows` and `minSpareRows`.
     * :::
     *
     * @memberof Options#
     * @type {number}
     * @default 5
     * @category Core
     *
     * @example
     * ```js
     * // start with 15 empty rows
     * startRows: 15,
     * ```
     */
    startRows: 5,

    /**
     * @description
     * The `stretchH` option determines what happens when the declared grid width
     * is different from the calculated sum of all column widths.
     *
     * You can set the `stretchH` option to one of the following:
     *
     * | Setting            | Description                                                       |
     * | ------------------ | ----------------------------------------------------------------- |
     * | `'none'` (default) | Don't fit the grid to the container (disable column stretching)   |
     * | `'last'`           | Fit the grid to the container, by stretching only the last column |
     * | `'all'`            | Fit the grid to the container, by stretching all columns evenly   |
     *
     * Read more:
     * - [Column width: Column stretching](@/guides/columns/column-width/column-width.md#column-stretching)
     *
     * @memberof Options#
     * @type {string}
     * @default 'none'
     * @category Core
     *
     * @example
     * ```js
     * // fit the grid to the container
     * // by stretching all columns evenly
     * stretchH: 'all',
     * ```
     */
    stretchH: 'none',

    /**
     * The `strict` option configures the behavior of [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cells.
     *
     * You can set the `strict` option to one of the following:
     *
     * | Setting | Mode                                                                                          | Description                                                                                |
     * | ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
     * | `true`  | [Strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode)         | The end user:<br>- Can only choose one of suggested values<br>- Can't enter a custom value |
     * | `false` | [Flexible mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-flexible-mode)     | The end user:<br>- Can choose one of suggested values<br>- Can enter a custom value        |
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [`source`](#source)
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *   // set the `type` of each cell in this column to `autocomplete`
     *   type: 'autocomplete',
     *   // set options available in every `autocomplete` cell of this column
     *   source: ['A', 'B', 'C'],
     *   // values entered must match `A`, `B`, or `C`
     *   strict: true
     *   },
     * ],
     * ```
     */
    strict: undefined,

    /**
     * The `tableClassName` option lets you add CSS class names
     * to every Handsontable instance inside the `container` element.
     *
     * You can set the `tableClassName` option to one of the following:
     *
     * | Setting             | Description                                                                                |
     * | ------------------- | ------------------------------------------------------------------------------------------ |
     * | A string            | Add a single CSS class name to every Handsontable instance inside the `container` element  |
     * | An array of strings | Add multiple CSS class names to every Handsontable instance inside the `container` element |
     *
     * Read more:
     * - [`currentRowClassName`](#currentRowClassName)
     * - [`currentColClassName`](#currentColClassName)
     * - [`currentHeaderClassName`](#currentHeaderClassName)
     * - [`activeHeaderClassName`](#activeHeaderClassName)
     * - [`invalidCellClassName`](#invalidCellClassName)
     * - [`placeholderCellClassName`](#placeholderCellClassName)
     * - [`readOnlyCellClassName`](#readOnlyCellClassName)
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     * - [`commentedCellClassName`](#commentedCellClassName)
     * - [`className`](#className)
     *
     * @memberof Options#
     * @type {string|string[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add a `your-class-name` CSS class name
     * // to every Handsontable instance inside the `container` element
     * tableClassName: 'your-class-name',
     *
     * // add `first-class-name` and `second-class-name` CSS class names
     * // to every Handsontable instance inside the `container` element
     * tableClassName: ['first-class-name', 'second-class-name'],
     * ```
     */
    tableClassName: undefined,

    /**
     * The `textEllipsis` option configures whether the text content in the cells should be truncated with an ellipsis (three dots).
     *
     * You can set the `textEllipsis` option to one of the following:
     *
     * | Setting           | Description                                   |
     * | ----------------- | --------------------------------------------- |
     * | `false` (default) | Don't truncate text content with an ellipsis  |
     * | `true`            | Truncate text content with an ellipsis        |
     *
     * @since 16.0.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // truncate text content with an ellipsis
     *     textEllipsis: true,
     *   },
     *   {
     *     // don't truncate text content with an ellipsis
     *     textEllipsis: false,
     *   }
     * ],
     * ```
     */
    textEllipsis: false,

    /**
     * The `themeName` option allows enabling a theme by that name.
     *
     * Read more:
     * - [Themes](@/guides/styling/themes/themes.md)
     *
     * @memberof Options#
     * @type {string|undefined}
     * @default undefined
     * @category Core
     * @since 15.0.0
     *
     * @example
     * ```js
     * themeName: 'ht-theme-name',
     * ```
     */
    themeName: undefined,

    /**
     * The `theme` option configures the visual theme for your Handsontable instance.
     *
     * You can set the `theme` option to one of the following:
     *
     * | Setting                               | Description                                                                           |
     * | ------------------------------------- | ------------------------------------------------------------------------------------- |
     * | `undefined` (default)                 | Don't apply any theme and use the default main theme                                  |
     * | A string (e.g., `'ht-theme-horizon'`) | Apply a registered theme by name (required to import CSS file)                        |
     * | A plain theme config object           | Apply a theme with default settings (import and pass the config, e.g. `horizonTheme`) |
     * | A `ThemeBuilder` object               | Apply a theme with runtime configuration (recommended)                                |
     *
     * When using a `ThemeBuilder` object, you can configure the theme at runtime using these methods:
     *
     * | Method                           | Description                                                                                |
     * | -------------------------------- | ------------------------------------------------------------------------------------------ |
     * | `setColorScheme(mode)`           | Sets the color scheme: `'light'`, `'dark'`, or `'auto'` (default: `'auto'`)                |
     * | `setDensityType(type)`           | Sets the row density: `'compact'`, `'default'`, or `'comfortable'` (default: `'default'`)  |
     * | `params(paramsObject)`           | Sets custom theme parameters e.g. `icons`, `colors`, `tokens`                              |
     *
     * Read more:
     * - [Themes](@/guides/styling/themes/themes.md)
     * - [`themeName`](#themeName)
     *
     * @memberof Options#
     * @type {ThemeBuilder|string|undefined}
     * @default undefined
     * @category Core
     * @since 17.0.0
     *
     * @example
     * ```js
     * // Enable a theme by class name (requires loading the theme CSS)
     * theme: 'ht-theme-horizon',
     * ```
     * @example
     * ```js
     * // Pass a plain theme config object
     * import { horizonTheme } from 'handsontable/themes';
     *
     * const hot = new Handsontable(container, {
     *   theme: horizonTheme,
     * });
     * ```
     *
     * @example
     * ```js
     * // Pass a ThemeBuilder object (for customization before initialization)
     * import { horizonTheme, registerTheme } from 'handsontable/themes';
     *
     * const theme = registerTheme(horizonTheme)
     *   .setColorScheme('dark')
     *   .setDensityType('compact')
     *   .params({
     *     tokens: {
     *       fontSize: '14px',
     *       iconSize: 'size_5',
     *       borderColor: ['colors.palette.100', 'colors.palette.800'],
     *     },
     *   });
     *
     * const hot = new Handsontable(container, {
     *   theme,
     * });
     * ```
     */
    theme: undefined,

    /**
     * The `injectCoreCss` option controls whether Handsontable injects its core CSS into the document.
     *
     * You can set the `injectCoreCss` option to one of the following:
     *
     * | Setting            | Description                                                                                                      |
     * | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
     * | `true` (default)   | Inject core styles into the document head                                                                        |
     * | `false`            | Do not inject core styles (use when you load CSS yourself, e.g. `import 'handsontable/styles/handsontable.css'`) |
     *
     * Read more:
     * - [Themes](@/guides/styling/themes/themes.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     * @since 17.0.0
     *
     * @example
     * ```js
     * // inject core CSS (default)
     * injectCoreCss: true,
     *
     * // skip injection when you load Handsontable CSS yourself
     * injectCoreCss: false,
     * ```
     */
    injectCoreCss: true,

    /**
     * The `tabMoves` option configures the action of the <kbd>**Tab**</kbd> key.
     *
     * You can set the `tabMoves` option to an object with the following properties
     * (or to a function that returns such an object):
     *
     * | Property | Type   | Description                                                                                                                                              |
     * | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `row`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `row` rows down<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `row` rows up              |
     * | `col`    | Number | - On pressing <kbd>**Tab**</kbd>, move selection `col` columns right<br>- On pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>, move selection `col` columns left     |
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {row: 0, col: 1}
     * @category Core
     *
     * @example
     * ```js
     * // on pressing Tab, move selection 2 rows down and 2 columns right
     * // on pressing Shift+Tab, move selection 2 rows up and 2 columns left
     * tabMoves: {row: 2, col: 2},
     *
     * // the same setting, as a function
     * // `event` is a DOM Event object received on pressing Tab
     * // you can use it to check whether the user pressed Tab or Shift+Tab
     * tabMoves(event) {
     *   return {row: 2, col: 2};
     * },
     * ```
     */
    tabMoves: { row: 0, col: 1 },

    /**
     * @description
     * The `title` option configures [column header](@/guides/columns/column-header/column-header.md) names.
     *
     * You can set the `title` option to a string.
     *
     * Read more:
     * - [Column header](@/guides/columns/column-header/column-header.md)
     * - [`columns`](#columns)
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // set the first column header name to `First name`
     *     title: 'First name',
     *     type: 'text',
     *   },
     *   {
     *     // set the second column header name to `Last name`
     *     title: 'Last name',
     *     type: 'text',
     *   }
     * ],
     * ```
     */
    title: undefined,

    /**
     * The `trimDropdown` option configures the width of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * and [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) lists.
     *
     * When set to `true` (default), the list is trimmed to match the width of the edited cell,
     * which can truncate long option labels. When set to `false`, the list expands to fit its
     * longest option, which may make the list wider than the cell.
     *
     * You can set the `trimDropdown` option to one of the following:
     *
     * | Setting          | Description                                                                     |
     * | ---------------- | ------------------------------------------------------------------------------- |
     * | `true` (default) | Make the dropdown/autocomplete list's width the same as the edited cell's width |
     * | `false`          | Scale the dropdown/autocomplete list's width to the list's content              |
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'autocomplete',
     *     // for each cell of this column
     *     // make the `autocomplete` list's width the same as the edited cell's width
     *     trimDropdown: true,
     *   },
     *   {
     *     type: 'dropdown',
     *     // for each cell of this column
     *     // scale the `dropdown` list's width to the list's content
     *     trimDropdown: false,
     *   }
     * ],
     * ```
     */
    trimDropdown: true,

    /**
     * @description
     * The `trimRows` option configures the [`TrimRows`](@/api/trimRows.md) plugin.
     *
     * You can set the `trimRows` option to one of the following:
     *
     * | Setting                          | Description                                                                                   |
     * | -------------------------------- | --------------------------------------------------------------------------------------------- |
     * | `false`                          | Disable the [`TrimRows`](@/api/trimRows.md) plugin                                            |
     * | `true`                           | Enable the [`TrimRows`](@/api/trimRows.md) plugin                                             |
     * | An array of physical row indexes | - Enable the [`TrimRows`](@/api/trimRows.md) plugin<br>- Trim selected rows at initialization |
     *
     * Read more:
     * - [Plugins: `TrimRows`](@/api/trimRows.md)
     * - [Row trimming](@/guides/rows/row-trimming/row-trimming.md)
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category TrimRows
     *
     * @example
     * ```js
     * // enable the `TrimRows` plugin
     * trimRows: true,
     *
     * // enable the `TrimRows` plugin
     * // at Handsontable's initialization, trim rows 5, 10, and 15
     * trimRows: [5, 10, 15],
     * ```
     */
    trimRows: undefined,

    /**
     * The `trimWhitespace` option configures automatic whitespace removal. This option
     * affects the cell renderer and the cell editor.
     *
     * You can set the `trimWhitespace` option to one of the following:
     *
     * | Setting          | Description                                                     |
     * | ---------------- | --------------------------------------------------------------- |
     * | `true` (default) | Remove whitespace at the beginning and at the end of each cell |
     * | `false`          | Don't remove whitespace                                         |
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // don't remove whitespace
     *     // from any cell of this column
     *     trimWhitespace: false
     *   }
     * ]
     * ```
     */
    trimWhitespace: true,

    /**
     * @description
     * The `type` option lets you set the [`renderer`](#renderer), [`editor`](#editor), and [`validator`](#validator)
     * options all at once, by selecting a [cell type](@/guides/cell-types/cell-type/cell-type.md).
     *
     * You can set the `type` option to one of the following:
     *
     * | Cell type                                                         | Renderer, editor & validator                                                                                                                                                                                                                       |
     * | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | A [custom cell type](@/guides/cell-types/cell-type/cell-type.md)            | Renderer: your [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)<br>Editor: your [custom cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)<br>Validator: your [custom cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) |
     * | [`'autocomplete'`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) | Renderer: `AutocompleteRenderer`<br>Editor: `AutocompleteEditor`<br>Validator: `AutocompleteValidator`                                                                         |
     * | [`'checkbox'`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md)         | Renderer: `CheckboxRenderer`<br>Editor: `CheckboxEditor`<br>Validator: -                                                                                                                               |
     * | [`'date'`](@/guides/cell-types/date-cell-type/date-cell-type.md)                 | Renderer: `DateRenderer`<br>Editor: `DateEditor`<br>Validator: `DateValidator`                                                                                                 |
     * | [`'intl-date'`](@/guides/cell-types/date-cell-type/date-cell-type.md)                 | Renderer: `IntlDateRenderer`<br>Editor: `IntlDateEditor`<br>Validator: `IntlDateValidator`                                                                                                 |
     * | [`'dropdown'`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)         | Renderer: `DropdownRenderer`<br>Editor: `DropdownEditor`<br>Validator: `DropdownValidator`                                                                                     |
     * | [`'handsontable'`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) | Renderer: `AutocompleteRenderer`<br>Editor: `HandsontableEditor`<br>Validator: -                                                                                                                       |
     * | [`'numeric'`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)           | Renderer: `NumericRenderer`<br>Editor: `NumericEditor`<br>Validator: `NumericValidator`                                                                                        |
     * | [`'password'`](@/guides/cell-types/password-cell-type/password-cell-type.md)         | Renderer: `PasswordRenderer`<br>Editor: `PasswordEditor`<br>Validator: -                                                                                                                               |
     * | `'text'`                                                          | Renderer: `TextRenderer`<br>Editor: `TextEditor`<br>Validator: -                                                                                                                                       |
     * | [`'time`'](@/guides/cell-types/time-cell-type/time-cell-type.md)                 | Renderer: `TimeRenderer`<br>Editor: `TimeEditor`<br>Validator: `TimeValidator`                                                                                                 |
     * | [`'intl-time'`](@/guides/cell-types/time-cell-type/time-cell-type.md)                 | Renderer: `IntlTimeRenderer`<br>Editor: `IntlTimeEditor`<br>Validator: `IntlTimeValidator`                                                                                                 |
     *
     * Read more:
     * - [Cell type](@/guides/cell-types/cell-type/cell-type.md)
     * - [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
     * - [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
     * - [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [`renderer`](#renderer)
     * - [`editor`](#editor)
     * - [`validator`](#validator)
     * - [`valueParser`](#valueparser)
     * - [`valueFormatter`](#valueformatter)
     *
     * @memberof Options#
     * @type {string}
     * @default 'text'
     * @category Core
     *
     * @example
     * ```js
     * // set the `numeric` cell type for each cell of the entire grid
     * type: `'numeric'`,
     *
     * // apply the `type` option to individual columns
     * columns: [
     *   {
     *     // set the `autocomplete` cell type for each cell of this column
     *     type: 'autocomplete'
     *   },
     *   {
     *     // set the `myCustomCellType` cell type for each cell of this column
     *     type: 'myCustomCellType'
     *   }
     * ]
     * ```
     */
    type: 'text',

    /**
     * The `uncheckedTemplate` option lets you configure what value
     * an unchecked [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell has.
     *
     * You can set the `uncheckedTemplate` option to one of the following:
     *
     * | Setting           | Description                                                                                                                                                                                |
     * | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `false` (default) | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the [`getDataAtCell`](@/api/core.md#getDataAtCell) method for this cell returns `false`                 |
     * | A string          | If a [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell is unchecked,<br>the [`getDataAtCell`](@/api/core.md#getDataAtCell) method for this cell returns a string of your choice |
     *
     * ::: warning
     * When you set `uncheckedTemplate` to a custom string value (e.g. `'No'`), using `false` in your data source to
     * represent an unchecked state is no longer valid. Only the exact custom string value matches an unchecked checkbox.
     * Pair `uncheckedTemplate` with [`checkedTemplate`](#checkedTemplate) to define both states explicitly.
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Checkbox cell type: Checkbox template](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md#checkbox-template)
     * - [`getDataAtCell()`](@/api/core.md#getDataAtCell)
     * - [`checkedTemplate`](#checkedTemplate)
     *
     * @memberof Options#
     * @type {boolean|string|number}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // set the `type` of each cell in this column to `checkbox`
     *     // when unchecked, the cell's value is `false`
     *     // when checked, the cell's value is `true`
     *     type: 'checkbox',
     *   },
     *   {
     *     // set the `type` of each cell in this column to `checkbox`
     *     // when unchecked, the cell's value is `'No'`
     *     // when checked, the cell's value is `'Yes'`
     *     type: 'checkbox',
     *     uncheckedTemplate: 'No'
     *     checkedTemplate: 'Yes',
     *  }
     * ],
     * ```
     */
    uncheckedTemplate: undefined,

    /**
     * The `undo` option configures the [`UndoRedo`](@/api/undoRedo.md) plugin.
     *
     * You can set the `undo` option to one of the following:
     *
     * | Setting | Description                                        |
     * | ------- | -------------------------------------------------- |
     * | `true`  | Enable the [`UndoRedo`](@/api/undoRedo.md) plugin  |
     * | `false` | Disable the [`UndoRedo`](@/api/undoRedo.md) plugin |
     *
     * By default, the `undo` option is set to `true`,
     * To disable the [`UndoRedo`](@/api/undoRedo.md) plugin completely,
     * set the `undo` option to `false`.
     *
     * Read more:
     * - [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md)
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category UndoRedo
     *
     * @example
     * ```js
     * // enable the `UndoRedo` plugin
     * undo: true,
     * ```
     */
    undo: true,

    /**
     * @description
     * The `validator` option sets a [cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) for a cell.
     *
     * You can set the `validator` option to one of the following:
     *
     * | Setting              | Description                                                                      |
     * | -------------------- | -------------------------------------------------------------------------------- |
     * | A string             | A [cell validator alias](@/guides/cell-functions/cell-validator/cell-validator.md)              |
     * | A function           | Your [custom cell validator function](@/guides/cell-functions/cell-validator/cell-validator.md) |
     * | A regular expression | A regular expression used for cell validation                                    |
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * By setting the `validator` option to a string,
     * you can use one of the following [cell validator aliases](@/guides/cell-functions/cell-validator/cell-validator.md):
     *
     * | Alias               | Cell validator function                                                 |
     * | ------------------- | ----------------------------------------------------------------------- |
     * | A custom alias      | Your [custom cell validator](@/guides/cell-functions/cell-validator/cell-validator.md) |
     * | `'autocomplete'`    | `AutocompleteValidator`                                                 |
     * | `'date'`            | `DateValidator`                                                         |
     * | `'intl-date'`       | `IntlDateValidator`                                                     |
     * | `'dropdown'`        | `DropdownValidator`                                                     |
     * | `'numeric'`         | `NumericValidator`                                                      |
     * | `'time'`            | `TimeValidator`                                                         |
     * | `'intl-time'`       | `IntlTimeValidator`                                                     |
     *
     * To set the [`editor`](#editor), [`renderer`](#renderer), and [`validator`](#validator)
     * options all at once, use the [`type`](#type) option.
     *
     * Read more:
     * - [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
     * - [Cell type](@/guides/cell-types/cell-type/cell-type.md)
     * - [Configuration options: Cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration)
     * - [`type`](#type)
     *
     * @memberof Options#
     * @type {Function|RegExp|string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *    {
     *      // use a built-in `numeric` cell validator
     *      validator: 'numeric'
     *    },
     *    {
     *      // validate against a regular expression
     *      validator: /^[0-9]$/
     *    },
     *    {
     *      // add a custom cell validator function
     *      validator(value, callback) {
     *          ...
     *      }
     *    },
     * ],
     * ```
     */
    validator: undefined,

    /**
     * @description
     * The [`sourceDataValidator`](@/api/options.md#sourcedatavalidator) option sets a function that validates values
     * when they are written to the source data layer. Validation runs on table initialization and when calling
     * [`loadData`](@/api/core.md#loaddata), [`updateData`](@/api/core.md#updatedata), or
     * [`setSourceDataAtCell`](@/api/core.md#setsourcedataatcell). It does not run for the `setData*` family of methods.
     *
     * Return `true` from the function to mark the value as valid, or `false` to mark it invalid. When a value is
     * invalid and [`allowInvalid`](@/api/options.md#allowinvalid) is `false`, it is replaced with `null` in the
     * source (on initialization and when calling `loadData` or `updateData`). When `allowInvalid` is `true`, invalid
     * values are kept; a warning is still logged when the validator returns `false`. An exception:
     * [`setSourceDataAtCell`](@/api/core.md#setsourcedataatcell) - when the validator returns `false`, the write is
     * skipped and the cell is not nullified; the previous value in the source remains unchanged. Use
     * [`allowEmpty`](@/api/options.md#allowempty) to treat `null`, `undefined`, or `''` as valid when appropriate.
     *
     * Optionally set [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) to customize the
     * message logged for invalid values.
     *
     * @example
     * ```js
     * sourceDataWarningMessage: 'The source data is invalid.',
     * sourceDataValidator: (value, cellMeta) => {
     *   if (cellMeta.allowEmpty && value == null) {
     *     return true;
     *   }
     *
     *   if (typeof value === 'string') {
     *     return true;
     *   }
     *
     *   return false;
     * }
     * ```
     *
     * @memberof Options#
     * @since 17.0.0
     * @type {function(*, CellMeta): (boolean)}
     * @default undefined
     * @category Core
     */
    sourceDataValidator: undefined,

    /**
     * @description
     * The [`sourceDataWarningMessage`](@/api/options.md#sourcedatawarningmessage) option sets the message used when
     * a value fails [`sourceDataValidator`](@/api/options.md#sourcedatavalidator). When not set, no message is logged.
     *
     * @example
     * ```js
     * sourceDataWarningMessage: 'The source data is invalid.',
     * ```
     *
     * @memberof Options#
     * @since 17.0.0
     * @type {string}
     * @default undefined
     * @category Core
     */
    sourceDataWarningMessage: undefined,

    /**
     * @description
     * The `valueGetter` option configures a function that defines what value will be used when displaying the cell content.
     * It can be used to modify the value of a cell before it is displayed (for example, for object-based data).
     *
     * @example
     * ```js
     * // use the `label` property of the value object with a fallback to the value itself
     * valueGetter: (value, row, column, cellMeta) => {
     *   return value?.label ?? value;
     * }
     * ```
     *
     * @memberof Options#
     * @type {function(*, number, number): *}
     * @param {*} value The value to be displayed in the cell.
     * @param {number} row The visual row index of the cell.
     * @param {number} column The visual column index of the cell.
     * @param {object} cellMeta The cell meta object.
     * @since 16.1.0
     * @default undefined
     * @category Core
     */
    valueGetter: undefined,

    /**
     * @description
     * The `valueSetter` option configures a function that defines what value will be used when setting the cell content.
     * It can be used to modify the value of a cell before it is saved (for example, for object-based data).
     *
     * @example
     * ```js
     * // Modify the value of a cell before it is saved
     * valueSetter: (value, row, column, cellMeta) => {
     *   return { id: value?.id ?? value, value: `${value?.value ?? value} at ${row}, ${column}` }
     * },
     * ```
     *
     * @memberof Options#
     * @type {function(*, number, number): *}
     * @param {*} value The value to be set to a cell.
     * @param {number} row The visual row index of the cell.
     * @param {number} column The visual column index of the cell.
     * @param {object} cellMeta The cell meta object.
     * @since 16.1.0
     * @default undefined
     * @category Core
     */
    valueSetter: undefined,

    /**
     * @description
     * The `viewportColumnRenderingOffset` option configures the number of columns
     * to be rendered outside of the grid's viewport.
     *
     * You can set the `viewportColumnRenderingOffset` option to one of the following:
     *
     * | Setting            | Description                                             |
     * | ------------------ | ------------------------------------------------------- |
     * | `auto` (default)   | Use the offset calculated automatically by Handsontable |
     * | A number           | Set the offset manually                                 |
     *
     * The `viewportColumnRenderingOffset` setting is ignored when [`renderAllColumns`](#renderAllColumns) is set to `true`.
     *
     * Read more:
     * - [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
     *
     * @memberof Options#
     * @type {number|'auto'}
     * @default 'auto'
     * @category Core
     *
     * @example
     * ```js
     * // render 70 columns outside of the grid's viewport
     * viewportColumnRenderingOffset: 70,
     * ```
     */
    viewportColumnRenderingOffset: 'auto',

    /**
     * @description
     * The `viewportRowRenderingOffset` option configures the number of rows
     * to be rendered outside of the grid's viewport.
     *
     * You can set the `viewportRowRenderingOffset` option to one of the following:
     *
     * | Setting            | Description                                             |
     * | ------------------ | ------------------------------------------------------- |
     * | `auto` (default)   | Use the offset calculated automatically by Handsontable |
     * | A number           | Set the offset manually                                 |
     *
     * The `viewportRowRenderingOffset` setting is ignored when [`renderAllRows`](#renderAllRows) is set to `true`.
     *
     * Read more:
     * - [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
     * - [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
     *
     * @memberof Options#
     * @type {number|'auto'}
     * @default 'auto'
     * @category Core
     *
     * @example
     * ```js
     * // render 70 rows outside of the grid's viewport
     * viewportRowRenderingOffset: 70,
     * ```
     */
    viewportRowRenderingOffset: 'auto',

    /**
     * @description
     * The `viewportColumnRenderingThreshold` option configures what column number starting from the left or right
     * (depends on the scroll direction) should trigger the rendering of columns outside of the grid's viewport.
     *
     * You can set the `viewportColumnRenderingThreshold` option to one of the following:
     *
     * | Setting            | Description                                             |
     * | ------------------ | ------------------------------------------------------- |
     * | `auto`             | Triggers rendering at half the offset defined by [`viewportColumnRenderingOffset`](#viewportColumnRenderingOffset) option |
     * | A number           | Sets the offset manually (`0` is a default)             |
     *
     * The `viewportColumnRenderingThreshold` setting is ignored when [`renderAllColumn`](#renderAllColumn) is set to `true`.
     *
     * Read more:
     * - [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
     * - [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
     *
     * @memberof Options#
     * @since 1.14.7
     * @type {number|'auto'}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // render 12 columns outside of the grid's viewport
     * viewportColumnRenderingOffset: 12,
     * // the columns outside of the viewport will be rendered when the user scrolls to the 8th column from/to
     * viewportColumnRenderingThreshold: 8,
     * ```
     */
    viewportColumnRenderingThreshold: 0,

    /**
     * @description
     * The `viewportRowRenderingThreshold` option configures what row number starting from the top or bottom
     * (depends on the scroll direction) should trigger the rendering of rows outside of the grid's viewport.
     *
     * You can set the `viewportRowRenderingThreshold` option to one of the following:
     *
     * | Setting            | Description                                             |
     * | ------------------ | ------------------------------------------------------- |
     * | `auto`             | Triggers rendering at half the offset defined by [`viewportRowRenderingOffset`](#viewportRowRenderingOffset) option |
     * | A number           | Sets the offset manually (`0` is a default)             |
     *
     * The `viewportRowRenderingThreshold` setting is ignored when [`renderAllRows`](#renderAllRows) is set to `true`.
     *
     * Read more:
     * - [Performance: Define the number of pre-rendered rows and columns](@/guides/optimization/performance/performance.md#define-the-number-of-pre-rendered-rows-and-columns)
     * - [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
     *
     * @memberof Options#
     * @since 1.14.7
     * @type {number|'auto'}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // render 12 rows outside of the grid's viewport
     * viewportRowRenderingOffset: 12,
     * // the rows outside of the viewport will be rendered when the user scrolls to the 8th row from/to
     * viewportRowRenderingThreshold: 8,
     * ```
     */
    viewportRowRenderingThreshold: 0,

    /**
     * The `visibleRows` option sets the height of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * , [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) and [`multiSelect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)-typed cells' lists.
     *
     * When the number of list options exceeds the `visibleRows` number, a scrollbar appears.
     *
     * ::: tip
     * If the grid has a fixed [`height`](#height) set, the dropdown list may be visually constrained by the available
     * space and show fewer rows than the `visibleRows` value. In such cases, the list is clipped to fit within the grid.
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
     * - [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
     * - [MultiSelect cell type](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md)
     *
     * @memberof Options#
     * @type {number}
     * @default 10
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'autocomplete',
     *     // set the `autocomplete` list's height to 15 options
     *     // for each cell of this column
     *     visibleRows: 15,
     *   },
     *   {
     *     type: 'dropdown',
     *     // set the `dropdown` list's height to 5 options
     *     // for each cell of this column
     *     visibleRows: 5,
     *   },
     *   {
     *     type: 'multiselect',
     *     // set the `multiSelect` list's height to 5 options
     *     // for each cell of this column
     *     visibleRows: 5,
     *   }
     * ],
     * ```
     */
    visibleRows: 10,

    /**
     * The `width` option configures the width of your grid.
     *
     * You can set the `width` option to one of the following:
     *
     * | Setting                                                                    | Example                   |
     * | -------------------------------------------------------------------------- | ------------------------- |
     * | A number of pixels                                                         | `width: 500`              |
     * | A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `width: '75vw'`           |
     * | `'auto'`                                                                   | `width: 'auto'`           |
     * | A function that returns a valid number or string                           | `width() { return 500; }` |
     *
     * With `width: 'auto'`, Handsontable writes `width: auto` as an inline style on the root
     * element. The grid then follows the width of its parent container. Use this value when
     * you want the grid to stay flexible horizontally while still setting an explicit
     * [`height`](#height).
     *
     * ::: tip
     * For horizontal scrolling to work, you must also set the [`height`](#height) option in Handsontable's configuration.
     * Setting `width` alone (without `height`) does not activate the scrollable viewport.
     * Setting the height via inline CSS on the container element is not supported - use the `height` configuration option instead.
     * :::
     *
     * Read more:
     * - [Grid size](@/guides/getting-started/grid-size/grid-size.md)
     *
     * @memberof Options#
     * @type {number|'auto'|string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the grid's width to 500px
     * width: 500,
     *
     * // set the grid's width to 75vw
     * width: '75vw',
     *
     * // let the grid follow its parent container's width
     * width: 'auto',
     *
     * // set the grid's width to 500px, using a function
     * width() {
     *   return 500;
     * },
     * ```
     */
    width: undefined,

    /**
     * The `wordWrap` option configures whether content that exceeds a column's width is wrapped or not.
     *
     * You can set the `wordWrap` option to one of the following:
     *
     * | Setting          | Description                                             |
     * | ---------------- | ------------------------------------------------------- |
     * | `true` (default) | If content exceeds the column's width, wrap the content |
     * | `false`          | Don't wrap content                                      |
     *
     * To style cells that don't wrap content, use the [`noWordWrapClassName`](#noWordWrapClassName) option.
     *
     * ::: tip
     * Word wrapping only applies to content that contains spaces or other soft-wrap opportunities.
     * A long unbroken string without spaces (e.g. a URL or a continuous number sequence) does not wrap
     * regardless of this setting.
     * :::
     *
     * This option can be set at any level of the [cascading configuration](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration):
     * the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), the [`columns`](#columns) level, the [`cells`](#cells) level, and the [`cell`](#cell) level.
     *
     * Read more:
     * - [`noWordWrapClassName`](#noWordWrapClassName)
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // set column width for every column of the entire grid
     * colWidths: 100,
     *
     * columns: [
     *   {
     *     // don't wrap content in this column
     *     wordWrap: false,
     *   },
     *   {
     *     // if content exceeds this column's width, wrap the content
     *     wordWrap: true,
     *   }
     * ],
     * ```
     */
    wordWrap: true,

    /**
     * The `sanitizer` option configures the function used to sanitize HTML before it is written to the DOM.
     * Whenever Handsontable sets HTML (e.g. cell content, headers, context menu labels, dialog content,
     * paste from clipboard), it can pass the string through this function first. Sanitization is important
     * when content comes from users or external sources to prevent XSS (e.g. script injection, event handlers).
     *
     * By default (when no sanitizer is set), HTML is applied as-is (pass-through). You are responsible for
     * XSS protection. Set a sanitizer when you need to allow rich content while stripping or neutralizing
     * dangerous markup.
     *
     * The function receives the raw HTML string and an optional second argument (source) indicating where
     * the content is used (e.g. `'innerHTML'`, `'CopyPaste.paste'`), so you can apply different rules per source.
     * It must return a string that is safe to assign to `innerHTML`.
     *
     * This option is only respected when set in the table settings. It does not work when defined per column
     * or per cell (e.g. in `columns` or cell meta).
     *
     * @since 17.0.0
     * @memberof Options#
     * @type {function(string, string): string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // Allowlist-based sanitization using a custom library
     * sanitizer: (content, source) => myLibrary.sanitize(content),
     * ```
     *
     * @example
     * ```js
     * // Maximum safety: strip all tags and escape output (no rich HTML)
     * sanitizer: (content, source) => {
     *   const tpl = document.createElement('template');
     *
     *   tpl.innerHTML = content;
     *
     *   const text = tpl.content.textContent ?? '';
     *
     *   return text
     *     .replace(/&/g, '&amp;')
     *     .replace(/</g, '&lt;')
     *     .replace(/>/g, '&gt;')
     *     .replace(/"/g, '&quot;')
     *     .replace(/'/g, '&#39;');
     * },
     * ```
     *
     * @example
     * ```js
     * // Trusted Types: wrap sanitization in a policy so the sink accepts the result.
     * // Add the policy name to the CSP trusted-types directive (e.g. trusted-types default handsontable).
     * const policy = window.trustedTypes?.createPolicy('handsontable', {
     *   createHTML: (input) => myLibrary.sanitize(input),
     * });
     *
     * sanitizer: (content, source) =>
     *   policy ? policy.createHTML(content) : myLibrary.sanitize(content),
     * ```
     */
    sanitizer: undefined,

    /**
     * The `parsePastedValue` option determines how pasted content is written to cells when the user pastes
     * from the clipboard into Handsontable (e.g. from another Handsontable instance or between cells in the same table).
     * It does not affect how other applications read or process the clipboard.
     *
     * When set to `false`, pasted content is written as plain strings. Non-scalar values (e.g. objects) are coerced
     * to string, so an object becomes `"[object Object]"`.
     *
     * When set to `true`, pasted text is parsed so that JSON-like (or other supported) values are converted to
     * JavaScript values and written to the data source. This allows copying and pasting more sophisticated JavaScript
     * structures (e.g. objects, arrays) between cells and between Handsontable instances. Cells then store the resulting
     * object (e.g. `{ id: 1, value: 'A1' }`). Schema validation is relaxed so object-based values can be pasted into
     * cells that would normally expect a scalar.
     *
     * You can set the `parsePastedValue` option to one of the following:
     *
     * | Setting           | Description                                      |
     * | ----------------- | ------------------------------------------------ |
     * | `false` (default) | Write pasted content as plain strings            |
     * | `true`            | Parse pasted text and write JavaScript values    |
     *
     * @since 17.0.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category CopyPaste
     *
     * @example
     * ```js
     * // write pasted content as strings (objects become "[object Object]")
     * parsePastedValue: false,
     * ```
     *
     * @example
     * ```js
     * // parse pasted text so cells receive JavaScript objects when pasted content is object-like
     * parsePastedValue: true,
     * ```
     */
    parsePastedValue: false,

  };
};
