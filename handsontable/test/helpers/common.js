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
export const alter = handsontableMethodFactory('alter');
export const clear = handsontableMethodFactory('clear');
export const colToProp = handsontableMethodFactory('colToProp');
export const countCols = handsontableMethodFactory('countCols');
export const countEmptyCols = handsontableMethodFactory('countEmptyCols');
export const countEmptyRows = handsontableMethodFactory('countEmptyRows');
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
export const getCoords = handsontableMethodFactory('getCoords');
export const getCopyableData = handsontableMethodFactory('getCopyableData');
export const getCopyableText = handsontableMethodFactory('getCopyableText');
export const getData = handsontableMethodFactory('getData');
export const getDataAtCell = handsontableMethodFactory('getDataAtCell');
export const getDataAtCol = handsontableMethodFactory('getDataAtCol');
export const getDataAtRow = handsontableMethodFactory('getDataAtRow');
export const getDataAtRowProp = handsontableMethodFactory('getDataAtRowProp');
export const getDataType = handsontableMethodFactory('getDataType');
export const getInstance = handsontableMethodFactory('getInstance');
export const getPlugin = handsontableMethodFactory('getPlugin');
export const getRowHeader = handsontableMethodFactory('getRowHeader');
export const getSelected = handsontableMethodFactory('getSelected');
export const getSelectedLast = handsontableMethodFactory('getSelectedLast');
export const getSelectedRange = handsontableMethodFactory('getSelectedRange');
export const getSelectedRangeLast = handsontableMethodFactory('getSelectedRangeLast');
export const getSettings = handsontableMethodFactory('getSettings');
export const getSourceData = handsontableMethodFactory('getSourceData');
export const getSourceDataArray = handsontableMethodFactory('getSourceDataArray');
export const getSourceDataAtCell = handsontableMethodFactory('getSourceDataAtCell');
export const getSourceDataAtCol = handsontableMethodFactory('getSourceDataAtCol');
export const getSourceDataAtRow = handsontableMethodFactory('getSourceDataAtRow');
export const getValue = handsontableMethodFactory('getValue');
export const isListening = handsontableMethodFactory('isListening');
export const listen = handsontableMethodFactory('listen');
export const loadData = handsontableMethodFactory('loadData');
export const populateFromArray = handsontableMethodFactory('populateFromArray');
export const propToCol = handsontableMethodFactory('propToCol');
export const redo = handsontableMethodFactory('redo');
export const refreshDimensions = handsontableMethodFactory('refreshDimensions');
export const removeCellMeta = handsontableMethodFactory('removeCellMeta');
export const render = handsontableMethodFactory('render');
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
export const undo = handsontableMethodFactory('undo');
export const updateSettings = handsontableMethodFactory('updateSettings');
export const validateCell = handsontableMethodFactory('validateCell');
export const validateCells = handsontableMethodFactory('validateCells');

const specContext = {};

beforeEach(function() {
  specContext.spec = this;
});
afterEach(() => {
  specContext.spec = null;
});

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
 * Creates the Handsontable instance.
 *
 * @param {object} options The Handsontale options.
 * @returns {Handsontable}
 */
export function handsontable(options) {
  const currentSpec = spec();

  currentSpec.$container.handsontable(options);
  currentSpec.$container[0].focus(); // otherwise TextEditor tests do not pass in IE8

  return currentSpec.$container.data('handsontable');
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
export function getTopLeftClone() {
  return spec().$container.find('.ht_clone_top_left_corner');
}

/**
 * @returns {jQuery}
 */
export function getLeftClone() {
  return spec().$container.find('.ht_clone_left');
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
export function getBottomLeftClone() {
  return spec().$container.find('.ht_clone_bottom_left_corner');
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
 * Shows context menu.
 *
 * @param {string} submenuName The context menu item name (it has to be a submenu) to hover.
 * @param {string} optionName The context menu subitem name to click.
 * @param {HTMLElement} [cell] The cell element to check.
 */
export async function selectContextSubmenuOption(submenuName, optionName, cell) {
  contextMenu(cell);

  const item = $(`.htContextMenu .ht_master .htCore tbody td:contains(${submenuName})`);

  item.simulate('mouseover');

  await sleep(300);

  const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
  const button = contextSubMenu.find(`.ht_master .htCore tbody td:contains(${optionName})`);

  button.simulate('mousedown').simulate('mouseup');
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
 * @param {number} columnIndex The column index under which the dropdown menu is triggered.
 */
export function dropdownMenu(columnIndex) {
  const hotInstance = spec().$container.data('handsontable');
  const th = hotInstance.view.wt.wtTable.getColumnHeader(columnIndex || 0);
  const button = th.querySelector('.changeType');

  if (button) {
    $(button).simulate('mousedown');
    $(button).simulate('mouseup');
    $(button).simulate('click');
  }
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
  if ((event !== null || event !== void 0)
    && (event.isImmediatePropagationEnabled === null || event.isImmediatePropagationEnabled === void 0)) {
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
  const $th = getLeftClone().find(`tbody tr:eq(${renderableRowIndex}) th:eq(0)`);
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
