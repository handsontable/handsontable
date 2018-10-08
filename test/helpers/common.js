export function sleep(delay = 100) {
  return Promise.resolve({
    then(resolve) {
      setTimeout(resolve, delay);
    }
  });
}

export function promisfy(fn) {
  return new Promise((resolve, reject) => fn(resolve, reject));
}

/**
 * Calls a method in current Handsontable instance, returns its output
 * @param method
 * @return {Function}
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

export const addHook = handsontableMethodFactory('addHook');
export const alter = handsontableMethodFactory('alter');
export const colToProp = handsontableMethodFactory('colToProp');
export const countCols = handsontableMethodFactory('countCols');
export const countEmptyCols = handsontableMethodFactory('countEmptyCols');
export const countEmptyRows = handsontableMethodFactory('countEmptyRows');
export const countRows = handsontableMethodFactory('countRows');
export const countSourceCols = handsontableMethodFactory('countSourceCols');
export const countSourceRows = handsontableMethodFactory('countSourceRows');
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
export const getSourceData = handsontableMethodFactory('getSourceData');
export const getSourceDataArray = handsontableMethodFactory('getSourceDataArray');
export const getSourceDataAtCell = handsontableMethodFactory('getSourceDataAtCell');
export const getSourceDataAtCol = handsontableMethodFactory('getSourceDataAtCol');
export const getSourceDataAtRow = handsontableMethodFactory('getSourceDataAtRow');
export const getValue = handsontableMethodFactory('getValue');
export const loadData = handsontableMethodFactory('loadData');
export const populateFromArray = handsontableMethodFactory('populateFromArray');
export const propToCol = handsontableMethodFactory('propToCol');
export const removeCellMeta = handsontableMethodFactory('removeCellMeta');
export const render = handsontableMethodFactory('render');
export const selectAll = handsontableMethodFactory('selectAll');
export const selectCell = handsontableMethodFactory('selectCell');
export const selectCells = handsontableMethodFactory('selectCells');
export const selectColumns = handsontableMethodFactory('selectColumns');
export const selectRows = handsontableMethodFactory('selectRows');
export const setCellMeta = handsontableMethodFactory('setCellMeta');
export const setDataAtCell = handsontableMethodFactory('setDataAtCell');
export const setDataAtRowProp = handsontableMethodFactory('setDataAtRowProp');
export const spliceCellsMeta = handsontableMethodFactory('spliceCellsMeta');
export const spliceCol = handsontableMethodFactory('spliceCol');
export const spliceRow = handsontableMethodFactory('spliceRow');
export const updateSettings = handsontableMethodFactory('updateSettings');
export const undo = handsontableMethodFactory('undo');

export function hot() {
  return spec().$container.data('handsontable');
}

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
 * This method returns the original htCore object
 *
 * @returns {jqObject} reference to the original htCore
 */

export function getHtCore() {
  return spec().$container.find('.htCore').first();
}

export function getTopClone() {
  return spec().$container.find('.ht_clone_top');
}

export function getTopLeftClone() {
  return spec().$container.find('.ht_clone_top_left_corner');
}
// for compatybility
// const getCornerClone = getTopLeftClone;

export function getLeftClone() {
  return spec().$container.find('.ht_clone_left');
}

export function getBottomClone() {
  return spec().$container.find('.ht_clone_bottom');
}

export function getBottomLeftClone() {
  return spec().$container.find('.ht_clone_bottom_left_corner');
}

// Rename me to countTD
export function countCells() {
  return getHtCore().find('tbody td').length;
}

export function isEditorVisible(editableElement) {
  if (editableElement && !(editableElement.hasClass('handsontableInput') || editableElement.hasClass('handsontableEditor'))) {
    throw new Error('Editable element of the editor was not found.');
  }

  const keyProxyHolder = (editableElement || keyProxy()).parent();

  if (keyProxyHolder.size() === 0) {
    return false;
  }
  const css = cssProp => keyProxyHolder.css(cssProp);

  return css('z-index') !== '-1' && css('top') !== '-9999px' && css('left') !== '-9999px';
}

export function isFillHandleVisible() {
  return !!spec().$container.find('.wtBorder.corner:visible').length;
}

export function getCorrespondingOverlay(cell, container) {
  const overlay = $(cell).parents('.handsontable');

  if (overlay[0] === container[0]) {
    return $('.ht_master');
  }

  return $(overlay[0]);
}

/**
 * Shows context menu
 */
export function contextMenu(cell) {
  const hotInstance = spec().$container.data('handsontable');
  let clickedCell = cell;
  let selected = hotInstance.getSelectedLast();

  if (!selected) {
    hotInstance.selectCell(0, 0);
    selected = hotInstance.getSelectedLast();
  }
  if (!clickedCell) {
    clickedCell = getCell(selected[0], selected[1]);
  }
  const cellOffset = $(clickedCell).offset();

  $(clickedCell).simulate('mousedown', { button: 2 });
  $(clickedCell).simulate('contextmenu', {
    clientX: cellOffset.left - Handsontable.dom.getWindowScrollLeft(),
    clientY: cellOffset.top - Handsontable.dom.getWindowScrollTop(),
  });
  // Chrome doesn't call `mouseup`.
  // $(cell).simulate('mouseup', { button: 2 });
}

export function closeContextMenu() {
  $(document).simulate('mousedown');
  // $(document).trigger('mousedown');
}

/**
 * Shows dropdown menu
 */
export function dropdownMenu(columnIndex) {
  const hotInstance = spec().$container.data('handsontable');
  const th = hotInstance.view.wt.wtTable.getColumnHeader(columnIndex || 0);
  const button = th.querySelector('.changeType');

  if (button) {
    $(button).simulate('mousedown');
    $(button).simulate('click');
  }
}

export function closeDropdownMenu() {
  $(document).simulate('mousedown');
}

export function dropdownMenuRootElement() {
  const plugin = hot().getPlugin('dropdownMenu');
  let root;

  if (plugin && plugin.menu) {
    root = plugin.menu.container;
  }

  return root;
}

/**
 * Returns a function that triggers a mouse event
 * @param {String} type Event type
 * @return {Function}
 */
export function handsontableMouseTriggerFactory(type, button) {
  return function(element) {
    let handsontableElement = element;

    if (!(handsontableElement instanceof jQuery)) {
      handsontableElement = $(handsontableElement);
    }
    const ev = $.Event(type);
    ev.which = button || 1; // left click by default

    handsontableElement.simulate(type, ev);
  };
}

export const mouseDown = handsontableMouseTriggerFactory('mousedown');
export const mouseMove = handsontableMouseTriggerFactory('mousemove');
export const mouseOver = handsontableMouseTriggerFactory('mouseover');
export const mouseUp = handsontableMouseTriggerFactory('mouseup');

export function mouseDoubleClick(element) {
  mouseDown(element);
  mouseUp(element);
  mouseDown(element);
  mouseUp(element);
}

export const mouseRightDown = handsontableMouseTriggerFactory('mousedown', 3);
export const mouseRightUp = handsontableMouseTriggerFactory('mouseup', 3);

/**
 * Returns a function that triggers a key event
 * @param {String} type Event type
 * @return {Function}
 */
export function handsontableKeyTriggerFactory(type) {
  return function(key, extend) {
    const ev = {}; // $.Event(type);
    let keyToTrigger = key;

    if (typeof keyToTrigger === 'string') {
      if (keyToTrigger.indexOf('shift+') > -1) {
        keyToTrigger = keyToTrigger.substring(6);
        ev.shiftKey = true;
      }

      if (keyToTrigger.indexOf('ctrl+') > -1) {
        keyToTrigger = keyToTrigger.substring(5);
        ev.ctrlKey = true;
        ev.metaKey = true;
      }

      switch (keyToTrigger) {
        case 'tab':
          ev.keyCode = 9;
          break;

        case 'enter':
          ev.keyCode = 13;
          break;

        case 'esc':
          ev.keyCode = 27;
          break;

        case 'f2':
          ev.keyCode = 113;
          break;

        case 'arrow_left':
          ev.keyCode = 37;
          break;

        case 'arrow_up':
          ev.keyCode = 38;
          break;

        case 'arrow_right':
          ev.keyCode = 39;
          break;

        case 'arrow_down':
          ev.keyCode = 40;
          break;

        case 'ctrl':
          if (window.navigator.platform.includes('Mac')) {
            ev.keyCode = 91;
          } else {
            ev.keyCode = 17;
          }
          break;

        case 'shift':
          ev.keyCode = 16;
          break;

        case 'backspace':
          ev.keyCode = 8;
          break;

        case 'delete':
          ev.keyCode = 46;
          break;

        case 'space':
          ev.keyCode = 32;
          break;

        case 'x':
          ev.keyCode = 88;
          break;

        case 'c':
          ev.keyCode = 67;
          break;

        case 'v':
          ev.keyCode = 86;
          break;

        case 'a':
          ev.keyCode = 65;
          break;

        default:
          throw new Error(`Unrecognised key name: ${keyToTrigger}`);
      }

    } else if (typeof keyToTrigger === 'number') {
      ev.keyCode = keyToTrigger;
    }
    //    ev.originalEvent = {}; //needed as long Handsontable searches for event.originalEvent
    $.extend(ev, extend);
    $(document.activeElement).simulate(type, ev);
  };
}

export const keyDown = handsontableKeyTriggerFactory('keydown');
export const keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Presses keyDown, then keyUp
 */
export function keyDownUp(key, extend) {
  if (typeof key === 'string' && key.indexOf('shift+') > -1) {
    keyDown('shift');
  }

  keyDown(key, extend);
  keyUp(key, extend);

  if (typeof key === 'string' && key.indexOf('shift+') > -1) {
    keyUp('shift');
  }
}

/**
 * Returns current value of the keyboard proxy textarea
 * @return {String}
 */
export function keyProxy() {
  return spec().$container.find('textarea.handsontableInput');
}

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

export function autocompleteEditor() {
  return spec().$container.find('.handsontableInput');
}

/**
 * Sets text cursor inside keyboard proxy
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
 * Returns autocomplete instance
 */
export function autocomplete() {
  return spec().$container.find('.autocompleteEditor');
}

/**
 * Triggers paste string on current selection
 */
export function triggerPaste(str) {
  spec().$container.data('handsontable').getPlugin('CopyPaste').paste(str);
}

/**
 * Returns column width for HOT container
 * @param $elem
 * @param col
 * @returns {Number}
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
 * Returns row height for HOT container
 * @param $elem
 * @param row
 * @returns {Number}
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
 * Returns value that has been rendered in table cell
 * @param {Number} trIndex
 * @param {Number} tdIndex
 * @returns {String}
 */
export function getRenderedValue(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).html();
}

/**
 * Returns nodes that have been rendered in table cell
 * @param {Number} trIndex
 * @param {Number} tdIndex
 * @returns {String}
 */
export function getRenderedContent(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).children();
}

/**
 * Create numerical data values for the table
 * @param rowCount
 * @param colCount
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
 * Created for the purpose of testing HOT with Backbone-like Models
 * @param opts
 * @returns {{}}
 * @constructor
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
 * @param name - name of the property for which an accessor function will be created
 * @returns {Function}
 */
export function createAccessorForProperty(name) {
  return function(obj, value) {
    return obj.attr(name, value);
  };
}

export function resizeColumn(displayedColumnIndex, width) {
  const $container = spec().$container;
  const $th = $container.find(`thead tr:eq(0) th:eq(${displayedColumnIndex})`);

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

export function resizeRow(displayedRowIndex, height) {
  const $container = spec().$container;
  const $th = $container.find(`tbody tr:eq(${displayedRowIndex}) th:eq(0)`);

  $th.simulate('mouseover');

  const $resizer = $container.find('.manualRowResizer');
  const resizerPosition = $resizer.position();

  $resizer.simulate('mousedown', {
    clientY: resizerPosition.top
  });

  let delta = height - $th.height() - 2;

  if (delta < 0) {
    delta = 0;
  }

  $resizer.simulate('mousemove', {
    clientY: resizerPosition.top + delta
  });

  $resizer.simulate('mouseup');
}

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

export function triggerTouchEvent(type, target, pageX, pageY) {
  const e = document.createEvent('TouchEvent');
  const targetCoords = target.getBoundingClientRect();
  const targetPageX = pageX || parseInt(targetCoords.left + 3, 10);
  const targetPageY = pageY || parseInt(targetCoords.top + 3, 10);
  let touches;
  let targetTouches;
  let changedTouches;

  const touch = document.createTouch(window, target, 0, targetPageX, targetPageY, targetPageX, targetPageY);

  if (type === 'touchend') {
    touches = document.createTouchList();
    targetTouches = document.createTouchList();
    changedTouches = document.createTouchList(touch);
  } else {
    touches = document.createTouchList(touch);
    targetTouches = document.createTouchList(touch);
    changedTouches = document.createTouchList(touch);
  }

  e.initTouchEvent(type, true, true, window, null, 0, 0, 0, 0, false, false, false, false, touches, targetTouches, changedTouches, 1, 0);
  target.dispatchEvent(e);
}

export function createSpreadsheetData(...args) {
  return Handsontable.helper.createSpreadsheetData(...args);
}
