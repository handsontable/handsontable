import {isDefined} from './helpers/mixed';

/**
 * @alias Options
 * @constructor
 * @description

 * ## Constructor options
 *
 * Constructor options are applied using an object literal passed as a second argument to the Handsontable constructor.
 *
 * ```js
 * var hot = new Handsontable(document.getElementById('example1'), {
 *   data: myArray,
 *   width: 400,
 *   height: 300
 * });
 * ```
 *
 * ---
 * ## Cascading configuration
 *
 * Handsontable 0.9 and newer is using *Cascading Configuration*, which is a fast way to provide configuration options
 * for the entire table, including its columns and particular cells.
 *
 * Consider the following example:
 * ```js
 * var hot = new Handsontable(document.getElementById('example'), {
 *   readOnly: true,
 *   columns: [
 *     {readOnly: false},
 *     {},
 *     {}
 *   ],
 *   cells: function (row, col, prop) {
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
 * Configuration options that are provided using second-level function `handsontable(container, {cells: function: (row, col, prop){ }})`
 *
 * ---
 * ## Architecture performance
 *
 * The Cascading Configuration model is based on prototypical inheritance. It is much faster and memory efficient compared
 * to the previous model that used jQuery extend. See: [http://jsperf.com/extending-settings](http://jsperf.com/extending-settings).
 *
 * ---
 * __Important notice:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
 */
function DefaultSettings() {};

DefaultSettings.prototype = {
  /**
   * @description
   * Initial data source that will be bound to the data grid __by reference__ (editing data grid alters the data source).
   * Can be declared as an Array of Arrays, Array of Objects or a Function.
   *
   * See [Understanding binding as reference](http://docs.handsontable.com/tutorial-data-binding.html#page-reference).
   *
   * @type {Array|Function}
   * @default undefined
   */
  data: void 0,

  /**
   * @description
   * Defines the structure of a new row when data source is an array of objects.
   *
   * See [data-schema](http://docs.handsontable.com/tutorial-data-sources.html#page-data-schema) for examples.
   *
   * @type {Object}
   * @default undefined
   */
  dataSchema: void 0,

  /**
   * Width of the grid. Can be a value or a function that returns a value.
   *
   * @type {Number|Function}
   * @default undefined
   */
  width: void 0,

  /**
   * Height of the grid. Can be a number or a function that returns a number.
   *
   * @type {Number|Function}
   * @default undefined
   */
  height: void 0,

  /**
   * @description
   * Initial number of rows.
   *
   * __Notice:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
   */
  startRows: 5,

  /**
   * @description
   * Initial number of columns.
   *
   * __Notice:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
   */
  startCols: 5,

  /**
   * Setting `true` or `false` will enable or disable the default row headers (1, 2, 3).
   * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
   * If a function is set the index of the row is passed as a parameter.
   *
   * @type {Boolean|Array|Function}
   * @default null
   * @example
   * ```js
   * ...
   * // as boolean
   * rowHeaders: true,
   * ...
   *
   * ...
   * // as array
   * rowHeaders: [1, 2, 3],
   * ...
   *
   * ...
   * // as function
   * rowHeaders: function(index) {
   *   return index + ': AB';
   * },
   * ...
   * ```
   */
  rowHeaders: void 0,

  /**
   * Setting `true` or `false` will enable or disable the default column headers (A, B, C).
   * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
   * If a function is set, then the index of the column is passed as a parameter.
   *
   * @type {Boolean|Array|Function}
   * @default null
   * @example
   * ```js
   * ...
   * // as boolean
   * colHeaders: true,
   * ...
   *
   * ...
   * // as array
   * colHeaders: ['A', 'B', 'C'],
   * ...
   *
   * ...
   * // as function
   * colHeaders: function(index) {
   *   return index + ': AB';
   * },
   * ...
   * ```
   */
  colHeaders: null,

  /**
   * Defines column widths in pixels. Accepts number, string (that will be converted to a number),
   * array of numbers (if you want to define column width separately for each column) or a
   * function (if you want to set column width dynamically on each render).
   *
   * @type {Array|Function|Number|String}
   * @default undefined
   */
  colWidths: void 0,

  /**
   * Defines row heights in pixels. Accepts numbers, strings (that will be converted into a number),
   * array of numbers (if you want to define row height separately for each row) or a
   * function (if you want to set row height dynamically on each render).
   *
   * @type {Array|Function|Number|String}
   * @default undefined
   */
  rowHeights: void 0,

  /**
   * @description
   * Defines the cell properties and data binding for certain columns.
   *
   * __Notice:__ Using this option sets a fixed number of columns (options `startCols`, `minCols`, `maxCols` will be ignored).
   *
   * See [documentation -> datasources.html](http://docs.handsontable.com/tutorial-data-sources.html#page-nested) for examples.
   *
   * @type {Array}
   * @default undefined
   * @example
   * ```js
   * ...
   * columns: [
   *   {
   *     // column options for the first column
   *     type: 'numeric',
   *     format: '0,0.00 $'
   *   },
   *   {
   *     // column options for the second column
   *     type: 'text',
   *     readOnly: true
   *   }
   * ],
   * ...
   * ```
   */
  columns: void 0,

  /**
   * @description
   * Defines the cell properties for given `row`, `col`, `prop` coordinates.
   * Any constructor or column option may be overwritten for a particular cell (row/column combination)
   * using the `cells` property in the Handsontable constructor.
   *
   * __Note:__ Parameters `row` and `col` always represent __physical indexes__. Example below show how to execute
   * operations based on the __visual__ representation of Handsontable.
   *
   * @type {Function}
   * @default undefined
   * @example
   * ```js
   * ...
   * cells: function (row, col, prop) {
   *   var cellProperties = {};
   *   var visualRowIndex = this.instance.toVisualRow(row);
   *   var visualColIndex = this.instance.toVisualColumn(col);
   *
   *   if (visualRowIndex === 0 && visualColIndex === 0) {
   *     cellProperties.readOnly = true;
   *   }
   *
   *   return cellProperties;
   * },
   * ...
   * ```
   */
  cells: void 0,

  /**
   * Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell`
   * array passed to the Handsontable constructor.
   *
   * @type {Array}
   * @default []
   * @example
   * ```js
   * ...
   * cell: [
   *   {row: 0, col: 0, readOnly: true}
   * ],
   * ...
   * ```
   */
  cell: [],

  /**
   * @description
   * If `true`, enables the {@link Comments} plugin, which enables an option to apply cell comments through the context menu
   * (configurable with context menu keys `commentsAddEdit`, `commentsRemove`).
   *
   * To initialize Handsontable with predefined comments, provide cell coordinates and comment text values in a form of an array.
   *
   * See [Comments](http://docs.handsontable.com/demo-comments_.html) demo for examples.
   *
   * @since 0.11.0
   * @type {Boolean|Array}
   * @default false
   * @example
   * ```js
   * ...
   * comments: [{row: 1, col: 1, comment: {value: "Test comment"}}],
   * ...
   * ```
   */
  comments: false,

  /**
   * @description
   * If `true`, enables the Custom Borders plugin, which enables an option to apply custom borders through the context menu (configurable with context menu key `borders`).
   *
   * To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form of an array.
   *
   * See [Custom Borders](http://docs.handsontable.com/demo-custom-borders.html) demo for examples.
   *
   * @since 0.11.0
   * @type {Boolean|Array}
   * @default false
   * @example
   * ```js
   * ...
   * customBorders: [
   *   {range: {
   *     from: {row: 1, col: 1},
   *     to: {row: 3, col: 4}},
   *     left: {},
   *     right: {},
   *     top: {},
   *     bottom: {}
   *   }
   * ],
   * ...
   *
   * // or
   * ...
   * customBorders: [
   *   {row: 2, col: 2, left: {width: 2, color: 'red'},
   *     right: {width: 1, color: 'green'}, top: '', bottom: ''}
   * ],
   * ...
   * ```
   */
  customBorders: false,

  /**
   * Minimum number of rows. At least that number of rows will be created during initialization.
   *
   * @type {Number}
   * @default 0
   */
  minRows: 0,

  /**
   * Minimum number of columns. At least that number of columns will be created during initialization.
   *
   * @type {Number}
   * @default 0
   */
  minCols: 0,

  /**
   * Maximum number of rows. If set to a value lower than the initial row count, the data will be trimmed to the provided value as the number of rows.
   *
   * @type {Number}
   * @default Infinity
   */
  maxRows: Infinity,

  /**
   * Maximum number of cols. If set to a value lower than the initial col count, the data will be trimmed to the provided value as the number of cols.
   *
   * @type {Number}
   * @default Infinity
   */
  maxCols: Infinity,

  /**
   * When set to 1 (or more), Handsontable will add a new row at the end of grid if there are no more empty rows.
   * (unless the number of rows exceeds the one set in the `maxRows` property)
   *
   * @type {Number}
   * @default 0
   */
  minSpareRows: 0,

  /**
   * When set to 1 (or more), Handsontable will add a new column at the end of grid if there are no more empty columns.
   * (unless the number of rows exceeds the one set in the `maxCols` property)
   *
   * @type {Number}
   * @default 0
   */
  minSpareCols: 0,

  /**
   * If set to `false`, there won't be an option to insert new rows in the Context Menu.
   *
   * @type {Boolean}
   * @default true
   */
  allowInsertRow: true,

  /**
   * If set to `false`, there won't be an option to insert new columns in the Context Menu.
   *
   * @type {Boolean}
   * @default true
   */
  allowInsertColumn: true,

  /**
   * If set to `false`, there won't be an option to remove rows in the Context Menu.
   *
   * @type {Boolean}
   * @default true
   */
  allowRemoveRow: true,

  /**
   * If set to `false`, there won't be an option to remove columns in the Context Menu.
   *
   * @type {Boolean}
   * @default true
   */
  allowRemoveColumn: true,

  /**
   * If true, selection of multiple cells using keyboard or mouse is allowed.
   *
   * @type {Boolean}
   * @default true
   */
  multiSelect: true,

  /**
   * Enables the fill handle (drag-down and copy-down) functionality, which shows a small rectangle in bottom
   * right corner of the selected area, that let's you expand values to the adjacent cells.
   *
   * Possible values: `true` (to enable in all directions), `'vertical'` or `'horizontal'` (to enable in one direction),
   * `false` (to disable completely). Setting to `true` enables the fillHandle plugin.
   *
   * Since 0.23.0 you can pass object to plugin which allows you to add more options for this functionality. If `autoInsertRow`
   * option is `true`, fill-handler will create new rows till it reaches the last row. It is enabled by default.
   *
   * @example
   * ```js
   * ...
   * fillHandle: true // enable plugin in all directions and with autoInsertRow as true
   * ...
   * // or
   * ...
   * fillHandle: 'vertical' // enable plugin in vertical direction and with autoInsertRow as true
   * ...
   * // or
   * ...
   * fillHandle: { // enable plugin in both directions and with autoInsertRow as false
   *   autoInsertRow: false,
   * }
   * // or
   * ...
   * fillHandle: { // enable plugin in vertical direction and with autoInsertRow as false
   *   autoInsertRow: false,
   *   direction: 'vertical' // 'vertical' or 'horizontal'
   * }
   * ```
   *
   * @type {Boolean|String|Object}
   * @default true
   */
  fillHandle: true,

  /**
   * Allows to specify the number of fixed (or *frozen*) rows at the top of the table.
   *
   * @type {Number}
   * @default 0
   * @example
   * ```js
   * fixedRowsTop: 3 // This would freeze the top 3 rows of the table.
   * ```
   */
  fixedRowsTop: 0,

  /**
   * Allows to specify the number of fixed (or *frozen*) rows at the bottom of the table.
   *
   * @pro
   * @type {Number}
   * @default 0
   * @example
   * ```js
   * fixedRowsBottom: 3 // This would freeze the top 3 rows of the table.
   * ```
   */
  fixedRowsBottom: 0,

  /**
   * Allows to specify the number of fixed (or *frozen*) columns on the left of the table.
   *
   * @type {Number}
   * @default 0
   * @example
   * ```js
   * fixedColumnsLeft: 3 // This would freeze the top 3 rows of the table.
   * ```
   */
  fixedColumnsLeft: 0,

  /**
   * If `true`, mouse click outside the grid will deselect the current selection.
   * Can be a function that takes the click event target and returns a boolean.
   *
   * @type {Boolean|Function}
   * @default true
   */
  outsideClickDeselects: true,

  /**
   * If `true`, <kbd>ENTER</kbd> begins editing mode (like in Google Docs). If `false`, <kbd>ENTER</kbd> moves to next
   * row (like Excel) and adds a new row if necessary. <kbd>TAB</kbd> adds new column if necessary.
   *
   * @type {Boolean}
   * @default true
   */
  enterBeginsEditing: true,

  /**
   * Defines the cursor movement after <kbd>ENTER</kbd> was pressed (<kbd>SHIFT</kbd> + <kbd>ENTER</kbd> uses a negative vector).
   * Can be an object or a function that returns an object. The event argument passed to the function
   * is a DOM Event object received after the <kbd>ENTER</kbd> key has been pressed. This event object can be used to check
   * whether user pressed <kbd>ENTER</kbd> or <kbd>SHIFT</kbd> + <kbd>ENTER</kbd>.
   *
   * @type {Object|Function}
   * @default {row: 1, col: 0}
   */
  enterMoves: {row: 1, col: 0},

  /**
   * Defines the cursor movement after <kbd>TAB</kbd> is pressed (<kbd>SHIFT</kbd> + <kbd>TAB</kbd> uses a negative vector).
   * Can be an object or a function that returns an object. The event argument passed to the function
   * is a DOM Event object received after the <kbd>TAB</kbd> key has been pressed. This event object can be used to check
   * whether user pressed <kbd>TAB</kbd> or <kbd>SHIFT</kbd> + <kbd>TAB</kbd>.
   *
   * @type {Object}
   * @default {row: 0, col: 1}
   */
  tabMoves: {row: 0, col: 1},

  /**
   * If `true`, pressing <kbd>TAB</kbd> or right arrow in the last column will move to first column in next row.
   *
   * @type {Boolean}
   * @default false
   */
  autoWrapRow: false,

  /**
   * If `true`, pressing <kbd>ENTER</kbd> or down arrow in the last row will move to the first row in the next column.
   *
   * @type {Boolean}
   * @default false
   */
  autoWrapCol: false,

  /**
   * Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
   *
   * @type {Number}
   * @default 1000
   */
  copyRowsLimit: 1000,

  /**
   * Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
   *
   * @type {Number}
   * @default 1000
   */
  copyColsLimit: 1000,

  /**
   * @description
   * Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
   * * Default value `"overwrite"` will paste clipboard value over current selection.
   * * When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
   * * When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.
   *
   * @type {String}
   * @default 'overwrite'
   */
  pasteMode: 'overwrite',

  /**
   * @description
   * Turns on saving the state of column sorting, column positions and column sizes in local storage.
   *
   * You can save any sort of data in local storage to preserve table state between page reloads.
   * In order to enable data storage mechanism, `persistentState` option must be set to `true` (you can set it
   * either during Handsontable initialization or using the `updateSettings` method). When `persistentState` is enabled it exposes 3 hooks:
   *
   * __persistentStateSave__ (key: String, value: Mixed)
   *
   *   * Saves value under given key in browser local storage.
   *
   * __persistentStateLoad__ (key: String, valuePlaceholder: Object)
   *
   *   * Loads `value`, saved under given key, form browser local storage. The loaded `value` will be saved in `valuePlaceholder.value`
   *     (this is due to specific behaviour of `Hooks.run()` method). If no value have been saved under key `valuePlaceholder.value`
   *     will be `undefined`.
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
   */
  persistentState: void 0,

  /**
   * Class name for all visible rows in the current selection.
   *
   * @type {String}
   * @default undefined
   * @example
   * ```js
   * currentRowClassName: 'currentRow' // This will add a 'currentRow' class name to appropriate table cells.
   * ```
   */
  currentRowClassName: void 0,

  /**
   * Class name for all visible columns in the current selection.
   *
   * @type {String}
   * @default undefined
   * @example
   * ```js
   * currentColClassName: 'currentColumn' // This will add a 'currentColumn' class name to appropriate table cells.
   * ```
   */
  currentColClassName: void 0,

  /**
   * Class name for all visible headers in current selection.
   *
   * @type {String}
   * @since 0.27.0
   * @default 'ht__highlight'
   * @example
   * ```js
   * currentHeaderClassName: 'ht__highlight' // This will add a 'ht__highlight' class name to appropriate table headers.
   * ```
   */
  currentHeaderClassName: 'ht__highlight',
  /**
   * Class name for the Handsontable container element.
   *
   * @type {String|Array}
   * @default undefined
   */
  className: void 0,

  /**
   * Class name for all tables inside container element.
   *
   * @since 0.17.0
   * @type {String|Array}
   * @default undefined
   */
  tableClassName: void 0,

  /**
   * @description
   * Defines how the columns react, when the declared table width is different than the calculated sum of all column widths.
   * [See more](http://docs.handsontable.com/demo-stretching.html) mode. Possible values:
   *  * `'none'` Disable stretching
   *  * `'last'` Stretch only the last column
   *  * `'all'` Stretch all the columns evenly
   *
   * @type {String}
   * @default 'none'
   */
  stretchH: 'none',

  /**
   * Lets you overwrite the default `isEmptyRow` method, which checks if row at the provided index is empty.
   *
   * @type {Function}
   * @param {Number} row
   * @returns {Boolean}
   */
  isEmptyRow(row) {
    var col,
      colLen,
      value,
      meta;

    for (col = 0, colLen = this.countCols(); col < colLen; col++) {
      value = this.getDataAtCell(row, col);

      if (value !== '' && value !== null && isDefined(value)) {
        if (typeof value === 'object') {
          meta = this.getCellMeta(row, col);

          return isObjectEquals(this.getSchema()[meta.prop], value);
        }
        return false;
      }
    }

    return true;
  },

  /**
   * Lets you overwrite the default `isEmptyCol` method, which checks if column at the provided index is empty.
   *
   * @type {Function}
   * @param {Number} col
   * @returns {Boolean}
   */
  isEmptyCol(col) {
    var row,
      rowLen,
      value;

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
   */
  observeDOMVisibility: true,

  /**
   * If set to `true`, Handsontable will accept values that were marked as invalid by the cell `validator`.
   * It will result with *invalid* cells being treated as *valid* (will save the *invalid* value into the Handsontable data source).
   * If set to `false`, Handsontable will *not* accept the invalid values and won't allow the user to close the editor.
   * This option will be particularly useful when used with the Autocomplete's `strict` mode.
   *
   * @type {Boolean}
   * @default true
   * @since 0.9.5
   */
  allowInvalid: true,

  /**
   * If set to `true`, Handsontable will accept values that are empty (`null`, `undefined` or `''`).
   * If set to `false`, Handsontable will *not* accept the empty values and mark cell as invalid.
   *
   * @example
   * ```js
   * ...
   * allowEmpty: true // allow empty values for all cells (whole table)
   * ...
   * // or
   * ...
   * columns: [
   *   // allow empty values only for 'date' column
   *   {data: 'date', dateFormat: 'DD/MM/YYYY', allowEmpty: true}
   * ]
   * ...
   * ```
   *
   * @type {Boolean}
   * @default true
   * @since 0.23.0
   */
  allowEmpty: true,

  /**
   * CSS class name for cells that did not pass validation.
   *
   * @type {String}
   * @default 'htInvalid'
   */
  invalidCellClassName: 'htInvalid',

  /**
   * When set to an non-empty string, displayed as the cell content for empty cells. If a value of a different type is provided,
   * it will be stringified and applied as a string.
   *
   * @type {Mixed}
   * @default false
   */
  placeholder: false,

  /**
   * CSS class name for cells that have a placeholder in use.
   *
   * @type {String}
   * @default 'htPlaceholder'
   */
  placeholderCellClassName: 'htPlaceholder',

  /**
   * CSS class name for read-only cells.
   *
   * @type {String}
   * @default 'htDimmed'
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
   * Or you can [register](http://docs.handsontable.com/demo-custom-renderers.html) the custom renderer under specified name and use
   * its name as an alias in your configuration.
   *
   * If a function is provided, it will receive the following arguments:
   * ```js
   * function(instance, TD, row, col, prop, value, cellProperties) {}
   * ```
   *
   * You can read more about custom renderes [in the documentation](http://docs.handsontable.com/demo-custom-renderers.html).
   *
   * @example
   * ```js
   * ...
   * Handsontable.renderers.registerRenderer('my.renderer', function(instance, TD, row, col, prop, value, cellProperties) {
   *   TD.innerHTML = value;
   * });
   * ...
   * columns: [
   *   {
   *     editor: 'select',
   *     renderer: 'autocomplete' // as string
   *   },
   *   {
   *     renderer: 'my.renderer' // custom renderer as an alias
   *   },
   *   {
   *     // renderer as custom function
   *     renderer: function(hotInstance, TD, row, col, prop, value, cellProperties) {
   *       TD.style.color = 'blue';
   *       TD.innerHTML = value;
   *     }
   *   }
   * ]
   * ...
   * ```
   *
   * @type {String|Function}
   * @default undefined
   */
  renderer: void 0,

  /**
   * CSS class name added to the commented cells.
   *
   * @type {String}
   * @default 'htCommentCell'
   */
  commentedCellClassName: 'htCommentCell',

  /**
   * If set to `true`, it enables the browser's native selection of a fragment of the text within a single cell, between adjacent cells or in a whole table.
   * If set to `'cell'`, it enables the possibility of selecting a fragment of the text within a single cell's body.
   *
   * @type {Boolean|String}
   * @default false
   */
  fragmentSelection: false,

  /**
   * @description
   * Make cell [read only](http://docs.handsontable.com/demo-read-only.html).
   *
   * @type {Boolean}
   * @default false
   */
  readOnly: false,

  /**
   * @description
   * When added to a `column` property, it skips the column on paste and pastes the data on the next column to the right.
   *
   * @type {Boolean}
   * @default false
   */
  skipColumnOnPaste: false,

  /**
   * @description
   * Setting to true enables the search plugin (see [demo](http://docs.handsontable.com/demo-search-for-values.html)).
   *
   * @type {Boolean}
   * @default false
   */
  search: false,

  /**
   * @description
   * Shortcut to define the combination of the cell renderer, editor and validator for the column, cell or whole table.
   *
   * Possible values:
   *  * [autocomplete](http://docs.handsontable.com/demo-autocomplete.html)
   *  * [checkbox](http://docs.handsontable.com/demo-checkbox.html)
   *  * [date](http://docs.handsontable.com/demo-date.html)
   *  * [dropdown](http://docs.handsontable.com/demo-dropdown.html)
   *  * [handsontable](http://docs.handsontable.com/demo-handsontable.html)
   *  * [numeric](http://docs.handsontable.com/demo-numeric.html)
   *  * [password](http://docs.handsontable.com/demo-password.html)
   *  * text
   *  * [time](http://docs.handsontable.com/demo-time.html)
   *
   * Or you can register the custom cell type under specified name and use
   * its name as an alias in your configuration.
   *
   * @example
   * ```js
   * ...
   * Handsontable.cellTypes.registerCellType('my.type', {
   *   editor: MyEditorClass,
   *   renderer: function(hot, td, row, col, prop, value, cellProperties) {
   *     td.innerHTML = value;
   *   },
   *   validator: function(value, callback) {
   *     callback(value === 'foo' ? true : false);
   *   }
   * });
   * ...
   * columns: [
   *   {
   *     type: 'text'
   *   },
   *   {
   *     type: 'my.type' // an alias to custom type
   *   },
   *   {
   *     type: 'checkbox'
   *   }
   * ]
   * ...
   * ```
   *
   * @type {String}
   * @default 'text'
   */
  type: 'text',

  /**
   * @description
   * Make cell copyable (pressing <kbd>CTRL</kbd> + <kbd>C</kbd> on your keyboard moves its value to system clipboard).
   *
   * __Note:__ this setting is `false` by default for cells with type `password`.
   *
   * @type {Boolean}
   * @default true
   * @since 0.10.2
   */
  copyable: true,

  /**
   * Defines the editor for the table/column/cell.
   *
   * If a string is provided, it may be one of the following predefined values:
   *  * [autocomplete](http://docs.handsontable.com/demo-autocomplete.html)
   *  * [checkbox](http://docs.handsontable.com/demo-checkbox.html)
   *  * [date](http://docs.handsontable.com/demo-date.html)
   *  * [dropdown](http://docs.handsontable.com/demo-dropdown.html)
   *  * [handsontable](http://docs.handsontable.com/demo-handsontable.html)
   *  * [mobile](http://docs.handsontable.com/demo-mobiles-and-tablets.html)
   *  * [password](http://docs.handsontable.com/demo-password.html)
   *  * [select](http://docs.handsontable.com/demo-select.html)
   *  * text
   *
   * Or you can [register](http://docs.handsontable.com/tutorial-cell-editor.html#registering-an-editor) the custom editor under specified name and use
   * its name as an alias in your configuration.
   *
   * To disable cell editing completely set `editor` property to `false`.
   *
   * @example
   * ```js
   * ...
   * columns: [
   *   {
   *     editor: 'select'
   *   },
   *   {
   *     editor: false
   *   }
   * ]
   * ...
   * ```
   *
   * @type {String|Function|Boolean}
   * @default 'text'
   */
  editor: void 0,

  /**
   * @description
   * Autocomplete definitions. See [autocomplete demo](http://docs.handsontable.com/demo-autocomplete.html) for examples and definitions.
   *
   * @type {Array}
   * @default undefined
   */
  autoComplete: void 0,

  /**
   * Control number of choices for the autocomplete (or dropdown) typed cells. After exceeding it, a scrollbar for the dropdown list of choices will appear.
   *
   * @since 0.18.0
   * @type {Number}
   * @default 10
   */
  visibleRows: 10,

  /**
   * Makes autocomplete or dropdown width the same as the edited cell width. If `false` then editor will be scaled
   * according to its content.
   *
   * @since 0.17.0
   * @type {Boolean}
   * @default true
   */
  trimDropdown: true,

  /**
   * Setting to true enables the debug mode, currently used to test the correctness of the row and column
   * header fixed positioning on a layer above the master table.
   *
   * @type {Boolean}
   * @default false
   */
  debug: false,

  /**
   * When set to `true`, the text of the cell content is wrapped if it does not fit in the fixed column width.
   *
   * @type {Boolean}
   * @default true
   * @since 0.11.0
   */
  wordWrap: true,

  /**
   * CSS class name added to cells with cell meta `wordWrap: false`.
   *
   * @type {String}
   * @default 'htNoWrap'
   * @since 0.11.0
   */
  noWordWrapClassName: 'htNoWrap',

  /**
   * @description
   * Defines if the right-click context menu should be enabled. Context menu allows to create new row or
   * column at any place in the grid among [other features](http://docs.handsontable.com/demo-context-menu.html).
   * Possible values:
   * * `true` (to enable default options),
   * * `false` (to disable completely)
   *
   * or array of any available strings:
   * * `["row_above", "row_below", "col_left", "col_right",
   * "remove_row", "remove_col", "---------", "undo", "redo"]`.
   *
   * See [the context menu demo](http://docs.handsontable.com/demo-context-menu.html) for examples.
   *
   * @example
   * ```js
   * ...
   * // as a boolean
   * contextMenu: true
   * ...
   * // as a array
   * contextMenu: ['row_above', 'row_below', '--------', 'undo', 'redo']
   * ...
   * ```
   *
   * @type {Boolean|Array|Object}
   * @default undefined
   */
  contextMenu: void 0,

  /**
   * @description
   * Defines new actions copy/paste for context menu. This functionality is dependent on ZeroClipboard from which you
   * should pass the swf file path under `swfPath` object key.
   *
   * @example
   * ```js
   * ...
   * contextMenuCopyPaste: {swfPath: '[path to file]'}
   * ...
   * ```
   *
   * @type {Object}
   */
  contextMenuCopyPaste: void 0,

  /**
   * @description
   * Disable or enable the copy/paste functionality.
   *
   * @example
   * ```js
   * ...
   * copyPaste: false,
   * ...
   * ```
   *
   * @type {Boolean}
   * @default undefined
   */
  copyPaste: void 0,

  /**
   * If `true`, undo/redo functionality is enabled.
   *
   * @type {Boolean}
   * @default undefined
   */
  undo: void 0,

  /**
   * @description
   * Turns on [Column sorting](http://docs.handsontable.com/demo-sorting-data.html).
   * Can be either a boolean (true/false) or an object with a declared sorting options. See the below example:
   *
   * @example
   * ```js
   * ...
   * // as boolean
   * columnSorting: true
   * ...
   * // as a object with initial order (sort ascending column at index 2)
   * columnSorting: {
   *   column: 2,
   *   sortOrder: true, // true = ascending, false = descending, undefined = original order
   *   sortEmptyCells: true // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
   * }
   * ...
   * ```
   *
   * @type {Boolean|Object}
   * @default undefined
   */
  columnSorting: void 0,

  /**
   * @description
   * Turns on [Manual column move](http://docs.handsontable.com/demo-moving-rows-and-columns.html), if set to a boolean or define initial
   * column order, if set to an array of column indexes.
   *
   * @example
   * ```js
   * ...
   * // as boolean
   * manualColumnMove: true
   * ...
   * // as a array with initial order (move column index at 0 to 1 and move column index at 1 to 4)
   * manualColumnMove: [1, 4]
   * ...
   * ```
   *
   * @type {Boolean|Array}
   * @default undefined
   */
  manualColumnMove: void 0,

  /**
   * @description
   * Turns on [Manual column resize](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * column resized widths, if set to an array of numbers.
   *
   * @example
   * ```js
   * ...
   * // as boolean
   * manualColumnResize: true
   * ...
   * // as a array with initial widths (column at 0 index has 40px and column at 1 index has 50px)
   * manualColumnResize: [40, 50]
   * ...
   * ```
   *
   * @type {Boolean|Array}
   * @default undefined
   */
  manualColumnResize: void 0,

  /**
   * @description
   * Turns on [Manual row move](http://docs.handsontable.com/demo-moving-rows-and-columns.html), if set to a boolean or define initial
   * row order, if set to an array of row indexes.
   *
   * @example
   * ```js
   * ...
   * // as boolean
   * manualRowMove: true
   * ...
   * // as a array with initial order (move row index at 0 to 1 and move row index at 1 to 4)
   * manualRowMove: [1, 4]
   * ...
   * ```
   *
   * @type {Boolean|Array}
   * @default undefined
   * @since 0.11.0
   */
  manualRowMove: void 0,

  /**
   * @description
   * Turns on [Manual row resize](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * row resized heights, if set to an array of numbers.
   *
   * @example
   * ```js
   * ...
   * // as boolean
   * manualRowResize: true
   * ...
   * // as a array with initial heights (row at 0 index has 40px and row at 1 index has 50px)
   * manualRowResize: [40, 50]
   * ...
   * ```
   *
   * @type {Boolean|Array}
   * @default undefined
   * @since 0.11.0
   */
  manualRowResize: void 0,

  /**
   * @description
   * If set to `true`, it enables a possibility to merge cells. If set to an array of objects, it merges the cells provided in the objects (see the example below).
   * [More information on the demo page.](http://docs.handsontable.com/demo-merge-cells.html)
   *
   * @example
   * ```js
   * // enables the mergeCells plugin:
   * margeCells: true
   * ...
   * // declares a list of merged sections:
   * mergeCells: [
   *   {row: 1, col: 1, rowspan: 3, colspan: 3}, // rowspan and colspan properties declare the width and height of a merged section in cells
   *   {row: 3, col: 4, rowspan: 2, colspan: 2},
   *   {row: 5, col: 6, rowspan: 3, colspan: 3}
   * ]
   * ```
   * @type {Boolean|Array}
   * @default false
   */
  mergeCells: false,

  /**
   * Number of rows to be rendered outside of the visible part of the table.
   * By default, it's set to `'auto'`, which makes Handsontable to attempt to calculate the best offset performance-wise.
   *
   * You may test out different values to find the best one that works for your specific implementation.
   *
   * @type {Number|String}
   * @default 'auto'
   */
  viewportRowRenderingOffset: 'auto',

  /**
   * Number of columns to be rendered outside of the visible part of the table.
   * By default, it's set to `'auto'`, which makes Handsontable try calculating the best offset performance-wise.
   *
   * You may experiment with the value to find the one that works best for your specific implementation.
   *
   * @type {Number|String}
   * @default 'auto'
   */
  viewportColumnRenderingOffset: 'auto',

  /**
   * A function, regular expression or a string, which will be used in the process of cell validation.
   * If a function is used, be sure to execute the callback argument with either `true` (`callback(true)`) if the validation passed
   * or with `false` (`callback(false)`), if the validation failed.
   * Note, that `this` in the function points to the `cellProperties` object.
   *
   * If a string is provided, it may be one of the following predefined values:
   * * `autocomplete`,
   * * `date`,
   * * `numeric`,
   * * `time`.
   *
   * Or you can [register](http://docs.handsontable.com/demo-data-validation.html) the validator function under specified name and use
   * its name as an alias in your configuration.
   *
   * See more [in the demo](http://docs.handsontable.com/demo-data-validation.html).
   *
   * @example
   * ```js
   * // as a function
   * columns: [
   *    {
   *      validator: function(value, callback) { // validation rules }
   *    }
   * ]
   * ...
   * // as a regexp
   * columns: [
   *    {
   *      validator: /^[0-9]$/ // regular expression
   *    }
   * ]
   * // as a string
   * columns: [
   *    {
   *      validator: 'numeric'
   *    }
   * ]
   * ```
   * @type {Function|RegExp|String}
   * @default undefined
   * @since 0.9.5
   */
  validator: void 0,

  /**
   * @description
   * Disable visual cells selection.
   *
   * Possible values:
   *  * `true` - Disables any type of visual selection (current and area selection),
   *  * `false` - Enables any type of visual selection. This is default value.
   *  * `current` - Disables the selection of a currently selected cell, the area selection is still present.
   *  * `area` - Disables the area selection, the currently selected cell selection is still present.
   *
   * @type {Boolean|String|Array}
   * @default false
   * @since 0.13.2
   * @example
   * ```js
   * ...
   * // as boolean
   * disableVisualSelection: true,
   * ...
   *
   * ...
   * // as string ('current' or 'area')
   * disableVisualSelection: 'current',
   * ...
   *
   * ...
   * // as array
   * disableVisualSelection: ['current', 'area'],
   * ...
   * ```
   */
  disableVisualSelection: false,

  /**
   * @description
   * Set whether to display the current sorting order indicator (a triangle icon in the column header, specifying the sorting order).
   *
   * @type {Boolean}
   * @default false
   * @since 0.15.0-beta3
   */
  sortIndicator: void 0,

  /**
   * Disable or enable ManualColumnFreeze plugin.
   *
   * @type {Boolean}
   * @default false
   */
  manualColumnFreeze: void 0,

  /**
   * @description
   * Defines whether Handsontable should trim the whitespace at the beginning and the end of the cell contents.
   *
   * @type {Boolean}
   * @default true
   */
  trimWhitespace: true,

  settings: void 0,

  /**
   * @description
   * Defines data source for Autocomplete or Dropdown cell types.
   *
   * @example
   * ```js
   * ...
   * // source as a array
   * columns: [{
   *   type: 'autocomplete',
   *   source: ['A', 'B', 'C', 'D']
   * }]
   * ...
   * // source as a function
   * columns: [{
   *   type: 'autocomplete',
   *   source: function(query, callback) {
   *     fetch('http://example.com/query?q=' + query, function(response) {
   *       callback(response.items);
   *     })
   *   }
   * }]
   * ...
   * ```
   *
   * @type {Array|Function}
   * @default undefined
   */
  source: void 0,

  /**
   * @description
   * Defines the column header name.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *     title: 'First name',
   *     type: 'text',
   *   },
   *   {
   *     title: 'Last name',
   *     type: 'text',
   *   }]
   * ...
   * ```
   *
   * @type {String}
   * @default undefined
   */
  title: void 0,

  /**
   * Data template for `'checkbox'` type when checkbox is checked.
   *
   * @example
   * ```js
   * checkedTemplate: 'good'
   *
   * // if a checkbox-typed cell is checked, then getDataAtCell(x,y), where x and y are the coordinates of the cell
   * // will return 'good'.
   * ```
   * @type {Boolean|String}
   * @default true
   */
  checkedTemplate: void 0,

  /**
   * Data template for `'checkbox'` type when checkbox is unchecked.
   *
   * @example
   * ```js
   * uncheckedTemplate: 'bad'
   *
   * // if a checkbox-typed cell is not checked, then getDataAtCell(x,y), where x and y are the coordinates of the cell
   * // will return 'bad'.
   * ```
   * @type {Boolean|String}
   * @default false
   */
  uncheckedTemplate: void 0,

  /**
   * @description
   * Object which describes if renderer should create checkbox element with label element as a parent. Option desired for
   * [checkbox](http://docs.handsontable.com/demo-checkbox.html)-typed cells.
   *
   * By default the [checkbox](http://docs.handsontable.com/demo-checkbox.html) renderer renders the checkbox without a label.
   *
   * Possible object properties:
   *  * `property` - Defines the property name of the data object, which will to be used as a label.
   *  (eg. `label: {property: 'name.last'}`). This option works only if data was passed as an array of objects.
   *  * `position` - String which describes where to place the label text (before or after checkbox element).
   * Valid values are `'before'` and '`after`' (defaults to `'after'`).
   *  * `value` - String or a Function which will be used as label text.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'checkbox',
   *   label: {position: 'after', value: 'My label: '}
   * }]
   * ...
   * ```
   *
   * @since 0.19.0
   * @type {Object}
   * @default undefined
   */
  label: void 0,

  /**
   * Display format. See [numbrojs](http://numbrojs.com). This option is desired for
   * [numeric](http://docs.handsontable.com/demo-numeric.html)-typed cells.
   *
   * Since 0.26.0 Handsontable uses [numbro](http://numbrojs.com/) as a main library for numbers formatting.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'numeric',
   *   format: '0,00'
   * }]
   * ...
   * ```
   *
   * @type {String}
   * @default '0'
   */
  format: void 0,

  /**
   * Language display format. See [numbrojs](http://numbrojs.com/languages.html#supported-languages). This option is desired for
   * [numeric](http://docs.handsontable.com/demo-numeric.html)-typed cells.
   *
   * Since 0.26.0 Handsontable uses [numbro](http://numbrojs.com/) as a main library for numbers formatting.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'numeric',
   *   language: 'en-US'
   * }]
   * ...
   * ```
   *
   * @type {String}
   * @default 'en-US'
   */
  language: void 0,

  /**
   * @description
   * Data source for [select](http://docs.handsontable.com/demo-select.html)-typed cells.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   editor: 'select',
   *   selectOptions: ['A', 'B', 'C'],
   * }]
   * ...
   * ```
   *
   * @type {Array}
   */
  selectOptions: void 0,

  /**
   * Enables or disables the autoColumnSize plugin. Default value is `undefined`, which has the same effect as `true`.
   * Disabling this plugin can increase performance, as no size-related calculations would be done.
   *
   * Column width calculations are divided into sync and async part. Each of this parts has their own advantages and
   * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous operations don't
   * block the browser UI.
   *
   * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.
   * `syncLimit` option is available since 0.16.0.
   *
   * You can also use the `useHeaders` option to take the column headers with into calculation.
   *
   * @example
   * ```js
   * ...
   * // as a number (300 columns in sync, rest async)
   * autoColumnSize: {syncLimit: 300},
   * ...
   *
   * ...
   * // as a string (percent)
   * autoColumnSize: {syncLimit: '40%'},
   * ...
   *
   * ...
   * // use headers width while calculation the column width
   * autoColumnSize: {useHeaders: true},
   * ...
   *
   * ```
   *
   * @type {Object|Boolean}
   * @default {syncLimit: 50}
   */
  autoColumnSize: void 0,

  /**
   * Enables or disables autoRowSize plugin. Default value is `undefined`, which has the same effect as `false` (disabled).
   * Enabling this plugin can decrease performance, as size-related calculations would be performed.
   *
   * Row height calculations are divided into sync and async stages. Each of these stages has their own advantages and
   * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous operations don't
   * block the browser UI.
   *
   * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.
   * `syncLimit` options is available since 0.16.0.
   *
   * @example
   * ```js
   * ...
   * // as number (300 columns in sync, rest async)
   * autoRowSize: {syncLimit: 300},
   * ...
   *
   * ...
   * // as string (percent)
   * autoRowSize: {syncLimit: '40%'},
   * ...
   * ```
   * @type {Object|Boolean}
   * @default {syncLimit: 1000}
   */
  autoRowSize: void 0,

  /**
   * Date validation format.
   *
   * Option desired for `'date'` - typed cells.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'date',
   *   dateFormat: 'MM/DD/YYYY'
   * }]
   * ...
   * ```
   *
   * @type {String}
   * @default 'DD/MM/YYYY'
   */
  dateFormat: void 0,

  /**
   * If `true` then dates will be automatically formatted to match the desired format.
   *
   * Option desired for `'date'`-typed typed cells.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'date',
   *   dateFormat: 'YYYY-MM-DD',
   *   correctFormat: true
   * }]
   * ...
   * ```
   *
   * @type {Boolean}
   * @default false
   */
  correctFormat: false,

  /**
   * Definition of default value which will fill the empty cells.
   *
   * Option desired for `'date'`-typed cells.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'date',
   *   defaultData: '2015-02-02'
   * }]
   * ...
   * ```
   *
   * @type {String}
   */
  defaultDate: void 0,

  /**
   * If set to `true`, the value entered into the cell must match (case-sensitive) the autocomplete source. Otherwise, cell won't pass the validation.
   * When filtering the autocomplete source list, the editor will be working in case-insensitive mode.
   *
   * Option desired for `autocomplete`-typed cells.
   *
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'autocomplete',
   *   source: ['A', 'B', 'C'],
   *   strict: true
   * }]
   * ...
   * ```
   *
   * @type {Boolean}
   */
  strict: void 0,

  /**
   * @description
   * If typed `true`, data defined in `source` of the autocomplete or dropdown cell will be treated as HTML.
   *
   * __Warning:__ Enabling this option can cause serious XSS vulnerabilities.
   *
   * Option desired for `'autocomplete'`-typed cells.
   * @example
   * ```js
   * ...
   * columns: [{
   *   type: 'autocomplete',
   *   allowHtml: true,
   *   source: ['<b>foo</b>', '<b>bar</b>']
   * }]
   * ...
   * ```
   * @type {Boolean}
   * @default false
   */
  allowHtml: false,

  /**
   * If typed `true` then virtual rendering mechanism for handsontable will be disabled.
   *
   * @type {Boolean}
   */
  renderAllRows: void 0,

  /**
   * Prevents table to overlap outside the parent element. If `'horizontal'` option is chosen then table will appear horizontal
   * scrollbar in case where parent's width is narrower then table's width.
   *
   * Possible values:
   *  * `false` - Disables functionality (Default option).
   *  * `horizontal` - Prevents horizontal overflow table.
   *  * `vertical` - Prevents vertical overflow table (Not implemented yet).
   *
   * @since 0.20.3
   * @example
   * ```js
   * ...
   * preventOverflow: 'horizontal'
   * ...
   * ```
   *
   * @type {String|Boolean}
   */
  preventOverflow: false,

  /**
   * @description
   * Plugin allowing binding the table rows with their headers.
   * If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if at the initialization
   * row 0 has a header titled "A", it will have it no matter what you do with the table.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|String}
   * @example
   *
   * ```js
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   date: getData(),
   *   bindRowsWithHeaders: true
   * });
   * ...
   * ```
   *
   */
  bindRowsWithHeaders: void 0,

  /**
   * @description
   * The CollapsibleColumns plugin allows collapsing of columns, covered by a header with the `colspan` property defined.
   *
   * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
   *
   * Setting the `collapsibleColumns` property to `true` will display a "collapse/expand" button in every header with a defined
   * `colspan` property.
   *
   * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array of objects, as in
   * the example below.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|Array}
   * @example
   * ```js
   * ...
   *  collapsibleColumns: [
   *    {row: -4, col: 1, collapsible: true},
   *    {row: -3, col: 5, collapsible: true}
   *  ]
   * ...
   * // or
   * ...
   *  collapsibleColumns: true
   * ...
   * ```
   */
  collapsibleColumns: void 0,

  /**
   * @description
   * Allows making pre-defined calculations on the cell values and display the results within Handsontable.
   * See the demo for more information.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Object}
   */
  columnSummary: void 0,

  /**
   * This plugin allows adding a configurable dropdown menu to the table's column headers.
   * The dropdown menu acts like the Context Menu, but is triggered by clicking the button in the header.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|Object|Array}
   */
  dropdownMenu: void 0,

  /**
   * The filters plugin.
   * It allows filtering the table data either by the built-in component or with the API.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean}
   */
  filters: void 0,

  /**
   * It allows Handsontable to process formula expressions defined in the provided data.
   *
   * @pro
   * @since 1.7.0
   * @type {Boolean}
   */
  formulas: void 0,

  /**
   * @description
   * GanttChart plugin enables a possibility to create a Gantt chart using a Handsontable instance.
   * In this case, the whole table becomes read-only.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Object}
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
   * @since 1.0.0-beta1
   * @type {Boolean|Object}
   */
  headerTooltips: void 0,

  /**
   * Plugin allowing hiding of certain columns.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|Object}
   */
  hiddenColumns: void 0,

  /**
   * @description
   * Plugin allowing hiding of certain rows.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|Object}
   */
  hiddenRows: void 0,

  /**
   * @description
   * Allows creating a nested header structure, using the HTML's colspan attribute.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Array}
   */
  nestedHeaders: void 0,

  /**
   * @description
   * Plugin allowing hiding of certain rows.
   *
   * @pro
   * @since 1.0.0-beta1
   * @type {Boolean|Array}
   */
  trimRows: void 0,

  /**
   * @description
   * Allows setting a custom width of the row headers. You can provide a number or an array of widths, if many row header levels are defined.
   *
   * @since 0.22.0
   * @type {Number|Array}
   */
  rowHeaderWidth: void 0,

  /**
   * @description
   * Allows setting a custom height of the column headers. You can provide a number or an array of heights, if many column header levels are defined.
   *
   * @since 0.22.0
   * @type {Number|Array}
   */
  columnHeaderHeight: void 0,

  /**
   * @description
   * Enabling this plugin switches table into one-way data binding where changes are applied into data source (from outside table)
   * will be automatically reflected in the table.
   *
   * For every data change [afterChangesObserved](Hooks.html#event:afterChangesObserved) hook will be fired.
   *
   * @type {Boolean}
   * @default false
   */
  observeChanges: void 0,

  /**
   * @description
   * When passed to the `column` property, allows specifying a custom sorting function for the desired column.
   *
   * @since 0.24.0
   * @type {Function}
   * @example
   * ```js
   * columns: [
   *   {
   *     sortFunction: function(sortOrder) {
   *        return function(a, b) {
   *          // sorting function body.
   *          //
   *          // Function parameters:
   *          // sortOrder: If true, the order is ascending, if false - descending. undefined = original order
   *          // a, b: Two compared elements. These are 2-element arrays, with the first element being the row index, the second - cell value.
   *        }
   *     }
   *   }
   * ]
   * ```
   */
  sortFunction: void 0,

  /**
   * If defined as 'true', the Autocomplete's suggestion list would be sorted by relevance (the closer to the left the match is, the higher the suggestion).
   *
   * Option desired for cells of the `'autocomplete'` type.
   *
   * @type {Boolean}
   * @default true
   */
  sortByRelevance: true,

  /**
   * If defined as 'true', when the user types into the input area the Autocomplete's suggestion list is updated to only
   * include those choices starting with what has been typed; if defined as 'false' all suggestions remain shown, with
   * those matching what has been typed marked in bold.
   *
   * @type {Boolean}
   * @default true
   */
  filter: true,

  /**
   * If defined as 'true', filtering in the Autocomplete Editor will be case-sensitive.
   *
   * @type {Boolean}
   * @default: false
   */
  filteringCaseSensitive: false,

  /**
   * If defined as 'true', column headers will be included when table is copied to clipboard
   *
   * @type {Boolean}
   * @default: false
   */
  columnHeadersClipboard: false,

  /**
   * If defined as 'true', row headers will be included when table is copied to clipboard
   *
   * @type {Boolean}
   * @default: false
   */
  rowHeadersClipboard: false
};

export default DefaultSettings;
