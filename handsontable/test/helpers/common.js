const specContext = {};

beforeEach(function() {
  specContext.spec = this;

  if (typeof __ENV_ARGS__ !== 'undefined') {
    this.loadedTheme = __ENV_ARGS__.HOT_THEME;
  }
});

afterEach(() => {
  specContext.spec = null;
});

beforeAll(() => {
  // Make the test more predictable by hiding the test suite dots (skip it on unit tests)
  if (!process.env.JEST_WORKER_ID) {
    $('.jasmine_html-reporter').hide();
  }
});
afterAll(() => {
  // After the test are finished show the test suite dots
  if (!process.env.JEST_WORKER_ID) {
    $('.jasmine_html-reporter').show();
  }
});

/**
 * @param {number} [delay=100] The delay in ms after which the Promise is resolved.
 * @returns {Promise}
 */
export function sleep(delay = 100) {
  return Promise.resolve({
    then(resolve) {
      setTimeout(resolve, delay);
    }
  });
}

/**
 * @param {Function} fn The function to convert to Promise.
 * @returns {Promise}
 */
export function promisfy(fn) {
  return new Promise((resolve, reject) => fn(resolve, reject));
}

/**
 * Calls a method in current Handsontable instance, returns its output.
 *
 * @param {string} method The method to compose.
 * @returns {Function}
 */
export function handsontableMethodFactory(method) {
  return function(...args) {
    let instance;

    try {
      instance = spec().$container.handsontable('getInstance');
    } catch (err) {
      /* eslint-disable */
      console.error(err);
      /* eslint-enable */
    }

    if (instance) {
      if (method === 'destroy') {
        spec().$container.removeData();
      }
    } else {
      if (method === 'destroy') {
        return; // we can forgive this... maybe it was destroyed in the test
      }
      throw new Error('Something wrong with the test spec: Handsontable instance not found');
    }

    return instance[method](...args);
  };
}

export const _getColWidthFromSettings = handsontableMethodFactory('_getColWidthFromSettings');
export const addHook = handsontableMethodFactory('addHook');
export const addHookOnce = handsontableMethodFactory('addHookOnce');
export const alter = handsontableMethodFactory('alter');
export const clear = handsontableMethodFactory('clear');
export const colToProp = handsontableMethodFactory('colToProp');
export const countColHeaders = handsontableMethodFactory('countColHeaders');
export const countCols = handsontableMethodFactory('countCols');
export const countEmptyCols = handsontableMethodFactory('countEmptyCols');
export const countEmptyRows = handsontableMethodFactory('countEmptyRows');
export const countRenderedCols = handsontableMethodFactory('countRenderedCols');
export const countRenderedRows = handsontableMethodFactory('countRenderedRows');
export const countRowHeaders = handsontableMethodFactory('countRowHeaders');
export const countRows = handsontableMethodFactory('countRows');
export const countSourceCols = handsontableMethodFactory('countSourceCols');
export const countSourceRows = handsontableMethodFactory('countSourceRows');
export const countVisibleCols = handsontableMethodFactory('countVisibleCols');
export const deselectCell = handsontableMethodFactory('deselectCell');
export const destroy = handsontableMethodFactory('destroy');
export const destroyEditor = handsontableMethodFactory('destroyEditor');
export const emptySelectedCells = handsontableMethodFactory('emptySelectedCells');
export const getActiveEditor = handsontableMethodFactory('getActiveEditor');
export const getCell = handsontableMethodFactory('getCell');
export const getCellEditor = handsontableMethodFactory('getCellEditor');
export const getCellMeta = handsontableMethodFactory('getCellMeta');
export const getCellMetaAtRow = handsontableMethodFactory('getCellMetaAtRow');
export const getCellRenderer = handsontableMethodFactory('getCellRenderer');
export const getCellsMeta = handsontableMethodFactory('getCellsMeta');
export const getCellValidator = handsontableMethodFactory('getCellValidator');
export const getColHeader = handsontableMethodFactory('getColHeader');
export const getColumnMeta = handsontableMethodFactory('getColumnMeta');
export const getColWidth = handsontableMethodFactory('getColWidth');
export const getCoords = handsontableMethodFactory('getCoords');
export const getCopyableData = handsontableMethodFactory('getCopyableData');
export const getCopyableText = handsontableMethodFactory('getCopyableText');
export const getCurrentThemeName = handsontableMethodFactory('getCurrentThemeName');
export const getData = handsontableMethodFactory('getData');
export const getDataAtCell = handsontableMethodFactory('getDataAtCell');
export const getDataAtCol = handsontableMethodFactory('getDataAtCol');
export const getDataAtProp = handsontableMethodFactory('getDataAtProp');
export const getDataAtRow = handsontableMethodFactory('getDataAtRow');
export const getDataAtRowProp = handsontableMethodFactory('getDataAtRowProp');
export const getDataType = handsontableMethodFactory('getDataType');
export const getFirstFullyVisibleColumn = handsontableMethodFactory('getFirstFullyVisibleColumn');
export const getFirstFullyVisibleRow = handsontableMethodFactory('getFirstFullyVisibleRow');
export const getFirstPartiallyVisibleColumn = handsontableMethodFactory('getFirstPartiallyVisibleColumn');
export const getFirstPartiallyVisibleRow = handsontableMethodFactory('getFirstPartiallyVisibleRow');
export const getFirstRenderedVisibleColumn = handsontableMethodFactory('getFirstRenderedVisibleColumn');
export const getFirstRenderedVisibleRow = handsontableMethodFactory('getFirstRenderedVisibleRow');
export const getFocusManager = handsontableMethodFactory('getFocusManager');
export const getInstance = handsontableMethodFactory('getInstance');
export const getLastFullyVisibleColumn = handsontableMethodFactory('getLastFullyVisibleColumn');
export const getLastFullyVisibleRow = handsontableMethodFactory('getLastFullyVisibleRow');
export const getLastPartiallyVisibleColumn = handsontableMethodFactory('getLastPartiallyVisibleColumn');
export const getLastPartiallyVisibleRow = handsontableMethodFactory('getLastPartiallyVisibleRow');
export const getLastRenderedVisibleColumn = handsontableMethodFactory('getLastRenderedVisibleColumn');
export const getLastRenderedVisibleRow = handsontableMethodFactory('getLastRenderedVisibleRow');
export const getPlugin = handsontableMethodFactory('getPlugin');
export const getRowHeader = handsontableMethodFactory('getRowHeader');
export const getRowHeight = handsontableMethodFactory('getRowHeight');
export const getSchema = handsontableMethodFactory('getSchema');
export const getSelected = handsontableMethodFactory('getSelected');
export const getSelectedLast = handsontableMethodFactory('getSelectedLast');
export const getSelectedRange = handsontableMethodFactory('getSelectedRange');
export const getSelectedRangeLast = handsontableMethodFactory('getSelectedRangeLast');
export const getSettings = handsontableMethodFactory('getSettings');
export const getShortcutManager = handsontableMethodFactory('getShortcutManager');
export const getSourceData = handsontableMethodFactory('getSourceData');
export const getSourceDataArray = handsontableMethodFactory('getSourceDataArray');
export const getSourceDataAtCell = handsontableMethodFactory('getSourceDataAtCell');
export const getSourceDataAtCol = handsontableMethodFactory('getSourceDataAtCol');
export const getSourceDataAtRow = handsontableMethodFactory('getSourceDataAtRow');
export const getValue = handsontableMethodFactory('getValue');
export const hasHook = handsontableMethodFactory('hasHook');
export const isListening = handsontableMethodFactory('isListening');
export const listen = handsontableMethodFactory('listen');
export const loadData = handsontableMethodFactory('loadData');
export const populateFromArray = handsontableMethodFactory('populateFromArray');
export const propToCol = handsontableMethodFactory('propToCol');
export const refreshDimensions = handsontableMethodFactory('refreshDimensions');
export const removeCellMeta = handsontableMethodFactory('removeCellMeta');
export const removeHook = handsontableMethodFactory('removeHook');
export const render = handsontableMethodFactory('render');
export const runHooks = handsontableMethodFactory('runHooks');
export const scrollToFocusedCell = handsontableMethodFactory('scrollToFocusedCell');
export const scrollViewportTo = handsontableMethodFactory('scrollViewportTo');
export const selectAll = handsontableMethodFactory('selectAll');
export const selectCell = handsontableMethodFactory('selectCell');
export const selectCells = handsontableMethodFactory('selectCells');
export const selectColumns = handsontableMethodFactory('selectColumns');
export const selectRows = handsontableMethodFactory('selectRows');
export const setCellMeta = handsontableMethodFactory('setCellMeta');
export const setDataAtCell = handsontableMethodFactory('setDataAtCell');
export const setDataAtRowProp = handsontableMethodFactory('setDataAtRowProp');
export const setSourceDataAtCell = handsontableMethodFactory('setSourceDataAtCell');
export const spliceCellsMeta = handsontableMethodFactory('spliceCellsMeta');
export const spliceCol = handsontableMethodFactory('spliceCol');
export const spliceRow = handsontableMethodFactory('spliceRow');
export const toVisualRow = handsontableMethodFactory('toVisualRow');
export const unlisten = handsontableMethodFactory('unlisten');
export const updateData = handsontableMethodFactory('updateData');
export const updateSettings = handsontableMethodFactory('updateSettings');
export const useTheme = handsontableMethodFactory('useTheme');
export const validateCell = handsontableMethodFactory('validateCell');
export const validateCells = handsontableMethodFactory('validateCells');

/**
 * @returns {object} Returns the spec object for currently running test.
 */
export function spec() {
  return specContext.spec;
}

/**
 * @returns {Handsontable} Returns the Handsontable instance.
 */
export function hot() {
  return spec().$container.data('handsontable');
}

/**
 * @returns {IndexMapper} Returns the row index mapper instance.
 */
export function rowIndexMapper() {
  return hot().rowIndexMapper;
}

/**
 * @returns {IndexMapper} Returns the column index mapper instance.
 */
export function columnIndexMapper() {
  return hot().columnIndexMapper;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function topOverlay() {
  return hot().view._wt.wtOverlays.topOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function bottomOverlay() {
  return hot().view._wt.wtOverlays.bottomOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function topInlineStartCornerOverlay() {
  return hot().view._wt.wtOverlays.topInlineStartCornerOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function inlineStartOverlay() {
  return hot().view._wt.wtOverlays.inlineStartOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function bottomInlineStartCornerOverlay() {
  return hot().view._wt.wtOverlays.bottomInlineStartCornerOverlay;
}

/**
 * Moves the table's viewport to the specified y scroll position.
 *
 * @param {number} y The scroll position.
 */
export function setScrollTop(y) {
  if (hot().view._wt.wtOverlays.scrollableElement === hot().rootWindow) {
    window.scrollTo(window.scrollX, y);
  } else {
    getMaster().find('.wtHolder')[0].scrollTop = y;
  }
}

/**
 * Moves the table's viewport to the specified x scroll position.
 *
 * @param {number} x The scroll position.
 */
export function setScrollLeft(x) {
  if (hot().view._wt.wtOverlays.scrollableElement === hot().rootWindow) {
    window.scrollTo(x, window.scrollY);
  } else {
    getMaster().find('.wtHolder')[0].scrollLeft = x;
  }
}

/**
 * Creates the Handsontable instance.
 *
 * @param {object} options The Handsontable options.
 * @param {boolean} explicitOptions If set to `true`, the options will be passed to the Handsontable instance as-is
 * and license key won't be added automatically.
 * @param {jQuery} container The root element where the Handsontable will be injected.
 * @returns {Handsontable}
 */
export function handsontable(options, explicitOptions = false, container = spec().$container) {
  const loadedTheme = spec().loadedTheme;

  // Add a license key to every Handsontable instance.
  if (!explicitOptions) {
    if (!options) {
      options = {};
    }

    if (
      !options.themeName &&
      loadedTheme &&
      loadedTheme !== 'classic'
    ) {
      options.themeName = `ht-theme-${spec().loadedTheme}`;
    }

    options.licenseKey = 'non-commercial-and-evaluation';
  }

  container.handsontable(options);

  return container.data('handsontable');
}

/**
 * As for v. 0.11 the only scrolling method is native scroll, which creates copies of main htCore table inside of the container.
 * Therefore, simple $(".htCore") will return more than one object. Most of the time, you're interested in the original
 * htCore, not the copies made by native scroll.
 *
 * This method returns the original htCore object.
 *
 * @returns {jQuery} The reference to the original htCore.
 */
export function getHtCore() {
  return spec().$container.find('.htCore').first();
}

/**
 * @returns {jQuery}
 */
export function getMaster() {
  return spec().$container.find('.ht_master');
}

/**
 * @returns {jQuery}
 */
export function getTopClone() {
  return spec().$container.find('.ht_clone_top');
}

/**
 * @returns {jQuery}
 */
export function getTopInlineStartClone() {
  return spec().$container.find('.ht_clone_top_inline_start_corner');
}

/**
 * @returns {jQuery}
 */
export function getInlineStartClone() {
  return spec().$container.find('.ht_clone_inline_start');
}

/**
 * @returns {jQuery}
 */
export function getBottomClone() {
  return spec().$container.find('.ht_clone_bottom');
}

/**
 * @returns {jQuery}
 */
export function getBottomInlineStartClone() {
  return spec().$container.find('.ht_clone_bottom_inline_start_corner');
}

/**
 * Emulates the browser's TAB navigation to the Handsontable (from element above).
 *
 * @param {Handsontable} hotInstance The Handsontable instance to apply the event.
 */
export function triggerTabNavigationFromTop(hotInstance = hot()) {
  $(hotInstance.rootElement).find('.htFocusCatcher').first().focus();
}

/**
 * Emulates the browser's Shift+TAB navigation to the Handsontable (from element below).
 *
 * @param {Handsontable} hotInstance The Handsontable instance to apply the event.
 */
export function triggerTabNavigationFromBottom(hotInstance = hot()) {
  $(hotInstance.rootElement).find('.htFocusCatcher').last().focus();
}

/**
 * Returns an instance of the CellCoords class.
 *
 * @param {number} row The row index.
 * @param {number} col The column index.
 * @returns {CellCoords}
 */
export function cellCoords(row, col) {
  return hot()._createCellCoords(row, col);
}

/**
 * Returns an instance of the CellRange class.
 *
 * @param {number} rowFrom The row start index of the range.
 * @param {number} colFrom The column start index.of the range.
 * @param {number} rowTo The row end index of the range.
 * @param {number} colTo The column end index of the range.
 * @param {number} [rowFocus] The row focus/highlight index.
 * @param {number} [colFocus] The column focus/highlight index.
 * @returns {CellRange}
 */
export function cellRange(rowFrom, colFrom, rowTo, colTo, rowFocus = rowFrom, colFocus = colFrom) {
  return hot()._createCellRange(
    hot()._createCellCoords(rowFocus, colFocus),
    hot()._createCellCoords(rowFrom, colFrom),
    hot()._createCellCoords(rowTo, colTo),
  );
}

/**
 * TODO: Rename me to countTD.
 *
 * @returns {number}
 */
export function countCells() {
  return getHtCore().find('tbody td').length;
}

/**
 * @param {number} columnIndex Visual column index.
 * @returns {HTMLTableCellElement}
 */
export function getColumnHeader(columnIndex = 0) {
  return hot().view._wt.wtTable.getColumnHeader(columnIndex);
}

/**
 * @param {HTMLElement} editableElement The element to check.
 * @returns {boolean}
 */
export function isEditorVisible(editableElement) {
  if (editableElement && !(editableElement.hasClass('handsontableInput') ||
      editableElement.hasClass('handsontableEditor'))) {
    throw new Error('Editable element of the editor was not found.');
  }

  const keyProxyHolder = (editableElement || keyProxy()).parent();

  if (keyProxyHolder.size() === 0) {
    return false;
  }
  const css = cssProp => keyProxyHolder.css(cssProp);

  return css('z-index') !== '-1' && css('top') !== '-9999px' && css('left') !== '-9999px';
}

/**
 * @returns {boolean}
 */
export function isFillHandleVisible() {
  return !!spec().$container.find('.wtBorder.corner:visible').length;
}

/**
 * @param {HTMLElement} cell The cell element to check.
 * @param {jQuery} container The Handsontable container element.
 * @returns {jQuery}
 */
export function getCorrespondingOverlay(cell, container) {
  const overlay = $(cell).parents('.handsontable');

  if (overlay[0] === container[0]) {
    return $('.ht_master');
  }

  return $(overlay[0]);
}

/**
 * Shows context menu.
 *
 * @param {HTMLElement} cell The cell element to check.
 * @param {Handsontable} [instance] The Handsontable instance.
 */
export function contextMenu(cell, instance) {
  const hotInstance = instance || spec().$container.data('handsontable');
  let clickedCell = cell;
  let selected = hotInstance.getSelectedLast();

  if (!clickedCell) {
    if (!selected) {
      hotInstance.selectCell(0, 0);
      selected = hotInstance.getSelectedLast();
    }

    clickedCell = hotInstance.getCell(selected[0], selected[1]);
  }

  const cellOffset = $(clickedCell).offset();

  $(clickedCell).simulate('mousedown', { button: 2 });
  $(clickedCell).simulate('contextmenu', {
    clientX: cellOffset.left - Handsontable.dom.getWindowScrollLeft(hotInstance.rootWindow),
    clientY: cellOffset.top - Handsontable.dom.getWindowScrollTop(hotInstance.rootWindow),
  });
}

/**
 * Opens and executes the context menu item action and closes the menu.
 *
 * @param {string} optionName The context menu item name to click.
 * @returns {HTMLElement}
 */
export function selectContextMenuOption(optionName) {
  const item = $('.htContextMenu .ht_master .htCore')
    .find(`tbody td:contains(${optionName})`);

  item.simulate('mouseenter')
    .simulate('mousedown')
    .simulate('mouseup')
    .simulate('click');

  return item;
}

/**
 * Open (and not close) the sub menu of the context menu.
 *
 * @param {string} submenuName The context menu item name (it has to be a submenu) to hover.
 * @param {HTMLElement} [cell] The cell element to check.
 */
export function openContextSubmenuOption(submenuName, cell) {
  contextMenu(cell);

  const item = $(`.htContextMenu .ht_master .htCore tbody td:contains(${submenuName})`);

  item
    .simulate('mouseenter')
    .simulate('mouseover');
}

/**
 * Open, execute the sub menu action and close the context menu.
 *
 * @param {string} submenuName The context menu item name (it has to be a submenu) to hover.
 * @param {string} optionName The context menu subitem name to click.
 * @param {HTMLElement} [cell] The cell element to check.
 */
export async function selectContextSubmenuOption(submenuName, optionName, cell) {
  openContextSubmenuOption(submenuName, cell);

  await sleep(300);

  const contextSubMenu = $(`.htContextMenuSub_${submenuName}`);
  const button = contextSubMenu.find(`.ht_master .htCore tbody td:contains(${optionName})`);

  button
    .simulate('mouseenter')
    .simulate('mousedown')
    .simulate('mouseup')
    .simulate('click');
  closeContextMenu();
}

/**
 * Closes the context menu.
 */
export function closeContextMenu() {
  $(document).simulate('mousedown');
}

/**
 * Shows dropdown menu.
 *
 * @param {number|HTMLTableCellElement} [columnIndexOrCell=0] The column index or TD element under which the dropdown menu is triggered.
 */
export function dropdownMenu(columnIndexOrCell = 0) {
  let th = columnIndexOrCell;

  if (!(columnIndexOrCell instanceof HTMLTableCellElement)) {
    const hotInstance = spec().$container.data('handsontable');

    th = hotInstance.view._wt.wtTable.getColumnHeader(columnIndexOrCell || 0);
  }

  const button = th.querySelector('.changeType');

  if (button) {
    $(button).simulate('mousedown');
    $(button).simulate('mouseup');
    $(button).simulate('click');
  }
}

/**
 * Opens and executes the dropdown menu item action and closes the menu.
 *
 * @param {string} optionName The dropdown menu item name to click.
 * @returns {HTMLElement}
 */
export function selectDropdownMenuOption(optionName) {
  const item = $('.htDropdownMenu .ht_master .htCore')
    .find(`tbody td:contains(${optionName})`);

  item
    .simulate('mouseenter')
    .simulate('mousedown')
    .simulate('mouseup')
    .simulate('click');

  return item;
}

/**
 * Open (and not close) the sub menu of the dropdown menu.
 *
 * @param {string} submenuName The dropdown menu item name (it has to be a submenu) to hover.
 * @param {HTMLElement} [cell] The cell element to check.
 */
export function openDropdownSubmenuOption(submenuName, cell) {
  dropdownMenu(cell);

  const item = $(`.htDropdownMenu .ht_master .htCore tbody td:contains(${submenuName})`);

  item
    .simulate('mouseenter')
    .simulate('mouseover');
}

/**
 * Opens the condition menu of the dropdown menu.
 *
 * @param {'first' | 'second'} menuName The menu name to select.
 */
export function openDropdownByConditionMenu(menuName = 'first') {
  $(conditionSelectRootElements()[menuName])
    .simulate('mouseenter')
    .simulate('mousedown')
    .simulate('mouseup')
    .simulate('click');
}

/**
 * Selects and executes the action of the condition menu of the dropdown menu.
 *
 * @param {string} optionName The condition menu item name to click.
 * @param {'first' | 'second'} menuName The menu name to select.
 * @returns {HTMLElement}
 */
export function selectDropdownByConditionMenuOption(optionName, menuName = 'first') {
  const item = $(conditionMenuRootElements()[menuName])
    .find('tbody td')
    .filter((index, element) => element.textContent === optionName);

  item
    .simulate('mouseenter')
    .simulate('mousedown')
    .simulate('mouseup')
    .simulate('click');

  return item;
}

/**
 * @returns {HTMLElement}
 */
export function dropdownMenuRootElement() {
  const plugin = hot().getPlugin('dropdownMenu');
  let root;

  if (plugin && plugin.menu) {
    root = plugin.menu.container;
  }

  return root;
}

/**
 * @param {Event} event The event object.
 * @returns {Event}
 */
export function serveImmediatePropagation(event) {
  if ((event !== null || event !== undefined)
    && (event.isImmediatePropagationEnabled === null || event.isImmediatePropagationEnabled === undefined)) {
    event.stopImmediatePropagation = function() {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function() {
      return !this.isImmediatePropagationEnabled;
    };
  }

  return event;
}

/**
 * @returns {jQuery}
 */
export function autocompleteEditor() {
  return spec().$container.find('.handsontableInput');
}

/**
 * Sets text cursor inside keyboard proxy.
 *
 * @param {number} pos The cursor position.
 */
export function setCaretPosition(pos) {
  const el = keyProxy()[0];

  if (el.setSelectionRange) {
    el.focus();
    el.setSelectionRange(pos, pos);

  } else if (el.createTextRange) {
    const range = el.createTextRange();

    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}

/**
 * Returns autocomplete instance.
 *
 * @returns {jQuery}
 */
export function autocomplete() {
  return spec().$container.find('.autocompleteEditor');
}

/**
 * Triggers paste string on current selection.
 *
 * @param {string} str The string to paste.
 */
export function triggerPaste(str) {
  spec().$container.data('handsontable').getPlugin('CopyPaste').paste(str);
}

/**
 * Returns column width for HOT container.
 *
 * @param {jQuery} $elem An element to calculate from.
 * @param {number} col The column index.
 * @returns {number}
 */
export function colWidth($elem, col) {
  const TR = $elem[0].querySelector('TBODY TR');
  let cell;

  if (TR) {
    cell = TR.querySelectorAll('TD')[col];
  } else {
    cell = $elem[0].querySelector('THEAD TR').querySelectorAll('TH')[col];
  }

  if (!cell) {
    throw new Error(`Cannot find table column of index '${col}'`);
  }

  return cell.offsetWidth;
}

/**
 * Returns row height for HOT container.
 *
 * @param {jQuery} $elem An element to calculate from.
 * @param {number} row The row index.
 * @returns {number}
 */
export function rowHeight($elem, row) {
  let TD;

  if (row >= 0) {
    TD = $elem[0].querySelector(`tbody tr:nth-child(${row + 1}) td`);
  } else {
    TD = $elem[0].querySelector(`thead tr:nth-child(${Math.abs(row)})`);
  }

  if (!TD) {
    throw new Error(`Cannot find table row of index '${row}'`);
  }

  return Handsontable.dom.outerHeight(TD);
}

/**
 * Returns value that has been rendered in table cell.
 *
 * @param {number} trIndex The visual index.
 * @param {number} tdIndex The visual index.
 * @returns {string}
 */
export function getRenderedValue(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).html();
}

/**
 * Returns nodes that have been rendered in table cell.
 *
 * @param {number} trIndex The visual index.
 * @param {number} tdIndex The visual index.
 * @returns {string}
 */
export function getRenderedContent(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).children();
}

/**
 * Create numerical data values for the table.
 *
 * @param {number} rowCount The number of rows to create.
 * @param {number} colCount The number of columns to create.
 * @returns {Array}
 */
export function createNumericData(rowCount, colCount) {
  const rowsMax = typeof rowCount === 'number' ? rowCount : 100;
  const columnsMax = typeof colCount === 'number' ? colCount : 4;
  const rows = [];
  let i;
  let j;

  for (i = 0; i < rowsMax; i++) {
    const row = [];

    for (j = 0; j < columnsMax; j++) {
      row.push((i + 1));
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Model factory, which creates object with private properties, accessible by setters and getters.
 * Created for the purpose of testing HOT with Backbone-like Models.
 *
 * @param {object} opts The model options.
 * @class
 */
export function Model(opts) {
  const obj = {};

  const _data = $.extend({
    id: undefined,
    name: undefined,
    address: undefined
  }, opts);

  obj.attr = function(name, value) {
    if (typeof value === 'undefined') {
      return this.get(name);
    }

    return this.set(name, value);
  };

  obj.get = function(name) {
    return _data[name];
  };

  obj.set = function(name, value) {
    _data[name] = value;

    return this;
  };

  return obj;
}

/**
 * Factory which produces an accessor for objects of type "Model" (see above).
 * This function should be used to create accessor for a given property name and pass it as `data` option in column
 * configuration.
 *
 * @param {string} name The name of the property for which an accessor function will be created.
 * @returns {Function}
 */
export function createAccessorForProperty(name) {
  return function(obj, value) {
    return obj.attr(name, value);
  };
}

/**
 * @param {number} renderableColumnIndex The renderable column index.
 * @param {number} width The target column width.
 */
export function resizeColumn(renderableColumnIndex, width) {
  const $container = spec().$container;
  const $th = getTopClone().find(`thead tr:eq(0) th:eq(${renderableColumnIndex})`);

  $th.simulate('mouseover');

  const $resizer = $container.find('.manualColumnResizer');
  const resizerPosition = $resizer.position();

  $resizer.simulate('mousedown', {
    clientX: resizerPosition.left,
  });

  const delta = width - $th.width() - 2;
  const newPosition = resizerPosition.left + delta;

  $resizer.simulate('mousemove', {
    clientX: newPosition
  });

  $resizer.simulate('mouseup');
}

/**
 * @param {number} renderableRowIndex The renderable row index.
 * @param {number} height The target row height.
 */
export function resizeRow(renderableRowIndex, height) {
  const $container = spec().$container;
  const $th = getInlineStartClone().find(`tbody tr:eq(${renderableRowIndex}) th:eq(0)`);
  const newHeight = renderableRowIndex !== 0 ? height + 1 : height; // compensate border

  $th.simulate('mouseover');

  const $resizer = $container.find('.manualRowResizer');
  const resizerPosition = $resizer.position();

  $resizer.simulate('mousedown', {
    clientY: resizerPosition.top
  });

  const delta = newHeight - $th.height() - 2;

  $resizer.simulate('mousemove', {
    clientY: resizerPosition.top + delta
  });

  $resizer.simulate('mouseup');
}

/**
 * @param {HTMLElement} container An container element that holds the DOM structure of the Handsontable.
 * @param {number} secondDisplayedRowIndex The visual row index.
 */
export function moveSecondDisplayedRowBeforeFirstRow(container, secondDisplayedRowIndex) {
  const $mainContainer = container.parents('.handsontable').not('[class*=clone]').not('[class*=master]').first();
  const $rowHeaders = container.find('tbody tr th');
  const $firstRowHeader = $rowHeaders.eq(secondDisplayedRowIndex - 1);
  const $secondRowHeader = $rowHeaders.eq(secondDisplayedRowIndex);

  $secondRowHeader.simulate('mouseover');
  const $manualRowMover = $mainContainer.find('.manualRowMover');

  if ($manualRowMover.length) {
    $manualRowMover.simulate('mousedown', {
      clientY: $manualRowMover[0].getBoundingClientRect().top
    });

    $manualRowMover.simulate('mousemove', {
      clientY: $manualRowMover[0].getBoundingClientRect().top - 20
    });

    $firstRowHeader.simulate('mouseover');
    $secondRowHeader.simulate('mouseup');
  }
}

/**
 * @param {HTMLElement} container An container element that holds the DOM structure of the Handsontable.
 * @param {number} firstDisplayedRowIndex The visual row index.
 */
export function moveFirstDisplayedRowAfterSecondRow(container, firstDisplayedRowIndex) {
  const $mainContainer = container.parents('.handsontable').not('[class*=clone]').not('[class*=master]').first();
  const $rowHeaders = container.find('tbody tr th');
  const $firstRowHeader = $rowHeaders.eq(firstDisplayedRowIndex);
  const $secondRowHeader = $rowHeaders.eq(firstDisplayedRowIndex + 1);

  $secondRowHeader.simulate('mouseover');
  const $manualRowMover = $mainContainer.find('.manualRowMover');

  if ($manualRowMover.length) {
    $manualRowMover.simulate('mousedown', {
      clientY: $manualRowMover[0].getBoundingClientRect().top
    });

    $manualRowMover.simulate('mousemove', {
      clientY: $manualRowMover[0].getBoundingClientRect().top + 20
    });

    $firstRowHeader.simulate('mouseover');
    $secondRowHeader.simulate('mouseup');
  }
}

/**
 * @param {HTMLElement} container An container element that holds the DOM structure of the Handsontable.
 * @param {number} from The visual column index.
 * @param {number} to The visual column index.
 */
export function swapDisplayedColumns(container, from, to) {
  const $mainContainer = container.parents('.handsontable').not('[class*=clone]').not('[class*=master]').first();
  const $colHeaders = container.find('thead tr:eq(0) th');
  const $to = $colHeaders.eq(to);
  const $from = $colHeaders.eq(from);

  // Enter the second column header
  $from.simulate('mouseover');
  const $manualColumnMover = $mainContainer.find('.manualColumnMover');

  // Grab the second column
  $manualColumnMover.simulate('mousedown', {
    pageX: $manualColumnMover[0].getBoundingClientRect().left,
  });

  // Drag the second column over the first column
  $manualColumnMover.simulate('mousemove', {
    pageX: $manualColumnMover[0].getBoundingClientRect().left - 20,
  });

  $to.simulate('mouseover');

  // Drop the second column
  $from.simulate('mouseup');
}

/**
 * Creates touch event and dispatch it for handled element.
 *
 * @param {number} x The page x coordinates.
 * @param {number} y The page y coordinates.
 * @param {HTMLElement} element An element for which event will be triggered.
 * @param {string} eventType Type of touch event, ie. 'touchstart', 'touchmove', 'touchend'.
 * @returns {Event} Returns the Event instance used to trigger the event.
 */
function sendTouchEvent(x, y, element, eventType) {
  const touchObj = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    radiusX: 2.5,
    radiusY: 2.5,
  });

  const touchEvent = new TouchEvent(eventType, {
    cancelable: true,
    bubbles: true,
    touches: eventType === 'touchend' ? [] : [touchObj],
    targetTouches: eventType === 'touchend' ? [] : [touchObj],
    changedTouches: [touchObj],
    shiftKey: false,
  });

  element.dispatchEvent(touchEvent);

  return touchEvent;
}

/**
 * @param {string} type A name/type of the event.
 * @param {HTMLElement} target The target element from the event was triggered.
 * @param {number} pageX The page x coordinates.
 * @param {number} pageY The page y coordinates.
 * @returns {Event} Returns the Event instance used to trigger the event.
 */
export function triggerTouchEvent(type, target, pageX, pageY) {
  const targetCoords = target.getBoundingClientRect();
  const targetPageX = pageX || parseInt(targetCoords.left, 10) + 3;
  const targetPageY = pageY || parseInt(targetCoords.top, 10) + 3;

  return sendTouchEvent(targetPageX, targetPageY, target, type);
}

/**
 * Emulates touch on handled HTML element.
 *
 * Note: Please keep in mind that this method doesn't reflects fully "native" behaviour.
 * Note: MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent)
 * says: "Browsers typically dispatch emulated mouse and click events when there is only a single active touch point.".
 * This method is working similar.
 *
 * @param {HTMLElement} target The target element from the event was triggered.
 */
export function simulateTouch(target) {
  const touchStartRun = triggerTouchEvent('touchstart', target);

  if (!touchStartRun.defaultPrevented) {
    const touchEndRun = triggerTouchEvent('touchend', target);

    // If the `preventDefault` is called for below event emulation doesn't reflects "native" behaviour.
    if (!touchEndRun.defaultPrevented) {
      $(target).simulate('mousedown');
      $(target).simulate('mouseup');
      $(target).simulate('click');
    }
  }
}

/**
 * Simulates the application of modern theme styles to a Handsontable context.
 *
 * @param {HTMLElement|jQuery} container - The container element to which the styles will be applied.
 */
export function simulateModernThemeStylesheet(container) {
  const element = container instanceof $ ? container.get(0) : container;

  element.style.setProperty('--ht-line-height', '17px');
  element.style.setProperty('--ht-cell-vertical-padding', '5px');
}

/**
 * Clears the modern theme styles simulation applied using the `simulateModernThemeStylesheet` method.
 *
 * @param {HTMLElement|jQuery} container - The container element.
 */
export function clearModernThemeStylesheetMock(container) {
  const element = container instanceof $ ? container.get(0) : container;

  element.style.removeProperty('--ht-line-height');
  element.style.removeProperty('--ht-cell-vertical-padding');
}

/**
 * Creates spreadsheet data as an array of arrays filled with spreadsheet-like label
 * values (e.q "A1", "A2"...).
 *
 * @param {*} args The arguments passed directly to the Handsontable helper.
 * @returns {Array}
 */
export function createSpreadsheetData(...args) {
  return Handsontable.helper.createSpreadsheetData(...args);
}

/**
 * Creates spreadsheet data as an array of objects filled with spreadsheet-like label
 * values (e.q "A1", "A2"...).
 *
 * @param {*} args The arguments passed directly to the Handsontable helper.
 * @returns {Array}
 */
export function createSpreadsheetObjectData(...args) {
  return Handsontable.helper.createSpreadsheetObjectData(...args);
}

/**
 * @returns {Event}
 */
export function getClipboardEvent() {
  const event = {};

  event.clipboardData = new DataTransferObject();
  event.preventDefault = () => { };

  return event;
}

class DataTransferObject {
  constructor() {
    this.data = {
      'text/plain': '',
      'text/html': ''
    };
  }
  getData(type = 'text/plain') {
    return this.data[type];
  }
  setData(type = 'text/plain', value) {
    this.data[type] = value;
  }
}
