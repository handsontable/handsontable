import { isDefined } from './helpers/mixed';
import { isObjectEqual } from './helpers/object';

/**
 * @alias Options
 * @constructor
 * @description

 * ## Constructor options
 *
 * Constructor options are applied using an object literal passed as a second argument to the Handsontable constructor.
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
 * ---
 * ## Cascading configuration
 *
 * Handsontable is using *Cascading Configuration*, which is a fast way to provide configuration options
 * for the entire table, including its columns and particular cells.
 *
 * Consider the following example:
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   readOnly: true,
 *   columns: [
 *     {readOnly: false},
 *     {},
 *     {}
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
 * The above notation will result in all TDs being *read only*, except for first column TDs which will be *editable*, except for the TD in top left corner which will still be *read only*.
 *
 * ### The Cascading Configuration model
 *
 * ##### 1. Constructor
 *
 * Configuration options that are provided using first-level `handsontable(container, {option: "value"})` and `updateSettings` method.
 *
 * ##### 2. Columns
 *
 * Configuration options that are provided using second-level object `handsontable(container, {columns: {option: "value"}]})`
 *
 * ##### 3. Cells
 *
 * Configuration options that are provided using third-level function `handsontable(container, {cells: function: (row, col, prop){ }})`
 *
 * ---
 * ## Architecture performance
 *
 * The Cascading Configuration model is based on prototypical inheritance. It is much faster and memory efficient
 * compared to the previous model that used jQuery extend. See: [http://jsperf.com/extending-settings](http://jsperf.com/extending-settings).
 *
 * ---
 * __Important notice:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
 */
function DefaultSettings() {}

DefaultSettings.prototype = {
  /**
   * License key for commercial version of Handsontable.
   *
   * @pro
   * @type {String}
   * @default 'trial'
   * @example
   * ```js
   * licenseKey: '00000-00000-00000-00000-00000',
   * ```
   */
  licenseKey: 'trial',

  /**
   * @description
   * Initial data source that will be bound to the data grid __by reference__ (editing data grid alters the data source).
   * Can be declared as an array of arrays, array of objects or a function.
   *
   * See [Understanding binding as reference](https://docs.handsontable.com/tutorial-data-binding.html#page-reference).
   *
   * @type {Array[]|Object[]|Function}
   * @default undefined
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
   * See [data-schema](https://docs.handsontable.com/tutorial-data-sources.html#page-data-schema) for more options.
   *
   * @type {Object}
   * @default undefined
   *
   * @example
   * ```
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
   * @type {Number|Function}
   * @default undefined
   *
   * @example
   * ```
   * // as a number
   * width: 500,
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
   * @type {Number|Function}
   * @default undefined
   *
   * @example
   * ```js
   * // as a number
   * height: 500,
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
   * __Note:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
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
   * __Note:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
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
   * @type {Boolean|String[]|Function}
   * @default undefined
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
   * @type {Boolean|String[]|Function}
   * @default null
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
   * @type {Number|Number[]|String|String[]|Function}
   * @default undefined
   *
   * @example
   * ```js
   * // as a number, for each column.
   * colWidths: 100,
   *
   * // as a string, for each column.
   * colWidths: '100px',
   *
   * // as an array, based on visual indexes. The rest of the columns have a default width.
   * colWidths: [100, 120, 90],
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
   * Height should be equal or greater than 23px. Table is rendered incorrectly if height is less than 23px.
   *
   * @type {Number|Number[]|String|String[]|Function}
   * @default undefined
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
   * See [documentation -> datasources.html](https://docs.handsontable.com/tutorial-data-sources.html#page-nested) for examples.
   *
   * @type {Object[]|Function}
   * @default undefined
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
   * - property name for column's data source object, when dataset is an [array of objects](/tutorial-data-sources.html#page-object)
   * - the same number as `col`, when dataset is an [array of arrays](/tutorial-data-sources.html#page-array)
   *
   * @type {Function}
   * @default undefined
   *
   * @example
   * ```js
   * cells: function(row, column, prop) {
   *   const cellProperties = {};
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
   * @type {Array[]}
   * @default []
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
   * See [Comments](https://docs.handsontable.com/demo-comments_.html) demo for examples.
   *
   * @type {Boolean|Object[]}
   * @default false
   *
   * @example
   * ```js
   * // enable comments plugin
   * comments: true,
   *
   * // or
   * // enable comments plugin and add predefined comments
   * comments: [
   *   {
   *     row: 1,
   *     col: 1,
   *     comment: {
   *       value: "Test comment"
   *     }
   *   }
   * ],
   * ```
   */
  comments: false,

  /**
   * @description
   * If `true`, enables the {@link CustomBorders} plugin, which enables an option to apply custom borders through the context
   * menu (configurable with context menu key `borders`). To initialize Handsontable with predefined custom borders,
   * provide cell coordinates and border styles in a form of an array.
   *
   * See [Custom Borders](https://docs.handsontable.com/demo-custom-borders.html) demo for examples.
   *
   * @type {Boolean|Object[]}
   * @default false
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
   * @type {Number}
   * @default 0
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
   *
   * @type {Number}
   * @default 0
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
   * @type {Number}
   * @default Infinity
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
   * @type {Number}
   * @default Infinity
   *
   * @example
   * ```js
   * // limit table size to maximum 300 columns
   * maxCols: 300,
   * ```
   */
  maxCols: Infinity,

  /**
   * When set to 1 (or more), Handsontable will add a new row at the end of grid if there are no more empty rows.
   * (unless the number of rows exceeds the one set in the `maxRows` property)
   *
   * @type {Number}
   * @default 0
   *
   * @example
   * ```js
   * // always add 3 empty rows at the table end
   * minSpareRows: 3,
   * ```
   */
  minSpareRows: 0,

  /**
   * When set to 1 (or more), Handsontable will add a new column at the end of grid if there are no more empty columns.
   * (unless the number of rows exceeds the one set in the `maxCols` property)
   *
   * @type {Number}
   * @default 0
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
   * @type {Boolean}
   * @default true
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
   * @type {Boolean}
   * @default true
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
   * @type {Boolean}
   * @default true
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
   * @type {Boolean}
   * @default true
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
   * [https://docs.handsontable.com/demo-selecting-ranges.html](https://docs.handsontable.com/demo-selecting-ranges.html).
   *
   * @type {String}
   * @default 'multiple'
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
   * @type {Boolean|String|Object}
   * @default true
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
   * @type {Number}
   * @default 0
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
   * @pro
   * @type {Number}
   * @default 0
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
   * @type {Number}
   * @default 0
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
   * @type {Boolean|Function}
   * @default true
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
   * @type {Boolean}
   * @default true
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
   * @type {Object|Function}
   * @default {row: 1, col: 0}
   *
   * @example
   * ```js
   * // move selection diagonal by 1 cell in x and y axis
   * enterMoves: {row: 1, col: 1},
   * // or as a function
   * enterMoves: function(event) {
   *   return {row: 1, col: 1};
   * },
   * ```
   */
  enterMoves: { row: 1, col: 0 },

  /**
   * Defines the cursor movement after <kbd>TAB</kbd> is pressed (<kbd>SHIFT</kbd> + <kbd>TAB</kbd> uses a negative vector). Can
   * be an object or a function that returns an object. The event argument passed to the function is a DOM Event object
   * received after the <kbd>TAB</kbd> key has been pressed. This event object can be used to check whether user pressed
   * <kbd>TAB</kbd> or <kbd>SHIFT</kbd> + <kbd>TAB</kbd>.
   *
   * @type {Object|Function}
   * @default {row: 0, col: 1}
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
   * If `true`, pressing <kbd>TAB</kbd> or right arrow in the last column will move to first column in next row.
   *
   * @type {Boolean}
   * @default true
   *
   * @example
   * ```js
   * // stop TAB key navigation on the last column
   * autoWrapRow: false,
   * ```
   */
  autoWrapRow: true,

  /**
   * If `true`, pressing <kbd>ENTER</kbd> or down arrow in the last row will move to the first row in the next column.
   *
   * @type {Boolean}
   * @default true
   *
   * @example
   * ```js
   * // stop ENTER key navigation on the last row
   * autoWrapCol: false,
   * ```
   */
  autoWrapCol: true,

  /**
   * @description
   * Turns on saving the state of column sorting, column positions and column sizes in local storage.
   *
   * You can save any sort of data in local storage to preserve table state between page reloads.  In order to enable
   * data storage mechanism, `persistentState` option must be set to `true` (you can set it either during Handsontable
   * initialization or using the `updateSettings` method). When `persistentState` is enabled it exposes 3 hooks:
   *
   * __persistentStateSave__ (key: String, value: Mixed)
   *
   *   * Saves value under given key in browser local storage.
   *
   * __persistentStateLoad__ (key: String, valuePlaceholder: Object)
   *
   *   * Loads `value`, saved under given key, form browser local storage. The loaded `value` will be saved in
   *   `valuePlaceholder.value` (this is due to specific behaviour of `Hooks.run()` method). If no value have
   *   been saved under key `valuePlaceholder.value` will be `undefined`.
   *
   * __persistentStateReset__ (key: String)
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
   * @type {Boolean}
   * @default false
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
   * @type {String}
   * @default undefined
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
   * @type {String}
   * @default undefined
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
   * @type {String}
   * @default 'ht__highlight'
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
   * @type {String}
   * @since 0.38.2
   * @default 'ht__active_highlight'
   *
   * @example
   * ```js
   * // this will add a 'ht__active_highlight' class name to appropriate table headers.
   * activeHeaderClassName: 'ht__active_highlight',
   * ```
   */
  activeHeaderClassName: 'ht__active_highlight',

  /**
   * Class name for the Handsontable container element.
   *
   * @type {String|String[]}
   * @default undefined
   *
   * @example
   * ```js
   * // set custom class for table container
   * className: 'your__class--name',
   *
   * // or
   * className: ['first-class-name', 'second-class-name'],
   * ```
   */
  className: void 0,

  /**
   * Class name for all tables inside container element.
   *
   * @type {String|String[]}
   * @default undefined
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
   * [See more](https://docs.handsontable.com/demo-stretching.html) mode. Possible values:
   *  * `'none'` Disable stretching
   *  * `'last'` Stretch only the last column
   *  * `'all'` Stretch all the columns evenly
   *
   * @type {String}
   * @default 'none'
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
   * @type {Function}
   * @param {Number} row Visual row index.
   * @returns {Boolean}
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

      if (value !== '' && value !== null && isDefined(value)) {
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
   * @type {Function}
   * @param {Number} column Visual column index
   * @returns {Boolean}
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

      if (value !== '' && value !== null && isDefined(value)) {
        return false;
      }
    }

    return true;
  },

  /**
   * When set to `true`, the table is re-rendered when it is detected that it was made visible in DOM.
   *
   * @type {Boolean}
   * @default true
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
   * @type {Boolean}
   * @default true
   *
   * @example
   * ```js
   * // don't save the invalid values
   * allowInvalid: false,
   * ```
   */
  allowInvalid: true,

  /**
   * If set to `true`, Handsontable will accept values that are empty (`null`, `undefined` or `''`). If set to `false`,
   * Handsontable will *not* accept the empty values and mark cell as invalid.
   *
   * @type {Boolean}
   * @default true
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
   * @type {String}
   * @default 'htInvalid'
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
   * @type {String}
   * @default undefined
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
   * @type {String}
   * @default 'htPlaceholder'
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
   * @type {String}
   * @default 'htDimmed'
   *
   * @example
   * ```js
   * // set custom read-only class
   * readOnlyCellClassName: 'is-readOnly',
   * ```
   */
  readOnlyCellClassName: 'htDimmed',

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
   * Or you can [register](https://docs.handsontable.com/demo-custom-renderers.html) the custom renderer under specified name and use its name as an alias in your
   * configuration.
   *
   * If a function is provided, it will receive the following arguments:
   * ```js
   * function(instance, TD, row, col, prop, value, cellProperties) {}
   * ```
   *
   * You can read more about custom renderes [in the documentation](https://docs.handsontable.com/demo-custom-renderers.html).
   *
   * @type {String|Function}
   * @default undefined
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

  /**
   * CSS class name added to the commented cells.
   *
   * @type {String}
   * @default 'htCommentCell'
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
   * @type {Boolean|String}
   * @default false
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
   * Makes cell [read only](https://docs.handsontable.com/demo-read-only.html).
   *
   * @type {Boolean}
   * @default false
   *
   * @example
   * ```js
   * // set cell as read only
   * readOnly: true,
   * ```
   */
  readOnly: false,

  /**
   * @description
   * When added to a `column` property, it skips the column on paste and pastes the data on the next column to the right.
   *
   * @type {Boolean}
   * @default false
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
   * Setting to `true` enables the {@link Search} plugin (see [demo](https://docs.handsontable.com/demo-search-for-values.html)).
   *
   * @type {Boolean}
   * @default false
   *
   * @example
   * ```js
   * // enable search plugin
   * search: true,
   *
   * // or
   * // as an object with detailed configuration
   * search: {
   *   searchResultClass: 'customClass',
   *   queryMethod: function(queryStr, value) {
   *     ...
   *   },
   *   callback: function(instance, row, column, value, result) {
   *     ...
   *   }
   * }
   * ```
   */
  search: false,

  /**
   * @description
   * Shortcut to define the combination of the cell renderer, editor and validator for the column, cell or whole table.
   *
   * Possible values:
   *  * [autocomplete](https://docs.handsontable.com/demo-autocomplete.html)
   *  * [checkbox](https://docs.handsontable.com/demo-checkbox.html)
   *  * [date](https://docs.handsontable.com/demo-date.html)
   *  * [dropdown](https://docs.handsontable.com/demo-dropdown.html)
   *  * [handsontable](https://docs.handsontable.com/demo-handsontable.html)
   *  * [numeric](https://docs.handsontable.com/demo-numeric.html)
   *  * [password](https://docs.handsontable.com/demo-password.html)
   *  * text
   *  * [time](https://docs.handsontable.com/demo-time.html)
   *
   * Or you can register the custom cell type under specified name and use
   * its name as an alias in your configuration.
   *
   * @type {String}
   * @default 'text'
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
   * @type {Boolean}
   * @default true
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
   *  * [autocomplete](https://docs.handsontable.com/demo-autocomplete.html)
   *  * [checkbox](https://docs.handsontable.com/demo-checkbox.html)
   *  * [date](https://docs.handsontable.com/demo-date.html)
   *  * [dropdown](https://docs.handsontable.com/demo-dropdown.html)
   *  * [handsontable](https://docs.handsontable.com/demo-handsontable.html)
   *  * [mobile](https://docs.handsontable.com/demo-mobiles-and-tablets.html)
   *  * [password](https://docs.handsontable.com/demo-password.html)
   *  * [select](https://docs.handsontable.com/demo-select.html)
   *  * text
   *
   * Or you can [register](https://docs.handsontable.com/tutorial-cell-editor.html#registering-an-editor) the custom editor under specified name and use its name as an alias in your
   * configuration.
   *
   * To disable cell editing completely set `editor` property to `false`.
   *
   * @type {String|Function|Boolean}
   * @default undefined
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
   * @type {Number}
   * @default 10
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
   * @type {Boolean}
   * @default true
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
   * Setting to `true` enables the debug mode, currently used to test the correctness of the row and column
   * header fixed positioning on a layer above the master table.
   *
   * @type {Boolean}
   * @default false
   *
   * @example
   * ```js
   * // enable debug mode
   * debug: true,
   * ```
   */
  debug: false,

  /**
   * When set to `true`, the text of the cell content is wrapped if it does not fit in the fixed column width.
   *
   * @type {Boolean}
   * @default true
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
   * @type {String}
   * @default 'htNoWrap'
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
   * place in the grid among [other features](https://docs.handsontable.com/demo-context-menu.html).
   * Possible values:
   * * `true` (to enable default options),
   * * `false` (to disable completely)
   * * an array of [predefined options](https://docs.handsontable.com/demo-context-menu.html#page-specific),
   * * an object [with defined structure](https://docs.handsontable.com/demo-context-menu.html#page-custom)
   *
   * See [the context menu demo](https://docs.handsontable.com/demo-context-menu.html) for examples.
   *
   * @type {Boolean|String[]|Object}
   * @default undefined
   *
   * @example
   * ```js
   * // as a boolean
   * contextMenu: true,
   *
   * // as an array
   * contextMenu: ['row_above', 'row_below', '--------', 'undo', 'redo'],
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
   * @type {Boolean}
   * @default true
   *
   * @example
   * ```js
   * // disable copy and paste
   * copyPaste: false,
   * ```
   */
  copyPaste: true,

  /**
   * If `true`, undo/redo functionality is enabled.
   *
   * @type {Boolean}
   * @default undefined
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
   * Turns on [Column sorting](https://docs.handsontable.com/demo-sorting-data.html). Can be either a boolean (`true` / `false`) or an object with a declared sorting options:
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
   * * `sortEmptyCells` - how empty values should be handled
   *   * `true` = the table sorts empty cells
   *   * `false` = the table moves all empty cells to the end of the table
   * * `compareFunctionFactory` - curry function returning compare function; compare function should work in the same way as function which is handled by native `Array.sort` method); please take a look at below examples for more information.
   *
   * @type {Boolean|Object}
   * @default undefined
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
   * }```
   */
  columnSorting: void 0,

  /**
   * Turns on [Manual column move](https://docs.handsontable.com/demo-moving-rows-and-columns.html), if set to a boolean or define initial column order (as an array of column indexes).
   *
   * @type {Boolean|Number[]}
   * @default undefined
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
   * Turns on [Manual column resize](https://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial column resized widths (an an array of widths).
   *
   * @type {Boolean|Number[]}
   * @default undefined
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
   * Turns on [Manual row move](https://docs.handsontable.com/demo-moving-rows-and-columns.html), if set to a boolean or define initial row order (as an array of row indexes).
   *
   * @type {Boolean|Number[]}
   * @default undefined
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
   * Turns on [Manual row resize](https://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial row resized heights (as an array of heights).
   *
   * @type {Boolean|Number[]}
   * @default undefined
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
   * in the objects (see the example below). More information on [the demo page](https://docs.handsontable.com/demo-merge-cells.html).
   *
   * @type {Boolean|Object[]}
   * @default false
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
   * Turns on [Multi-column sorting](https://docs.handsontable.com/pro/demo-multicolumn-sorting.html). Can be either a boolean (`true` / `false`) or an object with a declared sorting options:
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
   * * `sortEmptyCells` - how empty values should be handled
   *   * `true` = the table sorts empty cells
   *   * `false` = the table moves all empty cells to the end of the table
   * * `compareFunctionFactory` - curry function returning compare function; compare function should work in the same way as function which is handled by native `Array.sort` method); please take a look at below examples for more information.
   *
   * @pro
   * @type {Boolean|Object}
   * @default undefined
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
   * }```
   */
  multiColumnSorting: void 0,
  /**
   * @description
   * Number of rows to be rendered outside of the visible part of the table. By default, it's set to `'auto'`, which
   * makes Handsontable to attempt to calculate the best offset performance-wise.
   *
   * You may test out different values to find the best one that works for your specific implementation.
   *
   * @type {Number|String}
   * @default 'auto'
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
   * @type {Number|String}
   * @default 'auto'
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
   * Or you can [register](https://docs.handsontable.com/demo-data-validation.html) the validator function under specified name and use its name as an alias in your
   * configuration.
   *
   * See more [in the demo](https://docs.handsontable.com/demo-data-validation.html).
   *
   * @type {Function|RegExp|String}
   * @default undefined
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
   *  * `true` - Disables any type of visual selection (current and area selection),
   *  * `false` - Enables any type of visual selection. This is default value.
   *  * `'current'` - Disables the selection of a currently selected cell, the area selection is still present.
   *  * `'area'` - Disables the area selection, the currently selected cell selection is still present.
   *  * `'header'` - Disables the headers selection, the currently selected cell selection is still present.
   *
   * @type {Boolean|String|String[]}
   * @default false
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
   * @type {Boolean}
   * @default undefined
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
   * @type {Boolean}
   * @default true
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
   * @type {Array|Function}
   * @default undefined
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
   * @type {String}
   * @default undefined
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
   * @type {Boolean|String|Number}
   * @default true
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
   * @type {Boolean|String|Number}
   * @default false
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
   * __Note__, this option only works for [checkbox-typed](https://docs.handsontable.com/demo-checkbox.html) cells.
   *
   * By default the [checkbox](https://docs.handsontable.com/demo-checkbox.html) renderer renders the checkbox without a label.
   *
   * Possible object properties:
   *  * `property` - Defines the property name of the data object, which will to be used as a label.
   *  (eg. `label: {property: 'name.last'}`). This option works only if data was passed as an array of objects.
   *  * `position` - String which describes where to place the label text (before or after checkbox element).
   * Valid values are `'before'` and '`after`' (defaults to `'after'`).
   *  * `value` - String or a Function which will be used as label text.
   *
   * @type {Object}
   * @default undefined
   *
   * @example
   * ```js
   * columns: [{
   *   type: 'checkbox',
   *   // add "My label:" after the checkbox
   *   label: {position: 'after', value: 'My label: '}
   * }],
   * ```
   */
  label: void 0,

  /**
   * Display format for numeric typed renderers.
   *
   * __Note__, this option only works for [numeric-typed](https://docs.handsontable.com/demo-numeric.html) cells.
   *
   * Format is described by two properties:
   * * `pattern` - Handled by `numbro` for purpose of formatting numbers to desired pattern. List of supported patterns can be found [here](http://numbrojs.com/format.html#numbers).
   * * `culture` - Handled by `numbro` for purpose of formatting currencies. Examples showing how it works can be found [here](http://numbrojs.com/format.html#currency). List of supported cultures can be found [here](http://numbrojs.com/languages.html#supported-languages).
   *
   * __Note:__ Please keep in mind that this option is used only to format the displayed output! It has no effect on the input data provided for the cell. The numeric data can be entered to the table only as floats (separated by a dot or a comma) or integers, and are stored in the source dataset as JavaScript numbers.
   *
   * Handsontable uses [numbro](http://numbrojs.com/) as a main library for numbers formatting.
   *
   * @since 0.35.0
   * @type {Object}
   * @default undefined
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
   * Language for Handsontable translation. Possible language codes are [listed here](https://docs.handsontable.com/tutorial-internationalization.html#available-languages).
   *
   * @type {String}
   * @default 'en-US'
   *
   * @example
   * ```js
   * // set Polish language
   * language: 'pl-PL',
   * ```
   */
  language: 'en-US',

  /**
   * Data source for [select-typed](https://docs.handsontable.com/demo-select.html) cells.
   *
   * __Note__, this option only works for [select-typed](https://docs.handsontable.com/demo-select.html) cells.
   *
   * @type {String[]}
   * @default undefined
   *
   * @example
   * ```js
   * columns: [
   *   {
   *     editor: 'select',
   *     // add three select options to choose from
   *     selectOptions: ['A', 'B', 'C'],
   *   }
   * ],
   * ```
   */
  selectOptions: void 0,

  /**
   * Enables or disables the {@link AutoColumnSize} plugin. Default value is `undefined`, which has the same effect as `true`.
   * Disabling this plugin can increase performance, as no size-related calculations would be done.
   *
   * Column width calculations are divided into sync and async part. Each of those parts has their own advantages and
   * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
   * operations don't block the browser UI.
   *
   * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.
   *
   * You can also use the `useHeaders` option to take the column headers width into calculation.
   *
   * @type {Object|Boolean}
   * @default {syncLimit: 50}
   *
   * @example
   * ```js
   * // as a number (300 columns in sync, rest async)
   * autoColumnSize: {syncLimit: 300},
   *
   * // as a string (percent)
   * autoColumnSize: {syncLimit: '40%'},
   *
   * // use headers width while calculating the column width
   * autoColumnSize: {useHeaders: true},
   * ```
   */
  autoColumnSize: void 0,

  /**
   * Enables or disables {@link AutoRowSize} plugin. Default value is `undefined`, which has the same effect as `false`
   * (disabled). Enabling this plugin can decrease performance, as size-related calculations would be performed.
   *
   * Row height calculations are divided into sync and async stages. Each of these stages has their own advantages and
   * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
   * operations don't block the browser UI.
   *
   * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.
   *
   * @type {Object|Boolean}
   * @default {syncLimit: 500}
   *
   * @example
   * ```js
   * // as a number (300 columns in sync, rest async)
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
   * __Note__, this option only works for [date-typed](https://docs.handsontable.com/demo-date.html) cells.
   *
   * @type {String}
   * @default 'DD/MM/YYYY'
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
   * __Note__, this option only works for [date-typed](https://docs.handsontable.com/demo-date.html) cells.
   *
   * @type {Boolean}
   * @default false
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
   * __Note__, this option only works for [date-typed](https://docs.handsontable.com/demo-date.html) cells.
   *
   * @type {String}
   * @default undefined
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
   * __Note__, this option only works for [autocomplete-typed](https://docs.handsontable.com/demo-autocomplete.html) cells.
   *
   * @type {Boolean}
   * @default undefined
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
   * __Note__, this option only works for [autocomplete-typed](https://docs.handsontable.com/demo-autocomplete.html) cells.
   *
   * @type {Boolean}
   * @default false
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
   * @type {Boolean}
   * @default undefined
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
   * @type {String|Boolean}
   * @default false
   *
   * @example
   * ```js
   * preventOverflow: 'horizontal',
   * ```
   */
  preventOverflow: false,

  /**
   * @description
   * Enables the functionality of the {@link BindRowsWithHeaders} plugin which allows binding the table rows with their headers.
   * If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically,
   * if at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.
   *
   * @pro
   * @type {Boolean|String}
   * @default undefined
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
   * @pro
   * @type {Boolean|Object[]}
   * @default undefined
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
   * Allows making pre-defined calculations on the cell values and display the results within Handsontable.
   *
   * Possible types:
   *  * `'sum'`
   *  * `'min'`
   *  * `'max'`
   *  * `'count'`
   *  * `'average'`
   *  * `'custom'` - add `customFunction`
   *
   * [See the demo for more information](https://docs.handsontable.com/pro/demo-summary-calculations.html).
   *
   * @pro
   * @type {Object[]|Function}
   * @default undefined
   *
   * @example
   * ```
   * columnSummary: [
   *   {
   *     destinationRow: 4,
   *     destinationColumn: 1,
   *     forceNumeric: true,
   *     reversedRowCoords: true,
   *     suppressDataTypeErrors: false,
   *     readOnly: true,
   *     roundFloat: false,
   *     type: 'custom',
   *     customFunction: function(endpoint) {
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
   * @pro
   * @type {Boolean|Object|String[]}
   * @default undefined
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
   * @pro
   * @type {Boolean}
   * @default undefined
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
   * @pro
   * @type {Boolean|Object}
   * @default undefined
   *
   * @example
   * ```js
   * // enable formulas plugin
   * formulas: true,
   *
   * // or as an object with custom variables to be used in formula expressions
   * formulas: {
   *   variables: {
   *     FOO: 64,
   *     BAR: 'baz',
   *   }
   * },
   * ```
   */
  formulas: void 0,

  /**
   * @description
   * The {@link GanttChart} plugin enables a possibility to create a Gantt chart using a Handsontable instance. In this
   * case, the whole table becomes read-only.
   *
   * @pro
   * @type {Object}
   * @default undefined
   */
  ganttChart: void 0,

  /**
   * @description
   * Allows adding a tooltip to the table headers.
   *
   * Available options:
   * * the `rows` property defines if tooltips should be added to row headers,
   * * the `columns` property defines if tooltips should be added to column headers,
   * * the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).
   *
   * @pro
   * @type {Boolean|Object}
   * @default undefined
   *
   * @example
   * ```js
   * // enable tooltips for all headers
   * headerTooltips: true,
   *
   * // or
   * headerTooltips: {
   *   rows: false,
   *   columns: true,
   *   onlyTrimmed: true
   * }
   * ```
   */
  headerTooltips: void 0,

  /**
   * The {@link HiddenColumns} plugin allows hiding of certain columns. You can pass additional configuration with an
   * object notation. Options that are then available are:
   *  * `columns` - an array of rows that should be hidden on plugin initialization
   *  * `indicators` - enables small ui markers to indicate where are hidden columns
   *
   * @pro
   * @type {Boolean|Object}
   * @default undefined
   *
   * @example
   * ```js
   * // enable column hiding
   * hiddenColumns: true,
   *
   * // or
   * hiddenColumns: {
   *   // set columns that are hidden by default
   *   columns: [5, 10, 15],
   *   // show where are hidden columns
   *   indicators: true
   * }
   * ```
   */
  hiddenColumns: void 0,

  /**
   * The {@link HiddenRows} plugin allows hiding of certain rows. You can pass additional configuration with an
   * object notation. Options that are then available are:
   *  * `rows` - an array of rows that should be hidden on plugin initialization
   *  * `indicators` - enables small ui markers to indicate where are hidden columns
   *
   * @pro
   * @type {Boolean|Object}
   * @default undefined
   *
   * @example
   * ```js
   * // enable row hiding
   * hiddenRows: true,
   *
   * // or
   * hiddenRows: {
   *   // set rows that are hidden by default
   *   rows: [5, 10, 15],
   *   // show where are hidden rows
   *   indicators: true
   * }
   * ```
   */
  hiddenRows: void 0,

  /**
   * @description
   * Allows creating a nested header structure, using the HTML's colspan attribute.
   *
   * @pro
   * @type {Array[]}
   * @default undefined
   *
   * @example
   * ```
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
   * @pro
   * @type {Boolean|Number[]}
   * @default undefined
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
   * @type {Number|Number[]}
   * @default undefined
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
   * @type {Number|Number[]}
   * @default undefined
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
   * @description
   * Enables the {@link ObserveChanges} plugin switches table into one-way data binding where changes are applied into
   * data source (from outside table) will be automatically reflected in the table.
   *
   * For every data change [afterChangesObserved](Hooks.html#event:afterChangesObserved) hook will be fired.
   *
   * @type {Boolean}
   * @default undefined
   *
   * @example
   * ```js
   * observeChanges: true,
   * ```
   */
  observeChanges: void 0,

  /**
   * If defined as `true`, the Autocomplete's suggestion list would be sorted by relevance (the closer to the left the
   * match is, the higher the suggestion).
   *
   * __Note__, this option only works for [autocomplete-typed](https://docs.handsontable.com/demo-autocomplete.html) cells.
   *
   * @type {Boolean}
   * @default true
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
   * __Note__, this option only works for [autocomplete-typed](https://docs.handsontable.com/demo-autocomplete.html) cells.
   *
   * @type {Boolean}
   * @default true
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
   * __Note__, this option only works for [autocomplete-typed](https://docs.handsontable.com/demo-autocomplete.html) cells.
   *
   * @type {Boolean}
   * @default: false
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
   * Disables or enables the drag to scroll functionality.
   *
   * @type {Boolean}
   * @default true
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
   * See [quick setup of the Nested rows](https://docs.handsontable.kbudnik/pro/next/demo-nested-rows.html).
   * @example
   * ```js
   * nestedRows: true,
   * ```
   *
   * @pro
   * @type {Boolean}
   * @default false
   */
  nestedRows: void 0,
};

export default DefaultSettings;
