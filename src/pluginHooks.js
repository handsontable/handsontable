import { arrayEach } from './helpers/array';
import { objectEach } from './helpers/object';

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
   * value is entered using an editor or changed using API (e.q setDataAtCell)
   *
   * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
   *
   * @event Hooks#afterChange
   * @param {Array} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`.
   * @param {String} [source] String that identifies source of hook call ([list of all available sources]{@link https://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
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
   * Fired by {@link ObserveChanges} plugin after detecting changes in the data source. This hook is fired when
   * {@link Options#observeChanges} option is enabled.
   *
   * @event Hooks#afterChangesObserved
   */
  'afterChangesObserved',

  /**
   * Fired by {@link ContextMenu} after setting up the Context Menu's default options. These options are a collection
   * which user can select by setting an array of keys or an array of objects in {@link Options#contextMenu} option.
   *
   * @event Hooks#afterContextMenuDefaultOptions
   * @param {Array} predefinedItems An array of objects containing information about the pre-defined Context Menu items.
   */
  'afterContextMenuDefaultOptions',

  /**
   * Fired by {@link ContextMenu} plugin before setting up the Context Menu's items but after filtering these options by
   * user (`contextMenu` option). This hook can by helpful to determine if user use specified menu item or to set up
   * one of the menu item to by always visible.
   *
   * @event Hooks#beforeContextMenuSetItems
   * @param {Object[]} menuItems An array of objects containing information about to generated Context Menu items.
   */
  'beforeContextMenuSetItems',

  /**
   * Fired by {@link DropdownMenu} plugin after setting up the Dropdown Menu's default options. These options are a
   * collection which user can select by setting an array of keys or an array of objects in {@link Options#dropdownMenu}
   * option.
   *
   * @pro
   * @event Hooks#afterDropdownMenuDefaultOptions
   * @param {Object[]} predefinedItems An array of objects containing information about the pre-defined Context Menu items.
   */
  'afterDropdownMenuDefaultOptions',

  /**
   * Fired by {@link DropdownMenu} plugin before setting up the Dropdown Menu's items but after filtering these options
   * by user (`dropdownMenu` option). This hook can by helpful to determine if user use specified menu item or to set
   * up one of the menu item to by always visible.
   *
   * @pro
   * @event Hooks#beforeDropdownMenuSetItems
   * @param {Object[]} menuItems An array of objects containing information about to generated Dropdown Menu items.
   */
  'beforeDropdownMenuSetItems',

  /**
   * Fired by {@link ContextMenu} plugin after hiding the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#afterContextMenuHide
   * @param {Object} context The Context Menu plugin instance.
   */
  'afterContextMenuHide',

  /**
   * Fired by {@link ContextMenu} plugin before opening the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#beforeContextMenuShow
   * @param {Object} context The Context Menu instance.
   */
  'beforeContextMenuShow',

  /**
   * Fired by {@link ContextMenu} plugin after opening the Context Menu. This hook is fired when {@link Options#contextMenu}
   * option is enabled.
   *
   * @event Hooks#afterContextMenuShow
   * @param {Object} context The Context Menu plugin instance.
   */
  'afterContextMenuShow',

  /**
   * Fired by {@link CopyPaste} plugin after reaching the copy limit while copying data. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterCopyLimit
   * @param {Number} selectedRows Count of selected copyable rows.
   * @param {Number} selectedColumns Count of selected copyable columns.
   * @param {Number} copyRowsLimit Current copy rows limit.
   * @param {Number} copyColumnsLimit Current copy columns limit.
   */
  'afterCopyLimit',

  /**
   * Fired before created a new column.
   *
   * @event Hooks#beforeCreateCol
   * @param {Number} index Represents the visual index of first newly created column in the data source array.
   * @param {Number} amount Number of newly created columns in the data source array.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'beforeCreateCol',

  /**
   * Fired after created a new column.
   *
   * @event Hooks#afterCreateCol
   * @param {Number} index Represents the visual index of first newly created column in the data source.
   * @param {Number} amount Number of newly created columns in the data source.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterCreateCol',

  /**
   * Fired before created a new row.
   *
   * @event Hooks#beforeCreateRow
   * @param {Number} index Represents the visual index of first newly created row in the data source array.
   * @param {Number} amount Number of newly created rows in the data source array.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'beforeCreateRow',

  /**
   * Fired after created a new row.
   *
   * @event Hooks#afterCreateRow
   * @param {Number} index Represents the visual index of first newly created row in the data source array.
   * @param {Number} amount Number of newly created rows in the data source array.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
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
   * @param {Number} currentRow Row index of the currently processed cell.
   * @param {Number} currentColumn Column index of the currently cell.
   * @param {Number[]} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
   * @param {Number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @since 0.38.1
   * @returns {String|undefined} Can return a `String`, which will act as an additional `className` to be added to the currently processed cell.
   */
  'afterDrawSelection',

  /**
   * Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.
   *
   * @event Hooks#beforeRemoveCellClassNames
   * @since 0.38.1
   * @returns {String[]|undefined} Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
   */
  'beforeRemoveCellClassNames',

  /**
   * Fired after getting the cell settings.
   *
   * @event Hooks#afterGetCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Object} cellProperties Object containing the cell properties.
   */
  'afterGetCellMeta',

  /**
   * Fired after retrieving information about a column header and appending it to the table header.
   *
   * @event Hooks#afterGetColHeader
   * @param {Number} column Visual column index.
   * @param {HTMLTableCellElement} TH Header's TH element.
   */
  'afterGetColHeader',

  /**
   * Fired after retrieving information about a row header and appending it to the table header.
   *
   * @event Hooks#afterGetRowHeader
   * @param {Number} row Visual row index.
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
   * @param {Boolean} initialLoad flag that determines whether the data has been loaded during the initialization.
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
   * @param {Number} index Visual index of starter column.
   * @param {Number} amount An amount of removed columns.
   * @param {Number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {String} [source] String that identifies source of hook call ([list of all available sources]{@link https://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterRemoveCol',

  /**
   * Fired after one or more rows are removed.
   *
   * @event Hooks#afterRemoveRow
   * @param {Number} index Visual index of starter row.
   * @param {Number} amount An amount of removed rows.
   * @param {Number[]} physicalRows An array of physical rows removed from the data source.
   * @param {String} [source] String that identifies source of hook call ([list of all available sources]{@link https://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterRemoveRow',

  /**
   * Fired after the Handsontable table is rendered.
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
   * @param {HTMLTableCellElement} TD Currently rendered cell's TD element.
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String|Number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {*} value Value of the rendered cell.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  'beforeRenderer',

  /**
   * Fired after finishing rendering the cell (after the renderer finishes).
   *
   * @event Hooks#afterRenderer
   * @param {HTMLTableCellElement} TD Currently rendered cell's TD element.
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String|Number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {*} value Value of the rendered cell.
   * @param {Object} cellProperties Object containing the cell's properties.
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
   * Fired after one or more cells are selected (e.g. during mouse move).
   *
   * @event Hooks#afterSelection
   * @param {Number} row Selection start visual row index.
   * @param {Number} column Selection start visual column index.
   * @param {Number} row2 Selection end visual row index.
   * @param {Number} column2 Selection end visual column index.
   * @param {Object} preventScrolling Object with `value` property where its value change will be observed.
   * @param {Number} selectionLayerLevel The number which indicates what selection layer is currently modified.
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
   * @param {Number} row Selection start visual row index.
   * @param {String} prop Selection start data source object property name.
   * @param {Number} row2 Selection end visual row index.
   * @param {String} prop2 Selection end data source object property name.
   * @param {Object} preventScrolling Object with `value` property where its value change will be observed.
   * @param {Number} selectionLayerLevel The number which indicates what selection layer is currently modified.
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
   * Fired after one or more cells are selected (e.g. on mouse up).
   *
   * @event Hooks#afterSelectionEnd
   * @param {Number} row Selection start visual row index.
   * @param {Number} column Selection start visual column index.
   * @param {Number} row2 Selection end visual row index.
   * @param {Number} column2 Selection end visual column index.
   * @param {Number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   */
  'afterSelectionEnd',

  /**
   * Fired after one or more cells are selected (e.g. on mouse up).
   *
   * The `prop` and `prop2` arguments represent the source object property name instead of the column number.
   *
   * @event Hooks#afterSelectionEndByProp
   * @param {Number} row Selection start visual row index.
   * @param {String} prop Selection start data source object property index.
   * @param {Number} row2 Selection end visual row index.
   * @param {String} prop2 Selection end data source object property index.
   * @param {Number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   */
  'afterSelectionEndByProp',

  /**
   * Fired after cell meta is changed.
   *
   * @event Hooks#afterSetCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} key The updated meta key.
   * @param {*} value The updated meta value.
   */
  'afterSetCellMeta',

  /**
   * Fired after cell meta is removed.
   *
   * @event Hooks#afterRemoveCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} key The removed meta key.
   * @param {*} value Value which was under removed key of cell meta.
   */
  'afterRemoveCellMeta',

  /**
   * Fired after cell data was changed.
   *
   * @event Hooks#afterSetDataAtCell
   * @param {Array} changes An array of changes in format `[[row, column, oldValue, value], ...]`.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterSetDataAtCell',

  /**
   * Fired after cell data was changed.
   *
   * @event Hooks#afterSetDataAtRowProp
   * @param {Array} changes An array of changes in format `[[row, prop, oldValue, value], ...]`.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterSetDataAtRowProp',

  /**
   * Fired after calling the `updateSettings` method.
   *
   * @event Hooks#afterUpdateSettings
   * @param {Object} newSettings New settings object.
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
   * @param {Boolean} isValid `true` if valid, `false` if not.
   * @param {*} value The value in question.
   * @param {Number} row Visual row index.
   * @param {String|Number} prop Property name / visual column index.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'afterValidate',

  /**
   * Fired before successful change of language (when proper language code was set)
   *
   * @event Hooks#beforeLanguageChange
   * @since 0.35.0
   * @param {String} languageCode New language code.
   */
  'beforeLanguageChange',

  /**
   * Fired after successful change of language (when proper language code was set).
   *
   * @event Hooks#afterLanguageChange
   * @since 0.35.0
   * @param {String} languageCode New language code.
   */
  'afterLanguageChange',

  /**
   * Fired by {@link Autofill} plugin before populating the data in the autofill feature. This hook is fired when
   * {@link Options#fillHandle} option is enabled.
   *
   * @event Hooks#beforeAutofill
   * @param {CellCoords} start Object containing information about first filled cell: `{row: 2, col: 0}`.
   * @param {CellCoords} end Object containing information about last filled cell: `{row: 4, col: 1}`.
   * @param {Array[]} data 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`.
   */
  'beforeAutofill',

  /**
   * Fired before aligning the cell contents.
   *
   * @event Hooks#beforeCellAlignment
   * @param {Object} stateBefore An object with class names defining the cell alignment.
   * @param {CellRange[]} range An array of CellRange coordinates where the alignment will be applied.
   * @param {String} type Type of the alignment - either `horizontal` or `vertical`.
   * @param {String} alignmentClass String defining the alignment class added to the cell.
   * Possible values:
   * * `htLeft`
   * * `htCenter`
   * * `htRight`
   * * `htJustify`
   * * `htTop`
   * * `htMiddle`
   * * `htBottom`
   */
  'beforeCellAlignment',

  /**
   * Fired before one or more cells is changed. Its main purpose is to alter changes silently after input and before
   * table rendering.
   *
   * @event Hooks#beforeChange
   * @param {Array[]} changes 2D array containing information about each of the edited cells.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
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
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
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
   * Fired before getting cell settings.
   *
   * @event Hooks#beforeGetCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  'beforeGetCellMeta',

  /**
   * Fired before cell meta is removed.
   *
   * @event Hooks#beforeRemoveCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} key The removed meta key.
   * @param {*} value Value which is under removed key of cell meta.
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
   * @param {Object} walkontableConfig Walkontable configuration object.
   */
  'beforeInitWalkontable',

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
   * @param {Object} controller An object with keys `row`, `column` and `cells` which contains boolean values. This
   *                            object allows or disallows changing the selection for the particular axies.
   */
  'beforeOnCellMouseDown',

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
   * @param {Object} controller An object with keys `row`, `column` and `cells` which contains boolean values. This
   *                            object allows or disallows changing the selection for the particular axies.
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
   * @param {Number} index Visual index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   * @param {Number[]} physicalColumns An array of physical columns removed from the data source.
   * @param {String} [source] String that identifies source of hook call ([list of all available sources]{@link https://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'beforeRemoveCol',

  /**
   * Fired when one or more rows are about to be removed.
   *
   * @event Hooks#beforeRemoveRow
   * @param {Number} index Visual index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   * @param {Number[]} physicalRows An array of physical rows removed from the data source.
   * @param {String} [source] String that identifies source of hook call ([list of all available sources]{@link https://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'beforeRemoveRow',

  /**
   * Fired before the Handsontable table is rendered.
   *
   * @event Hooks#beforeRender
   * @param {Boolean} isForced If `true` rendering was triggered by a change of settings or data; or `false` if
   *                           rendering was triggered by scrolling or moving selection.
   */
  'beforeRender',

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
   * __Note:__ this will not affect values of changes. This will change value *ONLY* for validation
   *
   * @event Hooks#beforeValidate
   * @param {*} value Value of the cell.
   * @param {Number} row Visual row index.
   * @param {String|Number} prop Property name / column index.
   * @param {String} [source] String that identifies source of hook call
   *                          ([list of all available sources]{@link http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition}).
   */
  'beforeValidate',

  /**
   * Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
   * value which is passed to the renderer without modifying the renderer itself.
   *
   * @event Hooks#beforeValueRender
   * @param {*} value Cell value to render.
   * @param {Object} cellProperties An object containing the cell properties.
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
   * Fired when a column index is about to be modified by a callback function.
   *
   * @event Hooks#modifyCol
   * @param {Number} column Visual column index.
   */
  'modifyCol',

  /**
   * Fired when a column index is about to be de-modified by a callback function.
   *
   * @event Hooks#unmodifyCol
   * @param {Number} column Physical column index.
   */
  'unmodifyCol',

  /**
   * Fired when a physical row index is about to be de-modified by a callback function.
   *
   * @event Hooks#unmodifyRow
   * @param {Number} row Physical row index.
   */
  'unmodifyRow',

  /**
   * Fired when a column header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyColHeader
   * @param {Number} column Visual column header index.
   */
  'modifyColHeader',

  /**
   * Fired when a column width is about to be modified by a callback function.
   *
   * @event Hooks#modifyColWidth
   * @param {Number} width Current column width.
   * @param {Number} column Visual column index.
   */
  'modifyColWidth',

  /**
   * Fired when a row index is about to be modified by a callback function.
   *
   * @event Hooks#modifyRow
   * @param {Number} row Visual row index.
   */
  'modifyRow',

  /**
   * Fired when a row header index is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeader
   * @param {Number} row Visual row header index.
   */
  'modifyRowHeader',

  /**
   * Fired when a row height is about to be modified by a callback function.
   *
   * @event Hooks#modifyRowHeight
   * @param {Number} height Row height.
   * @param {Number} row Visual row index.
   */
  'modifyRowHeight',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyData
   * @param {Number} row Row height.
   * @param {Number} column Column index.
   * @param {Object} valueHolder Object which contains original value which can be modified by overwriting `.value` property.
   * @param {String} ioMode String which indicates for what operation hook is fired (`get` or `set`).
   */
  'modifyData',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyRowData
   * @param {Number} row Physical row index.
   */
  'modifyRowData',

  /**
   * Used to modify the cell coordinates when using the `getCell` method.
   *
   * @event Hooks#modifyGetCellCoords
   * @since 0.36.0
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Boolean} topmost If set to `true`, it returns the TD element from the topmost overlay. For example,
   *                          if the wanted cell is in the range of fixed rows, it will return a TD element
   *                          from the `top` overlay.
   */
  'modifyGetCellCoords',

  /**
   * Fired by {@link PersistentState} plugin, after loading value, saved under given key, from browser local storage. This hook is fired when
   * {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateLoad
   * @param {String} key Key.
   * @param {Object} valuePlaceholder Object containing the loaded value under `valuePlaceholder.value` (if no value have been saved, `value` key will be undefined).
   */
  'persistentStateLoad',

  /**
   * Fired by {@link PersistentState} plugin after resetting data from local storage. If no key is given, all values associated with table will be cleared.
   * This hook is fired when {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateReset
   * @param {String} [key] Key.
   */
  'persistentStateReset',

  /**
   * Fired by {@link PersistentState} plugin, after saving value under given key in browser local storage. This hook is fired when
   * {@link Options#persistentState} option is enabled.
   *
   * @event Hooks#persistentStateSave
   * @param {String} key Key.
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
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
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
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       which was cut out.
   */
  'afterCut',

  /**
   * Fired before values are copied into clipboard.
   *
   * @event Hooks#beforeCopy
   * @param {Array[]} data An array of arrays which contains data to copied.
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
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
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                         which was copied.
   */
  'afterCopy',

  /**
   * Fired by {@link CopyPaste} plugin before values are pasted into table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#beforePaste
   * @param {Array[]} data An array of arrays which contains data to paste.
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
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
   * @param {Object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       that correspond to the previously selected area.
   */
  'afterPaste',

  /**
   * Fired by {@link ManualColumnMove} plugin before change order of the visual indexes. This hook is fired when
   * {@link Options#manualColumnMove} option is enabled.
   *
   * @event Hooks#beforeColumnMove
   * @param {Number[]} columns Array of visual column indexes to be moved.
   * @param {Number} target Visual column index being a target for moved columns.
   */
  'beforeColumnMove',

  /**
   * Fired by {@link ManualColumnMove} plugin after changing order of the visual indexes. This hook is fired when
   * {@link Options#manualColumnMove} option is enabled.
   *
   * @event Hooks#afterColumnMove
   * @param {Number[]} columns Array of visual column indexes that were moved.
   * @param {Number} target Visual column index being a target for moved columns.
   */
  'afterColumnMove',

  /**
   * Fired by {@link ManualRowMove} plugin before change order of the visual indexes. This hook is fired when
   * {@link Options#manualRowMove} option is enabled.
   *
   * @event Hooks#beforeRowMove
   * @param {Number[]} rows An array of visual row indexes to be moved.
   * @param {Number} target Visual row index being a target for moved rows.
   */
  'beforeRowMove',

  /**
   * Fired by {@link ManualRowMove} plugin after change order of the visual indexes. This hook is fired when
   * {@link Options#manualRowMove} option is enabled.
   *
   * @event Hooks#afterRowMove
   * @param {Number[]} rows An array of visual row indexes that were moved.
   * @param {Number} target Visual row index being a target for moved rows.
   */
  'afterRowMove',

  /**
   * Fired by {@link ManualColumnResize} plugin before rendering the table with modified column sizes. This hook is
   * fired when {@link Options#manualColumnResize} option is enabled.
   *
   * @event Hooks#beforeColumnResize
   * @param {Number} currentColumn Visual index of the resized column.
   * @param {Number} newSize Calculated new column width.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {Number} Returns a new column size or `undefined`, if column size should be calculated automatically.
   */
  'beforeColumnResize',

  /**
   * Fired by {@link ManualColumnResize} plugin after rendering the table with modified column sizes. This hook is
   * fired when {@link Options#manualColumnResize} option is enabled.
   *
   * @event Hooks#afterColumnResize
   * @param {Number} currentColumn Visual index of the resized column.
   * @param {Number} newSize Calculated new column width.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  'afterColumnResize',

  /**
   * Fired by {@link ManualRowResize} plugin before rendering the table with modified row sizes. This hook is
   * fired when {@link Options#manualRowResize} option is enabled.
   *
   * @event Hooks#beforeRowResize
   * @param {Number} currentRow Visual index of the resized row.
   * @param {Number} newSize Calculated new row height.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   * @returns {Number} Returns the new row size or `undefined` if row size should be calculated automatically.
   */
  'beforeRowResize',

  /**
   * Fired by {@link ManualRowResize} plugin after rendering the table with modified row sizes. This hook is
   * fired when {@link Options#manualRowResize} option is enabled.
   *
   * @event Hooks#afterRowResize
   * @param {Number} currentRow Visual index of the resized row.
   * @param {Number} newSize Calculated new row height.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
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
   * @param {Number} stretchedWidth Calculated width.
   * @param {Number} column Visual column index.
   * @returns {Number} Returns new width which will be applied to the column element.
   */
  'beforeStretchingColumnWidth',

  /**
   * Fired by {@link Filters} plugin before applying [filtering]{@link http://docs.handsontable.com/pro/demo-filtering.html}. This hook is fired when
   * {@link Options#filters} option is enabled.
   *
   * @pro
   * @event Hooks#beforeFilter
   * @param {Object[]} conditionsStack An array of objects with added formulas.
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
   * @returns {Boolean} If hook returns `false` value then filtering won't be applied on the UI side (server-side filtering).
   */
  'beforeFilter',

  /**
   * Fired by {@link Filters} plugin after applying [filtering]{@link http://docs.handsontable.com/pro/demo-filtering.html}. This hook is fired when
   * {@link Options#filters} option is enabled.
   *
   * @pro
   * @event Hooks#afterFilter
   * @param {Object[]} conditionsStack An array of objects with added conditions.
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
   * @param {Object} action The action object. Contains information about the action being undone. The `actionType`
   *                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'beforeUndo',

  /**
   * Fired by {@link UndoRedo} plugin after the undo action. Contains information about the action that is being undone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#afterUndo
   * @param {Object} action The action object. Contains information about the action being undone. The `actionType`
   *                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`).
   */
  'afterUndo',

  /**
   * Fired by {@link UndoRedo} plugin before the redo action. Contains information about the action that is being redone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#beforeRedo
   * @param {Object} action The action object. Contains information about the action being redone. The `actionType`
   *                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`).
   */
  'beforeRedo',

  /**
   * Fired by {@link UndoRedo} plugin after the redo action. Contains information about the action that is being redone.
   * This hook is fired when {@link Options#undo} option is enabled.
   *
   * @event Hooks#afterRedo
   * @param {Object} action The action object. Contains information about the action being redone. The `actionType`
   *                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`).
   */
  'afterRedo',

  /**
   * Fired while retrieving the row header width.
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
   * @param {Array[]} input Contains an array of rows with data being used in the autofill.
   * @param {Array} deltas The deltas array passed to the `populateFromArray` method.
   */
  'beforeAutofillInsidePopulate',

  /**
   * Fired when the start of the selection is being modified (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformStart
   * @param {CellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformStart',

  /**
   * Fired when the end of the selection is being modified (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#modifyTransformEnd
   * @param {CellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformEnd',

  /**
   * Fired after the start of the selection is being modified (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformStart
   * @param {CellCoords} coords Coords of the freshly selected cell.
   * @param {Number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {Number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformStart',

  /**
   * Fired after the end of the selection is being modified (e.g. moving the selection with the arrow keys).
   *
   * @event Hooks#afterModifyTransformEnd
   * @param {CellCoords} coords Visual coords of the freshly selected cell.
   * @param {Number} rowTransformDir `-1` if trying to select a cell with a negative row index. `0` otherwise.
   * @param {Number} colTransformDir `-1` if trying to select a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformEnd',

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
   * Used to skip the length cache calculation for a defined period of time.
   *
   * @event Hooks#skipLengthCache
   * @param {Number} delay The delay in milliseconds.
   */
  'skipLengthCache',

  /**
   * Fired by {@link TrimRows} plugin after trimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @pro
   * @event Hooks#afterTrimRow
   * @param {Number[]} rows Physical indexes of trimmed rows.
   */
  'afterTrimRow',

  /**
   * Fired by {@link TrimRows} plugin after untrimming rows. This hook is fired when {@link Options#trimRows} option is enabled.
   *
   * @pro
   * @event Hooks#afterUntrimRow
   * @param {Number[]} rows Physical indexes of untrimmed rows.
   */
  'afterUntrimRow',

  /**
   * Fired by {@link DropdownMenu} plugin before opening the dropdown menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @pro
   * @event Hooks#beforeDropdownMenuShow
   * @param {DropdownMenu} dropdownMenu The DropdownMenu instance.
   */
  'beforeDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after opening the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @pro
   * @event Hooks#afterDropdownMenuShow
   * @param {DropdownMenu} dropdownMenu The DropdownMenu instance.
   */
  'afterDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after hiding the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @pro
   * @event Hooks#afterDropdownMenuHide
   * @param {DropdownMenu} instance The DropdownMenu instance.
   */
  'afterDropdownMenuHide',

  /**
   * Fired by {@link HiddenRows} plugin to check whether the provided row index is hidden. This hook is fired when
   * {@link Options#hiddenRows} option is enabled.
   *
   * @pro
   * @event Hooks#hiddenRow
   * @param {Number} row The visual row index in question.
   */
  'hiddenRow',

  /**
   * Fired by {@link HiddenColumns} plugin to check whether the provided column index is hidden. This hook is fired when
   * {@link Options#hiddenColumns} option is enabled.
   *
   * @pro
   * @event Hooks#hiddenColumn
   * @param {Number} column The visual column index in question.
   */
  'hiddenColumn',

  /**
   * Fired by {@link NestedRows} plugin before adding a children to the NestedRows structure. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @pro
   * @event Hooks#beforeAddChild
   * @param {Object} parent The parent object.
   * @param {Object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {Number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'beforeAddChild',

  /**
   * Fired by {@link NestedRows} plugin after adding a children to the NestedRows structure. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @pro
   * @event Hooks#afterAddChild
   * @param {Object} parent The parent object.
   * @param {Object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {Number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'afterAddChild',

  /**
   * Fired by {@link NestedRows} plugin before detaching a child from its parent. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @pro
   * @event Hooks#beforeDetachChild
   * @param {Object} parent An object representing the parent from which the element is to be detached.
   * @param {Object} element The detached element.
   */
  'beforeDetachChild',

  /**
   * Fired by {@link NestedRows} plugin after detaching a child from its parent. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
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
   * @param {Number} row Visual row index of the edited cell.
   * @param {Number} column Visual column index of the edited cell.
   */
  'afterBeginEditing',

  /**
   * Fired by {@link MergeCells} plugin before cell merging. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#beforeMergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {Boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'beforeMergeCells',

  /**
   * Fired by {@link MergeCells} plugin after cell merging. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#afterMergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {Object} mergeParent The parent collection of the provided cell range.
   * @param {Boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'afterMergeCells',

  /**
   * Fired by {@link MergeCells} plugin before unmerging the cells. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#beforeUnmergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {Boolean} [auto=false] `true` if called automatically by the plugin.
   */
  'beforeUnmergeCells',

  /**
   * Fired by {@link MergeCells} plugin after unmerging the cells. This hook is fired when {@link Options#mergeCells}
   * option is enabled.
   *
   * @event Hooks#afterUnmergeCells
   * @param {CellRange} cellRange Selection cell range.
   * @param {Boolean} [auto=false] `true` if called automatically by the plugin.
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
];

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

    // eslint-disable-next-line no-return-assign
    arrayEach(REGISTERED_HOOKS, hook => (bucket[hook] = []));

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
      arrayEach(callback, c => this.add(key, c, context));

    } else {
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
   * @param {String} key Hook name.
   * @param {Object} [context=null] A Handsontable instance.
   * @returns {Boolean} `true` for success, `false` otherwise.
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
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          const res = globalHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

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
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          const res = localHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

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
    // eslint-disable-next-line no-return-assign
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

const globalSingleton = new Hooks();

function getGlobalSingleton() {
  return globalSingleton;
}

export default Hooks;
