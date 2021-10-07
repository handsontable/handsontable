import { arrayEach } from './helpers/array';
import { objectEach } from './helpers/object';
import { substitute } from './helpers/string';
import { warn } from './helpers/console';
import { toSingleLine } from './helpers/templateLiteralTag';
import { fastCall } from './helpers/function';

/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __hooks__.
 *
 * @example
 *
 * ```js
 * // Using events as callbacks:
 * ...
 * const hot1 = new Handsontable(document.getElementById('example1'), {
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
 * const hot1 = new Handsontable(document.getElementById('example1'), {
 *   myPlugin: true
 * });
 *
 * const hot2 = new Handsontable(document.getElementById('example2'), {
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
   * Fired after resetting a cell's meta. This happens when the {@link Core#updateSettings} method is called.
   *
   * @event Hooks#afterCellMetaReset
   */
  'afterCellMetaReset',

  /**
   * Fired after one or more cells has been changed. The changes are triggered in any situation when the
   * value is entered using an editor or changed using API (e.q setDataAtCell).
   *
   * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
   *
   * @event Hooks#afterChange
   * @param {Array} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`.
   * @param {string} [source] String that identifies source of hook call ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @example
   * ```js
   * new Handsontable(element, {
   *   afterChange: (changes) => {
   *     changes.forEach(([row, prop, oldValue, newValue]) => {
   *       // Some logic...
   *     });
   *   }
   * })
   * ```
   */
  'afterChange',

  /**
   * Fired each time user opens {@link ContextMenu} and after setting up the Context Menu's default options. These options are a collection
   * which user can select by setting an array of keys or an array of objects in {@link Options#contextMenu} option.
   *
   * @event Hooks#afterContextMenuDefaultOptions
   * @param {Array} predefinedItems An array of objects containing information about the pre-defined Context Menu items.
   */
  'afterContextMenuDefaultOptions',

  /**
   * Fired each time user opens {@link ContextMenu} plugin before setting up the Context Menu's items but after filtering these options by
   * user (`contextMenu` option). This hook can by helpful to determine if user use specified menu item or to set up
   * one of the menu item to by always visible.
   *
   * @event Hooks#beforeContextMenuSetItems
   * @param {object[]} menuItems An array of objects containing information about to generated Context Menu items.
   */
  'beforeContextMenuSetItems',

  /**
   * Fired by {@link DropdownMenu} plugin after setting up the Dropdown Menu's default options. These options are a
   * collection which user can select by setting an array of keys or an array of objects in {@link Options#dropdownMenu}
   * option.
   *
   * @event Hooks#afterDropdownMenuDefaultOptions
   * @param {object[]} predefinedItems An array of objects containing information about the pre-defined Context Menu items.
   */
  'afterDropdownMenuDefaultOptions',

  /**
   * Fired by {@link DropdownMenu} plugin before setting up the Dropdown Menu's items but after filtering these options
   * by user (`dropdownMenu` option). This hook can by helpful to determine if user use specified menu item or to set
   * up one of the menu item to by always visible.
   *
   * @event Hooks#beforeDropdownMenuSetItems
   * @param {object[]} menuItems An array of objects containing information about to generated Dropdown Menu items.
   */
  'beforeDropdownMenuSetItems',

  /**
   * Fired by {@link ContextMenu} plugin after hiding the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#afterContextMenuHide
   * @param {object} context The Context Menu plugin instance.
   */
  'afterContextMenuHide',

  /**
   * Fired by {@link ContextMenu} plugin before opening the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#beforeContextMenuShow
   * @param {object} context The Context Menu instance.
   */
  'beforeContextMenuShow',

  /**
   * Fired by {@link ContextMenu} plugin after opening the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#afterContextMenuShow
   * @param {object} context The Context Menu plugin instance.
   */
  'afterContextMenuShow',

  /**
   * Fired by {@link CopyPaste} plugin after reaching the copy limit while copying data. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterCopyLimit
   * @param {number} selectedRows Count of selected copyable rows.
   * @param {number} selectedColumns Count of selected copyable columns.
   * @param {number} copyRowsLimit Current copy rows limit.
   * @param {number} copyColumnsLimit Current copy columns limit.
   */
  'afterCopyLimit',

  /**
   * Fired before created a new column.
   *
   * @event Hooks#beforeCreateCol
   * @param {number} index Represents the visual index of first newly created column in the data source array.
   * @param {number} amount Number of newly created columns in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*} If `false` then creating columns is cancelled.
   * @example
   * ```js
   * // Return `false` to cancel column inserting.
   * new Handsontable(element, {
   *   beforeCreateCol: function(data, coords) {
   *     return false;
   *   }
   * });
   * ```
   */
  'beforeCreateCol',

  /**
   * Fired after created a new column.
   *
   * @event Hooks#afterCreateCol
   * @param {number} index Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterCreateCol',

  /**
   * Fired before created a new row.
   *
   * @event Hooks#beforeCreateRow
   * @param {number} index Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeCreateRow',

  /**
   * Fired after created a new row.
   *
   * @event Hooks#afterCreateRow
   * @param {number} index Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
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
   * General hook which captures `keydown` events attached to the document body. These events are delegated to the
   * hooks system and consumed by Core and internal modules (e.g plugins, editors).
   *
   * @event Hooks#afterDocumentKeyDown
   * @param {Event} event A native `keydown` event object.
   */
  'afterDocumentKeyDown',

  /**
   * Fired inside the Walkontable's selection `draw` method. Can be used to add additional class names to cells, depending on the current selection.
   *
   * @event Hooks#afterDrawSelection
   * @param {number} currentRow Row index of the currently processed cell.
   * @param {number} currentColumn Column index of the currently cell.
   * @param {number[]} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
   * @param {number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @since 0.38.1
   * @returns {string|undefined} Can return a `String`, which will act as an additional `className` to be added to the currently processed cell.
   */
  'afterDrawSelection',

  /**
   * Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.
   *
   * @event Hooks#beforeRemoveCellClassNames
   * @since 0.38.1
   * @returns {string[]|undefined} Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
   */
  'beforeRemoveCellClassNames',

  /**
   * Fired after getting the cell settings.
   *
   * @event Hooks#afterGetCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties Object containing the cell properties.
   */
  'afterGetCellMeta',

  /**
   * Fired after retrieving information about a column header and appending it to the table header.
   *
   * @event Hooks#afterGetColHeader
   * @param {number} column Visual column index.
   * @param {HTMLTableCellElement} TH Header's TH element.
   */
  'afterGetColHeader',

  /**
   * Fired after retrieving information about a row header and appending it to the table header.
   *
   * @event Hooks#afterGetRowHeader
   * @param {number} row Visual row index.
   * @param {HTMLTableCellElement} TH Header's TH element.
   */
  'afterGetRowHeader',

  /**
   * Fired after the Handsontable instance is initiated.
   *
   * @event Hooks#afterInit
   */
  'afterInit',

  /**
   * Fired after new data is loaded (by `loadData` or `updateSettings` method) into the data source array.
   *
   * @event Hooks#afterLoadData
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} source Source of the call.
   */
  'afterLoadData',

  /**
   * Fired after a scroll event, which is identified as a momentum scroll (e.g. On an iPad).
   *
   * @event Hooks#afterMomentumScroll
   */
  'afterMomentumScroll',

  /**
   * Fired after a `mousedown` event is triggered on the cell corner (the drag handle).
   *
   * @event Hooks#afterOnCellCornerMouseDown
   * @param {Event} event `mousedown` event object.
   */
  'afterOnCellCornerMouseDown',

  /**
   * Fired after a `dblclick` event is triggered on the cell corner (the drag handle).
   *
   * @event Hooks#afterOnCellCornerDblClick
   * @param {Event} event `dblclick` event object.
   */
  'afterOnCellCornerDblClick',

  /**
   * Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
   * indexes are negative.
   *
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseDown` called
   * with coordinates `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseDown
   * @param {Event} event `mousedown` event object.
   * @param {CellCoords} coords Coordinates object containing the visual row and visual column indexes of the clicked cell.
   * @param {HTMLTableCellElement} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseDown',

  /**
   * Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
   * indexes are negative.
   *
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseUp` called
   * with coordinates `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseUp
   * @param {Event} event `mouseup` event object.
   * @param {CellCoords} coords Coordinates object containing the visual row and visual column indexes of the clicked cell.
   * @param {HTMLTableCellElement} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseUp',

  /**
   * Fired after clicking right mouse button on a cell or row/column header.
   *
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellContextMenu` called
   * with coordinates `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellContextMenu
   * @since 4.1.0
   * @param {Event} event `contextmenu` event object.
   * @param {CellCoords} coords Coordinates object containing the visual row and visual column indexes of the clicked cell.
   * @param {HTMLTableCellElement} TD Cell's TD (or TH) element.
   */
  'afterOnCellContextMenu',

  /**
   * Fired after hovering a cell or row/column header with the mouse cursor. In case the row/column header was
   * hovered, the index is negative.
   *
   * For example, hovering over the row header of cell (0, 0) results with `afterOnCellMouseOver` called
   * with coords `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseOver
   * @param {Event} event `mouseover` event object.
   * @param {CellCoords} coords Hovered cell's visual coordinate object.
   * @param {HTMLTableCellElement} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseOver',

  /**
   * Fired after leaving a cell or row/column header with the mouse cursor.
   *
   * @event Hooks#afterOnCellMouseOut
   * @param {Event} event `mouseout` event object.
   * @param {CellCoords} coords Leaved cell's visual coordinate object.
   * @param {HTMLTableCellElement} TD Cell's TD (or TH) element.
   */
  'afterOnCellMouseOut',

  /**
   * Fired after one or more columns are removed.
   *
   * @event Hooks#afterRemoveCol
   * @param {number} index Visual index of starter column.
   * @param {number} amount An amount of removed columns.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterRemoveCol',

  /**
   * Fired after one or more rows are removed.
   *
   * @event Hooks#afterRemoveRow
   * @param {number} index Visual index of starter row.
   * @param {number} amount An amount of removed rows.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterRemoveRow',

  /**
   * Fired before starting rendering the cell.
   *
   * @event Hooks#beforeRenderer
   * @param {HTMLTableCellElement} TD Currently rendered cell's TD element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string|number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {*} value Value of the rendered cell.
   * @param {object} cellProperties Object containing the cell's properties.
   */
  'beforeRenderer',

  /**
   * Fired after finishing rendering the cell (after the renderer finishes).
   *
   * @event Hooks#afterRenderer
   * @param {HTMLTableCellElement} TD Currently rendered cell's TD element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string|number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {*} value Value of the rendered cell.
   * @param {object} cellProperties Object containing the cell's properties.
   */
  'afterRenderer',

  /**
   * Fired after the horizontal scroll event.
   *
   * @event Hooks#afterScrollHorizontally
   */
  'afterScrollHorizontally',

  /**
   * Fired after the vertical scroll event.
   *
   * @event Hooks#afterScrollVertically
   */
  'afterScrollVertically',

  /**
   * Fired after one or more cells are selected (e.g. During mouse move).
   *
   * @event Hooks#afterSelection
   * @param {number} row Selection start visual row index.
   * @param {number} column Selection start visual column index.
   * @param {number} row2 Selection end visual row index.
   * @param {number} column2 Selection end visual column index.
   * @param {object} preventScrolling Object with `value` property where its value change will be observed.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   * @example
   * ```js
   * new Handsontable(element, {
   *   afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // setting if prevent scrolling after selection
   *     preventScrolling.value = true;
   *   }
   * })
   * ```
   */
  'afterSelection',

  /**
   * Fired after one or more cells are selected.
   *
   * The `prop` and `prop2` arguments represent the source object property name instead of the column number.
   *
   * @event Hooks#afterSelectionByProp
   * @param {number} row Selection start visual row index.
   * @param {string} prop Selection start data source object property name.
   * @param {number} row2 Selection end visual row index.
   * @param {string} prop2 Selection end data source object property name.
   * @param {object} preventScrolling Object with `value` property where its value change will be observed.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   * @example
   * ```js
   * new Handsontable(element, {
   *   afterSelectionByProp: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // setting if prevent scrolling after selection
   *     preventScrolling.value = true;
   *   }
   * })
   * ```
   */
  'afterSelectionByProp',

  /**
   * Fired after one or more cells are selected (e.g. On mouse up).
   *
   * @event Hooks#afterSelectionEnd
   * @param {number} row Selection start visual row index.
   * @param {number} column Selection start visual column index.
   * @param {number} row2 Selection end visual row index.
   * @param {number} column2 Selection end visual column index.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   */
  'afterSelectionEnd',

  /**
   * Fired after one or more cells are selected (e.g. On mouse up).
   *
   * The `prop` and `prop2` arguments represent the source object property name instead of the column number.
   *
   * @event Hooks#afterSelectionEndByProp
   * @param {number} row Selection start visual row index.
   * @param {string} prop Selection start data source object property index.
   * @param {number} row2 Selection end visual row index.
   * @param {string} prop2 Selection end data source object property index.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   */
  'afterSelectionEndByProp',

  /**
   * Fired after cell meta is changed.
   *
   * @event Hooks#afterSetCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key The updated meta key.
   * @param {*} value The updated meta value.
   */
  'afterSetCellMeta',

  /**
   * Fired after cell meta is removed.
   *
   * @event Hooks#afterRemoveCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key The removed meta key.
   * @param {*} value Value which was under removed key of cell meta.
   */
  'afterRemoveCellMeta',

  /**
   * Fired after cell data was changed.
   *
   * @event Hooks#afterSetDataAtCell
   * @param {Array} changes An array of changes in format `[[row, column, oldValue, value], ...]`.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterSetDataAtCell',

  /**
   * Fired after cell data was changed.
   * Called only when `setDataAtRowProp` was executed.
   *
   * @event Hooks#afterSetDataAtRowProp
   * @param {Array} changes An array of changes in format `[[row, prop, oldValue, value], ...]`.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterSetDataAtRowProp',

  /**
   * Fired after cell source data was changed.
   *
   * @event Hooks#afterSetSourceDataAtCell
   * @since 8.0.0
   * @param {Array} changes An array of changes in format `[[row, column, oldValue, value], ...]`.
   * @param {string} [source] String that identifies source of hook call.
   */
  'afterSetSourceDataAtCell',

  /**
   * Fired after calling the `updateSettings` method.
   *
   * @event Hooks#afterUpdateSettings
   * @param {object} newSettings New settings object.
   */
  'afterUpdateSettings',

  /**
   * @description
   * A plugin hook executed after validator function, only if validator function is defined.
   * Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.
   *
   * __Returning false from the callback will mark the cell as invalid__.
   *
   * @event Hooks#afterValidate
   * @param {boolean} isValid `true` if valid, `false` if not.
   * @param {*} value The value in question.
   * @param {number} row Visual row index.
   * @param {string|number} prop Property name / visual column index.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {void | boolean} If `false` the cell will be marked as invalid, `true` otherwise.
   */
  'afterValidate',

  /**
   * Fired before successful change of language (when proper language code was set).
   *
   * @event Hooks#beforeLanguageChange
   * @since 0.35.0
   * @param {string} languageCode New language code.
   */
  'beforeLanguageChange',

  /**
   * Fired after successful change of language (when proper language code was set).
   *
   * @event Hooks#afterLanguageChange
   * @since 0.35.0
   * @param {string} languageCode New language code.
   */
  'afterLanguageChange',

  /**
   * Fired by {@link Autofill} plugin before populating the data in the autofill feature. This hook is fired when
   * {@link Options#fillHandle} option is enabled.
   *
   * @event Hooks#beforeAutofill
   * @param {Array[]} selectionData Data the autofill operation will start from.
   * @param {CellRange} sourceRange The range values will be filled from.
   * @param {CellRange} targetRange The range new values will be filled into.
   * @param {string} direction Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`.
   *
   * @returns {boolean|Array[]} If false, the operation is cancelled. If array of arrays, the returned data
   *                              will be passed into `populateFromArray` instead of the default autofill
   *                              algorithm's result.
   */
  'beforeAutofill',

  /**
   * Fired by {@link Autofill} plugin after populating the data in the autofill feature. This hook is fired when
   * {@link Options#fillHandle} option is enabled.
   *
   * @event Hooks#afterAutofill
   * @since 8.0.0
   * @param {Array[]} fillData The data that was used to fill the `targetRange`. If `beforeAutofill` was used
   *                            and returned `[[]]`, this will be the same object that was returned from `beforeAutofill`.
   * @param {CellRange} sourceRange The range values will be filled from.
   * @param {CellRange} targetRange The range new values will be filled into.
   * @param {string} direction Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`.
   */
  'afterAutofill',

  /**
   * Fired before aligning the cell contents.
   *
   * @event Hooks#beforeCellAlignment
   * @param {object} stateBefore An object with class names defining the cell alignment.
   * @param {CellRange[]} range An array of CellRange coordinates where the alignment will be applied.
   * @param {string} type Type of the alignment - either `horizontal` or `vertical`.
   * @param {string} alignmentClass String defining the alignment class added to the cell.
   * Possible values:
   * * `htLeft`
   * * `htCenter`
   * * `htRight`
   * * `htJustify`
   * * `htTop`
   * * `htMiddle`
   * * `htBottom`.
   */
  'beforeCellAlignment',

  /**
   * Fired before one or more cells is changed. Its main purpose is to alter changes silently after input and before
   * table rendering.
   *
   * @event Hooks#beforeChange
   * @param {Array[]} changes 2D array containing information about each of the edited cells.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {void | boolean} If `false` all changes were cancelled, `true` otherwise.
   * @example
   * ```js
   * // To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0] = null;
   *   }
   * });
   * // To alter a single change, overwrite the desired value to changes[i][3].
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0][3] = 10;
   *   }
   * });
   * // To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     return false;
   *   }
   * });
   * ```
   */
  'beforeChange',

  /**
   * Fired right before rendering the changes.
   *
   * @event Hooks#beforeChangeRender
   * @param {Array[]} changes Array in form of `[row, prop, oldValue, newValue]`.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'beforeChangeRender',

  /**
   * Fired before drawing the borders.
   *
   * @event Hooks#beforeDrawBorders
   * @param {Array} corners Array specifying the current selection borders.
   * @param {string} borderClassName Specifies the border class name.
   */
  'beforeDrawBorders',

  /**
   * Fired before getting cell settings.
   *
   * @event Hooks#beforeGetCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties Object containing the cell's properties.
   */
  'beforeGetCellMeta',

  /**
   * Fired before cell meta is removed.
   *
   * @event Hooks#beforeRemoveCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key The removed meta key.
   * @param {*} value Value which is under removed key of cell meta.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeRemoveCellMeta',

  /**
   * Fired before the Handsontable instance is initiated.
   *
   * @event Hooks#beforeInit
   */
  'beforeInit',

  /**
   * Fired before the Walkontable instance is initiated.
   *
   * @event Hooks#beforeInitWalkontable
   * @param {object} walkontableConfig Walkontable configuration object.
   */
  'beforeInitWalkontable',

  /**
   * Fired before new data is loaded (by `loadData` or `updateSettings` method) into the data source array.
   *
   * @event Hooks#beforeLoadData
   * @since 8.0.0
   * @param {Array} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   * @param {string} source Source of the call.
   * @returns {Array} The returned array will be used as new dataset.
   */
  'beforeLoadData',

  /**
   * Fired before keydown event is handled. It can be used to overwrite default key bindings.
   *
   * __Note__: To prevent default behavior you need to call `event.stopImmediatePropagation()` in your `beforeKeyDown`
   * handler.
   *
   * @event Hooks#beforeKeyDown
   * @param {Event} event Original DOM event.
   */
  'beforeKeyDown',

  /**
   * Fired after the user clicked a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellMouseDown
   * @param {Event} event The `mousedown` event object.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {HTMLTableCellElement} TD TD element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  'beforeOnCellMouseDown',

  /**
   * Fired after the user clicked a cell.
   *
   * @event Hooks#beforeOnCellMouseUp
   * @param {Event} event The `mouseup` event object.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {HTMLTableCellElement} TD TD element.
   */
  'beforeOnCellMouseUp',

  /**
   * Fired after the user clicked a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellContextMenu
   * @since 4.1.0
   * @param {Event} event The `contextmenu` event object.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {HTMLTableCellElement} TD TD element.
   */
  'beforeOnCellContextMenu',

  /**
   * Fired after the user moved cursor over a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellMouseOver
   * @param {Event} event The `mouseover` event object.
   * @param {CellCoords} coords CellCoords object containing the visual coordinates of the clicked cell.
   * @param {HTMLTableCellElement} TD TD element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  'beforeOnCellMouseOver',

  /**
   * Fired after the user moved cursor out from a cell, but before all the calculations related with it.
   *
   * @event Hooks#beforeOnCellMouseOut
   * @param {Event} event The `mouseout` event object.
   * @param {CellCoords} coords CellCoords object containing the visual coordinates of the leaved cell.
   * @param {HTMLTableCellElement} TD TD element.
   */
  'beforeOnCellMouseOut',

  /**
   * Fired before one or more columns are about to be removed.
   *
   * @event Hooks#beforeRemoveCol
   * @param {number} index Visual index of starter column.
   * @param {number} amount Amount of columns to be removed.
   * @param {number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeRemoveCol',

  /**
   * Fired when one or more rows are about to be removed.
   *
   * @event Hooks#beforeRemoveRow
   * @param {number} index Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {number[]} physicalRows An array of physical rows removed from the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeRemoveRow',

  /**
   * Fired before Handsontable's view-rendering engine is rendered.
   *
   * __Note:__ In Handsontable 9.x and earlier, the `beforeViewRender` hook was named `beforeRender`.
   *
   * @event Hooks#beforeViewRender
   * @since 10.0.0
   * @param {boolean} isForced If set to `true`, the rendering gets triggered by a change of settings, a change of
   *                           data, or a logic that needs a full Handsontable render cycle.
   *                           If set to `false`, the rendering gets triggered by scrolling or moving the selection.
   * @param {object} skipRender Object with `skipRender` property, if it is set to `true ` the next rendering cycle will be skipped.
   */
  'beforeViewRender',

  /**
   * Fired after Handsontable's view-rendering engine is rendered,
   * but before redrawing the selection borders and before scroll syncing.
   *
   * __Note:__ In Handsontable 9.x and earlier, the `afterViewRender` hook was named `afterRender`.
   *
   * @event Hooks#afterViewRender
   * @since 10.0.0
   * @param {boolean} isForced If set to `true`, the rendering gets triggered by a change of settings, a change of
   *                           data, or a logic that needs a full Handsontable render cycle.
   *                           If set to `false`, the rendering gets triggered by scrolling or moving the selection.
   */
  'afterViewRender',

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Fired before Handsontable's view-rendering engine updates the view.
   *
   * The `beforeRender` event is fired right after the Handsontable
   * business logic is executed and right before the rendering engine starts calling
   * the Core logic, renderers, cell meta objects etc. to update the view.
   *
   * @event Hooks#beforeRender
   * @param {boolean} isForced If set to `true`, the rendering gets triggered by a change of settings, a change of
   *                           data, or a logic that needs a full Handsontable render cycle.
   *                           If set to `false`, the rendering gets triggered by scrolling or moving the selection.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  'beforeRender',

  /**
   * Fired after Handsontable's view-rendering engine updates the view.
   *
   * @event Hooks#afterRender
   * @param {boolean} isForced If set to `true`, the rendering gets triggered by a change of settings, a change of
   *                           data, or a logic that needs a full Handsontable render cycle.
   *                           If set to `false`, the rendering gets triggered by scrolling or moving the selection.
   */
  'afterRender',

  /**
   * Fired before cell meta is changed.
   *
   * @event Hooks#beforeSetCellMeta
   * @since 8.0.0
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key The updated meta key.
   * @param {*} value The updated meta value.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeSetCellMeta',

  /**
   * Fired before setting range is started but not finished yet.
   *
   * @event Hooks#beforeSetRangeStartOnly
   * @param {CellCoords} coords CellCoords instance.
   */
  'beforeSetRangeStartOnly',

  /**
   * Fired before setting range is started.
   *
   * @event Hooks#beforeSetRangeStart
   * @param {CellCoords} coords CellCoords instance.
   */
  'beforeSetRangeStart',

  /**
   * Fired before setting range is ended.
   *
   * @event Hooks#beforeSetRangeEnd
   * @param {CellCoords} coords CellCoords instance.
   */
  'beforeSetRangeEnd',

  /**
   * Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.
   *
   * @event Hooks#beforeTouchScroll
   */
  'beforeTouchScroll',

  /**
   * Fired before cell validation, only if validator function is defined. This can be used to manipulate the value
   * of changed cell before it is applied to the validator function.
   *
   * __Note:__ this will not affect values of changes. This will change value *ONLY* for validation.
   *
   * @event Hooks#beforeValidate
   * @param {*} value Value of the cell.
   * @param {number} row Visual row index.
   * @param {string|number} prop Property name / column index.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   */
  'beforeValidate',

  /**
   * Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
   * value which is passed to the renderer without modifying the renderer itself.
   *
   * @event Hooks#beforeValueRender
   * @param {*} value Cell value to render.
   * @param {object} cellProperties An object containing the cell properties.
   */
  'beforeValueRender',

  /**
   * Fired after Handsontable instance is constructed (using `new` operator).
   *
   * @event Hooks#construct
   */
  'construct',

  /**
   * Fired after Handsontable instance is initiated but before table is rendered.
   *
   * @event Hooks#init
   */
  'init',

  /**
   * Fired when a column header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyColHeader
   * @param {number} column Visual column header index.
   */
  'modifyColHeader',

  /**
   * Fired when a column width is about to be modified by a callback function.
   *
   * @event Hooks#modifyColWidth
   * @param {number} width Current column width.
   * @param {number} column Visual column index.
   */
  'modifyColWidth',

  /**
   * Fired when a row header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeader
   * @param {number} row Visual row header index.
   */
  'modifyRowHeader',

  /**
   * Fired when a row height is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeight
   * @param {number} height Row height.
   * @param {number} row Visual row index.
   */
  'modifyRowHeight',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyData
   * @param {number} row Physical row height.
   * @param {number} column Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  'modifyData',

  /**
   * Fired when a data was retrieved or modified from the source data set.
   *
   * @event Hooks#modifySourceData
   * @since 8.0.0
   * @param {number} row Physical row index.
   * @param {number} column Physical column index.
   * @param {object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {string} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  'modifySourceData',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyRowData
   * @param {number} row Physical row index.
   */
  'modifyRowData',

  /**
   * Used to modify the cell coordinates when using the `getCell` method, opening editor, getting value from the editor
   * and saving values from the closed editor.
   *
   * @event Hooks#modifyGetCellCoords
   * @since 0.36.0
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} topmost If set to `true`, it returns the TD element from the topmost overlay. For example,
   *                          if the wanted cell is in the range of fixed rows, it will return a TD element
   *                          from the `top` overlay.
   */
  'modifyGetCellCoords',

  /**
   * Allows modify the visual row index that is used to retrieve the row header element (TH) before it's
   * highlighted (proper CSS class names are added). Modifying the visual row index allows building a custom
   * implementation of the nested headers feature or other features that require highlighting other DOM
   * elements than that the rendering engine, by default, would have highlighted.
   *
   * @event Hooks#beforeHighlightingRowHeader
   * @since 8.4.0
   * @param {number} row Visual row index.
   * @param {number} headerLevel Column header level (0 = most distant to the table).
   * @param {object} highlightMeta An object that contains additional information about processed selection.
   * @returns {number|undefined}
   */
  'beforeHighlightingRowHeader',

  /**
   * Allows modify the visual column index that is used to retrieve the column header element (TH) before it's
   * highlighted (proper CSS class names are added). Modifying the visual column index allows building a custom
   * implementation of the nested headers feature or other features that require highlighting other DOM
   * elements than that the rendering engine, by default, would have highlighted.
   *
   * @event Hooks#beforeHighlightingColumnHeader
   * @since 8.4.0
   * @param {number} column Visual column index.
   * @param {number} headerLevel Row header level (0 = most distant to the table).
   * @param {object} highlightMeta An object that contains additional information about processed selection.
   * @returns {number|undefined}
   */
  'beforeHighlightingColumnHeader',

  /**
   * Fired by {@link PersistentState} plugin, after loading value, saved under given key, from browser local storage. This hook is fired when
   * {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateLoad
   * @param {string} key Key.
   * @param {object} valuePlaceholder Object containing the loaded value under `valuePlaceholder.value` (if no value have been saved, `value` key will be undefined).
   */
  'persistentStateLoad',

  /**
   * Fired by {@link PersistentState} plugin after resetting data from local storage. If no key is given, all values associated with table will be cleared.
   * This hook is fired when {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateReset
   * @param {string} [key] Key.
   */
  'persistentStateReset',

  /**
   * Fired by {@link PersistentState} plugin, after saving value under given key in browser local storage. This hook is fired when
   * {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateSave
   * @param {string} key Key.
   * @param {Mixed} value Value to save.
   */
  'persistentStateSave',

  /**
   * Fired by {@link ColumnSorting} and {@link MultiColumnSorting} plugins before sorting the column. If you return `false` value inside callback for hook, then sorting
   * will be not applied by the Handsontable (useful for server-side sorting).
   *
   * This hook is fired when {@link Options#columnSorting} or {@link Options#multiColumnSorting} option is enabled.
   *
   * @event Hooks#beforeColumnSort
   * @param {Array} currentSortConfig Current sort configuration (for all sorted columns).
   * @param {Array} destinationSortConfigs Destination sort configuration (for all sorted columns).
   * @returns {boolean | void} If `false` the column will not be sorted, `true` otherwise.
   */
  'beforeColumnSort',

  /**
   * Fired by {@link ColumnSorting} and {@link MultiColumnSorting} plugins after sorting the column. This hook is fired when {@link Options#columnSorting}
   * or {@link Options#multiColumnSorting} option is enabled.
   *
   * @event Hooks#afterColumnSort
   * @param {Array} currentSortConfig Current sort configuration (for all sorted columns).
   * @param {Array} destinationSortConfigs Destination sort configuration (for all sorted columns).
   */
  'afterColumnSort',

  /**
   * Fired by {@link Autofill} plugin after setting range of autofill. This hook is fired when {@link Options#fillHandle}
   * option is enabled.
   *
   * @event Hooks#modifyAutofillRange
   * @param {Array} startArea Array of visual coordinates of the starting point for the drag-down operation (`[startRow, startColumn, endRow, endColumn]`).
   * @param {Array} entireArea Array of visual coordinates of the entire area of the drag-down operation (`[startRow, startColumn, endRow, endColumn]`).
   */
  'modifyAutofillRange',

  /**
   * Fired to allow modifying the copyable range with a callback function.
   *
   * @event Hooks#modifyCopyableRange
   * @param {Array[]} copyableRanges Array of objects defining copyable cells.
   */
  'modifyCopyableRange',

  /**
   * Fired by {@link CopyPaste} plugin before copying the values into clipboard and before clearing values of
   * the selected cells. This hook is fired when {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#beforeCut
   * @param {Array[]} data An array of arrays which contains data to cut.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       which will be cut out.
   * @returns {*} If returns `false` then operation of the cutting out is canceled.
   * @example
   * ```js
   * // To disregard a single row, remove it from the array using data.splice(i, 1).
   * new Handsontable(element, {
   *   beforeCut: function(data, coords) {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }
   * });
   * // To cancel a cutting action, just return `false`.
   * new Handsontable(element, {
   *   beforeCut: function(data, coords) {
   *     return false;
   *   }
   * });
   * ```
   */
  'beforeCut',

  /**
   * Fired by {@link CopyPaste} plugin after data was cut out from the table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterCut
   * @param {Array[]} data An array of arrays which contains the cutted out data.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       which was cut out.
   */
  'afterCut',

  /**
   * Fired before values are copied into clipboard.
   *
   * @event Hooks#beforeCopy
   * @param {Array[]} data An array of arrays which contains data to copied.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                         which will copied.
   * @returns {*} If returns `false` then copying is canceled.
   *
   * @example
   * ```js
   * // To disregard a single row, remove it from array using data.splice(i, 1).
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeCopy: (data, coords) => {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }
   * });
   * ...
   *
   * // To cancel copying, return false from the callback.
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeCopy: (data, coords) => {
   *     return false;
   *   }
   * });
   * ...
   * ```
   */
  'beforeCopy',

  /**
   * Fired by {@link CopyPaste} plugin after data are pasted into table. This hook is fired when {@link Options#copyPaste}
   * option is enabled.
   *
   * @event Hooks#afterCopy
   * @param {Array[]} data An array of arrays which contains the copied data.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                         which was copied.
   */
  'afterCopy',

  /**
   * Fired by {@link CopyPaste} plugin before values are pasted into table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#beforePaste
   * @param {Array[]} data An array of arrays which contains data to paste.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       that correspond to the previously selected area.
   * @returns {*} If returns `false` then pasting is canceled.
   * @example
   * ```js
   * // To disregard a single row, remove it from array using data.splice(i, 1).
   * new Handsontable(example, {
   *   beforePaste: (data, coords) => {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }
   * });
   * // To cancel pasting, return false from the callback.
   * new Handsontable(example, {
   *   beforePaste: (data, coords) => {
   *     return false;
   *   }
   * });
   * ```
   */
  'beforePaste',

  /**
   * Fired by {@link CopyPaste} plugin after values are pasted into table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterPaste
   * @param {Array[]} data An array of arrays which contains the pasted data.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       that correspond to the previously selected area.
   */
  'afterPaste',

  /**
   * Fired by {@link ManualColumnMove} plugin before change order of the visual indexes. This hook is fired when
   * {@link Options#manualColumnMove} option is enabled.
   *
   * @event Hooks#beforeColumnMove
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/columns/column-moving.md).
   * @param {number|undefined} dropIndex Visual column index, being a drop index for the moved columns.
   *                                     Points to where we are going to drop the moved elements. To check
   *                                     visualization of drop index please take a look at
   *                                     [documentation](@/guides/columns/column-moving.md).
   *                                     It's `undefined` when `dragColumns` function wasn't called.
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @returns {void | boolean} If `false` the column will not be moved, `true` otherwise.
   */
  'beforeColumnMove',

  /**
   * Fired by {@link ManualColumnMove} plugin after changing order of the visual indexes.
   * This hook is fired when {@link Options#manualColumnMove} option is enabled.
   *
   * @event Hooks#afterColumnMove
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/columns/column-moving.md).
   * @param {number|undefined} dropIndex Visual column index, being a drop index for the moved columns.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/columns/column-moving.md).
   *                                     It's `undefined` when `dragColumns` function wasn't called.
   * @param {boolean} movePossible Indicates if it was possible to move columns to the desired position.
   * @param {boolean} orderChanged Indicates if order of columns was changed by move.
   */
  'afterColumnMove',

  /**
   * Fired by {@link ManualRowMove} plugin before changing the order of the visual indexes. This hook is fired when
   * {@link Options#manualRowMove} option is enabled.
   *
   * @event Hooks#beforeRowMove
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/rows/row-moving.md).
   * @param {number|undefined} dropIndex Visual row index, being a drop index for the moved rows.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/rows/row-moving.md).
   *                                     It's `undefined` when `dragRows` function wasn't called.
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeRowMove',

  /**
   * Fired by {@link ManualRowMove} plugin after changing the order of the visual indexes.
   * This hook is fired when {@link Options#manualRowMove} option is enabled.
   *
   * @event Hooks#afterRowMove
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/rows/row-moving.md).
   * @param {number|undefined} dropIndex Visual row index, being a drop index for the moved rows.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/rows/row-moving.md).
   *                                     It's `undefined` when `dragRows` function wasn't called.
   * @param {boolean} movePossible Indicates if it was possible to move rows to the desired position.
   * @param {boolean} orderChanged Indicates if order of rows was changed by move.
   */
  'afterRowMove',

  /**
   * Fired by {@link ManualColumnResize} plugin before rendering the table with modified column sizes. This hook is
   * fired when {@link Options#manualColumnResize} option is enabled.
   *
   * @event Hooks#beforeColumnResize
   * @param {number} newSize Calculated new column width.
   * @param {number} column Visual index of the resized column.
   * @param {boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {number} Returns a new column size or `undefined`, if column size should be calculated automatically.
   */
  'beforeColumnResize',

  /**
   * Fired by {@link ManualColumnResize} plugin after rendering the table with modified column sizes. This hook is
   * fired when {@link Options#manualColumnResize} option is enabled.
   *
   * @event Hooks#afterColumnResize
   * @param {number} newSize Calculated new column width.
   * @param {number} column Visual index of the resized column.
   * @param {boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  'afterColumnResize',

  /**
   * Fired by {@link ManualRowResize} plugin before rendering the table with modified row sizes. This hook is
   * fired when {@link Options#manualRowResize} option is enabled.
   *
   * @event Hooks#beforeRowResize
   * @param {number} newSize Calculated new row height.
   * @param {number} row Visual index of the resized row.
   * @param {boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {number} Returns the new row size or `undefined` if row size should be calculated automatically.
   */
  'beforeRowResize',

  /**
   * Fired by {@link ManualRowResize} plugin after rendering the table with modified row sizes. This hook is
   * fired when {@link Options#manualRowResize} option is enabled.
   *
   * @event Hooks#afterRowResize
   * @param {number} newSize Calculated new row height.
   * @param {number} row Visual index of the resized row.
   * @param {boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  'afterRowResize',

  /**
   * Fired after getting the column header renderers.
   *
   * @event Hooks#afterGetColumnHeaderRenderers
   * @param {Function[]} renderers An array of the column header renderers.
   */
  'afterGetColumnHeaderRenderers',

  /**
   * Fired after getting the row header renderers.
   *
   * @event Hooks#afterGetRowHeaderRenderers
   * @param {Function[]} renderers An array of the row header renderers.
   */
  'afterGetRowHeaderRenderers',

  /**
   * Fired before applying stretched column width to column.
   *
   * @event Hooks#beforeStretchingColumnWidth
   * @param {number} stretchedWidth Calculated width.
   * @param {number} column Visual column index.
   * @returns {number} Returns new width which will be applied to the column element.
   */
  'beforeStretchingColumnWidth',

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Fired by {@link Filters} plugin before applying [filtering](@/guides/columns/column-filter.md).
   * This hook is fired when {@link Options#filters} option is enabled.
   *
   * @event Hooks#beforeFilter
   * @param {object[]} conditionsStack An array of objects with added formulas.
   * ```js
   * // Example format of the conditionsStack argument:
   * [
   *   {
   *     column: 2,
   *     conditions: [
   *       {name: 'begins_with', args: [['S']]}
   *     ],
   *     operation: 'conjunction'
   *   },
   *   {
   *     column: 4,
   *     conditions: [
   *       {name: 'not_empty', args: []}
   *     ],
   *     operation: 'conjunction'
   *   },
   * ]
   * ```
   * @returns {boolean} If hook returns `false` value then filtering won't be applied on the UI side (server-side filtering).
   */
  'beforeFilter',

  /* eslint-enable jsdoc/require-description-complete-sentence */

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Fired by {@link Filters} plugin after applying [filtering](@/guides/columns/column-filter.md).
   * This hook is fired when {@link Options#filters} option is enabled.
   *
   * @event Hooks#afterFilter
   * @param {object[]} conditionsStack An array of objects with added conditions.
   * ```js
   * // Example format of the conditionsStack argument:
   * [
   *   {
   *     column: 2,
   *     conditions: [
   *       {name: 'begins_with', args: [['S']]}
   *     ],
   *     operation: 'conjunction'
   *   },
   *   {
   *     column: 4,
   *     conditions: [
   *       {name: 'not_empty', args: []}
   *     ],
   *     operation: 'conjunction'
   *   },
   * ]
   * ```
   */
  'afterFilter',
  /* eslint-enable jsdoc/require-description-complete-sentence */

  /**
   * Called when a value is updated in the engine.
   *
   * @since 9.0.0
   * @event Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The values and location of applied changes.
   */
  'afterFormulasValuesUpdate',

  /**
   * Called when a named expression is added to the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterNamedExpressionAdded
   * @param {string} namedExpressionName The name of the added expression.
   * @param {Array} changes The values and location of applied changes.
   */
  'afterNamedExpressionAdded',

  /**
   * Called when a named expression is removed from the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterNamedExpressionRemoved
   * @param {string} namedExpressionName The name of the removed expression.
   * @param {Array} changes The values and location of applied changes.
   */
  'afterNamedExpressionRemoved',

  /**
   * Called when a new sheet is added to the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterSheetAdded
   * @param {string} addedSheetDisplayName The name of the added sheet.
   */
  'afterSheetAdded',

  /**
   * Called when a sheet in the Formulas' engine instance is renamed.
   *
   * @since 9.0.0
   * @event Hooks#afterSheetRenamed
   * @param {string} oldDisplayName The old name of the sheet.
   * @param {string} newDisplayName The new name of the sheet.
   */
  'afterSheetRenamed',

  /**
   * Called when a sheet is removed from the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterSheetRemoved
   * @param {string} removedSheetDisplayName The removed sheet name.
   * @param {Array} changes The values and location of applied changes.
   */
  'afterSheetRemoved',

  /**
   * Fired while retrieving the column header height.
   *
   * @event Hooks#modifyColumnHeaderHeight
   */
  'modifyColumnHeaderHeight',

  /**
   * Fired by {@link UndoRedo} plugin before the undo action. Contains information about the action that is being undone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#beforeUndo
   * @param {object} action The action object. Contains information about the action being undone. The `actionType`
   *                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeUndo',

  /**
   * Fired by {@link UndoRedo} plugin before changing undo stack.
   *
   * @event Hooks#beforeUndoStackChange
   * @since 8.4.0
   * @param {Array} doneActions Stack of actions which may be undone.
   * @param {string} [source] String that identifies source of action
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*|boolean} If false is returned the action of changing undo stack is canceled.
   */
  'beforeUndoStackChange',

  /**
   * Fired by {@link UndoRedo} plugin after the undo action. Contains information about the action that is being undone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#afterUndo
   * @param {object} action The action object. Contains information about the action being undone. The `actionType`
   *                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'afterUndo',

  /**
   * Fired by {@link UndoRedo} plugin after changing undo stack.
   *
   * @event Hooks#afterUndoStackChange
   * @since 8.4.0
   * @param {Array} doneActionsBefore Stack of actions which could be undone before performing new action.
   * @param {Array} doneActionsAfter Stack of actions which can be undone after performing new action.
   */
  'afterUndoStackChange',

  /**
   * Fired by {@link UndoRedo} plugin before the redo action. Contains information about the action that is being redone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#beforeRedo
   * @param {object} action The action object. Contains information about the action being redone. The `actionType`
   *                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`).
   * @returns {*|boolean} If false is returned the action is canceled.
   */
  'beforeRedo',

  /**
   * Fired by {@link UndoRedo} plugin before changing redo stack.
   *
   * @event Hooks#beforeRedoStackChange
   * @since 8.4.0
   * @param {Array} undoneActions Stack of actions which may be redone.
   */
  'beforeRedoStackChange',

  /**
   * Fired by {@link UndoRedo} plugin after the redo action. Contains information about the action that is being redone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#afterRedo
   * @param {object} action The action object. Contains information about the action being redone. The `actionType`
   *                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`).
   */
  'afterRedo',

  /**
   * Fired by {@link UndoRedo} plugin after changing redo stack.
   *
   * @event Hooks#afterRedoStackChange
   * @since 8.4.0
   * @param {Array} undoneActionsBefore Stack of actions which could be redone before performing new action.
   * @param {Array} undoneActionsAfter Stack of actions which can be redone after performing new action.
   */
  'afterRedoStackChange',

  /**
   * Fired while retrieving the row header width.
   *
   * @event Hooks#modifyRowHeaderWidth
   * @param {number} rowHeaderWidth Row header width.
   */
  'modifyRowHeaderWidth',

  /**
   * Fired from the `populateFromArray` method during the `autofill` process. Fired for each "autofilled" cell individually.
   *
   * @deprecated
   * @event Hooks#beforeAutofillInsidePopulate
   * @param {object} index Object containing `row` and `col` properties, defining the number of rows/columns from the initial cell of the autofill.
   * @param {string} direction Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`.
   * @param {Array[]} input Contains an array of rows with data being used in the autofill.
   * @param {Array} deltas The deltas array passed to the `populateFromArray` method.
   */
  'beforeAutofillInsidePopulate',

  /**
   * Fired when the start of the selection is being modified (e.g. Moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformStart
   * @param {CellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformStart',

  /**
   * Fired when the end of the selection is being modified (e.g. Moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformEnd
   * @param {CellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformEnd',

  /**
   * Fired after the start of the selection is being modified (e.g. Moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformStart
   * @param {CellCoords} coords Coords of the freshly selected cell.
   * @param {number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformStart',

  /**
   * Fired after the end of the selection is being modified (e.g. Moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformEnd
   * @param {CellCoords} coords Visual coords of the freshly selected cell.
   * @param {number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformEnd',

  /**
   * Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.
   *
   * @event Hooks#afterViewportRowCalculatorOverride
   * @param {object} calc The row calculator.
   */
  'afterViewportRowCalculatorOverride',

  /**
   * Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.
   *
   * @event Hooks#afterViewportColumnCalculatorOverride
   * @param {object} calc The row calculator.
   */
  'afterViewportColumnCalculatorOverride',

  /**
   * Fired after initializing all the plugins.
   * This hook should be added before Handsontable is initialized.
   *
   * @event Hooks#afterPluginsInitialized
   *
   * @example
   * ```js
   * Handsontable.hooks.add('afterPluginsInitialized', myCallback);
   * ```
   */
  'afterPluginsInitialized',

  /**
   * Fired by {@link HiddenRows} plugin before marking the rows as hidden. Fired only if the {@link Options#hiddenRows} option is enabled.
   * Returning `false` in the callback will prevent the hiding action from completing.
   *
   * @event Hooks#beforeHideRows
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical row indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical row indexes.
   * @param {boolean} actionPossible `true`, if provided row indexes are valid, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the hiding action will not be completed.
   */
  'beforeHideRows',

  /**
   * Fired by {@link HiddenRows} plugin after marking the rows as hidden. Fired only if the {@link Options#hiddenRows} option is enabled.
   *
   * @event Hooks#afterHideRows
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical row indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical row indexes.
   * @param {boolean} actionPossible `true`, if provided row indexes are valid, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any non-hidden rows, `false` otherwise.
   */
  'afterHideRows',

  /**
   * Fired by {@link HiddenRows} plugin before marking the rows as not hidden. Fired only if the {@link Options#hiddenRows} option is enabled.
   * Returning `false` in the callback will prevent the row revealing action from completing.
   *
   * @event Hooks#beforeUnhideRows
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical row indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical row indexes.
   * @param {boolean} actionPossible `true`, if provided row indexes are valid, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the revealing action will not be completed.
   */
  'beforeUnhideRows',

  /**
   * Fired by {@link HiddenRows} plugin after marking the rows as not hidden. Fired only if the {@link Options#hiddenRows} option is enabled.
   *
   * @event Hooks#afterUnhideRows
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical row indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical row indexes.
   * @param {boolean} actionPossible `true`, if provided row indexes are valid, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any hidden rows, `false` otherwise.
   */
  'afterUnhideRows',

  /**
   * Fired by {@link HiddenColumns} plugin before marking the columns as hidden. Fired only if the {@link Options#hiddenColumns} option is enabled.
   * Returning `false` in the callback will prevent the hiding action from completing.
   *
   * @event Hooks#beforeHideColumns
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical column indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical column indexes.
   * @param {boolean} actionPossible `true`, if the provided column indexes are valid, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the hiding action will not be completed.
   */
  'beforeHideColumns',

  /**
   * Fired by {@link HiddenColumns} plugin after marking the columns as hidden. Fired only if the {@link Options#hiddenColumns} option is enabled.
   *
   * @event Hooks#afterHideColumns
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical column indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical column indexes.
   * @param {boolean} actionPossible `true`, if the provided column indexes are valid, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any non-hidden columns, `false` otherwise.
   */
  'afterHideColumns',

  /**
   * Fired by {@link HiddenColumns} plugin before marking the columns as not hidden. Fired only if the {@link Options#hiddenColumns} option is enabled.
   * Returning `false` in the callback will prevent the column revealing action from completing.
   *
   * @event Hooks#beforeUnhideColumns
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical column indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical column indexes.
   * @param {boolean} actionPossible `true`, if the provided column indexes are valid, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the hiding action will not be completed.
   */
  'beforeUnhideColumns',

  /**
   * Fired by {@link HiddenColumns} plugin after marking the columns as not hidden. Fired only if the {@link Options#hiddenColumns} option is enabled.
   *
   * @event Hooks#afterUnhideColumns
   * @param {Array} currentHideConfig Current hide configuration - a list of hidden physical column indexes.
   * @param {Array} destinationHideConfig Destination hide configuration - a list of hidden physical column indexes.
   * @param {boolean} actionPossible `true`, if the provided column indexes are valid, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any hidden columns, `false` otherwise.
   */
  'afterUnhideColumns',

  /**
   * Fired by {@link TrimRows} plugin before trimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @event Hooks#beforeTrimRow
   * @param {Array} currentTrimConfig Current trim configuration - a list of trimmed physical row indexes.
   * @param {Array} destinationTrimConfig Destination trim configuration - a list of trimmed physical row indexes.
   * @param {boolean} actionPossible `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the trimming action will not be completed.
   */
  'beforeTrimRow',

  /**
   * Fired by {@link TrimRows} plugin after trimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @event Hooks#afterTrimRow
   * @param {Array} currentTrimConfig Current trim configuration - a list of trimmed physical row indexes.
   * @param {Array} destinationTrimConfig Destination trim configuration - a list of trimmed physical row indexes.
   * @param {boolean} actionPossible `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any non-trimmed rows, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the trimming action will not be completed.
   */
  'afterTrimRow',

  /**
   * Fired by {@link TrimRows} plugin before untrimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @event Hooks#beforeUntrimRow
   * @param {Array} currentTrimConfig Current trim configuration - a list of trimmed physical row indexes.
   * @param {Array} destinationTrimConfig Destination trim configuration - a list of trimmed physical row indexes.
   * @param {boolean} actionPossible `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the untrimming action will not be completed.
   */
  'beforeUntrimRow',

  /**
   * Fired by {@link TrimRows} plugin after untrimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @event Hooks#afterUntrimRow
   * @param {Array} currentTrimConfig Current trim configuration - a list of trimmed physical row indexes.
   * @param {Array} destinationTrimConfig Destination trim configuration - a list of trimmed physical row indexes.
   * @param {boolean} actionPossible `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise.
   * @param {boolean} stateChanged `true`, if the action affected any trimmed rows, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the untrimming action will not be completed.
   */
  'afterUntrimRow',

  /**
   * Fired by {@link DropdownMenu} plugin before opening the dropdown menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @event Hooks#beforeDropdownMenuShow
   * @param {DropdownMenu} dropdownMenu The DropdownMenu instance.
   */
  'beforeDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after opening the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @event Hooks#afterDropdownMenuShow
   * @param {DropdownMenu} dropdownMenu The DropdownMenu instance.
   */
  'afterDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after hiding the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @event Hooks#afterDropdownMenuHide
   * @param {DropdownMenu} instance The DropdownMenu instance.
   */
  'afterDropdownMenuHide',

  /**
   * Fired by {@link NestedRows} plugin before adding a children to the NestedRows structure. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @event Hooks#beforeAddChild
   * @param {object} parent The parent object.
   * @param {object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'beforeAddChild',

  /**
   * Fired by {@link NestedRows} plugin after adding a children to the NestedRows structure. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @event Hooks#afterAddChild
   * @param {object} parent The parent object.
   * @param {object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'afterAddChild',

  /**
   * Fired by {@link NestedRows} plugin before detaching a child from its parent. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @event Hooks#beforeDetachChild
   * @param {object} parent An object representing the parent from which the element is to be detached.
   * @param {object} element The detached element.
   */
  'beforeDetachChild',

  /**
   * Fired by {@link NestedRows} plugin after detaching a child from its parent. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @event Hooks#afterDetachChild
   * @param {object} parent An object representing the parent from which the element was detached.
   * @param {object} element The detached element.
   * @param {number} finalElementPosition The final row index of the detached element.
   */
  'afterDetachChild',

  /**
   * Fired after the editor is opened and rendered.
   *
   * @event Hooks#afterBeginEditing
   * @param {number} row Visual row index of the edited cell.
   * @param {number} column Visual column index of the edited cell.
   */
  'afterBeginEditing',

  /**
   * Fired by {@link MergeCells} plugin before cell merging. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#beforeMergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'beforeMergeCells',

  /**
   * Fired by {@link MergeCells} plugin after cell merging. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#afterMergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {object} mergeParent The parent collection of the provided cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'afterMergeCells',

  /**
   * Fired by {@link MergeCells} plugin before unmerging the cells. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#beforeUnmergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'beforeUnmergeCells',

  /**
   * Fired by {@link MergeCells} plugin after unmerging the cells. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#afterUnmergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'afterUnmergeCells',

  /**
   * Fired after the table was switched into listening mode. This allows Handsontable to capture keyboard events and
   * respond in the right way.
   *
   * @event Hooks#afterListen
   */
  'afterListen',

  /**
   * Fired after the table was switched off from the listening mode. This makes the Handsontable inert for any
   * keyboard events.
   *
   * @event Hooks#afterUnlisten
   */
  'afterUnlisten',

  /**
   * Fired after the window was resized.
   *
   * @event Hooks#afterRefreshDimensions
   * @param {object} previousDimensions Previous dimensions of the container.
   * @param {object} currentDimensions Current dimensions of the container.
   * @param {boolean} stateChanged `true`, if the container was re-render, `false` otherwise.
   */
  'afterRefreshDimensions',

  /**
   * Cancellable hook, called after resizing a window, but before redrawing a table.
   *
   * @event Hooks#beforeRefreshDimensions
   * @param {object} previousDimensions Previous dimensions of the container.
   * @param {object} currentDimensions Current dimensions of the container.
   * @param {boolean} actionPossible `true`, if current and previous dimensions are different, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the refresh action will not be completed.
   */
  'beforeRefreshDimensions',

  /**
   * Fired by {@link CollapsibleColumns} plugin before columns collapse. This hook is fired when {@link Options#collapsibleColumns} option is enabled.
   *
   * @event Hooks#beforeColumnCollapse
   * @since 8.0.0
   * @param {Array} currentCollapsedColumns Current collapsible configuration - a list of collapsible physical column indexes.
   * @param {Array} destinationCollapsedColumns Destination collapsible configuration - a list of collapsible physical column indexes.
   * @param {boolean} collapsePossible `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the collapsing action will not be completed.
   */
  'beforeColumnCollapse',

  /**
   * Fired by {@link CollapsibleColumns} plugin before columns collapse. This hook is fired when {@link Options#collapsibleColumns} option is enabled.
   *
   * @event Hooks#afterColumnCollapse
   * @since 8.0.0
   * @param {Array} currentCollapsedColumns Current collapsible configuration - a list of collapsible physical column indexes.
   * @param {Array} destinationCollapsedColumns Destination collapsible configuration - a list of collapsible physical column indexes.
   * @param {boolean} collapsePossible `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise.
   * @param {boolean} successfullyCollapsed `true`, if the action affected any non-collapsible column, `false` otherwise.
   */
  'afterColumnCollapse',

  /**
   * Fired by {@link CollapsibleColumns} plugin before columns expand. This hook is fired when {@link Options#collapsibleColumns} option is enabled.
   *
   * @event Hooks#beforeColumnExpand
   * @since 8.0.0
   * @param {Array} currentCollapsedColumns Current collapsible configuration - a list of collapsible physical column indexes.
   * @param {Array} destinationCollapsedColumns Destination collapsible configuration - a list of collapsible physical column indexes.
   * @param {boolean} expandPossible `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise.
   * @returns {undefined|boolean} If the callback returns `false`, the expanding action will not be completed.
   */
  'beforeColumnExpand',

  /**
   * Fired by {@link CollapsibleColumns} plugin before columns expand. This hook is fired when {@link Options#collapsibleColumns} option is enabled.
   *
   * @event Hooks#afterColumnExpand
   * @since 8.0.0
   * @param {Array} currentCollapsedColumns Current collapsible configuration - a list of collapsible physical column indexes.
   * @param {Array} destinationCollapsedColumns Destination collapsible configuration - a list of collapsible physical column indexes.
   * @param {boolean} expandPossible `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise.
   * @param {boolean} successfullyExpanded `true`, if the action affected any non-collapsible column, `false` otherwise.
   */
  'afterColumnExpand',

  /**
   * Fired by {@link AutoColumnSize} plugin within SampleGenerator utility.
   *
   * @event Hooks#modifyAutoColumnSizeSeed
   * @since 8.4.0
   * @param {string|undefined} seed Seed ID, unique name to categorize samples.
   * @param {object} cellProperties Object containing the cell properties.
   * @param {*} cellValue Value of the cell.
   */
  'modifyAutoColumnSizeSeed',
];

/**
 * Template warning message for removed hooks.
 *
 * @type {string}
 */
const REMOVED_MESSAGE = toSingleLine`The plugin hook "[hookName]" was removed in Handsontable [removedInVersion].\x20
  Please consult release notes https://github.com/handsontable/handsontable/releases/tag/[removedInVersion] to\x20
  learn about the migration path.`;

/**
 * The list of the hooks which are removed from the API. The warning message is printed out in
 * the developer console when the hook is used.
 *
 * The Map key is represented by hook name and its value points to the Handsontable version
 * in which it was removed.
 *
 * @type {Map<string, string>}
 */
const REMOVED_HOOKS = new Map([
  ['modifyRow', '8.0.0'],
  ['modifyCol', '8.0.0'],
  ['unmodifyRow', '8.0.0'],
  ['unmodifyCol', '8.0.0'],
  ['skipLengthCache', '8.0.0'],
  ['hiddenColumn', '8.0.0'],
  ['hiddenRow', '8.0.0'],
]);

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The list of the hooks which are deprecated. The warning message is printed out in
 * the developer console when the hook is used.
 *
 * The Map key is represented by hook name and its value keeps message which whould be
 * printed out when the hook is used.
 *
 * Usage:
 * ```js
 * ...
 * New Map([
 *   ['beforeColumnExpand', 'The plugin hook "beforeColumnExpand" is deprecated. Use "beforeColumnExpand2" instead.'],
 * ])
 * ...
 * ```
 *
 *
 * @type {Map<string, string>}
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
const DEPRECATED_HOOKS = new Map([
  [
    'beforeAutofillInsidePopulate',
    'The plugin hook "beforeAutofillInsidePopulate" is deprecated and will be removed in the next major release.'
  ]
]);

class Hooks {
  static getSingleton() {
    return getGlobalSingleton();
  }

  /**
   *
   */
  constructor() {
    this.globalBucket = this.createEmptyBucket();
  }

  /**
   * Returns a new object with empty handlers related to every registered hook name.
   *
   * @returns {object} The empty bucket object.
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

    // eslint-disable-next-line no-return-assign
    arrayEach(REGISTERED_HOOKS, hook => (bucket[hook] = []));

    return bucket;
  }

  /**
   * Get hook bucket based on the context of the object or if argument is `undefined`, get the global hook bucket.
   *
   * @param {object} [context=null] A Handsontable instance.
   * @returns {object} Returns a global or Handsontable instance bucket.
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
   * @param {string} key Hook name.
   * @param {Function|Array} callback Callback function or an array of functions.
   * @param {object} [context=null] The context for the hook callback to be added - a Handsontable instance or leave empty.
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
      arrayEach(callback, c => this.add(key, c, context));

    } else {

      if (REMOVED_HOOKS.has(key)) {
        warn(substitute(REMOVED_MESSAGE, { hookName: key, removedInVersion: REMOVED_HOOKS.get(key) }));
      }
      if (DEPRECATED_HOOKS.has(key)) {
        warn(DEPRECATED_HOOKS.get(key));
      }

      const bucket = this.getBucket(context);

      if (typeof bucket[key] === 'undefined') {
        this.register(key);
        bucket[key] = [];
      }
      callback.skip = false;

      if (bucket[key].indexOf(callback) === -1) {
        // only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
        let foundInitialHook = false;

        if (callback.initialHook) {
          arrayEach(bucket[key], (cb, i) => {
            if (cb.initialHook) {
              bucket[key][i] = callback;
              foundInitialHook = true;

              return false;
            }
          });
        }

        if (!foundInitialHook) {
          bucket[key].push(callback);
        }
      }
    }

    return this;
  }

  /**
   * Adds a listener to a specified hook. After the hook runs this listener will be automatically removed from the bucket.
   *
   * @see Core#addHookOnce
   * @param {string} key Hook/Event name.
   * @param {Function|Array} callback Callback function.
   * @param {object} [context=null] A Handsontable instance.
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
   * ```
   */
  once(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.once(key, c, context));

    } else {
      callback.runOnce = true;
      this.add(key, callback, context);
    }
  }

  /**
   * Removes a listener from a hook with a given name. If the `context` argument is provided, it removes a listener from a local hook assigned to the given Handsontable instance.
   *
   * @see Core#removeHook
   * @param {string} key Hook/Event name.
   * @param {Function} callback Callback function (needs the be the function that was previously added to the hook).
   * @param {object} [context=null] Handsontable instance.
   * @returns {boolean} Returns `true` if hook was removed, `false` otherwise.
   *
   * @example
   * ```js
   * Handsontable.hooks.remove('beforeInit', myCallback);
   * ```
   */
  remove(key, callback, context = null) {
    const bucket = this.getBucket(context);

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
   * @param {string} key Hook name.
   * @param {object} [context=null] A Handsontable instance.
   * @returns {boolean} `true` for success, `false` otherwise.
   */
  has(key, context = null) {
    const bucket = this.getBucket(context);

    return !!(bucket[key] !== void 0 && bucket[key].length);
  }

  /**
   * Runs all local and global callbacks assigned to the hook identified by the `key` parameter.
   * It returns either a return value from the last called callback or the first parameter (`p1`) passed to the `run` function.
   *
   * @see Core#runHooks
   * @param {object} context Handsontable instance.
   * @param {string} key Hook/Event name.
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
      const length = globalHandlers ? globalHandlers.length : 0;
      let index = 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (index < length) {
          if (!globalHandlers[index] || globalHandlers[index].skip) {
            index += 1;
            /* eslint-disable no-continue */
            continue;
          }

          const res = fastCall(globalHandlers[index], context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            // eslint-disable-next-line no-param-reassign
            p1 = res;
          }
          if (globalHandlers[index] && globalHandlers[index].runOnce) {
            this.remove(key, globalHandlers[index]);
          }

          index += 1;
        }
      }
    }
    {
      const localHandlers = this.getBucket(context)[key];
      const length = localHandlers ? localHandlers.length : 0;
      let index = 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (index < length) {
          if (!localHandlers[index] || localHandlers[index].skip) {
            index += 1;
            /* eslint-disable no-continue */
            continue;
          }

          const res = fastCall(localHandlers[index], context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            // eslint-disable-next-line no-param-reassign
            p1 = res;
          }
          if (localHandlers[index] && localHandlers[index].runOnce) {
            this.remove(key, localHandlers[index], context);
          }

          index += 1;
        }
      }
    }

    return p1;
  }

  /**
   * Destroy all listeners connected to the context. If no context is provided, the global listeners will be destroyed.
   *
   * @param {object} [context=null] A Handsontable instance.
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
    // eslint-disable-next-line no-return-assign
    objectEach(this.getBucket(context), (value, key, bucket) => (bucket[key].length = 0));
  }

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins.
   * It is not necessary to call register, but if you use it, your plugin hook will be used returned by
   * the `getRegistered` method. (which itself is used in the [demo](@/guides/getting-started/events-and-hooks.md)).
   *
   * @param {string} key The hook name.
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
   * @param {string} key The hook name.
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
   * Returns a boolean value depending on if a hook by such name has been removed or deprecated.
   *
   * @param {string} hookName The hook name to check.
   * @returns {boolean} Returns `true` if the provided hook name was marked as deprecated or
   * removed from API, `false` otherwise.
   * @example
   * ```js
   * Handsontable.hooks.isDeprecated('skipLengthCache');
   *
   * // Results:
   * true
   * ```
   */
  isDeprecated(hookName) {
    return DEPRECATED_HOOKS.has(hookName) || REMOVED_HOOKS.has(hookName);
  }

  /**
   * Returns a boolean depending on if a hook by such name has been registered.
   *
   * @param {string} hookName The hook name to check.
   * @returns {boolean} `true` for success, `false` otherwise.
   * @example
   * ```js
   * Handsontable.hooks.isRegistered('beforeInit');
   *
   * // Results:
   * true
   * ```
   */
  isRegistered(hookName) {
    return REGISTERED_HOOKS.indexOf(hookName) >= 0;
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

const globalSingleton = new Hooks();

/**
 * @returns {Hooks}
 */
function getGlobalSingleton() {
  return globalSingleton;
}

export default Hooks;
