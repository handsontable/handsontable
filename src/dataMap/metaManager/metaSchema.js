import { isEmpty } from '../../helpers/mixed';
import { isObjectEqual } from '../../helpers/object';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @alias Options
 * @class Options
 * @description
 *
 * [Configuration options](@/guides/getting-started/setting-options.md) let you heavily customize your Handsontable instance. For example, you can:
 *
 * - Enable and disable built-in features
 * - Enable and configure additional [plugins](@/guides/building-and-testing/plugins.md)
 * - Personalize Handsontable's look
 * - Adjust Handsontable's behavior
 * - Implement your own custom features
 *
 * To apply [configuration options](@/guides/getting-started/setting-options.md), pass them as
 * a second argument of the [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid),
 * using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):
 *
 * ```js
 * const container = document.getElementById('example');
 *
 * const hot = new Handsontable(container, {
 *   // configuration options, in the object literal notation
 *   licenseKey: "non-commercial-and-evaluation",
 *   data: Handsontable.helper.createSpreadsheetData(5, 10),
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
 *
 * Depending on your needs, you can apply [configuration options](@/api/options.md) to different elements of your grid, such as:
 * - [The entire grid](@/guides/getting-started/setting-options.md#setting-grid-options)
 * - [Individual columns](@/guides/getting-started/setting-options.md#setting-column-options)
 * - [Individual rows](@/guides/getting-started/setting-options.md#setting-row-options)
 * - [Individual cells](@/guides/getting-started/setting-options.md#setting-cell-options)
 * - [Individual grid elements, based on any logic you implement](@/guides/getting-started/setting-options.md#implementing-custom-logic)
 *
 * Read more:
 * - [Configuration options &#8594;](@/guides/getting-started/setting-options.md)
 */
export default () => {
  return {
    /**
     * The `licenseKey` option sets your Handsontable license key.
     *
     * You can set the `licenseKey` option to one of the following:
     *
     * | Setting                                                                                                 | Description                                                                                       |
     * | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
     * | A string with your [commercial license key](@/guides/getting-started/license-key.md#commercial-license) | For [commercial use](@/guides/technical-specification/software-license.md#commercial-use)         |
     * | `'non-commercial-and-evaluation'`                                                                       | For [non-commercial use](@/guides/technical-specification/software-license.md#non-commercial-use) |
     *
     * Read more:
     * - [License key &#8594;](@/guides/getting-started/license-key.md)
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
    licenseKey: void 0,

    /* eslint-disable jsdoc/require-description-complete-sentence */
    /**
     * @description
     * The `data` option sets the initial [data](@/guides/getting-started/binding-to-data.md) of your Handsontable instance.
     *
     * Handsontable's data is bound to your source data __by reference__ (i.e. when you edit Handsontable's data, your source data alters as well).
     *
     * You can set the `data` option:
     * - Either to an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays).
     * - Or to an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects).
     *
     * Read more:
     * - [Binding to data &#8594;](@/guides/getting-started/binding-to-data.md)
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
     * ```
     */
    data: void 0,

    /* eslint-disable jsdoc/require-description-complete-sentence */

    /**
     * @description
     * When the [`data`](#data) option is set to an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects)
     * (or is empty), the `dataSchema` option defines the structure of new rows.
     *
     * Read more:
     * - [Binding to data: Array of objects with custom data schema &#8594;](@/guides/getting-started/binding-to-data.md#array-of-objects-with-custom-data-schema)
     *
     * @memberof Options#
     * @type {object}
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
    dataSchema: void 0,

    /**
     * The `width` option configures the width of your grid.
     *
     * You can set the `width` option to one of the following:
     *
     * | Setting                                                                    | Example                                                   |
     * | -------------------------------------------------------------------------- | --------------------------------------------------------- |
     * | A number of pixels                                                         | `width: 500`                                              |
     * | A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `width: '75vw'`                                           |
     * | A function that returns a valid number or string                           | `width: function() {`<br>&nbsp;&nbsp;`return 500;`<br>`}` |
     *
     * Read more:
     * - [Grid size &#8594;](@/guides/getting-started/grid-size.md)
     *
     * @memberof Options#
     * @type {number|string|Function}
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
     * // set the grid's width to 500px, using a function
     * width: function() {
     *   return 500;
     * },
     * ```
     */
    width: void 0,

    /**
     * The `height` option configures the height of your grid.
     *
     * You can set `height` option to one of the following:
     *
     * | Setting                                                                    | Example                                                    |
     * | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
     * | A number of pixels                                                         | `height: 500`                                              |
     * | A string with a [CSS unit](https://www.w3schools.com/cssref/css_units.asp) | `height: '75vw'`                                           |
     * | A function that returns a valid number or string                           | `height: function() {`<br>&nbsp;&nbsp;`return 500;`<br>`}` |
     *
     * Read more:
     * - [Grid size &#8594;](@/guides/getting-started/grid-size.md)
     *
     * @memberof Options#
     * @type {number|string|Function}
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
     * // set the grid's height to 500px, using a function
     * height: function() {
     *   return 500;
     * },
     * ```
     */
    height: void 0,

    /**
     * @description
     * If the [`data`](#data) option is not set, the `startRows` option sets the initial number of empty rows.
     *
     * The `startRows` option works only in Handsontable's constructor.
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
     * If the [`data`](#data) option is not set, the `startCols` option sets the initial number of empty columns.
     *
     * The `startCols` option works only in Handsontable's constructor.
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
     * The `rowHeaders` option configures your grid's row headers.
     *
     * You can set the `rowHeaders` option to one of the following:
     *
     * | Setting  | Description                                                       |
     * | -------- | ----------------------------------------------------------------- |
     * | `true`   | Enable the default row headers ("1", "2", "3", ...)               |
     * | `false`  | Disable row headers                                               |
     * | An array | Define your own row headers (e.g. `['One', 'Two', 'Three', ...]`) |
     *
     * Read more:
     * - [Row header &#8594;](@/guides/rows/row-header.md)
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
     * rowHeaders: function(rowIndex) {
     *   return rowIndex + ': AB';
     * },
     * ```
     */
    rowHeaders: void 0,

    /**
     * The `colHeaders` option configures your grid's column headers.
     *
     * You can set the `colHeaders` option to one of the following:
     *
     * | Setting  | Description                                                          |
     * | -------- | -------------------------------------------------------------------- |
     * | `true`   | Enable the default column headers ("A", "B", "C", ...)               |
     * | `false`  | Disable column headers                                               |
     * | An array | Define your own column headers (e.g. `['One', 'Two', 'Three', ...]`) |
     *
     * Read more:
     * - [Column header &#8594;](@/guides/columns/column-header.md)
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
     * colHeaders: function(columnIndex) {
     *   return columnIndex + ': AB';
     * },
     * ```
     */
    colHeaders: null,

    /**
     * The `colWidths` option sets columns' widths, in pixels.
     *
     * In the rendering process, the default column width is 50px. To change it,
     * set the `colWidths` option to one of the following:
     *
     * | Setting     | Description                                                                                          | Example                                                       |
     * | ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
     * | A number    | Set the same width for every column                                                                  | `colWidths: 100`                                              |
     * | A string    | Set the same width for every column                                                                  | `colWidths: '100px'`                                          |
     * | An array    | Set widths separately for each column                                                                | `colWidths: [100, 120, undefined]`                            |
     * | A function  | Set column widths dynamically,<br>on each render                                                     | `colWidths: function(index) {`<br>`return index * 10;`<br>`}` |
     * | `undefined` | Used by the [modifyColWidth](@/api/hooks.md#modifyColWidth) hook,<br>to detect column width changes. | `colWidths: undefined`                                        |
     *
     * Setting the `colWidths` option disables the {@link AutoColumnSize} plugin.
     *
     * Read more:
     * - [Column width &#8594;](@/guides/columns/column-width.md)
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
     * // set the third (by visual index) column's width to `undefined`
     * // set any other column's width to the default 50px
     * colWidths: [100, 120, undefined],
     *
     * // set each column's width individually, using a function
     * colWidths: function(index) {
     *   return index * 10;
     * },
     * ```
     */
    colWidths: void 0,

    /**
     * The `rowHeights` option sets rows' heights, in pixels.
     *
     * In the rendering process, the default row height is 23px.
     * You can change it to equal or greater than 23px, by setting the `rowHeights` option to one of the following:
     *
     * | Setting     | Description                                                                                         | Example                                                                    |
     * | ----------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
     * | A number    | Set the same height for every row                                                                   | `rowHeights: 100`                                                          |
     * | A string    | Set the same height for every row                                                                   | `rowHeights: '100px'`                                                      |
     * | An array    | Set heights separately for each row                                                                 | `rowHeights: [100, 120, undefined]`                                        |
     * | A function  | Set row heights dynamically,<br>on each render                                                      | `rowHeights: function(index) {`<br>&nbsp;&nbsp;`return index * 10;`<br>`}` |
     * | `undefined` | Used by the [modifyRowHeight](@/api/hooks.md#modifyRowHeight) hook,<br>to detect row height changes | `rowHeights: undefined`                                                    |
     *
     * The `rowHeights` option also sets the minimum row height that can be set
     * via the {@link ManualRowResize} and {@link AutoRowSize} plugins (if they are enabled).
     *
     * Read more:
     * - [Row height &#8594;](@/guides/row/row-height.md)
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
     * // set any other row's height to the default 23px
     * rowHeights: [100, 120, undefined],
     *
     * // set each row's height individually, using a function
     * rowHeights: function(index) {
     *   return index * 10;
     * },
     * ```
     */
    rowHeights: void 0,

    /**
     * @description
     * The `columns` option lets you apply [configuration options](@/guides/getting-started/setting-options.md) to individual columns (or ranges of columns).
     *
     * You can set the `columns` option to one of the following:
     * - An array of objects (each object represents one column)
     * - A function that returns an array of objects
     *
     * The `columns` option overwrites the [top-level grid options](@/guides/getting-started/setting-options.md#setting-grid-options).
     *
     * When you use the `columns` option, the [`startCols`](#startCols), [`minCols`](#minCols), and [`maxCols`](#maxCols) are ignored.
     *
     * Read more:
     * - [Configuration options: Setting column options &#8594;](@/guides/getting-started/setting-options.md#setting-column-options)
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
     *       pattern: '0,0.00 $'
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
     * columns: function(index) {
     *   return {
     *     type: index > 0 ? 'numeric' : 'text',
     *     readOnly: index < 1
     *   }
     * }
     * ```
     */
    columns: void 0,

    /**
     * @description
     * The `cells` option lets you apply [configuration options](@/guides/getting-started/setting-options.md) to
     * individual grid elements (columns, rows, cells), based on any logic you implement.
     *
     * The `cells` option overwrites all other options (including options set by [`columns`](#columns) and [`cell`](#cell)).
     * It takes the following parameters:
     *
     * | Parameter | Required | Type             | Description                                                                                                                                                                                                                                                                                                                             |
     * | --------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `row`     | Yes      | Number           | A physical row index                                                                                                                                                                                                                                                                                                                    |
     * | `column`  | Yes      | Number           | A physical column index                                                                                                                                                                                                                                                                                                                 |
     * | `prop`    | No       | String \| Number | If [`data`](#data) is set to an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays), `prop` is the same number as `column`.<br><br>If [`data`](#data) is set to an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects), `prop` is a property name for the column's data object. |
     *
     * Read more:
     * - [Configuration options: Implementing custom logic &#8594;](@/guides/getting-started/setting-options.md#implementing-custom-logic)
     * - [Configuration options: Setting row options &#8594;](@/guides/getting-started/setting-options.md#setting-row-options)
     *
     * @memberof Options#
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set the `cells` option to your custom function
     * cells: function(row, column, prop) {
     *   const cellProperties = { readOnly: false };
     *   const visualRowIndex = this.instance.toVisualRow(row);
     *   const visualColIndex = this.instance.toVisualColumn(column);
     *
     *   if (visualRowIndex === 0 && visualColIndex === 0) {
     *     cellProperties.readOnly = true;
     *   }
     *
     *   return cellProperties;
     * },
     * ```
     */
    cells: void 0,

    /**
     * The `cell` option lets you apply [configuration options](@/guides/getting-started/setting-options.md) to individual cells.
     *
     * The `cell` option overwrites the [top-level grid options](@/guides/getting-started/setting-options.md#setting-grid-options),
     * and the [`columns`](#columns) options.
     *
     * Read more:
     * - [Configuration options: Setting cell options &#8594;](@/guides/getting-started/setting-options.md#setting-cell-options)
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
     * The `comments` option enables and configures the [`Comments`](@/api/comments.md) plugin.
     *
     * You can set the `comments` option to one of the following:
     *
     * | Setting   | Description                                                                                                                                                                           |
     * | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true`    | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md)                                 |
     * | `false`   | Disable the [`Comments`](@/api/comments.md) plugin                                                                                                                                    |
     * | An object | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md)<br>- Configure comment settings |
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
     * - [Comments &#8594;](@/guides/cell-features/comments.md)
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
     * // or enable the `Comments` plugin
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
     * The `customBorders` option enables and configures the [`CustomBorders`](@/api/customBorders.md) plugin.
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * (and add its menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md)),
     * set the `customBorders` option to `true`.
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * and add a predefined border around a particular cell,
     * set the `customBorders` option to an array of objects.
     * Each object represents a border configuration for one cell, and has the following properties:
     *
     * | Property | Sub-properties     | Types                              | Description                                                       |
     * | -------- | ------------------ | ---------------------------------- | ----------------------------------------------------------------- |
     * | `row`    | -                  | `row`: Number                      | The cell's row coordinate.                                        |
     * | `col`    | -                  | `col`: Number                      | The cell's column coordinate.                                     |
     * | `left`   | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the left border's width (`width`)<br> and color (`color`).   |
     * | `right`  | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the right border's width (`width`)<br> and color (`color`).  |
     * | `top`    | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the top border's width (`width`)<br> and color (`color`).    |
     * | `bottom` | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the bottom border's width (`width`)<br> and color (`color`). |
     *
     * To enable the [`CustomBorders`](@/api/customBorders.md) plugin
     * and add a predefined border around a range of cells,
     * set the `customBorders` option to an array of objects.
     * Each object represents a border configuration for a single range of cells, and has the following properties:
     *
     * | Property | Sub-properties                               | Types                                                            | Description                                                                                  |
     * | -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
     * | `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | `from` selects the range's top-left corner.<br>`to` selects the range's bottom-right corner. |
     * | `left`   | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the left border's `width` and `color`.                                                  |
     * | `right`  | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the right border's `width` and `color`.                                                 |
     * | `top`    | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the top border's `width` and `color`.                                                   |
     * | `bottom` | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the bottom border's `width` and `color`.                                                |
     *
     * Read more:
     * - [Formatting cells: Custom cell borders &#8594;](@/guides/cell-features/formatting-cells.md#custom-cell-borders)
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
     * // or enable the `CustomBorders` plugin
     * // and add a predefined border for a particular cell
     * customBorders: [
     *   // add an object with a border configuration for one cell
     *   {
     *     // set the cell's row coordinate
     *     row: 2,
     *     // set the cell's column coordinate
     *     col: 2,
     *     // set the left border's width and color
     *     left: {
     *       width: 2,
     *       color: 'red'
     *     },
     *     // set the right border's width and color
     *     right: {
     *       width: 1,
     *       color: 'green'
     *     },
     *     // set the top border's width and color
     *     top: '',
     *     // set the bottom border's width and color
     *     bottom: ''
     *   }
     * ],
     *
     * // or enable the `CustomBorders` plugin
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
     *     // set the left border's width and color
     *     left: {
     *       width: 2,
     *       color: 'red'
     *     },
     *     // set the right border's width and color
     *     right: {},
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
     * The `minRows` option sets a minimum number of rows that Handsontable has to create at initialization.
     *
     * If the `minRows` value is higher than the initial number of rows, Handsontable adds empty rows at the bottom.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // at Handsontable's initialization, create at least 10 rows
     * minRows: 10,
     * ```
     */
    minRows: 0,

    /**
     * The `minCols` option sets a minimum number of columns that Handsontable has to create at initialization.
     *
     * If the `minCols` value is higher than the initial number of columns, Handsontable adds empty columns to the right.
     *
     * The `minCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays).
     * When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects),
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
     * // at Handsontable's initialization, create at least 10 columns
     * minCols: 10,
     * ```
     */
    minCols: 0,

    /**
     * The `maxRows` option sets a maximum number of rows that Handsontable can create at initialization.
     *
     * If the `maxRows` value is lower than the initial number of rows, Handsontable trims rows from the bottom.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // at Handsontable's initialization, create no more than 300 rows
     * maxRows: 300,
     * ```
     */
    maxRows: Infinity,

    /**
     * The `maxCols` option sets a maximum number of columns that Handsontable can create at initialization.
     *
     * If the `maxCols` value is lower than the initial number of columns, Handsontable trims rows from the right.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // at Handsontable's initialization, create no more than 300 columns
     * maxCols: 300,
     * ```
     */
    maxCols: Infinity,

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
     * The `minSpareCols` option sets a minimum number of empty columns
     * at the grid's right-hand end.
     *
     * If there already are other empty columns at the grid's right-hand end,
     * they are counted into the `minSpareCols` value.
     *
     * The total number of columns can't exceed the [`maxCols`](#maxCols) value.
     *
     * The `minSpareCols` option works only when your [`data`](#data) is an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays).
     * When your [`data`](#data) is an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects),
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
     * If set to `true`, the `allowInsertRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md):
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
     * // hide the "Insert row above" and "Insert row below" menu items from the context menu
     * allowInsertRow: false,
     * ```
     */
    allowInsertRow: true,

    /**
     * If set to `true`, the `allowInsertColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md):
     * - **Insert column left**
     * - **Insert column right**
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the "Insert column left" and "Insert column right" menu items from the context menu
     * allowInsertColumn: false,
     * ```
     */
    allowInsertColumn: true,

    /**
     * If set to `true`, the `allowRemoveRow` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md):
     * - **Remove row**
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the "Remove row" menu item from the context menu
     * allowRemoveRow: false,
     * ```
     */
    allowRemoveRow: true,

    /**
     * If set to `true`, the `allowRemoveColumn` option adds the following menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md):
     * - **Remove column**
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide the "Remove column" menu item from the context menu
     * allowRemoveColumn: false,
     * ```
     */
    allowRemoveColumn: true,

    /**
     * @description
     * The `selectionMode` option configures how cell selection works.
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
     * - [Selection: Selecting ranges &#8594;](@/guides/cell-features/selection.md#selecting-ranges)
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
     * The `fillHandle` option enables and configures the [Autofill](@/api/autofill.md) plugin.
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
     * - [AutoFill values &#8594;](@/guides/cell-features/autofill-values.md)
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
     * // or enable vertical autofill
     * // with `autoInsertRow` enabled
     * fillHandle: 'vertical',
     *
     * // or enable horizontal autofill
     * // with `autoInsertRow` enabled
     * fillHandle: 'horizontal',
     *
     * // or enable autofill in all directions
     * // with `autoInsertRow` disabled
     * fillHandle: {
     *   autoInsertRow: false,
     * },
     *
     * // or enable vertical autofill
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
     * The `fixedRowsTop` option sets the number of [frozen rows](@/guides/rows/row-freezing.md) at the top of the grid.
     *
     * Read more:
     * - [Row freezing &#8594;](@/guides/rows/row-freezing.md)
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
     * The `fixedRowsBottom` option sets the number of [frozen rows](@/guides/rows/row-freezing.md)
     * at the bottom of the grid.
     *
     * Read more:
     * - [Row freezing &#8594;](@/guides/rows/row-freezing.md)
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
     * The `fixedColumnsLeft` option sets the number of [frozen columns](@/guides/columns/column-freezing.md)
     * at the left-hand side of the grid.
     *
     * Read more:
     * - [Column freezing &#8594;](@/guides/columns/column-freezing.md)
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
     * The `outsideClickDeselects` option determines what happens to the current cell selection
     * when you click outside of the grid.
     *
     * You can set the `outsideClickDeselects` option to one of the following:
     *
     * | Setting          | Description                                                              |
     * | ---------------- | ------------------------------------------------------------------------ |
     * | `true` (default) | On a mouse click outside of the grid, clear the current cell selection   |
     * | `false`          | On a mouse click outside of the grid, keep the current cell selection    |
     * | A function       | A function that takes the click event target and returns a boolean       |
     *
     * @memberof Options#
     * @type {boolean|Function}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // on a mouse click outside of the grid, clear the current cell selection
     * outsideClickDeselects: true,
     *
     * // on a mouse click outside of the grid, keep the current cell selection
     * outsideClickDeselects: false,
     *
     * // take the click event target and return `false`
     * outsideClickDeselects: function(event) {
     *   return false;
     * }
     *
     * // take the click event target and return `true`
     * outsideClickDeselects: function(event) {
     *   return false;
     * }
     * ```
     */
    outsideClickDeselects: true,

    /**
     * The `enterBeginsEditing` option configures the action of the <kbd>Enter</kbd> key.
     *
     * You can set the `enterBeginsEditing` option to one of the following:
     *
     * | Setting          | Description                                                                                                                                                                                               |
     * | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     * | `true` (default) | - On pressing <kbd>Enter</kbd> once, start editing the currently-selected cell<br>- On pressing <kbd>Enter</kbd> twice, move to another cell,<br>as configured by the [`enterMoves`](#enterMoves) setting |
     * | `false`          | - On pressing <kbd>Enter</kbd> once, move to another cell,<br>as configured by the [`enterMoves`](#enterMoves) setting                                                                                    |
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
     * The `enterMoves` option configures the action of the <kbd>Enter</kbd> key.
     *
     * When the [`enterBeginsEditing`](#enterBeginsEditing) option is set to `true`,
     * the `enterMoves` setting applies to the **second** pressing of the <kbd>Enter</kbd> key.
     *
     * When the [`enterBeginsEditing`](#enterBeginsEditing) option is set to `false`,
     * the `enterMoves` setting applies to the **first** pressing of the <kbd>Enter</kbd> key.
     *
     * You can set the `enterMoves` option to an object with the following properties
     * (or to a function that returns such an object):
     *
     * | Property | Type   | Description                                                                                                                                                        |
     * | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `col`    | Number | - On pressing <kbd>Enter</kbd>, move cell selection `col` columns right<br>- On pressing <kbd>Shift</kbd>+<kbd>Enter</kbd>, move cell selection `col` columns left |
     * | `row`    | Number | - On pressing <kbd>Enter</kbd>, move cell selection `row` rows down<br>- On pressing <kbd>Shift</kbd>+<kbd>Enter</kbd>, move cell selection `row` rows up          |
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {col: 0, row: 1}
     * @category Core
     *
     * @example
     * ```js
     * // on pressing Enter, move cell selection 1 column right and 1 row down
     * // on pressing Shift+Enter, move cell selection 1 column left and 1 row up
     * enterMoves: {col: 1, row: 1},
     *
     * // the same setting, as a function
     * // `event` is a DOM Event object received on pressing Enter
     * // you can use it to check whether the user pressed Enter or Shift+Enter
     * enterMoves: function(event) {
     *   return {col: 1, row: 1};
     * },
     * ```
     */
    enterMoves: { col: 0, row: 1 },

    /**
     * The `tabMoves` option configures the action of the <kbd>Tab</kbd> key.
     *
     * You can set the `tabMoves` option to an object with the following properties
     * (or to a function that returns such an object):
     *
     * | Property | Type   | Description                                                                                                                                                        |
     * | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
     * | `row`    | Number | - On pressing <kbd>Tab</kbd>, move cell selection `row` rows down<br>- On pressing <kbd>Shift</kbd>+<kbd>Tab</kbd>, move cell selection `row` rows up              |
     * | `col`    | Number | - On pressing <kbd>Tab</kbd>, move cell selection `col` columns right<br>- On pressing <kbd>Shift</kbd>+<kbd>Tab</kbd>, move cell selection `col` columns left     |
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {row: 0, col: 1}
     * @category Core
     *
     * @example
     * ```js
     * // on pressing Tab, move cell selection 2 rows down and 2 columns right
     * // on pressing Shift+Tab, move cell selection 2 rows up and 2 columns left
     * tabMoves: {row: 2, col: 2},
     *
     * // the same setting, as a function
     * // `event` is a DOM Event object received on pressing Tab
     * // you can use it to check whether the user pressed Tab or Shift+Tab
     * tabMoves: function(event) {
     *   return {row: 2, col: 2};
     * },
     * ```
     */
    tabMoves: { row: 0, col: 1 },

    /**
     * The `autoWrapRow` option determines what happens when you reach the grid's left or right edge, using keyboard navigation.
     *
     * You can set the `autoWrapRow` option to one of the following:
     *
     * | Setting           | Description                                                          |
     * | ----------------- | -------------------------------------------------------------------- |
     * | `true`            | On reaching the grid's left or right edge, jump to the opposite edge |
     * | `false` (default) | On reaching the grid's left or right edge, stop                      |
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // on reaching the grid's left or right edge, jump to the opposite edge
     * autoWrapRow: true,
     * ```
     */
    autoWrapRow: false,

    /**
     * The `autoWrapCol` option determines what happens when you reach the grid's top or bottom edge, using keyboard navigation.
     *
     * You can set the `autoWrapCol` option to one of the following:
     *
     * | Setting           | Description                                                          |
     * | ----------------- | -------------------------------------------------------------------- |
     * | `true`            | On reaching the grid's top or bottom edge, jump to the opposite edge |
     * | `false` (default) | On reaching the grid's top or bottom edge, stop                      |
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // on reaching the grid's top or bottom edge, jump to the opposite edge
     * autoWrapCol: true,
     * ```
     */
    autoWrapCol: false,

    /**
     * @description
     * If set to `true`, the `persistentState` option enables the [`PersistentState`](@/api/persistentState.md) plugin.
     *
     * Read more:
     * - [`PersistentState` &#8594;](@/api/persistentState.md)
     * - [Saving data: Saving data locally](@/guides/getting-started/saving-data.md#saving-data-locally)
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category PersistentState
     *
     * @example
     * ```js
     * // enable the `PersistentState` plugin
     * persistentState: true,
     * ```
     */
    persistentState: void 0,

    /**
     * Class name for all visible rows in the current selection.
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // This will add a 'currentRow' class name to appropriate table cells.
     * currentRowClassName: 'currentRow',
     * ```
     */
    currentRowClassName: void 0,

    /**
     * Class name for all visible columns in the current selection.
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // This will add a 'currentColumn' class name to appropriate table cells.
     * currentColClassName: 'currentColumn',
     * ```
     */
    currentColClassName: void 0,

    /**
     * Class name for all visible headers in current selection.
     *
     * @memberof Options#
     * @type {string}
     * @default 'ht__highlight'
     * @category Core
     *
     * @example
     * ```js
     * // This will add a 'ht__highlight' class name to appropriate table headers.
     * currentHeaderClassName: 'ht__highlight',
     * ```
     */
    currentHeaderClassName: 'ht__highlight',

    /**
     * Class name for all active headers in selections. The header will be marked with this class name
     * only when a whole column or row will be selected.
     *
     * @memberof Options#
     * @type {string}
     * @since 0.38.2
     * @default 'ht__active_highlight'
     * @category Core
     *
     * @example
     * ```js
     * // this will add a 'ht__active_highlight' class name to appropriate table headers.
     * activeHeaderClassName: 'ht__active_highlight',
     * ```
     */
    activeHeaderClassName: 'ht__active_highlight',

    /**
     * Class name for the current element.
     * The interpretation depends on the level on which this option is provided in the [cascading configuration](@/guides/getting-started/setting-options.md).
     * If `className` is provided on the first (constructor) level, it is the applied to the Handsontable container.
     * If `className` is provided on the second (`column`) or the third (`cell` or `cells`) level, it is applied to the table cell.
     *
     * @memberof Options#
     * @type {string|string[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // can be set as a string
     * className: 'your__class--name',
     *
     * // or as an array of strings
     * className: ['first-class-name', 'second-class-name'],
     * ```
     */
    className: void 0,

    /**
     * Class name for all tables inside container element.
     *
     * @memberof Options#
     * @type {string|string[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set custom class for table element
     * tableClassName: 'your__class--name',
     *
     * // or
     * tableClassName: ['first-class-name', 'second-class-name'],
     * ```
     */
    tableClassName: void 0,

    /**
     * @description
     * Defines how the columns react, when the declared table width is different than the calculated sum of all column widths.
     * [See more](@/guides/columns/column-width.md#column-stretching) mode. Possible values:
     *  * `'none'` Disable stretching
     *  * `'last'` Stretch only the last column
     *  * `'all'` Stretch all the columns evenly.
     *
     * @memberof Options#
     * @type {string}
     * @default 'none'
     * @category Core
     *
     * @example
     * ```js
     * // fit table to the container
     * stretchH: 'all',
     * ```
     */
    stretchH: 'none',

    /**
     * Overwrites the default `isEmptyRow` method, which checks if row at the provided index is empty.
     *
     * @memberof Options#
     * @type {Function}
     * @param {number} row Visual row index.
     * @returns {boolean}
     * @category Core
     *
     * @example
     * ```js
     * // define custom checks for empty row
     * isEmptyRow: function(row) {
     *    ...
     * },
     * ```
     */
    isEmptyRow(row) {
      let col;
      let colLen;
      let value;
      let meta;

      for (col = 0, colLen = this.countCols(); col < colLen; col++) {
        value = this.getDataAtCell(row, col);

        if (isEmpty(value) === false) {
          if (typeof value === 'object') {
            meta = this.getCellMeta(row, col);

            return isObjectEqual(this.getSchema()[meta.prop], value);
          }

          return false;
        }
      }

      return true;
    },

    /**
     * Overwrites the default `isEmptyCol` method, which checks if column at the provided index is empty.
     *
     * @memberof Options#
     * @type {Function}
     * @param {number} col Visual column index.
     * @returns {boolean}
     * @category Core
     *
     * @example
     * ```js
     * // define custom checks for empty column
     * isEmptyCol: function(column) {
     *    return false;
     * },
     * ```
     */
    isEmptyCol(col) {
      let row;
      let rowLen;
      let value;

      for (row = 0, rowLen = this.countRows(); row < rowLen; row++) {
        value = this.getDataAtCell(row, col);

        if (isEmpty(value) === false) {
          return false;
        }
      }

      return true;
    },

    /**
     * When set to `true`, the table is re-rendered when it is detected that it was made visible in DOM.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // don't rerender the table on visibility changes
     * observeDOMVisibility: false,
     * ```
     */
    observeDOMVisibility: true,

    /**
     * If set to `true`, Handsontable will accept values that were marked as invalid by the cell `validator`. It will
     * result with *invalid* cells being treated as *valid* (will save the *invalid* value into the Handsontable data source).
     * If set to `false`, Handsontable will *not* accept the invalid values and won't allow the user to close the editor.
     * This option will be particularly useful when used with the Autocomplete's `strict` mode.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // don't save the invalid values
     * allowInvalid: false,
     * ```
     */
    allowInvalid: true,

    /**
     * If set to `true`, Handsontable will accept values that are empty (`null`, `undefined` or `''`). If set
     * to `false`, Handsontable will *not* accept the empty values and mark cell as invalid.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // allow empty values for all cells (whole table)
     * allowEmpty: true,
     *
     * // or
     * columns: [
     *   {
     *     data: 'date',
     *     dateFormat: 'DD/MM/YYYY',
     *     // allow empty values only for the 'date' column
     *     allowEmpty: true
     *   }
     * ],
     * ```
     */
    allowEmpty: true,

    /**
     * CSS class name for cells that did not pass validation.
     *
     * @memberof Options#
     * @type {string}
     * @default 'htInvalid'
     * @category Core
     *
     * @example
     * ```js
     * // set custom validation error class
     * invalidCellClassName: 'highlight--error',
     * ```
     */
    invalidCellClassName: 'htInvalid',

    /**
     * When set to an non-empty string, displayed as the cell content for empty cells. If a value of a different type is provided,
     * it will be stringified and applied as a string.
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // add custom placeholder content to empty cells
     * placeholder: 'Empty Cell',
     * ```
     */
    placeholder: void 0,

    /**
     * CSS class name for cells that have a placeholder in use.
     *
     * @memberof Options#
     * @type {string}
     * @default 'htPlaceholder'
     * @category Core
     *
     * @example
     * ```js
     * // set custom placeholder class
     * placeholderCellClassName: 'has-placeholder',
     * ```
     */
    placeholderCellClassName: 'htPlaceholder',

    /**
     * CSS class name for read-only cells.
     *
     * @memberof Options#
     * @type {string}
     * @default 'htDimmed'
     * @category Core
     *
     * @example
     * ```js
     * // set custom read-only class
     * readOnlyCellClassName: 'is-readOnly',
     * ```
     */
    readOnlyCellClassName: 'htDimmed',

    /* eslint-disable jsdoc/require-description-complete-sentence */
    /**
     * @description
     * If a string is provided, it may be one of the following predefined values:
     * * `autocomplete`,
     * * `checkbox`,
     * * `html`,
     * * `numeric`,
     * * `password`.
     * * `text`.
     *
     * Or you can [register](@/guides/cell-functions/cell-renderer.md) the custom renderer under specified name and use its name as an alias in your
     * configuration.
     *
     * If a function is provided, it will receive the following arguments:
     * ```js
     * function(instance, TD, row, col, prop, value, cellProperties) {}
     * ```
     *
     * You can read more about custom renderes [in the documentation](@/guides/cell-functions/cell-renderer.md).
     *
     * @memberof Options#
     * @type {string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // register custom renderer
     * Handsontable.renderers.registerRenderer('my.renderer', function(instance, TD, row, col, prop, value, cellProperties) {
     *   TD.innerHTML = value;
     * });
     *
     * // use it for selected column:
     * columns: [
     *   {
     *     // as a string with the name of build in renderer
     *     renderer: 'autocomplete',
     *     editor: 'select'
     *   },
     *   {
     *     // as an alias to custom renderer registered above
     *     renderer: 'my.renderer'
     *   },
     *   {
     *     // renderer as custom function
     *     renderer: function(hotInstance, TD, row, col, prop, value, cellProperties) {
     *       TD.style.color = 'blue';
     *       TD.innerHTML = value;
     *     }
     *   }
     * ],
     * ```
     */
    renderer: void 0,

    /* eslint-enable jsdoc/require-description-complete-sentence */

    /**
     * CSS class name added to the commented cells.
     *
     * @memberof Options#
     * @type {string}
     * @default 'htCommentCell'
     * @category Core
     *
     * @example
     * ```js
     * // set custom class for commented cells
     * commentedCellClassName: 'has-comment',
     * ```
     */
    commentedCellClassName: 'htCommentCell',

    /**
     * If set to `true`, it enables the browser's native selection of a fragment of the text within a single cell, between
     * adjacent cells or in a whole table. If set to `'cell'`, it enables the possibility of selecting a fragment of the
     * text within a single cell's body.
     *
     * @memberof Options#
     * @type {boolean|string}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable text selection within table
     * fragmentSelection: true,
     *
     * // or
     * // enable text selection within cells only
     * fragmentSelection: 'cell',
     * ```
     */
    fragmentSelection: false,

    /**
     * @description
     * Makes cell, column or comment [read only](@/guides/cell-features/disabled-cells.md#read-only-columns).
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // set as read only
     * readOnly: true,
     * ```
     */
    readOnly: false,

    /**
     * @description
     * When added to a `column` property, it skips the column on paste and pastes the data on the next column to the right.
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
     *     // don't paste data to this column
     *     skipColumnOnPaste: true
     *   }
     * ],
     * ```
     */
    skipColumnOnPaste: false,

    /**
     * @description
     * When added to a cell property, it skips the row on paste and pastes the data on the following row.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * cells: function(row, column) {
     *  const cellProperties = {};
     *
     *  // don't paste data to the second row
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
     * @description
     * If set to `true`, enables the {@link Search} plugin with a default configuration.
     * If set to an object, enables the {@link Search} plugin with a custom configuration.
     * See the guide on [how to search values in Handsontable](@/guides/accessories-and-menus/searching-values.md).
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default false
     * @category Search
     *
     * @example
     * ```js
     * // set to `true`, to enable the Search plugin with a default configuration
     * search: true,
     * // or set to an object, to enable the Search plugin with a custom configuration
     * search: {
     *   searchResultClass: 'customClass',
     *   queryMethod: function(queryStr, value) {
     *     ...
     *   },
     *   callback: function(instance, row, column, value, result) {
     *     ...
     *   }
     * }
     *
     * // set to `false, to disable the Search plugin
     * search: false,
     * ```
     */
    search: false,

    /**
     * @description
     * Shortcut to define the combination of the cell renderer, editor and validator for the column, cell or whole table.
     *
     * Possible values:
     *  * [autocomplete](@/guides/cell-types/autocomplete-cell-type.md)
     *  * [checkbox](@/guides/cell-types/checkbox-cell-type.md)
     *  * [date](@/guides/cell-types/date-cell-type.md)
     *  * [dropdown](@/guides/cell-types/dropdown-cell-type.md)
     *  * [handsontable](@/guides/cell-types/handsontable-cell-type.md)
     *  * [numeric](@/guides/cell-types/numeric-cell-type.md)
     *  * [password](@/guides/cell-types/password-cell-type.md)
     *  * text
     *  * [time](@/guides/cell-types/time-cell-type.md).
     *
     * Or you can register the custom cell type under specified name and use
     * its name as an alias in your configuration.
     *
     * @memberof Options#
     * @type {string}
     * @default 'text'
     * @category Core
     *
     * @example
     * ```js
     * // register custom cell type:
     * Handsontable.cellTypes.registerCellType('my.type', {
     *   editor: MyEditorClass,
     *   renderer: function(hot, td, row, col, prop, value, cellProperties) {
     *     td.innerHTML = value;
     *   },
     *   validator: function(value, callback) {
     *     callback(value === 'foo' ? true : false);
     *   }
     * });
     *
     * // use it in column settings:
     * columns: [
     *   {
     *     type: 'text'
     *   },
     *   {
     *     // an alias to custom type
     *     type: 'my.type'
     *   },
     *   {
     *     type: 'checkbox'
     *   }
     * ],
     * ```
     */
    type: 'text',

    /**
     * @description
     * Makes a cell copyable (pressing <kbd>CTRL</kbd> + <kbd>C</kbd> on your keyboard moves its value to system clipboard).
     *
     * __Note:__ this setting is `false` by default for cells with type `password`.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * cells: [
     *   {
     *     cell: 0,
     *     row: 0,
     *     // cell with coordinates (0, 0) can't be copied
     *     copyable: false,
     *   }
     * ],
     * ```
     */
    copyable: true,

    /**
     * Defines the editor for the table/column/cell.
     *
     * If a string is provided, it may be one of the following predefined values:
     *  * [autocomplete](@/guides/cell-types/autocomplete-cell-type.md)
     *  * [checkbox](@/guides/cell-types/checkbox-cell-type.md)
     *  * [date](@/guides/cell-types/date-cell-type.md)
     *  * [dropdown](@/guides/cell-types/dropdown-cell-type.md)
     *  * [handsontable](@/guides/cell-types/handsontable-cell-type.md)
     *  * mobile
     *  * [password](@/guides/cell-types/password-cell-type.md)
     *  * [select](@/guides/cell-types/select-cell-type.md)
     *  * text.
     *
     * Or you can [register](@/guides/cell-functions/cell-editor.md#registering-an-editor) the custom editor under specified name and use its name as an alias in your
     * configuration.
     *
     * To disable cell editing completely set `editor` property to `false`.
     *
     * @memberof Options#
     * @type {string|Function|boolean}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     // set editor for the first column
     *     editor: 'select'
     *   },
     *   {
     *     // disable editor for the second column
     *     editor: false
     *   }
     * ],
     * ```
     */
    editor: void 0,

    /**
     * Control number of choices for the autocomplete (or dropdown) typed cells. After exceeding it, a scrollbar for the
     * dropdown list of choices will appear.
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
     *     // set autocomplete options list height
     *     visibleRows: 15,
     *   }
     * ],
     * ```
     */
    visibleRows: 10,

    /**
     * Makes autocomplete or dropdown width the same as the edited cell width. If `false` then editor will be scaled
     * according to its content.
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
     *     // don't trim dropdown width with column width
     *     trimDropdown: false,
     *   }
     * ],
     * ```
     */
    trimDropdown: true,

    /**
     * When set to `true`, the text of the cell content is wrapped if it does not fit in the fixed column width.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * colWidths: 100,
     * columns: [
     *   {
     *     // fixed column width is set but don't wrap the content
     *     wordWrap: false,
     *   }
     * ],
     * ```
     */
    wordWrap: true,

    /**
     * CSS class name added to cells with cell meta `wordWrap: false`.
     *
     * @memberof Options#
     * @type {string}
     * @default 'htNoWrap'
     * @category Core
     *
     * @example
     * ```js
     * // set custom class for cells which content won't be wrapped
     * noWordWrapClassName: 'is-noWrapCell',
     * ```
     */
    noWordWrapClassName: 'htNoWrap',

    /**
     * @description
     * Defines if the right-click context menu should be enabled. Context menu allows to create new row or column at any
     * place in the grid among [other features](@/guides/accessories-and-menus/context-menu.md).
     * Possible values:
     * * `true` (to enable default options),
     * * `false` (to disable completely)
     * * an array of [predefined options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options),
     * * an object [with defined structure](@/guides/accessories-and-menus/context-menu.md#context-menu-with-fully-custom-configuration).
     *
     * If the value is an object, you can also customize the options with:
     * * `disableSelection` - a `boolean`, if set to true it prevents mouseover from highlighting the item for selection
     * * `isCommand` - a `boolean`, if set to false it prevents clicks from executing the command and closing the menu.
     *
     * See [the context menu demo](@/guides/accessories-and-menus/context-menu.md) for examples.
     *
     * @memberof Options#
     * @type {boolean|string[]|object}
     * @default undefined
     * @category ContextMenu
     *
     * @example
     * ```js
     * // as a boolean
     * contextMenu: true,
     *
     * // as an array
     * contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],
     *
     * // as an object (`name` attribute is required in the custom keys)
     * contextMenu: {
     *   items: {
     *     "option1": {
     *       name: "option1"
     *     },
     *     "option2": {
     *       name: "option2",
     *       submenu: {
     *         items: [
     *           {
     *             key: "option2:suboption1",
     *             name: "option2:suboption1",
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
    contextMenu: void 0,

    /**
     * Disables or enables the copy/paste functionality.
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default true
     * @category CopyPaste
     *
     * @example
     * ```js
     * // disable copy and paste
     * copyPaste: false,
     *
     * // enable copy and paste with custom configuration
     * copyPaste: {
     *   columnsLimit: 25,
     *   rowsLimit: 50,
     *   pasteMode: 'shift_down',
     *   uiContainer: document.body,
     * },
     * ```
     */
    copyPaste: true,

    /**
     * If `true`, undo/redo functionality is enabled.
     * Note: `undefined` by default but it acts as enabled.
     * You need to switch it to `false` to disable it completely.
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category UndoRedo
     *
     * @example
     * ```js
     * // enable undo and redo
     * undo: true,
     * ```
     */
    undo: void 0,

    /**
     * @description
     * Turns on [Column sorting](@/guides/rows/row-sorting.md). Can be either a boolean (`true` / `false`) or an object with a declared sorting options:
     * * `initialConfig` - Object with predefined keys:
     *   * `column` - sorted column
     *   * `sortOrder` - order in which column will be sorted
     *     * `'asc'` = ascending
     *     * `'desc'` = descending
     * * `indicator` - display status for sorting order indicator (an arrow icon in the column header, specifying the sorting order).
     *   * `true` = show sort indicator for sorted columns
     *   * `false` = don't show sort indicator for sorted columns
     * * `headerAction` - allow to click on the headers to sort
     *   * `true` = turn on possibility to click on the headers to sort
     *   * `false` = turn off possibility to click on the headers to sort
     * * `sortEmptyCells` - how empty values should be handled, for more information see @{link Options#allowEmpty}
     *   * `true` = the table sorts empty cells
     *   * `false` = the table moves all empty cells to the end of the table
     * * `compareFunctionFactory` - curry function returning compare function; compare function should work in the same way as function which is handled by native `Array.sort` method); please take a look at below examples for more information.
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category ColumnSorting
     *
     * @example
     * ```js
     * // as boolean
     * columnSorting: true
     *
     * // as an object with initial sort config (sort ascending for column at index 1)
     * columnSorting: {
     *   initialConfig: {
     *     column: 1,
     *     sortOrder: 'asc'
     *   }
     * }
     *
     * // as an object which define specific sorting options for all columns
     * columnSorting: {
     *   sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
     *   indicator: true, // true = shows indicator for all columns, false = don't show indicator for columns
     *   headerAction: false, // true = allow to click on the headers to sort, false = turn off possibility to click on the headers to sort
     *   compareFunctionFactory: function(sortOrder, columnMeta) {
     *     return function(value, nextValue) {
     *       // Some value comparisons which will return -1, 0 or 1...
     *     }
     *   }
     * }
     * ```
     */
    columnSorting: void 0,

    /**
     * Turns on [Manual column move](@/guides/columns/column-moving.md), if set to a boolean or define initial column order (as an array of column indexes).
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualColumnMove
     *
     * @example
     * ```js
     * // as a boolean to enable column move
     * manualColumnMove: true,
     *
     * // as a array with initial order
     * // (move column index at 0 to 1 and move column index at 1 to 4)
     * manualColumnMove: [1, 4],
     * ```
     */
    manualColumnMove: void 0,

    /**
     * @description
     * Turns on [Manual column resize](@/guides/columns/column-width.md#column-stretching), if set to a boolean or define initial column resized widths (an an array of widths).
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualColumnResize
     *
     * @example
     * ```js
     * // as a boolean to enable column resize
     * manualColumnResize: true,
     *
     * // as a array with initial widths
     * // (column at 0 index has 40px and column at 1 index has 50px)
     * manualColumnResize: [40, 50],
     * ```
     */
    manualColumnResize: void 0,

    /**
     * @description
     * Turns on [Manual row move](@/guides/columns/column-moving.md), if set to a boolean or define initial row order (as an array of row indexes).
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualRowMove
     *
     * @example
     * ```js
     * // as a boolean
     * manualRowMove: true,
     *
     * // as a array with initial order
     * // (move row index at 0 to 1 and move row index at 1 to 4)
     * manualRowMove: [1, 4],
     * ```
     */
    manualRowMove: void 0,

    /**
     * @description
     * Turns on [Manual row resize](@/guides/columns/column-width.md#column-stretching), if set to a boolean or define initial row resized heights (as an array of heights).
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category ManualRowResize
     *
     * @example
     * ```js
     * // as a boolean to enable row resize
     * manualRowResize: true,
     *
     * // as an array to set initial heights
     * // (row at 0 index has 40px and row at 1 index has 50px)
     * manualRowResize: [40, 50],
     * ```
     */
    manualRowResize: void 0,

    /**
     * @description
     * If set to `true`, it enables a possibility to merge cells. If set to an array of objects, it merges the cells provided
     * in the objects (see the example below). More information on [the demo page](@/guides/cell-features/merge-cells.md).
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category MergeCells
     *
     * @example
     * ```js
     * // enables the mergeCells plugin
     * margeCells: true,
     *
     * // declares a list of merged sections
     * mergeCells: [
     *   // rowspan and colspan properties declare the width and height of a merged section in cells
     *   {row: 1, col: 1, rowspan: 3, colspan: 3},
     *   {row: 3, col: 4, rowspan: 2, colspan: 2},
     *   {row: 5, col: 6, rowspan: 3, colspan: 3}
     * ],
     * ```
     */
    mergeCells: false,

    /**
     * @description
     * Turns on [Multi-column sorting](@/guides/rows/row-sorting.md). Can be either a boolean (`true` / `false`) or an object with a declared sorting options:
     * * `initialConfig` - Array containing objects, every with predefined keys:
     *   * `column` - sorted column
     *   * `sortOrder` - order in which column will be sorted
     *     * `'asc'` = ascending
     *     * `'desc'` = descending
     * * `indicator` - display status for sorting order indicator (an arrow icon in the column header, specifying the sorting order).
     *   * `true` = show sort indicator for sorted columns
     *   * `false` = don't show sort indicator for sorted columns
     * * `headerAction` - allow to click on the headers to sort
     *   * `true` = turn on possibility to click on the headers to sort
     *   * `false` = turn off possibility to click on the headers to sort
     * * `sortEmptyCells` - how empty values should be handled, for more information see @{link Options#allowEmpty}
     *   * `true` = the table sorts empty cells
     *   * `false` = the table moves all empty cells to the end of the table
     * * `compareFunctionFactory` - curry function returning compare function; compare function should work in the same way as function which is handled by native `Array.sort` method); please take a look at below examples for more information.
     *
     * @memberof Options#
     * @type {boolean|object}
     * @default undefined
     * @category MultiColumnSorting
     *
     * @example
     * ```js
     * // as boolean
     * multiColumnSorting: true
     *
     * // as an object with initial sort config (sort ascending for column at index 1 and then sort descending for column at index 0)
     * multiColumnSorting: {
     *   initialConfig: [{
     *     column: 1,
     *     sortOrder: 'asc'
     *   }, {
     *     column: 0,
     *     sortOrder: 'desc'
     *   }]
     * }
     *
     * // as an object which define specific sorting options for all columns
     * multiColumnSorting: {
     *   sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
     *   indicator: true, // true = shows indicator for all columns, false = don't show indicator for columns
     *   headerAction: false, // true = allow to click on the headers to sort, false = turn off possibility to click on the headers to sort
     *   compareFunctionFactory: function(sortOrder, columnMeta) {
     *     return function(value, nextValue) {
     *       // Some value comparisons which will return -1, 0 or 1...
     *     }
     *   }
     * }
     * ```
     */
    multiColumnSorting: void 0,
    /**
     * @description
     * Number of rows to be rendered outside of the visible part of the table. By default, it's set to `'auto'`, which
     * makes Handsontable to attempt to calculate the best offset performance-wise.
     *
     * You may test out different values to find the best one that works for your specific implementation.
     *
     * @memberof Options#
     * @type {number|string}
     * @default 'auto'
     * @category Core
     *
     * @example
     * ```js
     * viewportRowRenderingOffset: 70,
     * ```
     */
    viewportRowRenderingOffset: 'auto',

    /**
     * @description
     * Number of columns to be rendered outside of the visible part of the table. By default, it's set to `'auto'`, which
     * makes Handsontable try calculating the best offset performance-wise.
     *
     * You may experiment with the value to find the one that works best for your specific implementation.
     *
     * @memberof Options#
     * @type {number|string}
     * @default 'auto'
     * @category Core
     *
     * @example
     * ```js
     * viewportColumnRenderingOffset: 70,
     * ```
     */
    viewportColumnRenderingOffset: 'auto',

    /**
     * @description
     * A function, regular expression or a string, which will be used in the process of cell validation. If a function is
     * used, be sure to execute the callback argument with either `true` (`callback(true)`) if the validation passed
     * or with `false` (`callback(false)`), if the validation failed.
     *
     * __Note__, that `this` in the function points to the `cellProperties` object.
     *
     * If a string is provided, it may be one of the following predefined values:
     * * `autocomplete`,
     * * `date`,
     * * `numeric`,
     * * `time`.
     *
     * Or you can [register](@/guides/cell-functions/cell-validator.md) the validator function under specified name and use its name as an alias in your
     * configuration.
     *
     * See more [in the demo](@/guides/cell-functions/cell-validator.md).
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
     *      // as a function
     *      validator: function(value, callback) {
     *          ...
     *      }
     *    },
     *    {
     *      // regular expression
     *      validator: /^[0-9]$/
     *    },
     *    {
     *      // as a string
     *      validator: 'numeric'
     *    }
     * ],
     * ```
     */
    validator: void 0,

    /**
     * @description
     * Disables visual cells selection.
     *
     * Possible values:
     *  * `true` - Disables any type of visual selection (current, header and area selection),
     *  * `false` - Enables any type of visual selection. This is default value.
     *  * `'current'` - Disables the selection of a currently selected cell, the area selection is still present.
     *  * `'area'` - Disables the area selection, the currently selected cell selection is still present.
     *  * `'header'` - Disables the headers selection, the currently selected cell selection is still present.
     *
     * @memberof Options#
     * @type {boolean|string|string[]}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // as a boolean
     * disableVisualSelection: true,
     *
     * // as a string ('current', 'area' or 'header')
     * disableVisualSelection: 'current',
     *
     * // as an array
     * disableVisualSelection: ['current', 'area'],
     * ```
     */
    disableVisualSelection: false,

    /**
     * Disables or enables {@link ManualColumnFreeze} plugin.
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category ManualColumnFreeze
     *
     * @example
     * ```js
     * // enable fixed columns
     * manualColumnFreeze: true,
     * ```
     */
    manualColumnFreeze: void 0,

    /**
     * Defines whether Handsontable should trim the whitespace at the beginning and the end of the cell contents.
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
     *     trimWhitespace: false
     *   }
     * ]
     * ```
     */
    trimWhitespace: true,

    /**
     * Defines data source for Autocomplete or Dropdown cell types.
     *
     * @memberof Options#
     * @type {Array|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // source as a array
     * columns: [{
     *   type: 'autocomplete',
     *   source: ['A', 'B', 'C', 'D']
     * }],
     *
     * // source as a function
     * columns: [{
     *   type: 'autocomplete',
     *   source: function(query, callback) {
     *     fetch('https://example.com/query?q=' + query, function(response) {
     *       callback(response.items);
     *     })
     *   }
     * }],
     * ```
     */
    source: void 0,

    /**
     * @description
     * Defines the column header name.
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set header names for every column
     * columns: [
     *   {
     *     title: 'First name',
     *     type: 'text',
     *   },
     *   {
     *     title: 'Last name',
     *     type: 'text',
     *   }
     * ],
     * ```
     */
    title: void 0,

    /**
     * Data template for `'checkbox'` type when checkbox is checked.
     *
     * @memberof Options#
     * @type {boolean|string|number}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * checkedTemplate: 'good'
     *
     * // if a checkbox-typed cell is checked, then getDataAtCell(x, y),
     * // where x and y are the coordinates of the cell will return 'good'.
     * ```
     */
    checkedTemplate: void 0,

    /**
     * Data template for `'checkbox'` type when checkbox is unchecked.
     *
     * @memberof Options#
     * @type {boolean|string|number}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * uncheckedTemplate: 'bad'
     *
     * // if a checkbox-typed cell is not checked, then getDataAtCell(x,y),
     * // where x and y are the coordinates of the cell will return 'bad'.
     * ```
     */
    uncheckedTemplate: void 0,

    /**
     * @description
     * Object which describes if renderer should create checkbox element with label element as a parent.
     *
     * __Note__, this option only works for [checkbox-typed](@/guides/cell-types/checkbox-cell-type.md) cells.
     *
     * By default the [checkbox](@/guides/cell-types/checkbox-cell-type.md) renderer renders the checkbox without a label.
     *
     * Possible object properties:
     *  * `property` - Defines the property name of the data object, which will to be used as a label.
     *  (eg. `label: {property: 'name.last'}`). This option works only if data was passed as an array of objects.
     *  * `position` - String which describes where to place the label text (before or after checkbox element).
     * Valid values are `'before'` and '`after`' (defaults to `'after'`).
     *  * `value` - String or a Function which will be used as label text.
     *  * `separated` - Boolean which describes that checkbox & label elements are separated or not. Default value is `false`.
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
     *   // add "My label:" after the checkbox
     *   label: { position: 'after', value: 'My label: ', separated: true }
     * }],
     * ```
     */
    label: void 0,

    /**
     * Display format for numeric typed renderers.
     *
     * __Note__, this option only works for [numeric-typed](@/guides/cell-types/numeric-cell-type.md) cells.
     *
     * Format is described by two properties:
     * * `pattern` - Handled by `numbro` for purpose of formatting numbers to desired pattern. List of supported patterns can be found [here](https://numbrojs.com/format.html#numbers).
     * * `culture` - Handled by `numbro` for purpose of formatting currencies. Examples showing how it works can be found [here](https://numbrojs.com/format.html#currency). List of supported cultures can be found [here](https://numbrojs.com/languages.html#supported-languages).
     *
     * __Note:__ Please keep in mind that this option is used only to format the displayed output! It has no effect on the input data provided for the cell. The numeric data can be entered to the table only as floats (separated by a dot or a comma) or integers, and are stored in the source dataset as JavaScript numbers.
     *
     * Handsontable uses [numbro](https://numbrojs.com/) as a main library for numbers formatting.
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
     *     // set desired format pattern and
     *     numericFormat: {
     *       pattern: '0,00',
     *       culture: 'en-US'
     *     }
     *   }
     * ],
     * ```
     */
    numericFormat: void 0,

    /**
     * Language for Handsontable translation. Possible language codes are [listed here](@/guides/internationalization/internationalization-i18n.md#list-of-available-languages).
     *
     * @memberof Options#
     * @type {string}
     * @default 'en-US'
     * @category Core
     *
     * @example
     * ```js
     * // set Polish language
     * language: 'pl-PL',
     * ```
     */
    language: 'en-US',

    /**
     * Data source for [select-typed](@/guides/cell-types/select-cell-type.md) cells.
     *
     * __Note__, this option only works for [select-typed](@/guides/cell-types/select-cell-type.md) cells.
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
     *     editor: 'select',
     *     // as an array of strings: `option.value` and `option.textContent` use the same value
     *     selectOptions: ['A', 'B', 'C'],
     *     // as an object: `option.value` appoints a key, and `option.textContent` contains a string assigned to the key
     *     selectOptions: {
     *       value1: 'Label 1',
     *       value2: 'Label 2',
     *       value3: 'Label 3',
     *     },
     *     // as a function that returns possible options as an array
     *     selectOptions(visualRow, visualColumn, prop) {
     *       return ['A', 'B', 'C'];
     *     },
     *     // as a function that returns possible options as an object
     *     selectOptions(visualRow, visualColumn, prop) {
     *       return {
     *         value1: 'Label 1',
     *         value2: 'Label 2',
     *         value3: 'Label 3',
     *       };
     *     },
     *   }
     * ],
     * ```
     */
    selectOptions: void 0,

    /**
     * Enables or disables the {@link AutoColumnSize} plugin. Default value `undefined`
     * is an equivalent of `true`, sets `syncLimit` to 50.
     * Disabling this plugin can increase performance, as no size-related calculations would be done.
     * To disable plugin it's necessary to set `false`.
     *
     * Column width calculations are divided into sync and async part. Each of those parts has their own advantages and
     * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
     * operations don't block the browser UI.
     *
     * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.
     *
     * You can also use the `useHeaders` option to take the column headers width into calculation.
     *
     * Note: Using {@link Core#colWidths} option will forcibly disable {@link AutoColumnSize}.
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default undefined
     * @category AutoColumnSize
     *
     * @example
     * ```js
     * // as a number (300 columns in sync, rest async)
     * autoColumnSize: { syncLimit: 300 },
     *
     * // as a string (percent)
     * autoColumnSize: { syncLimit: '40%' },
     *
     * // use headers width while calculating the column width
     * autoColumnSize: { useHeaders: true },
     *
     * // defines how many samples for the same length will be caught to calculations
     * autoColumnSize: { samplingRatio: 10 },
     *
     * // defines if duplicated samples are allowed in calculations
     * autoColumnSize: { allowSampleDuplicates: true },
     * ```
     */
    autoColumnSize: void 0,

    /**
     * Enables or disables {@link AutoRowSize} plugin. Default value is `undefined`, which has the same effect as `false`
     * (disabled). Enabling this plugin can decrease performance, as size-related calculations would be performed.
     *
     * __Note:__ the default `syncLimit` value is set to 500 when the plugin is manually enabled by declaring it as: `autoRowSize: true`.
     *
     * Row height calculations are divided into sync and async stages. Each of these stages has their own advantages and
     * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
     * operations don't block the browser UI.
     *
     * To configure the sync/async distribution, you can pass an absolute value (number of rows) or a percentage value.
     *
     * @memberof Options#
     * @type {object|boolean}
     * @default undefined
     * @category AutoRowSize
     *
     * @example
     * ```js
     * // as a number (300 rows in sync, rest async)
     * autoRowSize: {syncLimit: 300},
     *
     * // as a string (percent)
     * autoRowSize: {syncLimit: '40%'},
     * ```
     */
    autoRowSize: void 0,

    /**
     * Date validation format.
     *
     * __Note__, this option only works for [date-typed](@/guides/cell-types/date-cell-type.md) cells.
     *
     * @memberof Options#
     * @type {string}
     * @default 'DD/MM/YYYY'
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   type: 'date',
     *   // localise date format
     *   dateFormat: 'MM/DD/YYYY'
     * }],
     * ```
     */
    dateFormat: 'DD/MM/YYYY',

    /**
     * If `true` then dates will be automatically formatted to match the desired format.
     *
     * __Note__, this option only works for [date-typed](@/guides/cell-types/date-cell-type.md) cells.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   type: 'date',
     *   dateFormat: 'YYYY-MM-DD',
     *   // force selected date format
     *   correctFormat: true
     * }],
     * ```
     */
    correctFormat: false,

    /**
     * Definition of default value which will fill the empty cells.
     *
     * __Note__, this option only works for [date-typed](@/guides/cell-types/date-cell-type.md) cells.
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
     *     // always set this date for empty cells
     *     defaultDate: '2015-02-02'
     *   }
     * ],
     * ```
     */
    defaultDate: void 0,

    /**
     * If set to `true`, the value entered into the cell must match (case-sensitive) the autocomplete source.
     * Otherwise, cell won't pass the validation. When filtering the autocomplete source list, the editor will
     * be working in case-insensitive mode.
     *
     * __Note__, this option only works for [autocomplete-typed](@/guides/cell-types/autocomplete-cell-type.md) cells.
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   type: 'autocomplete',
     *   source: ['A', 'B', 'C'],
     *   // force selected value to match the source list
     *   strict: true
     * }],
     * ```
     */
    strict: void 0,

    /**
     * If set to `true`, data defined in `source` of the autocomplete or dropdown cell will be treated as HTML.
     *
     * __Warning:__ Enabling this option can cause serious XSS vulnerabilities.
     *
     * __Note__, this option only works for [autocomplete-typed](@/guides/cell-types/autocomplete-cell-type.md) cells.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * columns: [{
     *   type: 'autocomplete',
     *   // use HTML in the source list
     *   allowHtml: true,
     *   source: ['<strong>foo</strong>', '<strong>bar</strong>']
     * }],
     * ```
     */
    allowHtml: false,

    /**
     * If typed `true` then virtual rendering mechanism for handsontable will be disabled.
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // disable virtual rows rendering
     * renderAllRows: true,
     * ```
     */
    renderAllRows: void 0,

    /**
     * Prevents table to overlap outside the parent element. If `'horizontal'` option is chosen then table will show
     * a horizontal scrollbar if parent's width is narrower then table's width.
     *
     * Possible values:
     *  * `false` - Disables functionality.
     *  * `horizontal` - Prevents horizontal overflow table.
     *  * `vertical` - Prevents vertical overflow table.
     *
     * @memberof Options#
     * @type {string|boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * preventOverflow: 'horizontal',
     * ```
     */
    preventOverflow: false,

    /**
     * Prevents wheel event on overlays for doing default action.
     *
     * @memberof Options#
     * @private
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * preventWheel: false,
     * ```
     */
    preventWheel: false,

    /**
     * @description
     * Enables the functionality of the {@link BindRowsWithHeaders} plugin which allows binding the table rows with their headers.
     * If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically,
     * if at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.
     *
     * @memberof Options#
     * @type {boolean|string}
     * @default undefined
     * @category BindRowsWithHeaders
     *
     * @example
     * ```js
     * // keep row data and row headers in sync
     * bindRowsWithHeaders: true
     * ```
     */
    bindRowsWithHeaders: void 0,

    /**
     * @description
     * The {@link CollapsibleColumns} plugin allows collapsing of columns, covered by a header with the `colspan` property
     * defined.
     *
     * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
     *
     * Setting the `collapsibleColumns` property to `true` will display a "collapse/expand" button in every
     * header with a defined colspan` property.
     *
     * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property
     * as an array of objects, as in the example below.
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default undefined
     * @category CollapsibleColumns
     *
     * @example
     * ```js
     * // enable collapsing for all headers
     * collapsibleColumns: true,
     *
     * // or
     * // enable collapsing for selected headers
     * collapsibleColumns: [
     *   {row: -4, col: 1, collapsible: true},
     *   {row: -3, col: 5, collapsible: true}
     * ],
     * ```
     */
    collapsibleColumns: void 0,

    /**
     * @description
     * The `ColumnSummary` plugin lets you [easily summarize your columns](@/guides/columns/column-summary.md).
     *
     * You can use the [built-in summary functions](@/guides/columns/column-summary.md#built-in-summary-functions),
     * or implement a [custom summary function](@/guides/columns/column-summary.md#implementing-a-custom-summary-function).
     *
     * For each column summary, you can set the following configuration options:
     *
     * | Option | Required | Type | Default | Description |
     * |---|---|---|---|---|
     * | `sourceColumn` | No | Number | Same as `destinationColumn` | [Selects a column to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
     * | `ranges` | No | Array | - | [Selects ranges of rows to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
     * | `type` | Yes | String | - | [Sets a summary function](@/guides/columns/column-summary.md#step-3-calculate-your-summary) |
     * | `destinationRow` | Yes | Number | - | [Sets the destination cell's row coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
     * | `destinationColumn` | Yes | Number | - | [Sets the destination cell's column coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
     * | `forceNumeric` | No | Boolean | `false` | [Forces the summary to treat non-numerics as numerics](@/guides/columns/column-summary.md#forcing-numeric-values) |
     * | `reversedRowCoords` | No | Boolean | `false` | [Reverses row coordinates](@/guides/columns/column-summary.md#step-5-make-room-for-the-destination-cell) |
     * | `suppressDataTypeErrors` | No | Boolean | `true` | [Suppresses data type errors](@/guides/columns/column-summary.md#throwing-data-type-errors) |
     * | `readOnly` | No | Boolean | `true` | Makes summary cell read-only |
     * | `roundFloat` | No | Number | - | [Rounds summary result](@/guides/columns/column-summary.md#rounding-a-column-summary-result) |
     * | `customFunction` | No | Function | - | [Lets you add a custom summary function](@/guides/columns/column-summary.md#implementing-a-custom-summary-function) |
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
    columnSummary: void 0,

    /**
     * This plugin allows adding a configurable dropdown menu to the table's column headers. The dropdown menu acts like
     * the {@link Options#contextMenu}, but is triggered by clicking the button in the header.
     *
     * @memberof Options#
     * @type {boolean|object|string[]}
     * @default undefined
     * @category DropdownMenu
     *
     * @example
     * ```js
     * // enable dropdown menu
     * dropdownMenu: true,
     *
     * // or
     * // enable and configure dropdown menu options
     * dropdownMenu: ['remove_col', '---------', 'make_read_only', 'alignment']
     * ```
     */
    dropdownMenu: void 0,

    /**
     * The {@link Filters} plugin allows filtering the table data either by the built-in component or with the API.
     *
     * @memberof Options#
     * @type {boolean}
     * @default undefined
     * @category Filters
     *
     * @example
     * ```js
     * // enable filters
     * filters: true,
     * ```
     */
    filters: void 0,

    /**
     * The {@link Formulas} plugin allows Handsontable to process formula expressions defined in the provided data.
     *
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Formulas
     *
     * @example
     * ```js
     * // in Handsontable's `formulas` configuration option, add the `HyperFormula` class
     * formulas: {
     *   engine: HyperFormula,
     *   // the `Formulas` plugin configuration
     * }
     *
     * // or, add a HyperFormula instance
     * const hyperformulaInstance = HyperFormula.buildEmpty({})
     *
     * formulas: {
     *   engine: hyperformulaInstance,
     *   // the `Formulas` plugin configuration
     * }
     *
     * // use the same HyperFormula instance in multiple Handsontable instances
     *
     * // a Handsontable instance `hot1`
     * formulas: {
     *   engine: HyperFormula,
     *   // the `Formulas` plugin configuration
     * }
     *
     * // a Handsontable instance `hot2`
     * formulas: {
     *   engine: hot1.getPlugin('formulas').engine,
     *   // the `Formulas` plugin configuration
     * }
     * ```
     */
    formulas: void 0,

    /**
     * The `hiddenColumns` option enables and configures the {@link HiddenColumns} plugin.
     *
     * To enable the `HiddenColumns` plugin, set the `hiddenColumns` option to `true`.
     *
     * To enable the `HiddenColumns` plugin and configure its settings, set the `hiddenColumns` option to an object with the following properties:
     *  * `columns`: An array of indexes of columns that are hidden on plugin initialization.
     *  * `copyPasteEnabled`: When set to `true`, takes hidden columns into account when copying or pasting data.
     *  * `indicators`: When set to `true`, displays UI markers to indicate the presence of hidden columns.
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
     * // or enable `HiddenColumns` plugin, and configure its settings
     * hiddenColumns: {
     *   // set columns that are hidden by default
     *   columns: [5, 10, 15],
     *   // take hidden columns into account when copying or pasting
     *   copyPasteEnabled: true,
     *   // show where hidden columns are
     *   indicators: true
     * }
     * ```
     */
    hiddenColumns: void 0,

    /**
     * The `hiddenRows` option enables and configures the {@link HiddenRows} plugin.
     *
     * To enable the `HiddenRows` plugin, set the `hiddenRows` option to `true`.
     *
     * To enable the `HiddenRows` plugin and configure its settings, set the `hiddenRows` option to an object with the following properties:
     *  * `rows`: An array of indexes of rows that are hidden on plugin initialization.
     *  * `copyPasteEnabled`: When set to `true`, takes hidden rows into account when copying or pasting data.
     *  * `indicators`: When set to `true`, displays UI markers to indicate the presence of hidden rows.
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
     * // or enable `HiddenRows` plugin, and configure its settings
     * hiddenRows: {
     *   // set rows that are hidden by default
     *   rows: [5, 10, 15],
     *   // take hidden rows into account when copying or pasting
     *   copyPasteEnabled: true,
     *   // show where hidden rows are
     *   indicators: true
     * }
     * ```
     */
    hiddenRows: void 0,

    /**
     * @description
     * Allows creating a nested header structure, using the HTML's colspan attribute.
     *
     * @memberof Options#
     * @type {Array[]}
     * @default undefined
     * @category NestedHeaders
     *
     * @example
     * ```js
     * nestedHeaders: [
     *   ['A', {label: 'B', colspan: 8}, 'C'],
     *   ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
     *   ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
     * ],
     * ```
     */
    nestedHeaders: void 0,

    /**
     * @description
     * Plugin allowing hiding of certain rows.
     *
     * @memberof Options#
     * @type {boolean|number[]}
     * @default undefined
     * @category TrimRows
     *
     * @example
     * ```js
     * // enable plugin
     * trimRows: true,
     *
     * // or
     * // trim selected rows on table initialization
     * trimRows: [5, 10, 15],
     * ```
     */
    trimRows: void 0,

    /**
     * @description
     * Allows setting a custom width of the row headers. You can provide a number or an array of widths, if many row
     * header levels are defined.
     *
     * @memberof Options#
     * @type {number|number[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set width for all row headers
     * rowHeaderWidth: 25,
     *
     * // or
     * // set width for selected headers only
     * rowHeaderWidth: [25, 30, 55],
     * ```
     */
    rowHeaderWidth: void 0,

    /**
     * @description
     * Allows setting a custom height of the column headers. You can provide a number or an array of heights, if many
     * column header levels are defined.
     *
     * @memberof Options#
     * @type {number|number[]}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // set shared height for all headers
     * columnHeaderHeight: 35,
     *
     * // or
     * // set height for each header individually
     * columnHeaderHeight: [35, 20, 55],
     *
     * // or
     * // skipped headers will fallback to default value
     * columnHeaderHeight: [35, undefined, 55],
     * ```
     */
    columnHeaderHeight: void 0,

    /**
     * If defined as `true`, the Autocomplete's suggestion list would be sorted by relevance (the closer to the left the
     * match is, the higher the suggestion).
     *
     * __Note__, this option only works for [autocomplete-typed](@/guides/cell-types/autocomplete-cell-type.md) cells.
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
     *     source: [ ... ],
     *     // keep options order as they were defined
     *     sortByRelevance: false
     *   }
     * ],
     * ```
     */
    sortByRelevance: true,

    /**
     * If defined as `true`, when the user types into the input area the Autocomplete's suggestion list is updated to only
     * include those choices starting with what has been typed; if defined as `false` all suggestions remain shown, with
     * those matching what has been typed marked in bold.
     *
     * __Note__, this option only works for [autocomplete-typed](@/guides/cell-types/autocomplete-cell-type.md) cells.
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
     *     source: [ ... ],
     *     // don't hide options that don't match search query
     *     filter: false
     *   }
     * ],
     * ```
     */
    filter: true,

    /**
     * If defined as `true`, filtering in the Autocomplete Editor will be case-sensitive.
     *
     * __Note__, this option only works for [autocomplete-typed](@/guides/cell-types/autocomplete-cell-type.md) cells.
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
     *   }
     * ],
     * ```
     */
    filteringCaseSensitive: false,

    /**
     * @description
     * Disables or enables the {@link DragToScroll} functionality.
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category DragToScroll
     *
     * @example
     * ```js
     * // don't scroll the viewport when selection gets to the viewport edge
     * dragToScroll: false,
     * ```
     */
    dragToScroll: true,

    /**
     * @description
     * Disable or enable the nested rows functionality - displaying nested structures in a two-dimensional data table.
     *
     * See [quick setup of the Nested rows](@/guides/rows/row-parent-child.md).
     * @example
     * ```js
     * nestedRows: true,
     * ```
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category NestedRows
     */
    nestedRows: void 0,
  };
};
