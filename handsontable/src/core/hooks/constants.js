/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description
 *
 * ::: only-for javascript
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __hooks__.
 * :::
 *
 * ::: only-for react
 * This page lists all the **Handsontable hooks** – callbacks that let you react before or after an action occurs.
 *
 * Read more on the [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) page.
 * :::
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * // using events as callbacks
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
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   afterChange={(changes, source) => {
 *     fetch('save.php', {
 *       method: 'POST',
 *       headers: {
 *         'Accept': 'application/json',
 *         'Content-Type': 'application/json'
 *       },
 *       body: JSON.stringify(changes)
 *     });
 *   }}
 * />
 * :::
 *
 * ::: only-for javascript
 * ```js
 * // using events as plugin hooks
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
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef1 = useRef(null);
 * const hotRef2 = useRef(null);
 *
 * // Using events as plugin hooks:
 * ...
 *
 * <HotTable
 *   ref={hotRef1}
 *   myPlugin={true}
 * });
 *
 * <HotTable
 *   ref={hotRef2}
 *   myPlugin={false}
 * });
 *
 * ...
 *
 * const hot2 = hotRef2.current.hotInstance;
 * // local hook (has same effect as a callback)
 * hot2.addHook('afterChange', function() {
 *   // function body - will only run in #example2
 * });
 *
 * // global hook
 * Handsontable.hooks.add('afterChange', function() {
 *   // Fired twice - for hot1 and hot2
 *   if (this.getSettings().myPlugin) {
 *     // function body - will only run for first instance
 *   }
 * });
 * :::
 * ...
 */

export const REGISTERED_HOOKS = [
  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Fired after resetting a cell's meta. This happens when the {@link Core#updateSettings} method is called.
   *
   * @event Hooks#afterCellMetaReset
   */
  'afterCellMetaReset',

  /**
   * Fired after one or more cells has been changed. The changes are triggered in any situation when the
   * value is entered using an editor or changed using API (e.q [`setDataAtCell`](@/api/core.md#setdataatcell) method).
   *
   * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
   *
   * @event Hooks#afterChange
   * @param {Array[]} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. `row` is a visual row index.
   * @param {string} [source] String that identifies source of hook call ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   * @example
   * ::: only-for javascript
   * ```js
   * new Handsontable(element, {
   *   afterChange: (changes) => {
   *     changes?.forEach(([row, prop, oldValue, newValue]) => {
   *       // Some logic...
   *     });
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   afterChange={(changes, source) => {
   *     changes?.forEach(([row, prop, oldValue, newValue]) => {
   *       // Some logic...
   *     });
   *   }}
   * />
   * ```
   * :::
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
   * user ([`contextMenu`](@/api/options.md#contextmenu) option). This hook can by helpful to determine if user use specified menu item or to set up
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
   * by user ([`dropdownMenu`](@/api/options.md#dropdownmenu) option). This hook can by helpful to determine if user use specified menu item or to set
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   * @returns {*} If `false` then creating columns is cancelled.
   * @example
   * ::: only-for javascript
   * ```js
   * // Return `false` to cancel column inserting.
   * new Handsontable(element, {
   *   beforeCreateCol: function(data, coords) {
   *     return false;
   *   }
   * });
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * // Return `false` to cancel column inserting.
   * <HotTable
   *   beforeCreateCol={(data, coords) => {
   *     return false;
   *   }}
   * />
   * ```
   * :::
   */
  'beforeCreateCol',

  /**
   * Fired after the order of columns has changed.
   * This hook is fired by changing column indexes of any type supported by the {@link IndexMapper}.
   *
   * @event Hooks#afterColumnSequenceChange
   * @param {'init'|'remove'|'insert'|'move'|'update'} [source] A string that indicates what caused the change to the order of columns.
   */
  'afterColumnSequenceChange',

  /**
   * Fired after created a new column.
   *
   * @event Hooks#afterCreateCol
   * @param {number} index Represents the visual index of first newly created column in the data source.
   * @param {number} amount Number of newly created columns in the data source.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterCreateCol',

  /**
   * Fired before created a new row.
   *
   * @event Hooks#beforeCreateRow
   * @param {number} index Represents the visual index of first newly created row in the data source array.
   * @param {number} amount Number of newly created rows in the data source array.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterCreateRow',

  /**
   * Fired after all selected cells are deselected.
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
   * Hook fired after `keydown` event is handled.
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
   * @param {number} [headerLevel=0] (Since 12.2.0) Header level index. Accepts positive (0 to n)
   *                                 and negative (-1 to -n) values. For positive values, 0 points to the
   *                                 topmost header. For negative values, -1 points to the bottom-most
   *                                 header (the header closest to the cells).
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
   * Fired after Handsontable's [`data`](@/api/options.md#data)
   * gets modified by the [`loadData()`](@/api/core.md#loaddata) method
   * or the [`updateSettings()`](@/api/core.md#updatesettings) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @event Hooks#afterLoadData
   * @param {Array} sourceData An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {boolean} initialLoad A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`)
   * @param {string} source The source of the call
   */
  'afterLoadData',

  /**
   * Fired after the [`updateData()`](@/api/core.md#updatedata) method
   * modifies Handsontable's [`data`](@/api/options.md#data).
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @event Hooks#afterUpdateData
   * @since 11.1.0
   * @param {Array} sourceData An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {boolean} initialLoad A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`)
   * @param {string} source The source of the call
   */
  'afterUpdateData',

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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * Fired after the order of rows has changed.
   * This hook is fired by changing row indexes of any type supported by the {@link IndexMapper}.
   *
   * @event Hooks#afterRowSequenceChange
   * @param {'init'|'remove'|'insert'|'move'|'update'} [source] A string that indicates what caused the change to the order of rows.
   */
  'afterRowSequenceChange',

  /**
   * Fired before the vertical viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
   * method or table internals.
   *
   * @since 14.0.0
   * @event Hooks#beforeViewportScrollVertically
   * @param {number} visualRow Visual row index.
   * @param {'auto' | 'top' | 'bottom'} [snapping='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on
   * the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of
   * the viewport.
   * @returns {number | boolean} Returns modified row index (or the same as passed in the method argument) to which
   * the viewport will be scrolled. If the returned value is `false`, the scrolling will be canceled.
   */
  'beforeViewportScrollVertically',

  /**
   * Fired before the horizontal viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
   * method or table internals.
   *
   * @since 14.0.0
   * @event Hooks#beforeViewportScrollHorizontally
   * @param {number} visualColumn Visual column index.
   * @param {'auto' | 'start' | 'end'} [snapping='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {number | boolean} Returns modified column index (or the same as passed in the method argument) to which
   * the viewport will be scrolled. If the returned value is `false`, the scrolling will be canceled.
   */
  'beforeViewportScrollHorizontally',

  /**
   * Fired before the vertical or horizontal viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
   * method or table internals.
   *
   * @since 14.0.0
   * @event Hooks#beforeViewportScroll
   */
  'beforeViewportScroll',

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
   * Fired after the vertical or horizontal scroll event.
   *
   * @since 14.0.0
   * @event Hooks#afterScroll
   */
  'afterScroll',

  /**
   * Fired after one or more cells are selected (e.g. during mouse move).
   *
   * @event Hooks#afterSelection
   * @param {number} row Selection start visual row index.
   * @param {number} column Selection start visual column index.
   * @param {number} row2 Selection end visual row index.
   * @param {number} column2 Selection end visual column index.
   * @param {object} preventScrolling A reference to the observable object with the `value` property.
   *                                  Property `preventScrolling.value` expects a boolean value that
   *                                  Handsontable uses to control scroll behavior after selection.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   * @example
   * ::: only-for javascript
   * ```js
   * new Handsontable(element, {
   *   afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // If set to `false` (default): when cell selection is outside the viewport,
   *     // Handsontable scrolls the viewport to cell selection's end corner.
   *     // If set to `true`: when cell selection is outside the viewport,
   *     // Handsontable doesn't scroll to cell selection's end corner.
   *     preventScrolling.value = true;
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   afterSelection={(row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // If set to `false` (default): when cell selection is outside the viewport,
   *     // Handsontable scrolls the viewport to cell selection's end corner.
   *     // If set to `true`: when cell selection is outside the viewport,
   *     // Handsontable doesn't scroll to cell selection's end corner.
   *     preventScrolling.value = true;
   *   }}
   * />
   * ```
   * :::
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
   * @param {object} preventScrolling A reference to the observable object with the `value` property.
   *                                  Property `preventScrolling.value` expects a boolean value that
   *                                  Handsontable uses to control scroll behavior after selection.
   * @param {number} selectionLayerLevel The number which indicates what selection layer is currently modified.
   * @example
   * ```js
   * ::: only-for javascript
   * new Handsontable(element, {
   *   afterSelectionByProp: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // setting if prevent scrolling after selection
   *     preventScrolling.value = true;
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   afterSelectionByProp={(row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
   *     // setting if prevent scrolling after selection
   *     preventScrolling.value = true;
   *   }}
   * />
   * ```
   * :::
   */
  'afterSelectionByProp',

  /**
   * Fired after one or more cells are selected (e.g. on mouse up).
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
   * Fired after one or more cells are selected (e.g. on mouse up).
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
   * Fired after the focus position within a selected range is changed.
   *
   * @since 14.3.0
   * @event Hooks#afterSelectionFocusSet
   * @param {number} row The focus visual row index position.
   * @param {number} column The focus visual column index position.
   * @param {object} preventScrolling A reference to the observable object with the `value` property.
   *                                  Property `preventScrolling.value` expects a boolean value that
   *                                  Handsontable uses to control scroll behavior after selection.
   * @example
   * ```js
   * ::: only-for javascript
   * new Handsontable(element, {
   *   afterSelectionFocusSet: (row, column, preventScrolling) => {
   *     // If set to `false` (default): when focused cell selection is outside the viewport,
   *     // Handsontable scrolls the viewport to that cell.
   *     // If set to `true`: when focused cell selection is outside the viewport,
   *     // Handsontable doesn't scroll the viewport.
   *     preventScrolling.value = true;
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   afterSelectionFocusSet={(row, column, preventScrolling) => {
   *     // If set to `false` (default): when focused cell selection is outside the viewport,
   *     // Handsontable scrolls the viewport to that cell.
   *     // If set to `true`: when focused cell selection is outside the viewport,
   *     // Handsontable doesn't scroll the viewport.
   *     preventScrolling.value = true;
   *   }}
   * />
   * ```
   * :::
   */
  'afterSelectionFocusSet',

  /**
   * Fired before one or more columns are selected (e.g. During mouse header click or {@link Core#selectColumns} API call).
   *
   * @since 14.0.0
   * @event Hooks#beforeSelectColumns
   * @param {CellCoords} from Selection start coords object.
   * @param {CellCoords} to Selection end coords object.
   * @param {CellCoords} highlight Selection cell focus coords object.
   * @example
   * ::: only-for javascript
   * ```js
   * new Handsontable(element, {
   *   beforeSelectColumns: (from, to, highlight) => {
   *     // Extend the column selection by one column left and one column right.
   *     from.col = Math.max(from.col - 1, 0);
   *     to.col = Math.min(to.col + 1, this.countCols() - 1);
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   beforeSelectColumns={(from, to, highlight) => {
   *     // Extend the column selection by one column left and one column right.
   *     from.col = Math.max(from.col - 1, 0);
   *     to.col = Math.min(to.col + 1, this.countCols() - 1);
   *   }}
   * />
   * ```
   * :::
   */
  'beforeSelectColumns',

  /**
   * Fired after one or more columns are selected (e.g. during mouse header click or {@link Core#selectColumns} API call).
   *
   * @since 14.0.0
   * @event Hooks#afterSelectColumns
   * @param {CellCoords} from Selection start coords object.
   * @param {CellCoords} to Selection end coords object.
   * @param {CellCoords} highlight Selection cell focus coords object.
   */
  'afterSelectColumns',

  /**
   * Fired before one or more rows are selected (e.g. during mouse header click or {@link Core#selectRows} API call).
   *
   * @since 14.0.0
   * @event Hooks#beforeSelectRows
   * @param {CellCoords} from Selection start coords object.
   * @param {CellCoords} to Selection end coords object.
   * @param {CellCoords} highlight Selection cell focus coords object.
   * @example
   * ::: only-for javascript
   * ```js
   * new Handsontable(element, {
   *   beforeSelectRows: (from, to, highlight) => {
   *     // Extend the row selection by one row up and one row bottom more.
   *     from.row = Math.max(from.row - 1, 0);
   *     to.row = Math.min(to.row + 1, this.countRows() - 1);
   *   }
   * })
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * <HotTable
   *   beforeSelectRows={(from, to, highlight) => {
   *     // Extend the row selection by one row up and one row bottom more.
   *     from.row = Math.max(from.row - 1, 0);
   *     to.row = Math.min(to.row + 1, this.countRows() - 1);
   *   }}
   * />
   * ```
   * :::
   */
  'beforeSelectRows',

  /**
   * Fired after one or more rows are selected (e.g. during mouse header click or {@link Core#selectRows} API call).
   *
   * @since 14.0.0
   * @event Hooks#afterSelectRows
   * @param {CellCoords} from Selection start coords object.
   * @param {CellCoords} to Selection end coords object.
   * @param {CellCoords} highlight Selection cell focus coords object.
   */
  'afterSelectRows',

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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   */
  'afterSetDataAtCell',

  /**
   * Fired after cell data was changed.
   * Called only when [`setDataAtRowProp`](@/api/core.md#setdataatrowprop) was executed.
   *
   * @event Hooks#afterSetDataAtRowProp
   * @param {Array} changes An array of changes in format `[[row, prop, oldValue, value], ...]`.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * Fired after a theme is enabled, changed, or disabled.
   *
   * @since 15.0.0
   * @event Hooks#afterSetTheme
   * @param {string|boolean|undefined} themeName The theme name.
   * @param {boolean} firstRun `true` if it's the initial setting of the theme, `false` otherwise.
   */
  'afterSetTheme',

  /**
   * Fired after calling the [`updateSettings`](@/api/core.md#updatesettings) method.
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   * @returns {undefined | boolean} If `false` the cell will be marked as invalid, `true` otherwise.
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
   *                              will be passed into [`populateFromArray`](@/api/core.md#populatefromarray) instead of the default autofill
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
   * @param {CellRange[]} range An array of `CellRange` coordinates where the alignment will be applied.
   * @param {string} type Type of the alignment - either `horizontal` or `vertical`.
   * @param {string} alignmentClass String defining the alignment class added to the cell.
   * Possible values: `htLeft` , `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, `htBottom`.
   */
  'beforeCellAlignment',

  /**
   * Fired before one or more cells are changed.
   *
   * Use this hook to silently alter the user's changes before Handsontable re-renders.
   *
   * To ignore the user's changes, use a nullified array or return `false`.
   *
   * @event Hooks#beforeChange
   * @param {Array[]} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. `row` is a visual row index.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
   * @returns {undefined | boolean} If `false` all changes were cancelled, `true` otherwise.
   * @example
   * ::: only-for javascript
   * ```js
   * // to alter a single change, overwrite the value with `changes[i][3]`
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0][3] = 10;
   *   }
   * });
   *
   * // to ignore a single change, set `changes[i]` to `null`
   * // or remove `changes[i]` from the array, by using `changes.splice(i, 1)`
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0] = null;
   *   }
   * });
   *
   * // to ignore all changes, return `false`
   * // or set the array's length to 0, by using `changes.length = 0`
   * new Handsontable(element, {
   *   beforeChange: (changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     return false;
   *   }
   * });
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * // to alter a single change, overwrite the desired value with `changes[i][3]`
   * <HotTable
   *   beforeChange={(changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0][3] = 10;
   *   }}
   * />
   *
   * // to ignore a single change, set `changes[i]` to `null`
   * // or remove `changes[i]` from the array, by using changes.splice(i, 1).
   * <HotTable
   *   beforeChange={(changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0] = null;
   *   }}
   * />
   *
   * // to ignore all changes, return `false`
   * // or set the array's length to 0 (`changes.length = 0`)
   * <HotTable
   *   beforeChange={(changes, source) => {
   *     // [[row, prop, oldVal, newVal], ...]
   *     return false;
   *   }}
   * />
   * ```
   * :::
   */
  'beforeChange',

  /**
   * Fired right before rendering the changes.
   *
   * @event Hooks#beforeChangeRender
   * @param {Array[]} changes Array in form of `[row, prop, oldValue, newValue]`.
   * @param {string} [source] String that identifies source of hook call
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * Fired before Handsontable's [`data`](@/api/options.md#data)
   * gets modified by the [`loadData()`](@/api/core.md#loaddata) method
   * or the [`updateSettings()`](@/api/core.md#updatesettings) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @event Hooks#beforeLoadData
   * @since 8.0.0
   * @param {Array} sourceData An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {boolean} initialLoad A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`)
   * @param {string} source The source of the call
   * @returns {Array} The returned array will be used as Handsontable's new dataset.
   */
  'beforeLoadData',

  /**
   * Fired before the [`updateData()`](@/api/core.md#updatedata) method
   * modifies Handsontable's [`data`](@/api/options.md#data).
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @event Hooks#beforeUpdateData
   * @since 11.1.0
   * @param {Array} sourceData An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {boolean} initialLoad A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`)
   * @param {string} source The source of the call
   * @returns {Array} The returned array will be used as Handsontable's new dataset.
   */
  'beforeUpdateData',

  /**
   * Hook fired before `keydown` event is handled. It can be used to stop default key bindings.
   *
   * __Note__: To prevent default behavior you need to call `false` in your `beforeKeyDown` handler.
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * When the focus position is moved to the next or previous row caused by the {@link Options#autoWrapRow} option
   * the hook is triggered.
   *
   * @since 14.0.0
   * @event Hooks#beforeRowWrap
   * @param {boolean} isWrapEnabled Tells whether the row wrapping is going to happen.
   * There may be situations where the option does not work even though it is enabled.
   * This is due to the priority of other options that may block the feature.
   * For example, when the {@link Options#minSpareCols} is defined, the {@link Options#autoWrapRow} option is not checked.
   * Thus, row wrapping is off.
   * @param {CellCoords} newCoords The new focus position. It is an object with keys `row` and `col`, where a value of `-1` indicates a header.
   * @param {boolean} isFlipped `true` if the row index was flipped, `false` otherwise.
   * Flipped index means that the user reached the last row and the focus is moved to the first row or vice versa.
   */
  'beforeRowWrap',

  /**
   * When the focus position is moved to the next or previous column caused by the {@link Options#autoWrapCol} option
   * the hook is triggered.
   *
   * @since 14.0.0
   * @event Hooks#beforeColumnWrap
   * @param {boolean} isWrapEnabled Tells whether the column wrapping is going to happen.
   * There may be situations where the option does not work even though it is enabled.
   * This is due to the priority of other options that may block the feature.
   * For example, when the {@link Options#minSpareRows} is defined, the {@link Options#autoWrapCol} option is not checked.
   * Thus, column wrapping is off.
   * @param {CellCoords} newCoords The new focus position. It is an object with keys `row` and `col`, where a value of `-1` indicates a header.
   * @param {boolean} isFlipped `true` if the column index was flipped, `false` otherwise.
   * Flipped index means that the user reached the last column and the focus is moved to the first column or vice versa.
   */
  'beforeColumnWrap',

  /**
   * Fired before cell meta is changed.
   *
   * @event Hooks#beforeSetCellMeta
   * @since 8.0.0
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key The updated meta key.
   * @param {*} value The updated meta value.
   * @returns {boolean|undefined} If false is returned the action is canceled.
   */
  'beforeSetCellMeta',

  /**
   * Fired before setting focus selection.
   *
   * @since 14.3.0
   * @event Hooks#beforeSelectionFocusSet
   * @param {CellCoords} coords CellCoords instance.
   */
  'beforeSelectionFocusSet',

  /**
   * Fired before setting range is started but not finished yet.
   *
   * @event Hooks#beforeSetRangeStartOnly
   * @param {CellCoords} coords `CellCoords` instance.
   */
  'beforeSetRangeStartOnly',

  /**
   * Fired before setting range is started.
   *
   * @event Hooks#beforeSetRangeStart
   * @param {CellCoords} coords `CellCoords` instance.
   */
  'beforeSetRangeStart',

  /**
   * Fired before setting range is ended.
   *
   * @event Hooks#beforeSetRangeEnd
   * @param {CellCoords} coords `CellCoords` instance.
   */
  'beforeSetRangeEnd',

  /**
   * Fired before applying selection coordinates to the renderable coordinates for Walkontable (rendering engine).
   * It occurs even when cell coordinates remain unchanged and activates during cell selection and drag selection.
   * The behavior of Shift+Tab differs from Arrow Left when there's no further movement possible.
   *
   * @since 14.0.0
   * @event Hooks#beforeSelectionHighlightSet
   */
  'beforeSelectionHighlightSet',

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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * @param {string} [source] String that identifies source of hook call.
   */
  'modifyColWidth',

  /**
   * Fired when rendering the list of values in the multiple-selection component of the Filters dropdown.
   * The hook allows modifying the displayed values in that component.
   *
   * @since 14.2.0
   * @event Hooks#modifyFiltersMultiSelectValue
   * @param {object} item The item in the list of values.
   * @param {object} meta The cell properties object.
   */
  'modifyFiltersMultiSelectValue',

  /**
   * Fired when focusing a cell or a header element. Allows replacing the element to be focused by returning a
   * different HTML element.
   *
   * @since 14.0.0
   * @event Hooks#modifyFocusedElement
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @param {HTMLElement|undefined} focusedElement The element to be focused. `null` for focusedElement is intended when focused cell is hidden.
   */
  'modifyFocusedElement',

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
   * @param {string} [source] String that identifies source of hook call.
   */
  'modifyRowHeight',

  /**
   * Fired when a row height is about to be modified by a callback function. The hook allows to change the row height
   * for the specified overlay type.
   *
   * @since 14.5.0
   * @event Hooks#modifyRowHeightByOverlayName
   * @param {number} height Row height.
   * @param {number} row Visual row index.
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName Overlay name.
   */
  'modifyRowHeightByOverlayName',

  /**
   * Fired when a data was retrieved or modified.
   *
   * @event Hooks#modifyData
   * @param {number} row Physical row index.
   * @param {number} column Visual column index.
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
   * @param {number} column Physical column index or property name.
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
   * Used to modify the cell coordinates when using the [`getCell`](@/api/core.md#getcell) method, opening editor, getting value from the editor
   * and saving values from the closed editor.
   *
   * @event Hooks#modifyGetCellCoords
   * @since 0.36.0
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} topmost If set to `true`, it returns the TD element from the topmost overlay. For example,
   *                          if the wanted cell is in the range of fixed rows, it will return a TD element
   *                          from the `top` overlay.
   * @param {string} source String that identifies how this coords change will be processed. Possible values:
   *                        `meta` the change will affect the cell meta and data; `render` the change will affect the
   *                        DOM element that will be returned by the `getCell` method.
   * @returns {undefined|number[]}
   */
  'modifyGetCellCoords',

  /**
   * Used to modify the returned cell coordinates of clicked cells (TD or TH elements).
   *
   * @event Hooks#modifyGetCoordsElement
   * @since 14.6.0
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {undefined|number[]}
   */
  'modifyGetCoordsElement',

  /**
   * Used to modify the cell coordinates when the table is activated (going into the listen mode).
   *
   * @event Hooks#modifyFocusOnTabNavigation
   * @since 14.0.0
   * @param {'from_above' | 'from_below'} tabActivationDir The browsers Tab navigation direction. Depending on
   * whether the user activated the table from the element above or below, another cell can be selected.
   * @param {CellCoords} visualCoords The coords that will be used to select a cell.
   */
  'modifyFocusOnTabNavigation',

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
   * Fired by {@link PersistentState} plugin, after loading value, saved under given key, from browser local storage.
   *
   * The `persistentStateLoad` hook is fired even when the {@link Options#persistentState} option is disabled.
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
   * Fired by {@link PersistentState} plugin, after saving value under given key in browser local storage.
   *
   * The `persistentStateSave` hook is fired even when the {@link Options#persistentState} option is disabled.
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
   * @returns {boolean | undefined} If `false` the column will not be sorted, `true` otherwise.
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
   * Fired by {@link CopyPaste} plugin before copying the values to the clipboard and before clearing values of
   * the selected cells. This hook is fired when {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#beforeCut
   * @param {Array[]} data An array of arrays which contains data to cut.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       which will be cut out.
   * @returns {*} If returns `false` then operation of the cutting out is canceled.
   * @example
   * ::: only-for javascript
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
   * :::
   *
   * ::: only-for react
   * ```jsx
   * // To disregard a single row, remove it from the array using data.splice(i, 1).
   * <HotTable
   *   beforeCut={(data, coords) => {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }}
   * />
   * // To cancel a cutting action, just return `false`.
   * <HotTable
   *   beforeCut={(data, coords) => {
   *     return false;
   *   }}
   * />
   * ```
   * :::
   */
  'beforeCut',

  /**
   * Fired by {@link CopyPaste} plugin after data was cut out from the table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterCut
   * @param {Array[]} data An array of arrays with the cut data.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       which was cut out.
   */
  'afterCut',

  /**
   * Fired before values are copied to the clipboard.
   *
   * @event Hooks#beforeCopy
   * @param {Array[]} data An array of arrays which contains data to copied.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                         which will copied.
   * @param {{ columnHeadersCount: number }} copiedHeadersCount (Since 12.3.0) The number of copied column headers.
   * @returns {*} If returns `false` then copying is canceled.
   *
   * @example
   * ::: only-for javascript
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
   * :::
   *
   * ::: only-for react
   * ```jsx
   * // To disregard a single row, remove it from array using data.splice(i, 1).
   * ...
   * <HotTable
   *   beforeCopy={(data, coords) => {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }}
   * />
   * ...
   *
   * // To cancel copying, return false from the callback.
   * ...
   * <HotTable
   *   beforeCopy={(data, coords) => {
   *     return false;
   *   }}
   * />
   * ...
   * ```
   * :::
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
   * @param {{ columnHeadersCount: number }} copiedHeadersCount (Since 12.3.0) The number of copied column headers.
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
   * ::: only-for javascript
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
   * :::
   *
   * ::: only-for react
   * ```jsx
   * // To disregard a single row, remove it from array using data.splice(i, 1).
   * <HotTable
   *   beforePaste={(data, coords) => {
   *     // data -> [[1, 2, 3], [4, 5, 6]]
   *     data.splice(0, 1);
   *     // data -> [[4, 5, 6]]
   *     // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
   *   }}
   * />
   * // To cancel pasting, return false from the callback.
   * <HotTable
   *   beforePaste={(data, coords) => {
   *     return false;
   *   }}
   * />
   * ```
   * :::
   */
  'beforePaste',

  /**
   * Fired by {@link CopyPaste} plugin after values are pasted into table. This hook is fired when
   * {@link Options#copyPaste} option is enabled.
   *
   * @event Hooks#afterPaste
   * @param {Array[]} data An array of arrays with the pasted data.
   * @param {object[]} coords An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                       that correspond to the previously selected area.
   */
  'afterPaste',

  /**
   * Fired by the {@link ManualColumnFreeze} plugin, before freezing a column.
   *
   * @event Hooks#beforeColumnFreeze
   * @since 12.1.0
   * @param {number} column The visual index of the column that is going to freeze.
   * @param {boolean} freezePerformed If `true`: the column is going to freeze. If `false`: the column is not going to freeze (which might happen if the column is already frozen).
   * @returns {boolean|undefined} If `false`: the column is not going to freeze, and the `afterColumnFreeze` hook won't fire.
   */
  'beforeColumnFreeze',

  /**
   * Fired by the {@link ManualColumnFreeze} plugin, right after freezing a column.
   *
   * @event Hooks#afterColumnFreeze
   * @since 12.1.0
   * @param {number} column The visual index of the frozen column.
   * @param {boolean} freezePerformed If `true`: the column got successfully frozen. If `false`: the column didn't get frozen.
   */
  'afterColumnFreeze',

  /**
   * Fired by {@link ManualColumnMove} plugin before change order of the visual indexes. This hook is fired when
   * {@link Options#manualColumnMove} option is enabled.
   *
   * @event Hooks#beforeColumnMove
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/columns/column-moving/column-moving.md).
   * @param {number|undefined} dropIndex Visual column index, being a drop index for the moved columns.
   *                                     Points to where we are going to drop the moved elements. To check
   *                                     visualization of drop index please take a look at
   *                                     [documentation](@/guides/columns/column-moving/column-moving.md).
   *                                     It's `undefined` when `dragColumns` function wasn't called.
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @returns {undefined | boolean} If `false` the column will not be moved, `true` otherwise.
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
   *                            [documentation](@/guides/columns/column-moving/column-moving.md).
   * @param {number|undefined} dropIndex Visual column index, being a drop index for the moved columns.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/columns/column-moving/column-moving.md).
   *                                     It's `undefined` when `dragColumns` function wasn't called.
   * @param {boolean} movePossible Indicates if it was possible to move columns to the desired position.
   * @param {boolean} orderChanged Indicates if order of columns was changed by move.
   */
  'afterColumnMove',

  /**
   * Fired by the {@link ManualColumnFreeze} plugin, before unfreezing a column.
   *
   * @event Hooks#beforeColumnUnfreeze
   * @since 12.1.0
   * @param {number} column The visual index of the column that is going to unfreeze.
   * @param {boolean} unfreezePerformed If `true`: the column is going to unfreeze. If `false`: the column is not going to unfreeze (which might happen if the column is already unfrozen).
   * @returns {boolean|undefined} If `false`: the column is not going to unfreeze, and the `afterColumnUnfreeze` hook won't fire.
   */
  'beforeColumnUnfreeze',

  /**
   * Fired by the {@link ManualColumnFreeze} plugin, right after unfreezing a column.
   *
   * @event Hooks#afterColumnUnfreeze
   * @since 12.1.0
   * @param {number} column The visual index of the unfrozen column.
   * @param {boolean} unfreezePerformed If `true`: the column got successfully unfrozen. If `false`: the column didn't get unfrozen.
   */
  'afterColumnUnfreeze',

  /**
   * Fired by {@link ManualRowMove} plugin before changing the order of the visual indexes. This hook is fired when
   * {@link Options#manualRowMove} option is enabled.
   *
   * @event Hooks#beforeRowMove
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows.
   *                            Points to where the elements will be placed after the moving action.
   *                            To check visualization of final index please take a look at
   *                            [documentation](@/guides/rows/row-moving/row-moving.md).
   * @param {number|undefined} dropIndex Visual row index, being a drop index for the moved rows.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/rows/row-moving/row-moving.md).
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
   *                            [documentation](@/guides/rows/row-moving/row-moving.md).
   * @param {number|undefined} dropIndex Visual row index, being a drop index for the moved rows.
   *                                     Points to where we are going to drop the moved elements.
   *                                     To check visualization of drop index please take a look at
   *                                     [documentation](@/guides/rows/row-moving/row-moving.md).
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
   * @returns {number|undefined} Returns the new row size or `undefined` if row size should be calculated automatically.
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
   * @returns {number|undefined} Returns new width which will be applied to the column element.
   */
  'beforeStretchingColumnWidth',

  /**
   * Fired by the [`Filters`](@/api/filters.md) plugin,
   * before a [column filter](@/guides/columns/column-filter/column-filter.md) gets applied.
   *
   * [`beforeFilter`](#beforefilter) takes two arguments: `conditionsStack` and `previousConditionsStack`, both are
   * arrays of objects.
   *
   * Each object represents one of your [column filters](@/api/filters.md#addcondition),
   * and consists of the following properties:
   *
   * | Property     | Possible values                                                         | Description                                                                                                              |
   * | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
   * | `column`     | Number                                                                  | A visual index of the column to which the filter will be applied.                                                        |
   * | `conditions` | Array of objects                                                        | Each object represents one condition. For details, see [`addCondition()`](@/api/filters.md#addcondition).                |
   * | `operation`  | `'conjunction'` \| `'disjunction'` \| `'disjunctionWithExtraCondition'` | An operation to perform on your set of `conditions`. For details, see [`addCondition()`](@/api/filters.md#addcondition). |
   *
   * An example of the format of the `conditionsStack` argument:
   *
   * ```js
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
   *
   * To perform server-side filtering (i.e., to not apply filtering to Handsontable's UI),
   * set [`beforeFilter`](#beforefilter) to return `false`:
   *
   * ```js
   * new Handsontable(document.getElementById('example'), {
   *   beforeFilter: (conditionsStack) => {
   *     return false;
   *   }
   * });
   *```
   *
   * Read more:
   * - [Guides: Column filter](@/guides/columns/column-filter/column-filter.md)
   * - [Hooks: `afterFilter`](#afterfilter)
   * - [Options: `filters`](@/api/options.md#filters)
   * - [Plugins: `Filters`](@/api/filters.md)
   * – [Plugin methods: `addCondition()`](@/api/filters.md#addcondition)
   *
   * @event Hooks#beforeFilter
   * @param {object[]} conditionsStack An array of objects with your [column filters](@/api/filters.md#addcondition).
   * @param {object[]|null} previousConditionsStack An array of objects with your previous [column filters](@/api/filters.md#addcondition). It can also be `null` if there was no previous filters applied or the conditions did not change between performing the `filter` action.
   * @returns {boolean} To perform server-side filtering (i.e., to not apply filtering to Handsontable's UI), return `false`.
   */
  'beforeFilter',

  /**
   * Fired by the [`Filters`](@/api/filters.md) plugin,
   * after a [column filter](@/guides/columns/column-filter/column-filter.md) gets applied.
   *
   * [`afterFilter`](#afterfilter) takes one argument (`conditionsStack`), which is an array of objects.
   * Each object represents one of your [column filters](@/api/filters.md#addcondition),
   * and consists of the following properties:
   *
   * | Property     | Possible values                                                         | Description                                                                                                              |
   * | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
   * | `column`     | Number                                                                  | A visual index of the column to which the filter was applied.                                                            |
   * | `conditions` | Array of objects                                                        | Each object represents one condition. For details, see [`addCondition()`](@/api/filters.md#addcondition).                |
   * | `operation`  | `'conjunction'` \| `'disjunction'` \| `'disjunctionWithExtraCondition'` | An operation to perform on your set of `conditions`. For details, see [`addCondition()`](@/api/filters.md#addcondition). |
   *
   * An example of the format of the `conditionsStack` argument:
   *
   * ```js
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
   *
   * Read more:
   * - [Guides: Column filter](@/guides/columns/column-filter/column-filter.md)
   * - [Hooks: `beforeFilter`](#beforefilter)
   * - [Options: `filters`](@/api/options.md#filters)
   * - [Plugins: `Filters`](@/api/filters.md)
   * – [Plugin methods: `addCondition()`](@/api/filters.md#addcondition)
   *
   * @event Hooks#afterFilter
   * @param {object[]} conditionsStack An array of objects with your [column filters](@/api/filters.md#addcondition).
   */
  'afterFilter',

  /**
   * Fired by the {@link Formulas} plugin, when any cell value changes.
   *
   * Returns an array of objects that contains:
   * - The addresses (`sheet`, `row`, `col`) and new values (`newValue`) of the changed cells.
   * - The addresses and new values of any cells that had to be recalculated (because their formulas depend on the cells that changed).
   *
   * This hook gets also fired on Handsontable's initialization, returning the addresses and values of all cells.
   *
   * Read more:
   * - [Guides: Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
   * - [HyperFormula documentation: `valuesUpdated`](https://hyperformula.handsontable.com/api/interfaces/listeners.html#valuesupdated)
   *
   * @since 9.0.0
   * @event Hooks#afterFormulasValuesUpdate
   * @param {Array} changes The addresses and new values of all the changed and recalculated cells.
   */
  'afterFormulasValuesUpdate',

  /**
   * Fired when a named expression is added to the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterNamedExpressionAdded
   * @param {string} namedExpressionName The name of the added expression.
   * @param {Array} changes The values and location of applied changes.
   */
  'afterNamedExpressionAdded',

  /**
   * Fired when a named expression is removed from the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterNamedExpressionRemoved
   * @param {string} namedExpressionName The name of the removed expression.
   * @param {Array} changes The values and location of applied changes.
   */
  'afterNamedExpressionRemoved',

  /**
   * Fired when a new sheet is added to the Formulas' engine instance.
   *
   * @since 9.0.0
   * @event Hooks#afterSheetAdded
   * @param {string} addedSheetDisplayName The name of the added sheet.
   */
  'afterSheetAdded',

  /**
   * Fired when a sheet in the Formulas' engine instance is renamed.
   *
   * @since 9.0.0
   * @event Hooks#afterSheetRenamed
   * @param {string} oldDisplayName The old name of the sheet.
   * @param {string} newDisplayName The new name of the sheet.
   */
  'afterSheetRenamed',

  /**
   * Fired when a sheet is removed from the Formulas' engine instance.
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
   * Fired while retrieving a column header's value.
   *
   * @since 12.3.0
   * @event Hooks#modifyColumnHeaderValue
   * @param {string} value A column header value.
   * @param {number} visualColumnIndex A visual column index.
   * @param {number} [headerLevel=0] Header level index. Accepts positive (`0` to `n`)
   *                                 and negative (`-1` to `-n`) values. For positive values, `0` points to the
   *                                 topmost header. For negative values, `-1` points to the bottom-most
   *                                 header (the header closest to the cells).
   * @returns {string} The column header value to be updated.
   */
  'modifyColumnHeaderValue',

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
   *                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).
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
   * Fired when the focus of the selection is being modified (e.g. Moving the focus with the enter/tab keys).
   *
   * @since 14.3.0
   * @event Hooks#modifyTransformFocus
   * @param {CellCoords} delta Cell coords object declaring the delta of the new selection relative to the previous one.
   */
  'modifyTransformFocus',

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
   * Fired after the focus of the selection is being modified (e.g. Moving the focus with the enter/tab keys).
   *
   * @since 14.3.0
   * @event Hooks#afterModifyTransformFocus
   * @param {CellCoords} coords Coords of the freshly focused cell.
   * @param {number} rowTransformDir `-1` if trying to focus a cell with a negative row index. `0` otherwise.
   * @param {number} colTransformDir `-1` if trying to focus a cell with a negative column index. `0` otherwise.
   */
  'afterModifyTransformFocus',

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
   * @param {DropdownMenu} dropdownMenu The `DropdownMenu` instance.
   */
  'beforeDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after opening the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @event Hooks#afterDropdownMenuShow
   * @param {DropdownMenu} dropdownMenu The `DropdownMenu` instance.
   */
  'afterDropdownMenuShow',

  /**
   * Fired by {@link DropdownMenu} plugin after hiding the Dropdown Menu. This hook is fired when {@link Options#dropdownMenu}
   * option is enabled.
   *
   * @event Hooks#afterDropdownMenuHide
   * @param {DropdownMenu} instance The `DropdownMenu` instance.
   */
  'afterDropdownMenuHide',

  /**
   * Fired by {@link NestedRows} plugin before adding a children to the `NestedRows` structure. This hook is fired when
   * {@link Options#nestedRows} option is enabled.
   *
   * @event Hooks#beforeAddChild
   * @param {object} parent The parent object.
   * @param {object|undefined} element The element added as a child. If `undefined`, a blank child was added.
   * @param {number|undefined} index The index within the parent where the new child was added. If `undefined`, the element was added as the last child.
   */
  'beforeAddChild',

  /**
   * Fired by {@link NestedRows} plugin after adding a children to the `NestedRows` structure. This hook is fired when
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
   * Fired before the editor is opened and rendered.
   *
   * @since 14.2.0
   * @event Hooks#beforeBeginEditing
   * @param {number} row Visual row index of the edited cell.
   * @param {number} column Visual column index of the edited cell.
   * @param {*} initialValue The initial editor value.
   * @param {MouseEvent | KeyboardEvent} event The event which was responsible for opening the editor.
   * @param {boolean} fullEditMode `true` if the editor is opened in full edit mode, `false` otherwise.
   * Editor opened in full edit mode does not close after pressing Arrow keys.
   * @returns {boolean | undefined} If the callback returns `false,` the editor won't be opened after
   * the mouse double click or after pressing the Enter key. Returning `undefined` (or other value
   * than boolean) will result in default behavior, which disallows opening an editor for non-contiguous
   * selection (while pressing Ctrl/Cmd) and for multiple selected cells (while pressing SHIFT).
   * Returning `true` removes those restrictions.
   */
  'beforeBeginEditing',

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
   * Fired after the window was resized or the size of the Handsontable root element was changed.
   *
   * @event Hooks#afterRefreshDimensions
   * @param {{ width: number, height: number }} previousDimensions Previous dimensions of the container.
   * @param {{ width: number, height: number }} currentDimensions Current dimensions of the container.
   * @param {boolean} stateChanged `true`, if the container was re-render, `false` otherwise.
   */
  'afterRefreshDimensions',

  /**
   * Cancellable hook, called after resizing a window or after detecting size change of the
   * Handsontable root element, but before redrawing a table.
   *
   * @event Hooks#beforeRefreshDimensions
   * @param {{ width: number, height: number }} previousDimensions Previous dimensions of the container.
   * @param {{ width: number, height: number }} currentDimensions Current dimensions of the container.
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
 * The list of the hooks which are removed from the API. The warning message is printed out in
 * the developer console when the hook is used.
 *
 * The Map key is represented by hook name and its value points to the Handsontable version
 * in which it was removed.
 *
 * @type {Map<string, string>}
 */
export const REMOVED_HOOKS = new Map([
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
export const DEPRECATED_HOOKS = new Map([
  []
]);
