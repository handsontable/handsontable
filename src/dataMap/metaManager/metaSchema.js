import { isEmpty } from '../../helpers/mixed';
import { isObjectEqual } from '../../helpers/object';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @alias Options
 * @class Options
 * @description
 *
 * Handsontable provides many options to choose from. They come either from the {@link Core} features or {@link Hooks}.
 *
 * You can pass options in an object iteral notation (a comma-separated list of name-value pairs wrapped in curly braces) as a second argument of the Handsontable constructor.
 *
 * In the further documentation, and in Guides, we prefer calling this object a `Settings` object or `configuration` object.
 *
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: myArray,
 *   width: 400,
 *   height: 300
 * });
 * ```
 *
 * ## Applying options to different elements of the grid
 *
 * Options can set for many different parts of the data grid:
 *
 * - The entire grid
 * - A column or range of columns
 * - A row or range of rows
 * - A cell or range of cells
 *
 * Options use the cascading configuration to make that possible.
 *
 * Take a look at the following example:
 *
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   readOnly: true,
 *   columns: [
 *     { readOnly: false },
 *     {},
 *     {},
 *   ],
 *   cells: function(row, col, prop) {
 *     var cellProperties = {};
 *
 *     if (row === 0 && col === 0) {
 *       cellProperties.readOnly = true;
 *     }
 *
 *     return cellProperties;
 *   }
 * });
 * ```
 *
 * In the above example we first set the `read-only` option for the entire grid. Then we make two exceptions of this rule:
 *
 * - We exclude the first column by passing `readOnly: false`, which in result makes it editable.
 * - We exclude the cell in the top left corner, just like we did it with the first column.
 *
 * To learn more about how to use cascading settings go to the [Setting Options](@/guides/getting-started/setting-options.md) page.
 *
 * ::: tip
 * In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
 * :::
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default () => {
  return {
    /**
     * License key for commercial version of Handsontable.
     *
     * @memberof Options#
     * @type {string}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * licenseKey: '00000-00000-00000-00000-00000',
     * // or
     * licenseKey: 'non-commercial-and-evaluation',
     * ```
     */
    licenseKey: void 0,

    /**
     * @description
     * Initial data source that will be bound to the data grid __by reference__ (editing data grid alters the data source).
     * Can be declared as an array of arrays or an array of objects.
     *
     * See [Understanding binding as reference](@/guides/getting-started/binding-to-data.md#understand-binding-as-a-reference).
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

    /**
     * @description
     * Defines the structure of a new row when data source is an array of objects.
     *
     * See [data-schema](@/guides/getting-started/binding-to-data.md#array-of-objects-with-custom-data-schema) for more options.
     *
     * @memberof Options#
     * @type {object}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // with data schema we can start with an empty table
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
     * Width of the grid. Can be a value or a function that returns a value.
     *
     * @memberof Options#
     * @type {number|string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as a number
     * width: 500,
     *
     * // as a string
     * width: '75vw',
     *
     * // as a function
     * width: function() {
     *   return 500;
     * },
     * ```
     */
    width: void 0,

    /**
     * Height of the grid. Can be a number or a function that returns a number.
     *
     * @memberof Options#
     * @type {number|string|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as a number
     * height: 500,
     *
     * // as a string
     * height: '75vh',
     *
     * // as a function
     * height: function() {
     *   return 500;
     * },
     * ```
     */
    height: void 0,

    /**
     * @description
     * Initial number of rows.
     *
     * __Note:__ This option only has effect in Handsontable constructor and only if `data` option is not provided.
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
     * Initial number of columns.
     *
     * __Note:__ This option only has effect in Handsontable constructor and only if `data` option is not provided.
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
     * Setting `true` or `false` will enable or disable the default row headers (1, 2, 3).
     * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
     * If a function is set the index of the row is passed as a parameter.
     *
     * @memberof Options#
     * @type {boolean|string[]|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as a boolean
     * rowHeaders: true,
     *
     * // as an array
     * rowHeaders: ['1', '2', '3'],
     *
     * // as a function
     * rowHeaders: function(index) {
     *   return index + ': AB';
     * },
     * ```
     */
    rowHeaders: void 0,

    /**
     * Setting `true` or `false` will enable or disable the default column headers (A, B, C).
     * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
     * If a function is set, then the index of the column is passed as a parameter.
     *
     * @memberof Options#
     * @type {boolean|string[]|Function}
     * @default null
     * @category Core
     *
     * @example
     * ```js
     * // as a boolean
     * colHeaders: true,
     *
     * // as an array
     * colHeaders: ['A', 'B', 'C'],
     *
     * // as a function
     * colHeaders: function(index) {
     *   return index + ': AB';
     * },
     * ```
     */
    colHeaders: null,

    /**
     * Defines column widths in pixels. Accepts number, string (that will be converted to a number), array of numbers
     * (if you want to define column width separately for each column) or a function (if you want to set column width
     * dynamically on each render).
     *
     * The default width for columns in the rendering process equals 50px.
     *
     * An `undefined` value is for detection in {@link Hooks#modifyColWidth} hook if plugin or setting changed the default size.
     *
     * Note: This option will forcely disable {@link AutoColumnSize} plugin.
     *
     * @memberof Options#
     * @type {number|number[]|string|string[]|Array<undefined>|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as a number, for each column.
     * colWidths: 100,
     *
     * // as a string, for each column.
     * colWidths: '100px',
     *
     * // as an array, based on visual indexes. Unspecified columns have a default width.
     * colWidths: [100, 120, undefined, 90],
     *
     * // as a function, based on visual indexes.
     * colWidths: function(index) {
     *   return index * 10;
     * },
     * ```
     */
    colWidths: void 0,

    /**
     * Defines row heights in pixels. Accepts numbers, strings (that will be converted into a number), array of numbers
     * (if you want to define row height separately for each row) or a function (if you want to set row height dynamically
     * on each render).
     *
     * If the {@link ManualRowResize} or {@link AutoRowSize} plugins are enabled, this is also the minimum height that can
     * be set via either of those two plugins.
     *
     * The default height for rows in the rendering process equals 23px.
     * Height should be equal or greater than 23px. Table is rendered incorrectly if height is less than 23px.
     *
     * An `undefined` value is for detection in {@link Hooks#modifyRowHeight} hook if plugin or setting changed the default size.
     *
     * @memberof Options#
     * @type {number|number[]|string|string[]|Array<undefined>|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as a number, the same for all rows
     * rowHeights: 100,
     *
     * // as a string, the same for all row
     * rowHeights: '100px',
     *
     * // as an array, based on visual indexes. The rest of the rows have a default height
     * rowHeights: [100, 120, 90],
     *
     * // as a function, based on visual indexes
     * rowHeights: function(index) {
     *   return index * 10;
     * },
     * ```
     */
    rowHeights: void 0,

    /**
     * @description
     * Defines the cell properties and data binding for certain columns.
     *
     * __Note:__ Using this option sets a fixed number of columns (options `startCols`, `minCols`, `maxCols` will be ignored).
     *
     * See [documentation -> datasources.html](@/guides/getting-started/binding-to-data.md#array-of-objects-with-column-mapping) for examples.
     *
     * @memberof Options#
     * @type {object[]|Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
     * // as an array of objects
     * // order of the objects in array is representation of physical indexes.
     * columns: [
     *   {
     *     // column options for the first column
     *     type: 'numeric',
     *     numericFormat: {
     *       pattern: '0,0.00 $'
     *     }
     *   },
     *   {
     *     // column options for the second column
     *     type: 'text',
     *     readOnly: true
     *   }
     * ],
     *
     * // or as a function, based on physical indexes
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
     * Defines the cell properties for given `row`, `col`, `prop` coordinates. Any constructor or column option may be
     * overwritten for a particular cell (row/column combination) using the `cells` property in the Handsontable constructor.
     *
     * __Note:__ Parameters `row` and `col` always represent __physical indexes__. Example below show how to execute
     * operations based on the __visual__ representation of Handsontable.
     *
     * Possible values of `prop`:
     * - property name for column's data source object, when dataset is an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects)
     * - the same number as `col`, when dataset is an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays).
     *
     * @memberof Options#
     * @type {Function}
     * @default undefined
     * @category Core
     *
     * @example
     * ```js
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
     * Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell`
     * array passed to the Handsontable constructor.
     *
     * @memberof Options#
     * @type {Array[]}
     * @default []
     * @category Core
     *
     * @example
     * ```js
     * // make cell with coordinates (0, 0) read only
     * cell: [
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
     * If `true`, enables the {@link Comments} plugin, which enables an option to apply cell comments through the context menu
     * (configurable with context menu keys `commentsAddEdit`, `commentsRemove`).
     *
     * To initialize Handsontable with predefined comments, provide cell coordinates and comment text values in a form of
     * an array.
     *
     * See [Comments](@/guides/cell-features/comments.md) demo for examples.
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category Comments
     *
     * @example
     * ```js
     * // enable comments plugin
     * comments: true,
     *
     * // or an object with extra predefined plugin config:
     *
     * comments: {
     *   displayDelay: 1000
     * }
     *
     * // or
     * // enable comments plugin and add predefined comments
     * const hot = new Handsontable(document.getElementById('example'), {
     *   data: getData(),
     *   comments: true,
     *   cell: [
     *     { row: 1, col: 1, comment: { value: 'Foo' } },
     *     { row: 2, col: 2, comment: { value: 'Bar' } }
     *   ]
     * });
     * ```
     */
    comments: false,

    /**
     * @description
     * If `true`, enables the {@link CustomBorders} plugin, which enables an option to apply custom borders through the context
     * menu (configurable with context menu key `borders`). To initialize Handsontable with predefined custom borders,
     * provide cell coordinates and border styles in a form of an array.
     *
     * See [Custom Borders](@/guides/cell-features/formatting-cells.md#custom-cell-borders) demo for examples.
     *
     * @memberof Options#
     * @type {boolean|object[]}
     * @default false
     * @category CustomBorders
     *
     * @example
     * ```js
     * // enable custom borders
     * customBorders: true,
     *
     * // or
     * // enable custom borders and start with predefined left border
     * customBorders: [
     *   {
     *     range: {
     *       from: {
     *         row: 1,
     *         col: 1
     *       },
     *       to: {
     *         row: 3,
     *         col: 4
     *       }
     *     },
     *     left: {
     *       width: 2,
     *       color: 'red'
     *     },
     *     right: {},
     *     top: {},
     *     bottom: {}
     *   }
     * ],
     *
     * // or
     * customBorders: [
     *   {
     *     row: 2,
     *     col: 2,
     *     left: {
     *       width: 2,
     *       color: 'red'
     *     },
     *     right: {
     *       width: 1,
     *       color: 'green'
     *     },
     *     top: '',
     *     bottom: ''
     *   }
     * ],
     * ```
     */
    customBorders: false,

    /**
     * Minimum number of rows. At least that number of rows will be created during initialization.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // set minimum table size to 10 rows
     * minRows: 10,
     * ```
     */
    minRows: 0,

    /**
     * Minimum number of columns. At least that number of columns will be created during initialization.
     * Works only with an array data source. When data source in an object, you can only have as many columns
     * as defined in the first data row, data schema, or the `columns` setting.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // set minimum table size to 10 columns
     * minCols: 10,
     * ```
     */
    minCols: 0,

    /**
     * Maximum number of rows. If set to a value lower than the initial row count, the data will be trimmed to the provided
     * value as the number of rows.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // limit table size to maximum 300 rows
     * maxRows: 300,
     * ```
     */
    maxRows: Infinity,

    /**
     * Maximum number of cols. If set to a value lower than the initial col count, the data will be trimmed to the provided
     * value as the number of cols.
     *
     * @memberof Options#
     * @type {number}
     * @default Infinity
     * @category Core
     *
     * @example
     * ```js
     * // limit table size to maximum 300 columns
     * maxCols: 300,
     * ```
     */
    maxCols: Infinity,

    /**
     * When set to an integer of more than `0`, appends the set number of empty rows
     * to the bottom of your table.
     *
     * `minSpareRows` sets a minimum number of empty rows,
     * so if there already are other empty rows at the bottom of your table,
     * they are counted into the number set in `minSpareRows`.
     *
     * The total number of rows can't exceed the number set in `maxRows`.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // always add 3 empty rows at the table end
     * minSpareRows: 3,
     * ```
     */
    minSpareRows: 0,

    /**
     * When set to an integer of more than `0`, appends the set number of empty columns
     * to the right-hand end of your table.
     *
     * `minSpareCols` sets a minimum number of empty columns,
     * so if there already are other empty columns at the right-hand end of your table,
     * they are counted into the number set in `minSpareCols`.
     *
     * The total number of columns can't exceed the number set in `maxCols`.
     *
     * `minSpareCols` works only when your table data is an array of arrays
     * (it doesn't work when your table data is an array of objects).
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // always add 3 empty columns at the table end
     * minSpareCols: 3,
     * ```
     */
    minSpareCols: 0,

    /**
     * If set to `false`, there won't be an option to insert new rows in the Context Menu.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide "Insert row above" and "Insert row below" options from the Context Menu
     * allowInsertRow: false,
     * ```
     */
    allowInsertRow: true,

    /**
     * If set to `false`, there won't be an option to insert new columns in the Context Menu.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide "Insert column left" and "Insert column right" options from the Context Menu
     * allowInsertColumn: false,
     * ```
     */
    allowInsertColumn: true,

    /**
     * If set to `false`, there won't be an option to remove rows in the Context Menu.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide "Remove row" option from the Context Menu
     * allowRemoveRow: false,
     * ```
     */
    allowRemoveRow: true,

    /**
     * If set to `false`, there won't be an option to remove columns in the Context Menu.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // hide "Remove column" option from the Context Menu
     * allowRemoveColumn: false,
     * ```
     */
    allowRemoveColumn: true,

    /**
     * @description
     * Defines how the table selection reacts. The selection support three different behaviors defined as:
     *  * `'single'` Only a single cell can be selected.
     *  * `'range'` Multiple cells within a single range can be selected.
     *  * `'multiple'` Multiple ranges of cells can be selected.
     *
     * To see how to interact with selection by getting selected data or change styles of the selected cells go to
     * [Selecting Ranges](@/guides/cell-features/selection.md).
     *
     * @memberof Options#
     * @type {string}
     * @default 'multiple'
     * @category Core
     *
     * @example
     * ```js
     * // only one cell can be selected at a time
     * selectionMode: 'single',
     * ```
     */
    selectionMode: 'multiple',

    /**
     * Enables the fill handle (drag-down and copy-down) functionality, which shows a small rectangle in bottom
     * right corner of the selected area, that let's you expand values to the adjacent cells.
     *
     * Setting to `true` enables the fillHandle plugin. Possible values: `true` (to enable in all directions),
     * `'vertical'` or `'horizontal'` (to enable in one direction), `false` (to disable completely), an object with
     * options: `autoInsertRow`, `direction`.
     *
     * If `autoInsertRow` option is `true`, fill-handler will create new rows till it reaches the last row.
     * It is enabled by default.
     *
     * @memberof Options#
     * @type {boolean|string|object}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // enable plugin in all directions and with autoInsertRow as true
     * fillHandle: true,
     *
     * // or
     * // enable plugin in vertical direction and with autoInsertRow as true
     * fillHandle: 'vertical',
     *
     * // or
     * fillHandle: {
     *   // enable plugin in both directions and with autoInsertRow as false
     *   autoInsertRow: false,
     * },
     *
     * // or
     * fillHandle: {
     *   // enable plugin in vertical direction and with autoInsertRow as false
     *   autoInsertRow: false,
     *   direction: 'vertical'
     * },
     * ```
     */
    fillHandle: {
      autoInsertRow: false,
    },

    /**
     * Allows to specify the number of fixed (or *frozen*) rows at the top of the table.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze the first 3 rows of the table.
     * fixedRowsTop: 3,
     * ```
     */
    fixedRowsTop: 0,

    /**
     * Allows to specify the number of fixed (or *frozen*) rows at the bottom of the table.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze the last 3 rows of the table.
     * fixedRowsBottom: 3,
     * ```
     */
    fixedRowsBottom: 0,

    /**
     * Allows to specify the number of fixed (or *frozen*) columns on the left of the table.
     *
     * @memberof Options#
     * @type {number}
     * @default 0
     * @category Core
     *
     * @example
     * ```js
     * // freeze first 3 columns of the table.
     * fixedColumnsLeft: 3,
     * ```
     */
    fixedColumnsLeft: 0,

    /**
     * If `true`, mouse click outside the grid will deselect the current selection. Can be a function that takes the
     * click event target and returns a boolean.
     *
     * @memberof Options#
     * @type {boolean|Function}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * // don't clear current selection when mouse click was outside the grid
     * outsideClickDeselects: false,
     *
     * // or
     * outsideClickDeselects: function(event) {
     *   return false;
     * }
     * ```
     */
    outsideClickDeselects: true,

    /**
     * If `true`, <kbd>ENTER</kbd> begins editing mode (like in Google Docs). If `false`, <kbd>ENTER</kbd> moves to next
     * row (like Excel) and adds a new row if necessary. <kbd>TAB</kbd> adds new column if necessary.
     *
     * @memberof Options#
     * @type {boolean}
     * @default true
     * @category Core
     *
     * @example
     * ```js
     * enterBeginsEditing: false,
     * ```
     */
    enterBeginsEditing: true,

    /**
     * Defines the cursor movement after <kbd>ENTER</kbd> was pressed (<kbd>SHIFT</kbd> + <kbd>ENTER</kbd> uses a negative vector). Can
     * be an object or a function that returns an object. The event argument passed to the function is a DOM Event object
     * received after the <kbd>ENTER</kbd> key has been pressed. This event object can be used to check whether user pressed
     * <kbd>ENTER</kbd> or <kbd>SHIFT</kbd> + <kbd>ENTER</kbd>.
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {col: 0, row: 1}
     * @category Core
     *
     * @example
     * ```js
     * // move selection diagonal by 1 cell in x and y axis
     * enterMoves: {col: 1, row: 1},
     * // or as a function
     * enterMoves: function(event) {
     *   return {col: 1, row: 1};
     * },
     * ```
     */
    enterMoves: { col: 0, row: 1 },

    /**
     * Defines the cursor movement after <kbd>TAB</kbd> is pressed (<kbd>SHIFT</kbd> + <kbd>TAB</kbd> uses a negative vector). Can
     * be an object or a function that returns an object. The event argument passed to the function is a DOM Event object
     * received after the <kbd>TAB</kbd> key has been pressed. This event object can be used to check whether user pressed
     * <kbd>TAB</kbd> or <kbd>SHIFT</kbd> + <kbd>TAB</kbd>.
     *
     * @memberof Options#
     * @type {object|Function}
     * @default {row: 0, col: 1}
     * @category Core
     *
     * @example
     * ```js
     * // move selection 2 cells away after TAB pressed.
     * tabMoves: {row: 2, col: 2},
     * // or as a function
     * tabMoves: function(event) {
     *   return {row: 2, col: 2};
     * },
     * ```
     */
    tabMoves: { row: 0, col: 1 },

    /**
     * If set to `true`: when you use keyboard navigation,
     * and you cross the grid's left or right edge,
     * cell selection jumps to the opposite edge.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable jumping across the grid's vertical edges
     * autoWrapRow: true,
     * ```
     */
    autoWrapRow: false,

    /**
     * If set to `true`: when you use keyboard navigation,
     * and you cross the grid's top or bottom edge,
     * cell selection jumps to the grid's opposite edge.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable jumping across the grid's horizontal edges
     * autoWrapCol: true,
     * ```
     */
    autoWrapCol: false,

    /**
     * @description
     * Turns on saving the state of column sorting, column positions and column sizes in local storage.
     *
     * You can save any sort of data in local storage to preserve table state between page reloads.  In order to enable
     * data storage mechanism, `persistentState` option must be set to `true` (you can set it either during Handsontable
     * initialization or using the `updateSettings` method). When `persistentState` is enabled it exposes 3 hooks:
     *
     * __persistentStateSave__ (key: String, value: Mixed).
     *
     *   * Saves value under given key in browser local storage.
     *
     * __persistentStateLoad__ (key: String, valuePlaceholder: Object).
     *
     *   * Loads `value`, saved under given key, form browser local storage. The loaded `value` will be saved in
     *   `valuePlaceholder.value` (this is due to specific behaviour of `Hooks.run()` method). If no value have
     *   been saved under key `valuePlaceholder.value` will be `undefined`.
     *
     * __persistentStateReset__ (key: String).
     *
     *   * Clears the value saved under `key`. If no `key` is given, all values associated with table will be cleared.
     *
     * __Note:__ The main reason behind using `persistentState` hooks rather than regular LocalStorage API is that it
     * ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more)
     * instances of Handsontable on one page, data saved by one instance won't be accessible by the second instance.
     * Those two instances can store data under the same key and no data would be overwritten.
     *
     * __Important:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
     *
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category PersistentState
     *
     * @example
     * ```js
     * // enable the persistent state plugin
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
