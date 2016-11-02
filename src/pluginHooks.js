
/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __hooks__.
 *
 * @example
 *
 * ```js
 * // Using events as callbacks:
 * ...
 * var hot1 = new Handsontable(document.getElementById('example1'), {
 *   afterChange: function(changes, source) {
 *     $.ajax({
 *       url: "save.php',
 *       data: change
 *     });
 *   }
 * });
 * ...
 * ```
 *
 * ```js
 * // Using events as plugin hooks:
 * ...
 * var hot1 = new Handsontable(document.getElementById('example1'), {
 *   myPlugin: true
 * });
 *
 * var hot2 = new Handsontable(document.getElementById('example2'), {
 *   myPlugin: false
 * });
 *
 * // global hook
 * Handsontable.hooks.add('afterChange', function() {
 *   // Fired twice - for hot1 and hot2
 *   if (this.getSettings().myPlugin) {
 *     // function body - will only run for hot1
 *   }
 * });
 *
 * // local hook (has same effect as a callback)
 * hot2.addHook('afterChange', function() {
 *   // function body - will only run in #example2
 * });
 * ```
 * ...
 */

// @TODO: Move plugin description hooks to plugin?
const REGISTERED_HOOKS = [
  /**
   * Callback fired after resetting a cell's meta.
   *
   * @event Hooks#afterCellMetaReset
   * @since 0.11
   */
  'afterCellMetaReset',

  /**
   * @description
   * Callback fired after one or more cells has been changed. Its main use case is to save the input.
   *
   * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
   *
   * @event Hooks#afterChange
   * @param {Array} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`.
   * @param {String} source Is one of the strings: `"alter", "edit", "populateFromArray", "loadData", "autofill", "paste"`.
   */
  'afterChange',

  /**
   * @description
   * Fired after observing changes.
   *
   * @event Hooks#afterChangesObserved
   */
  'afterChangesObserved',

  /**
   * @description
   * Fired after setting up the Context Menu's default options. These options are a collection which user can select by setting
   * an array of keys or an array of objects in `contextMenu` option.
   *
   * @event Hooks#afterContextMenuDefaultOptions
   * @param {Array} predefinedItems Array of objects containing information about the pre-defined Context Menu items.
   */
  'afterContextMenuDefaultOptions',

  /**
   * @description
   * Fired before setting up the Context Menu's items but after filtering these options by user (`contextMenu` option). This hook
   * can by helpful to determine if user use specified menu item or to set up one of the menu item to by always visible.
   *
   * @event Hooks#beforeContextMenuSetItems
   * @param {Array} menuItems Array of objects containing information about to generated Context Menu items.
   */
  'beforeContextMenuSetItems',

  /**
   * @description
   * Fired after setting up the Context Menu's default options. These options are a collection which user can select by setting
   * an array of keys or an array of objects in `contextMenu` option.
   *
   * @pro
   * @event Hooks#afterDropdownMenuDefaultOptions
   * @param {Array} predefinedItems Array of objects containing information about the pre-defined Context Menu items.
   */
  'afterDropdownMenuDefaultOptions',

  /**
   * @description
   * Fired before setting up the Dropdown Menu's items but after filtering these options by user (`dropdownMenu` option). This hook
   * can by helpful to determine if user use specified menu item or to set up one of the menu item to by always visible.
   *
   * @pro
   * @event Hooks#beforeDropdownMenuSetItems
   * @param {Array} menuItems Array of objects containing information about to generated Dropdown Menu items.
   */
  'beforeDropdownMenuSetItems',

  /**
   * @description
   * Fired after hiding the Context Menu.
   *
   * @event Hooks#afterContextMenuHide
   * @param {Object} context The Context menu instance.
   */
  'afterContextMenuHide',

  /**
   * @description
   * Fired after opening the Context Menu.
   *
   * @event Hooks#afterContextMenuShow
   * @param {Object} context The Context Menu instance.
   */
  'afterContextMenuShow',

  /**
   * @description
   * Fired after reaching the copy limit while copying data.
   *
   * @event Hooks#afterCopyLimit
   * @param {Number} selectedRows Count of selected copyable rows.
   * @param {Number} selectedColumns Count of selected copyable columns.
   * @param {Number} copyRowsLimit Current copy rows limit.
   * @param {Number} copyColumnsLimit Current copy columns limit.
   */
  'afterCopyLimit',

  /**
   * Callback is fired before a new column was created.
   *
   * @since 0.28.0
   * @event Hooks#beforeCreateCol
   * @param {Number} index Represents the index of first newly created column in the data source array.
   * @param {Number} amount Number of newly created columns in the data source array.
   * @param {String} [source] String that identifies source of method call.
   */
  'beforeCreateCol',

  /**
   * Callback is fired after a new column was created.
   *
   * @event Hooks#afterCreateCol
   * @param {Number} index Represents the index of first newly created column in the data source array.
   * @param {Number} amount Number of newly created columns in the data source array.
   * @param {String} [source] String that identifies source of method call.
   */
  'afterCreateCol',

  /**
   * Callback is fired before a new row was created.
   *
   * @since 0.28.0
   * @event Hooks#beforeCreateRow
   * @param {Number} index Represents the index of first newly created row in the data source array.
   * @param {Number} amount Number of newly created rows in the data source array.
   * @param {String} [source] String that identifies source of method call.
   */
  'beforeCreateRow',

  /**
   * Callback is fired after a new row was created.
   *
   * @event Hooks#afterCreateRow
   * @param {Number} index Represents the index of first newly created row in the data source array.
   * @param {Number} amount Number of newly created rows in the data source array.
   * @param {String} [source] String that identifies source of method call.
   */
  'afterCreateRow',

  /**
   * Fired after the current cell is deselected.
   *
   * @event Hooks#afterDeselect
   */
  'afterDeselect',

  /**
   * Fired after destroying the Handsontable instance.
   *
   * @event Hooks#afterDestroy
   */
  'afterDestroy',

  /**
   * Fired on a `keydown` event on the document body.
   *
   * @event Hooks#afterDocumentKeyDown
   * @param {Event} event A `keydown` event.
   */
  'afterDocumentKeyDown',

  /**
   * Callback fired after getting the cell settings.
   *
   * @event Hooks#afterGetCellMeta
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {Object} cellProperties Object containing the cell properties.
   */
  'afterGetCellMeta',

  /**
   * Callback fired after retrieving information about a column header and appending it to the table header.
   *
   * @event Hooks#afterGetColHeader
   * @param {Number} col Column index.
   * @param {Element} TH Header's TH element.
   */
  'afterGetColHeader',

  /**
   * Callback fired after retrieving information about a column header and appending it to the table header.
   *
   * @event Hooks#afterGetRowHeader
   * @param {Number} row Row index.
   * @param {Element} TH Header's TH element.
   */
  'afterGetRowHeader',

  /**
   * Callback fired after Handsontable instance is initiated.
   *
   * @event Hooks#afterInit
   */
  'afterInit',

  /**
   * Callback fired after new data is loaded (by `loadData` method) into the data source array.
   *
   * @event Hooks#afterLoadData
   * @param {Boolean} firstTime flag that determines whether the data has been loaded during the initialization.
   */
  'afterLoadData',

  /**
   * Fired after a scroll event, which is identified as a momentum scroll (e.g. on an iPad).
   *
   * @event Hooks#afterMomentumScroll
   */
  'afterMomentumScroll',

  /**
   * Fired after a `mousedown` event is triggered on the cell corner (the drag handle).
   *
   * @event Hooks#afterOnCellCornerMouseDown
   * @since 0.11
   * @param {Object} event `mousedown` event object.
   */
  'afterOnCellCornerMouseDown',

  /**
   * Callback fired after clicking on a cell or row/column header.
   * In case the row/column header was clicked, the index is negative.
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseDown` called
   * with coords `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseDown
   * @since 0.11
   * @param {Object} event `mousedown` event object.
   * @param {Object} coords Coordinates object containing the row and column indexes of the clicked cell.
   * @param {Element} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseDown',

  /**
   * Callback fired after hovering a cell or row/column header with the mouse cursor.
   * In case the row/column header was hovered, the index is negative.
   * For example, hovering over the row header of cell (0, 0) results with `afterOnCellMouseOver` called
   * with coords `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseOver
   * @since 0.11
   * @param {Object} event `mouseover` event object.
   * @param {Object} coords Hovered cell's coordinate object.
   * @param {Element} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseOver',

  /**
   * Callback is fired when one or more columns are removed.
   *
   * @event Hooks#afterRemoveCol
   * @param {Number} index Is an index of starter column.
   * @param {Number} amount Is an amount of removed columns.
   */
  'afterRemoveCol',

  /**
   * Callback is fired when one or more rows are removed.
   *
   * @event Hooks#afterRemoveRow
   * @param {Number} index Is an index of starter row.
   * @param {Number} amount Is an amount of removed rows.
   */
  'afterRemoveRow',

  /**
   * Callback fired after the Handsontable table is rendered.
   *
   * @event Hooks#afterRender
   * @param {Boolean} isForced Is `true` if rendering was triggered by a change of settings or data; or `false` if
   *                           rendering was triggered by scrolling or moving selection.
   */
  'afterRender',

  /**
   * Fired before starting rendering the cell.
   *
   * @event Hooks#beforeRenderer
   * @since 0.24.2
   * @param {Element} TD Currently rendered cell's TD element.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String|Number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {String} value Value of the rendered cell.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  'beforeRenderer',

  /**
   * Fired after finishing rendering the cell (after the renderer finishes).
   *
   * @event Hooks#afterRenderer
   * @since 0.11.0
   * @param {Element} TD Currently rendered cell's TD element.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String|Number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {String} value Value of the rendered cell.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  'afterRenderer',

  /**
   * Fired after the horizontal scroll event.
   *
   * @event Hooks#afterScrollHorizontally
   * @since 0.11
   */
  'afterScrollHorizontally',

  /**
   * Fired after the vertical scroll event.
   *
   * @event Hooks#afterScrollVertically
   * @since 0.11
   */
  'afterScrollVertically',

  /**
   * Callback fired after one or more cells are selected (e.g. during mouse move).
   *
   * @event Hooks#afterSelection
   * @param {Number} r Selection start row index.
   * @param {Number} c Selection start column index.
   * @param {Number} r2 Selection end row index.
   * @param {Number} c2 Selection end column index.
   */
  'afterSelection',

  /**
   * Callback fired after one or more cells are selected. The `p` argument represents the source object property name instead of the column number.
   *
   * @event Hooks#afterSelectionByProp
   * @param {Number} r Selection start row index.
   * @param {String} p Selection start data source object property name.
   * @param {Number} r2 Selection end row index.
   * @param {String} p2 Selection end data source object property name.
   */
  'afterSelectionByProp',

  /**
   * Callback fired after one or more cells are selected (e.g. on mouse up).
   *
   * @event Hooks#afterSelectionEnd
   * @param {Number} r Selection start row index.
   * @param {Number} c Selection start column index.
   * @param {Number} r2 Selection end row index.
   * @param {Number} c2 Selection end column index.
   */
  'afterSelectionEnd',

  /**
   * Callback fired after one or more cells are selected (e.g. on mouse up). The `p` argument represents the data source object
   * property name instead of the column number.
   *
   * @event Hooks#afterSelectionEndByProp
   * @param {Number} r Selection start row index.
   * @param {String} p Selection start data source object property index.
   * @param {Number} r2 Selection end row index.
   * @param {String} p2 Selection end data source object property index.
   */
  'afterSelectionEndByProp',

  /**
   * Called after cell meta is changed.
   *
   * @event Hooks#afterSetCellMeta
   * @since 0.11.0
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String} key The updated meta key.
   * @param {*} value The updated meta value.
   */
  'afterSetCellMeta',

  /**
   * Called after cell data was changed.
   *
   * @event Hooks#afterSetDataAtCell
   * @since 0.28.0
   * @param {Array} changes An array of changes in format `[[row, col, oldValue, value], ...]`.
   * @param {String} [source] String that identifies source of method call.
   */
  'afterSetDataAtCell',

  /**
   * Called after cell data was changed.
   *
   * @event Hooks#afterSetDataAtRowProp
   * @since 0.28.0
   * @param {Array} changes An array of changes in format `[[row, prop, oldValue, value], ...]`.
   * @param {String} [source] String that identifies source of method call.
   */
  'afterSetDataAtRowProp',

  /**
   * Fired after calling the `updateSettings` method.
   *
   * @event Hooks#afterUpdateSettings
   */
  'afterUpdateSettings',

  /**
   * @description
   * A plugin hook executed after validator function, only if validator function is defined.
   * Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.
   *
   * __Returning false from the callback will mark the cell as invalid.__
   *
   * @event Hooks#afterValidate
   * @since 0.9.5
   * @param {Boolean} isValid `true` if valid, `false` if not.
   * @param {*} value The value in question.
   * @param {Number} row Row index.
   * @param {String|Number} prop Property name / column index.
   * @param {String} source Source string.
   */
  'afterValidate',

  /**
   * Fired before populating the data in the autofill feature.
   *
   * @event Hooks#beforeAutofill
   * @param {Object} start Object containing information about first filled cell: `{row: 2, col: 0}`.
   * @param {Object} end Object containing information about last filled cell: `{row: 4, col: 1}`.
   * @param {Array} data 2D array containing information about fill pattern: `[["1', "Ted"], ["1', "John"]]`.
   */
  'beforeAutofill',

  /**
   * Fired before aligning the cell contents.
   *
   * @event Hooks#beforeCellAlignment
   * @param stateBefore
   * @param range
   * @param {String} type Type of the alignment - either `horizontal` or `vertical`
   * @param {String} alignmentClass String defining the alignment class added to the cell.
   * Possible values:
   * * `htLeft`,
   * * `htCenter`,
   * * `htRight`,
   * * `htJustify`
   * for horizontal alignment,
   *
   *
   * * `htTop`,
   * * `htMiddle`,
   * * `htBottom`
   * for vertical alignment.
   */
  'beforeCellAlignment',

  /**
   * Callback fired before one or more cells is changed. Its main purpose is to alter changes silently before input.
   *
   * @event Hooks#beforeChange
   * @param {Array} changes 2D array containing information about each of the edited cells.
   * @param {String} source The name of a source of changes.
   * @example
   * ```js
   * // To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0] = null;
   *   }
   * });
   * ...
   *
   * // To alter a single change, overwrite the desired value to changes[i][3].
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0][3] = 10;
   *   }
   * });
   * ...
   *
   * // To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     return false;
   *   }
   * });
   * ...
   * ```
   */
  'beforeChange',

  /**
   * Fired right before rendering the changes.
   *
   * @event Hooks#beforeChangeRender
   * @since 0.11
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue].
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback).
   */
  'beforeChangeRender',

  /**
   * Fired before drawing the borders.
   *
   * @event Hooks#beforeDrawBorders
   * @param {Array} corners Array specifying the current selection borders.
   * @param {String} borderClassName Specifies the border class name.
   */
  'beforeDrawBorders',

  /**
   * Callback fired before getting cell settings.
   *
   * @event Hooks#beforeGetCellMeta
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  'beforeGetCellMeta',

  /**
   * @description
   * Callback fired before Handsontable instance is initiated.
   *
   * @event Hooks#beforeInit
   */
  'beforeInit',

  /**
   * Callback fired before Walkontable instance is initiated.
   *
   * @since 0.11
   * @event Hooks#beforeInitWalkontable
   * @param {Object} walkontableConfig Walkontable configuration object.
   */
  'beforeInitWalkontable',

  /**
   * Callback fired before keydown event is handled. It can be used to overwrite default key bindings.
   * Caution - in your `beforeKeyDown` handler you need to call `event.stopImmediatePropagation()` to prevent default key behavior.
   *
   * @event Hooks#beforeKeyDown
   * @since 0.9.0
   * @param {Event} event Original DOM event.
   */
  'beforeKeyDown',

  /**
   * Fired after the user clicked a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellMouseDown
   * @param {Event} event The `mousedown` event object.
   * @param {WalkontableCellCoords} coords WalkontableCellCoords object containing the coordinates of the clicked cell.
   * @param {Element} TD TD element.
   */
  'beforeOnCellMouseDown',

  /**
   * Fired after the user moved cursor over a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellMouseOver
   * @param {Event} event The `mouseover` event object.
   * @param {WalkontableCellCoords} coords WalkontableCellCoords object containing the coordinates of the clicked cell.
   * @param {Element} TD TD element.
   * @param {Object} blockCalculations Contain keys 'row' and 'column' with boolean value.
   */
  'beforeOnCellMouseOver',

  /**
   * Callback is fired when one or more columns are about to be removed.
   *
   * @event Hooks#beforeRemoveCol
   * @param {Number} index Index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   * @param {Array} [logicalCols] Consists of logical indexes of processed columns.
   */
  'beforeRemoveCol',

  /**
   * Callback is fired when one or more rows are about to be removed.
   *
   * @event Hooks#beforeRemoveRow
   * @param {Number} index Index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   * @param {Array} [logicalRows] Consists of logical indexes of processed rows.
   */
  'beforeRemoveRow',

  /**
   * Callback fired before Handsontable table is rendered.
   *
   * @event Hooks#beforeRender
   * @param {Boolean} isForced If `true` rendering was triggered by a change of settings or data; or `false` if
   *                           rendering was triggered by scrolling or moving selection.
   */
  'beforeRender',

  /**
   * Callback fired before setting range is started.
   *
   * @event Hooks#beforeSetRangeStart
   * @param {Array} coords WalkontableCellCoords array.
   */
  'beforeSetRangeStart',

  /**
   * Callback fired before setting range is ended.
   *
   * @event Hooks#beforeSetRangeEnd
   * @param {Array} coords WalkontableCellCoords array.
   */
  'beforeSetRangeEnd',

  /**
   * Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.
   *
   * @event Hooks#beforeTouchScroll
   */
  'beforeTouchScroll',

  /**
   * @description
   * A plugin hook executed before validator function, only if validator function is defined.
   * This can be used to manipulate the value of changed cell before it is applied to the validator function.
   *
   * __Notice:__ this will not affect values of changes. This will change value ONLY for validation!
   *
   * @event Hooks#beforeValidate
   * @since 0.9.5
   * @param {*} value Value of the cell.
   * @param {Number} row Row index.
   * @param {String|Number} prop Property name / column index.
   * @param {String} source Information about the context of calling the function.
   */
  'beforeValidate',

  /**
   * Callback fired before cell value is rendered into the DOM (through renderer function).
   *
   * @event Hooks#beforeValueRender
   * @since 0.29.0
   * @param {*} value Cell value to render.
   */
  'beforeValueRender',

  /**
   * Callback fired after Handsontable instance is constructed (via `new` operator).
   *
   * @event Hooks#construct
   * @since 0.16.1
   */
  'construct',

  /**
   * Callback fired after Handsontable instance is initiated but before table is rendered.
   *
   * @event Hooks#init
   * @since 0.16.1
   */
  'init',

  /**
   * Fired when a column index is about to be modified by a callback function.
   *
   * @event Hooks#modifyCol
   * @since 0.11
   * @param {Number} col Column index.
   */
  'modifyCol',

  /**
   * Fired when a column index is about to be de-modified by a callback function.
   *
   * @event Hooks#unmodifyCol
   * @since 0.23.0
   * @param {Number} col Column index.
   */
    'unmodifyCol',

  /**
   * Fired when a row index is about to be de-modified by a callback function.
   *
   * @event Hooks#unmodifyRow
   * @since 0.26.2
   * @param {Number} row Logical row index.
   */
  'unmodifyRow',
  /**
   * Fired when a column header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyColHeader
   * @since 0.20.0
   * @param {Number} column Column header index.
   */
  'modifyColHeader',

  /**
   * Fired when a column width is about to be modified by a callback function.
   *
   * @event Hooks#modifyColWidth
   * @since 0.11
   * @param {Number} width Current column width.
   * @param {Number} col Column index.
   */
  'modifyColWidth',

  /**
   * Fired when a row index is about to be modified by a callback function.
   *
   * @event Hooks#modifyRow
   * @since 0.11
   * @param {Number} row Row index.
   */
  'modifyRow',

  /**
   * Fired when a row header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeader
   * @since 0.20.0
   * @param {Number} row Row header index.
   */
  'modifyRowHeader',

  /**
   * Fired when a row height is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeight
   * @since 0.11.0
   * @param {Number} height Row height.
   * @param {Number} row Row index.
   */
  'modifyRowHeight',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyData
   * @since 0.28.0
   * @param {Number} row Row height.
   * @param {Number} column Column index.
   * @param {Object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {String} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  'modifyData',

  /**
   * Fired after loading data using the Persistent State plugin.
   *
   * @event Hooks#persistentStateLoad
   * @param {String} key Key string.
   * @param {Object} valuePlaceholder Object containing the loaded data.
   */
  'persistentStateLoad',

  /**
   * Fired after resetting data using the Persistent State plugin.
   *
   * @event Hooks#persistentStateReset
   * @param {String} key Key string.
   */
  'persistentStateReset',

  /**
   * Fired after resetting data using the Persistent State plugin.
   *
   * @event Hooks#persistentStateSave
   * @param {String} key Key string.
   * @param {Mixed} value Value to save.
   */
  'persistentStateSave',

  /**
   * Fired before sorting the column. If you return `false` value then sorting will be not applied by
   * Handsontable (useful for server-side sorting).
   *
   * @event Hooks#beforeColumnSort
   * @param {Number} column Sorted column index.
   * @param {Boolean} order Soring order where:
   *  * `true` means ascending order,
   *  * `false` means descending order,
   *  * `undefined` means original order.
   */
  'beforeColumnSort',

  /**
   * Fired after sorting the column.
   *
   * @event Hooks#afterColumnSort
   * @param {Number} column Sorted column index.
   * @param {Boolean} order Soring order where:
   *  * `true` means ascending order
   *  * `false` means descending order
   *  * `undefined` means original order
   */
  'afterColumnSort',

  /**
   * @description
   * Fired after applying the autofill values.
   * Both arguments are provided in the following format:
   * ```js
   * [startRow, startColumn, endRow, endColumn]
   * ```
   *
   * @event Hooks#afterAutofillApplyValues
   * @param {Array} startArea Array of coordinates of the starting point for the drag-down operation.
   * @param {Array} entireArea Array of coordinates of the entire area of the drag-down operation.
   */
  'afterAutofillApplyValues',

  /**
   * Fired to allow modifying the copyable range with a callback function.
   *
   * @since 0.19.0
   * @event Hooks#modifyCopyableRange
   * @param {Array} copyableRanges Array of objects defining copyable cells.
   */
  'modifyCopyableRange',

  /**
   * Fired before change order of the logical indexes.
   *
   * @event Hooks#beforeColumnMove
   * @param {Array} columns Array of visual column indexes to be moved.
   * @param {Number} target Visual column index being a target for moved columns.
   */
  'beforeColumnMove',

  /**
   * Fired after change order of the logical indexes.
   *
   * @event Hooks#afterColumnMove
   * @param {Array} columns Array of visual column indexes that were moved.
   * @param {Number} target Visual column index being a target for moved columns.
   */
  'afterColumnMove',

  /**
   * Fired before change order of the logical indexes.
   *
   * @event Hooks#beforeRowMove
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {Number} target Visual row index being a target for moved rows.
   */
  'beforeRowMove',

  /**
   * Fired after change order of the logical indexes.
   *
   * @event Hooks#afterRowMove
   * @param {Array} rows Array of visual row indexes that were moved.
   * @param {Number} target Visual row index being a target for moved rows.
   */
  'afterRowMove',

  /**
   * Fired before rendering the table with modified column sizes.
   *
   * @event Hooks#beforeColumnResize
   * @param {Number} currentColumn Index of the resized column.
   * @param {Number} newSize Calculated new column width.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {Number} Returns a new column size or `undefined`, if column size should be calculated automatically.
   */
  'beforeColumnResize',

  /**
   * Fired after rendering the table with modified column sizes.
   *
   * @event Hooks#afterColumnResize
   * @param {Number} currentColumn Index of the resized column.
   * @param {Number} newSize Calculated new column width.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  'afterColumnResize',

  /**
   * Fired before rendering the table with modified row sizes.
   *
   * @event Hooks#beforeRowResize
   * @param {Number} currentRow Index of the resized row.
   * @param {Number} newSize Calculated new row height.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {Number} Returns the new row size or `undefined` if row size should be calculated automatically.
   */
  'beforeRowResize',

  /**
   * Fired after rendering the table with modified row sizes.
   *
   * @event Hooks#afterRowResize
   * @param {Number} currentRow Index of the resized row.
   * @param {Number} newSize Calculated new row height.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  'afterRowResize',

  /**
   * Fired after getting the column header renderers.
   *
   * @event Hooks#afterGetColumnHeaderRenderers
   * @param {Array} array Array of the column header renderers.
   */
  'afterGetColumnHeaderRenderers',

  /**
   * Fired after getting the row header renderers.
   *
   * @event Hooks#afterGetRowHeaderRenderers
   * @param {Array} array Array of the row header renderers.
   */
  'afterGetRowHeaderRenderers',

  /**
   * Fired before applying stretched column width to column.
   *
   * @event Hooks#beforeStretchingColumnWidth
   * @param {Number} stretchedWidth Calculated width.
   * @param {Number} column Column index.
   * @returns {Number} Returns new width which will be applied to the column element.
   */
  'beforeStretchingColumnWidth',

  /**
   * Fired before applying [filtering]{@link http://docs.handsontable.com/pro/demo-filtering.html}.
   *
   * @pro
   * @event Hooks#beforeFilter
   * @param {Array} formulasStack An array of objects with added formulas.
   * @returns {Boolean} If hook returns `false` value then filtering won't be applied on the UI side (server-side filtering).
   */
  'beforeFilter',

  /**
   * Fired after applying [filtering]{@link http://docs.handsontable.com/pro/demo-filtering.html}.
   *
   * @pro
   * @event Hooks#afterFilter
   * @param {Array} formulasStack An array of objects with added formulas.
   */
  'afterFilter',

  /**
   * Used to modify the column header height.
   *
   * @event Hooks#modifyColumnHeaderHeight
   * @since 0.25.0
   * @param {Number} col Column index.
   */
  'modifyColumnHeaderHeight',

  /**
   * Fired before the undo action. Contains information about the action that is being undone.
   *
   * @event Hooks#beforeUndo
   * @since 0.26.2
   * @param {Object} action The action object. Contains information about the action being undone. The `actionType`
   * property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'beforeUndo',

  /**
   * Fired after the undo action. Contains information about the action that is being undone.
   *
   * @event Hooks#afterUndo
   * @since 0.26.2
   * @param {Object} action The action object. Contains information about the action being undone. The `actionType`
   * property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'afterUndo',

  /**
   * Fired before the redo action. Contains information about the action that is being redone.
   *
   * @event Hooks#beforeRedo
   * @since 0.26.2
   * @param {Object} action The action object. Contains information about the action being redone. The `actionType`
   * property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'beforeRedo',

  /**
   * Fired after the redo action. Contains information about the action that is being redone.
   *
   * @event Hooks#afterRedo
   * @since 0.26.2
   * @param {Object} action The action object. Contains information about the action being redone. The `actionType`
   * property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'afterRedo',

  /**
   * Used to modify the row header width.
   *
   * @event Hooks#modifyRowHeaderWidth
   * @param {Number} rowHeaderWidth Row header width.
   */
  'modifyRowHeaderWidth',

  /**
   * Fired from the `populateFromArray` method during the `autofill` process. Fired for each "autofilled" cell individually.
   *
   * @event Hooks#beforeAutofillInsidePopulate
   * @param {Object} index Object containing `row` and `col` properties, defining the number of rows/columns from the initial cell of the autofill.
   * @param {String} direction Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`.
   * @param {Array} input Array of arrays. Contains an array of rows with data being used in the autofill.
   * @param {Array} deltas The deltas array passed to the `populateFromArray` method.
   */
  'beforeAutofillInsidePopulate',

  /**
   * Fired when the start of the selection is being modified. (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformStart
   * @param {WalkontableCellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformStart',

  /**
   * Fired when the end of the selection is being modified. (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformEnd
   * @param {WalkontableCellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformEnd',

  /**
   * Fired after the start of the selection is being modified. (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformStart
   * @param {WalkontableCellCoords} coords Coords of the freshly selected cell.
   * @param {Number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {Number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformStart',

  /**
   * Fired after the end of the selection is being modified. (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformEnd
   * @param {WalkontableCellCoords} coords Coords of the freshly selected cell.
   * @param {Number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {Number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformEnd',

  /**
   * Fired before rendering a cell value.
   *
   * @event Hooks#beforeValueRender
   * @param {Mixed} value The rendered value.
   */
  'beforeValueRender',

  /**
   * Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.
   *
   * @event Hooks#afterViewportRowCalculatorOverride
   * @param {Object} calc The row calculator.
   */
  'afterViewportRowCalculatorOverride',

  /**
   * Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.
   *
   * @event Hooks#afterViewportColumnCalculatorOverride
   * @param {Object} calc The row calculator.
   */
  'afterViewportColumnCalculatorOverride',

  /**
   * Fired after initializing all the plugins.
   *
   * @event Hooks#afterPluginsInitialized
   */
  'afterPluginsInitialized',

  /**
   * Used when saving/loading the manual row heights state.
   *
   * @event Hooks#manualRowHeights
   * @param {Array} state The current manual row heights state.
   */
  'manualRowHeights',

  /**
   * Used to skip the length cache calculation for a defined period of time.
   *
   * @event Hooks#skipLengthCache
   * @param {Number} delay The delay in milliseconds.
   */
  'skipLengthCache',

  /**
   * Fired after trimming rows in the TrimRows plugin.
   *
   * @pro
   * @event Hooks#afterTrimRow
   * @param {Array} rows Indexes of trimmed rows.
   */
  'afterTrimRow',

  /**
   * Fired after untrimming rows in the TrimRows plugin.
   *
   * @pro
   * @event Hooks#afterUntrimRow
   * @param {Array} rows Indexes of untrimmed rows.
   */
  'afterUntrimRow',

  /**
   * Fired after opening the dropdown menu.
   *
   * @pro
   * @event Hooks#afterDropdownMenuShow
   * @param {DropdownMenu} instance The DropdownMenu instance.
   */
  'afterDropdownMenuShow',

  /**
   * Fired after hiding the dropdown menu.
   *
   * @pro
   * @event Hooks#afterDropdownMenuHide
   * @param {DropdownMenu} instance The DropdownMenu instance.
   */
  'afterDropdownMenuHide',

  /**
   * Used to check whether the provided row index is hidden.
   *
   * @pro
   * @event Hooks#hiddenRow
   * @param {Number} row The row index in question.
   */
  'hiddenRow',

  /**
   * Used to check whether the provided column index is hidden.
   *
   * @pro
   * @event Hooks#hiddenColumn
   * @param {Number} column The column index in question.
   */
  'hiddenColumn',

  /**
   * Fired before adding a children to the NestedRows structure.
   *
   * @pro
   * @event Hooks#beforeAddChild
   * @param {Object} parent The parent object.
   * @param {Object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {Number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'beforeAddChild',

  /**
   * Fired after adding a children to the NestedRows structure.
   *
   * @pro
   * @event Hooks#afterAddChild
   * @param {Object} parent The parent object.
   * @param {Object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {Number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'afterAddChild',

  /**
   * Fired before detaching a child from its parent in the NestedRows plugin.
   *
   * @pro
   * @event Hooks#beforeDetachChild
   * @param {Object} parent An object representing the parent from which the element is to be detached.
   * @param {Object} element The detached element.
   */
  'beforeDetachChild',

  /**
   * Fired after detaching a child from its parent in the NestedRows plugin.
   *
   * @pro
   * @event Hooks#afterDetachChild
   * @param {Object} parent An object representing the parent from which the element was detached.
   * @param {Object} element The detached element.
   */
  'afterDetachChild',

  /**
   * Fired after the editor is opened and rendered.
   *
   * @event Hooks#afterBeginEditing
   * @param {Number} row Row index of the edited cell.
   * @param {Number} column Column index of the edited cell.
   */
  'afterBeginEditing'
];

import {arrayEach} from './helpers/array';
import {objectEach} from './helpers/object';

class Hooks {
  /**
   *
   */
  constructor() {
    this.globalBucket = this.createEmptyBucket();
  }

  /**
   * Returns a new object with empty handlers related to every registered hook name.
   *
   * @returns {Object} The empty bucket object.
   *
   * @example
   * ```js
   * Handsontable.hooks.createEmptyBucket();
   * // Results:
   * {
   * ...
   * afterCreateCol: [],
   * afterCreateRow: [],
   * beforeInit: [],
   * ...
   * }
   * ```
   */
  createEmptyBucket() {
    const bucket = Object.create(null);

    arrayEach(REGISTERED_HOOKS, (hook) => (bucket[hook] = []));

    return bucket;
  }

  /**
   * Get hook bucket based on the context of the object or if argument is `undefined`, get the global hook bucket.
   *
   * @param {Object} [context=null] A Handsontable instance.
   * @returns {Object} Returns a global or Handsontable instance bucket.
   */
  getBucket(context = null) {
    if (context) {
      if (!context.pluginHookBucket) {
        context.pluginHookBucket = this.createEmptyBucket();
      }

      return context.pluginHookBucket;
    }

    return this.globalBucket;
  }

  /**
   * Adds a listener (globally or locally) to a specified hook name.
   * If the `context` parameter is provided, the hook will be added only to the instance it references.
   * Otherwise, the callback will be used everytime the hook fires on any Handsontable instance.
   * You can provide an array of callback functions as the `callback` argument, this way they will all be fired
   * once the hook is triggered.
   *
   * @see Core#addHook
   * @param {String} key Hook name.
   * @param {Function|Array} callback Callback function or an array of functions.
   * @param {Object} [context=null] The context for the hook callback to be added - a Handsontable instance or leave empty.
   * @returns {Hooks} Instance of Hooks.
   *
   * @example
   * ```js
   * // single callback, added locally
   * Handsontable.hooks.add('beforeInit', myCallback, hotInstance);
   *
   * // single callback, added globally
   * Handsontable.hooks.add('beforeInit', myCallback);
   *
   * // multiple callbacks, added locally
   * Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback], hotInstance);
   *
   * // multiple callbacks, added globally
   * Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback]);
   * ```
   */
  add(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, (c) => this.add(key, c, context));

    } else {
      const bucket = this.getBucket(context);

      if (typeof bucket[key] === 'undefined') {
        this.register(key);
        bucket[key] = [];
      }
      callback.skip = false;

      if (bucket[key].indexOf(callback) === -1) {
        // only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
        bucket[key].push(callback);
      }
    }

    return this;
  }

  /**
   * Adds a listener to a specified hook. After the hook runs this listener will be automatically removed from the bucket.
   *
   * @see Core#addHookOnce
   * @param {String} key Hook/Event name.
   * @param {Function|Array} callback Callback function.
   * @param {Object} [context=null] A Handsontable instance.
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
   * ```
   */
  once(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, (c) => this.once(key, c, context));

    } else {
      callback.runOnce = true;
      this.add(key, callback, context);
    }
  }

  /**
   * Removes a listener from a hook with a given name. If the `context` argument is provided, it removes a listener from a local hook assigned to the given Handsontable instance.
   *
   * @see Core#removeHook
   * @param {String} key Hook/Event name.
   * @param {Function} callback Callback function (needs the be the function that was previously added to the hook).
   * @param {Object} [context=null] Handsontable instance.
   * @return {Boolean} Returns `true` if hook was removed, `false` otherwise.
   *
   * @example
   * ```js
   * Handsontable.hooks.remove('beforeInit', myCallback);
   * ```
   */
  remove(key, callback, context = null) {
    let bucket = this.getBucket(context);

    if (typeof bucket[key] !== 'undefined') {
      if (bucket[key].indexOf(callback) >= 0) {
        callback.skip = true;

        return true;
      }
    }

    return false;
  }

  /**
   * Checks whether there are any registered listeners for the provided hook name.
   * If the `context` parameter is provided, it only checks for listeners assigned to the given Handsontable instance.
   *
   * @param {String} key Hook name.
   * @param {Object} [context=null] A Handsontable instance.
   * @returns {Boolean} `true` for success, `false` otherwise.
   */
  has(key, context = null) {
    let bucket = this.getBucket(context);

    return bucket[key] !== void 0 && bucket[key].length ? true : false;
  }

  /**
   * Runs all local and global callbacks assigned to the hook identified by the `key` parameter.
   * It returns either a return value from the last called callback or the first parameter (`p1`) passed to the `run` function.
   *
   * @see Core#runHooks
   * @param {Object} context Handsontable instance.
   * @param {String} key Hook/Event name.
   * @param {*} [p1] Parameter to be passed as an argument to the callback function.
   * @param {*} [p2] Parameter to be passed as an argument to the callback function.
   * @param {*} [p3] Parameter to be passed as an argument to the callback function.
   * @param {*} [p4] Parameter to be passed as an argument to the callback function.
   * @param {*} [p5] Parameter to be passed as an argument to the callback function.
   * @param {*} [p6] Parameter to be passed as an argument to the callback function.
   * @returns {*} Either a return value from the last called callback or `p1`.
   *
   * @example
   * ```js
   * Handsontable.hooks.run(hot, 'beforeInit');
   * ```
   */
  run(context, key, p1, p2, p3, p4, p5, p6) {
    {
      const globalHandlers = this.globalBucket[key];
      let index = -1;
      let length = globalHandlers ? globalHandlers.length : 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (++index < length) {
          if (!globalHandlers[index] || globalHandlers[index].skip) {
            continue;
          }
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          let res = globalHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            p1 = res;
          }
          if (globalHandlers[index] && globalHandlers[index].runOnce) {
            this.remove(key, globalHandlers[index]);
          }
        }
      }
    }
    {
      const localHandlers = this.getBucket(context)[key];
      let index = -1;
      let length = localHandlers ? localHandlers.length : 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (++index < length) {
          if (!localHandlers[index] || localHandlers[index].skip) {
            continue;
          }
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          let res = localHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            p1 = res;
          }
          if (localHandlers[index] && localHandlers[index].runOnce) {
            this.remove(key, localHandlers[index], context);
          }
        }
      }
    }

    return p1;
  }

  /**
   * Destroy all listeners connected to the context. If no context is provided, the global listeners will be destroyed.
   *
   * @param {Object} [context=null] A Handsontable instance.
   * @example
   * ```js
   * // destroy the global listeners
   * Handsontable.hooks.destroy();
   *
   * // destroy the local listeners
   * Handsontable.hooks.destroy(hotInstance);
   * ```
   */
  destroy(context = null) {
    objectEach(this.getBucket(context), (value, key, bucket) => (bucket[key].length = 0));
  }

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins.
   * It is not necessary to call register, but if you use it, your plugin hook will be used returned by
   * the `getRegistered` method. (which itself is used in the demo http://docs.handsontable.com/tutorial-callbacks.html).
   *
   * @param key {String} The hook name.
   *
   * @example
   * ```js
   * Handsontable.hooks.register('myHook');
   * ```
   */
  register(key) {
    if (!this.isRegistered(key)) {
      REGISTERED_HOOKS.push(key);
    }
  }

  /**
   * Deregisters a hook name (removes it from the list of known hook names).
   *
   * @param key {String} Hook name.
   *
   * @example
   * ```js
   * Handsontable.hooks.deregister('myHook');
   * ```
   */
  deregister(key) {
    if (this.isRegistered(key)) {
      REGISTERED_HOOKS.splice(REGISTERED_HOOKS.indexOf(key), 1);
    }
  }

  /**
   * Returns a boolean depending on if a hook by such name has been registered.
   *
   * @param key {String} Hook name.
   * @returns {Boolean} `true` for success, `false` otherwise.
   *
   * @example
   * ```js
   * Handsontable.hooks.isRegistered('beforeInit');
   *
   * // Results:
   * true
   * ```
   */
  isRegistered(key) {
    return REGISTERED_HOOKS.indexOf(key) >= 0;
  }

  /**
   * Returns an array of registered hooks.
   *
   * @returns {Array} An array of registered hooks.
   *
   * @example
   * ```js
   * Handsontable.hooks.getRegistered();
   *
   * // Results:
   * [
   * ...
   *   'beforeInit',
   *   'beforeRender',
   *   'beforeSetRangeEnd',
   *   'beforeDrawBorders',
   *   'beforeChange',
   * ...
   * ]
   * ```
   */
  getRegistered() {
    return REGISTERED_HOOKS;
  }
}

export {Hooks};
