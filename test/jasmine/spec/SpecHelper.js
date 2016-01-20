var spec = function () {
  return jasmine.getEnv().currentSpec;
};

var hot = function() {
  return spec().$container.data('handsontable');
};

var handsontable = function (options) {
  var currentSpec = spec();
  currentSpec.$container.handsontable(options);
  currentSpec.$container[0].focus(); //otherwise TextEditor tests do not pass in IE8
  return currentSpec.$container.data('handsontable');
};

beforeEach(function () {
  var matchers = {
    toBeInArray: function (arr) {
      return ($.inArray(this.actual, arr) > -1);
    },
    toBeFunction: function () {
      return typeof this.actual === 'function';
    },
    toBeAroundValue: function (val) {
      this.message = function (val) {
        return [
          "Expected " + this.actual + " to be around " + val + " (between " + (val - 1) + " and " + (val + 1) + ")",
          "Expected " + this.actual + " NOT to be around " + val + " (between " + (val - 1) + " and " + (val + 1) + ")"
        ];
      };
      return (this.actual >= val - 1 && this.actual <= val + 1);
    }
  };

  this.addMatchers(matchers);

  if (document.activeElement && document.activeElement != document.body) {
    document.activeElement.blur();
  } else if (!document.activeElement) { // IE
    document.body.focus();
  }
});

/**
 * As for v. 0.11 the only scrolling method is native scroll, which creates copies of main htCore table inside of the container.
 * Therefore, simple $(".htCore") will return more than one object. Most of the time, you're interested in the original
 * htCore, not the copies made by native scroll.
 *
 * This method returns the original htCore object
 *
 * @returns {jqObject} reference to the original htCore
 */

var getHtCore = function () {
  return spec().$container.find('.htCore').first();
};

var getTopClone = function () {
  return spec().$container.find('.ht_clone_top');
};

var getTopLeftClone = function () {
  return spec().$container.find('.ht_clone_top_left_corner');
};
// for compatybility
var getCornerClone = getTopLeftClone;

var getLeftClone = function () {
  return spec().$container.find('.ht_clone_left');
};

var getBottomClone = function () {
  return spec().$container.find('.ht_clone_bottom');
};

var getBottomLeftClone = function () {
  return spec().$container.find('.ht_clone_bottom_left_corner');
};

//Rename me to countTD
var countCells = function () {
  return getHtCore().find('tbody td').length;
};

var isEditorVisible = function () {
  return !!(keyProxy().is(':visible') && keyProxy().parent().is(':visible') && !keyProxy().parent().is('.htHidden'));
};

var isFillHandleVisible = function () {
  return !!spec().$container.find('.wtBorder.corner:visible').length;
};

var getCorrespondingOverlay = function (cell, container) {
  var overlay = $(cell).parents(".handsontable");
  if(overlay[0] == container[0]) {
    return $(".ht_master");
  } else {
    return $(overlay[0]);
  }
};


/**
 * Shows context menu
 */
var contextMenu = function (cell) {
  var hot = spec().$container.data('handsontable');
  var selected = hot.getSelected();

  if (!selected) {
    hot.selectCell(0, 0);
    selected = hot.getSelected();
  }
  if (!cell) {
    cell = getCell(selected[0], selected[1]);
  }
  var cellOffset = $(cell).offset();

  $(cell).simulate('contextmenu',{
    clientX: cellOffset.left - Handsontable.dom.getWindowScrollLeft(),
    clientY: cellOffset.top - Handsontable.dom.getWindowScrollTop(),
  });
};

var closeContextMenu = function () {
  $(document).simulate('mousedown');
//  $(document).trigger('mousedown');
};


/**
 * Shows dropdown menu
 */
var dropdownMenu = function (columnIndex) {
  var hot = spec().$container.data('handsontable');
  var th = hot.view.wt.wtTable.getColumnHeader(columnIndex || 0);
  var button = th.querySelector('.changeType');

  if (button) {
    $(button).simulate('mousedown');
    $(button).simulate('click');
  }
};

var closeDropdownMenu = function () {
  $(document).simulate('mousedown');
};

var dropdownMenuRootElement = function () {
  var plugin = hot().getPlugin('dropdownMenu');
  var root;

  if (plugin && plugin.menu) {
    root = plugin.menu.container;
  }

  return root;
};

/**
 * Returns a function that triggers a mouse event
 * @param {String} type Event type
 * @return {Function}
 */
var handsontableMouseTriggerFactory = function (type, button) {
  return function (element) {
    if (!(element instanceof jQuery)) {
      element = $(element);
    }
    var ev = $.Event(type);
    ev.which = button || 1; // left click by default

    element.simulate(type, ev);
  }
};

var mouseDown = handsontableMouseTriggerFactory('mousedown');
var mouseMove = handsontableMouseTriggerFactory('mousemove');
var mouseOver = handsontableMouseTriggerFactory('mouseover');
var mouseUp = handsontableMouseTriggerFactory('mouseup');
var mouseDoubleClick = function (element) {
  mouseDown(element);
  mouseUp(element);
  mouseDown(element);
  mouseUp(element);
};

var mouseRightDown = handsontableMouseTriggerFactory('mousedown', 3);
var mouseRightUp = handsontableMouseTriggerFactory('mouseup', 3);

/**
 * Returns a function that triggers a key event
 * @param {String} type Event type
 * @return {Function}
 */
var handsontableKeyTriggerFactory = function (type) {
  return function (key, extend) {
    var ev = {};// $.Event(type);

    if (typeof key === 'string') {
      if (key.indexOf('shift+') > -1) {
        key = key.substring(6);
        ev.shiftKey = true;
      }

      if (key.indexOf('ctrl+') > -1) {
        key = key.substring(5);
        ev.ctrlKey = true;
        ev.metaKey = true;
      }

      switch (key) {
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
          ev.keyCode = 17;
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

        default:
          throw new Error('Unrecognised key name: ' + key);
      }
    }
    else if (typeof key === 'number') {
      ev.keyCode = key;
    }


//    ev.originalEvent = {}; //needed as long Handsontable searches for event.originalEvent
    $.extend(ev, extend);
    $(document.activeElement).simulate(type, ev);
  }
};

var keyDown = handsontableKeyTriggerFactory('keydown');
var keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Presses keyDown, then keyUp
 */
var keyDownUp = function (key, extend) {
  if (typeof key === 'string' && key.indexOf('shift+') > -1) {
    keyDown('shift');
  }

  keyDown(key, extend);
  keyUp(key, extend);

  if (typeof key === 'string' && key.indexOf('shift+') > -1) {
    keyUp('shift');
  }
};

/**
 * Returns current value of the keyboard proxy textarea
 * @return {String}
 */
var keyProxy = function () {
  return spec().$container.find('textarea.handsontableInput');
};

var serveImmediatePropagation = function (event) {
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function () {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function () {
      return !this.isImmediatePropagationEnabled;
    };
  }
  return event;
};

var triggerTouchEvent = function (type, target, pageX, pageY) {
  var e = document.createEvent('TouchEvent');
  var targetCoords = target.getBoundingClientRect();
  var touches
    , targetTouches
    , changedTouches;

  if(!pageX && !pageY) {
    pageX = parseInt(targetCoords.left + 3,10);
    pageY = parseInt(targetCoords.top + 3,10);
  }

  var touch = document.createTouch(window, target, 0, pageX, pageY, pageX, pageY);

  if (type == 'touchend') {
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
};

var autocompleteEditor = function () {
  return spec().$container.find('.handsontableInput');
};

/**
 * Sets text cursor inside keyboard proxy
 */
var setCaretPosition = function (pos) {
  var el = keyProxy()[0];
  if (el.setSelectionRange) {
    el.focus();
    el.setSelectionRange(pos, pos);
  }
  else if (el.createTextRange) {
    var range = el.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
};

/**
 * Returns autocomplete instance
 */
var autocomplete = function () {
  return spec().$container.find('.autocompleteEditor');
};

/**
 * Triggers paste string on current selection
 */
var triggerPaste = function (str) {
  spec().$container.data('handsontable').copyPaste.triggerPaste(null, str);
};

/**
 * Calls a method in current Handsontable instance, returns its output
 * @param method
 * @return {Function}
 */

var handsontableMethodFactory = function (method) {
  return function () {

    var instance;
    try{
      instance = spec().$container.handsontable('getInstance');
    } catch (err) {
      console.error(err);
    }

    if (!instance) {
      if (method === 'destroy') {
        return; //we can forgive this... maybe it was destroyed in the test
      }
      throw new Error('Something wrong with the test spec: Handsontable instance not found');
    } else {
      if (method === 'destroy') {
        spec().$container.removeData();
      }
    }

    return instance[method].apply(instance, arguments);
  }
};

var getInstance = handsontableMethodFactory('getInstance');
var countRows = handsontableMethodFactory('countRows');
var countCols = handsontableMethodFactory('countCols');
var selectCell = handsontableMethodFactory('selectCell');
var deselectCell = handsontableMethodFactory('deselectCell');
var getSelected = handsontableMethodFactory('getSelected');
var setDataAtCell = handsontableMethodFactory('setDataAtCell');
var setDataAtRowProp = handsontableMethodFactory('setDataAtRowProp');
var getCell = handsontableMethodFactory('getCell');
var getCellsMeta = handsontableMethodFactory('getCellsMeta');
var getCellMeta = handsontableMethodFactory('getCellMeta');
var setCellMeta = handsontableMethodFactory('setCellMeta');
var removeCellMeta = handsontableMethodFactory('removeCellMeta');
var getCellRenderer = handsontableMethodFactory('getCellRenderer');
var getCellEditor = handsontableMethodFactory('getCellEditor');
var getCellValidator = handsontableMethodFactory('getCellValidator');
var getData = handsontableMethodFactory('getData');
var getCopyableData = handsontableMethodFactory('getCopyableData');
var getCopyableText = handsontableMethodFactory('getCopyableText');
var getDataAtCell = handsontableMethodFactory('getDataAtCell');
var getDataAtRowProp = handsontableMethodFactory('getDataAtRowProp');
var getDataAtRow = handsontableMethodFactory('getDataAtRow');
var getDataAtCol = handsontableMethodFactory('getDataAtCol');
var getDataType = handsontableMethodFactory('getDataType');
var getSourceData = handsontableMethodFactory('getSourceData');
var getSourceDataAtCol = handsontableMethodFactory('getSourceDataAtCol');
var getSourceDataAtRow = handsontableMethodFactory('getSourceDataAtRow');
var getValue = handsontableMethodFactory('getValue');
var getRowHeader = handsontableMethodFactory('getRowHeader');
var getColHeader = handsontableMethodFactory('getColHeader');
var alter = handsontableMethodFactory('alter');
var spliceCol = handsontableMethodFactory('spliceCol');
var spliceRow = handsontableMethodFactory('spliceRow');
var populateFromArray = handsontableMethodFactory('populateFromArray');
var loadData = handsontableMethodFactory('loadData');
var destroyEditor = handsontableMethodFactory('destroyEditor');
var render = handsontableMethodFactory('render');
var updateSettings = handsontableMethodFactory('updateSettings');
var destroy = handsontableMethodFactory('destroy');
var addHook = handsontableMethodFactory('addHook');
var getActiveEditor = handsontableMethodFactory('getActiveEditor');

/**
 * Returns column width for HOT container
 * @param $elem
 * @param col
 * @returns {Number}
 */
function colWidth($elem, col) {
  var TD = $elem[0].querySelector('TBODY TR').querySelectorAll('TD')[col];
  if (!TD) {
    throw new Error("Cannot find table column of index '" + col + "'");
  }
  return TD.offsetWidth;
}

/**
 * Returns row height for HOT container
 * @param $elem
 * @param row
 * @returns {Number}
 */
function rowHeight($elem, row) {
  var TD = $elem[0].querySelector('tbody tr:nth-child(' + (row + 1) +') td');
  if (!TD) {
    throw new Error("Cannot find table row of index '" + row + "'");
  }

  return Handsontable.Dom.outerHeight(TD);
}

/**
 * Returns value that has been rendered in table cell
 * @param {Number} trIndex
 * @param {Number} tdIndex
 * @returns {String}
 */
function getRenderedValue(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).html();
}

/**
 * Returns nodes that have been rendered in table cell
 * @param {Number} trIndex
 * @param {Number} tdIndex
 * @returns {String}
 */
function getRenderedContent(trIndex, tdIndex) {
  return spec().$container.find('tbody tr').eq(trIndex).find('td').eq(tdIndex).children()
}

/**
 * Create numerical data values for the table
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
function createNumericData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
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
function Model(opts) {

  var obj = {};

  var _data = $.extend({
    id: undefined,
    name: undefined,
    address: undefined
  }, opts);

  obj.attr = function (name, value) {
    if (typeof value == 'undefined') {
      return this.get(name);
    } else {
      return this.set(name, value);
    }
  };

  obj.get = function (name) {
    return _data[name];
  };

  obj.set = function (name, value) {
    _data[name] = value;
    return this;
  }

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
function createAccessorForProperty(name) {
  return function (obj, value) {
    return obj.attr(name, value);
  };
}

function resizeColumn(displayedColumnIndex, width) {
  var $container = spec().$container;
  var $th = $container.find('thead tr:eq(0) th:eq(' + displayedColumnIndex +')');

  $th.simulate('mouseover');

  var $resizer = $container.find('.manualColumnResizer');
  var resizerPosition = $resizer.position();

  $resizer.simulate('mousedown',{
    clientX: resizerPosition.left
  });


  var delta = width - $th.width() - 2;
  var newPosition = resizerPosition.left + delta;
  $resizer.simulate('mousemove',
    {clientX: newPosition}
  );

  $resizer.simulate('mouseup');
}

function resizeRow(displayedRowIndex, height) {

  var $container = spec().$container;
  var $th = $container.find('tbody tr:eq(' + displayedRowIndex + ') th:eq(0)');

  $th.simulate('mouseover');

  var $resizer = $container.find('.manualRowResizer');
  var resizerPosition = $resizer.position();

  $resizer.simulate('mousedown',{
    clientY: resizerPosition.top
  });

  var delta = height - $th.height() - 2;

  if (delta < 0) {
    delta = 0;
  }

  $resizer.simulate('mousemove',{
    clientY: resizerPosition.top + delta
  });

  $resizer.simulate('mouseup');
}

function moveSecondDisplayedRowBeforeFirstRow(container, secondDisplayedRowIndex) {
  var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first(),
    $rowHeaders = container.find('tbody tr th'),
    $firstRowHeader = $rowHeaders.eq(secondDisplayedRowIndex - 1),
    $secondRowHeader = $rowHeaders.eq(secondDisplayedRowIndex);

  $secondRowHeader.simulate('mouseover');
  var $manualRowMover = $mainContainer.find('.manualRowMover');

  if ($manualRowMover.length) {
    $manualRowMover.simulate('mousedown',{
      clientY: $manualRowMover[0].getBoundingClientRect().top
    });

    $manualRowMover.simulate('mousemove',{
      clientY:$manualRowMover[0].getBoundingClientRect().top - 20
    });

    $firstRowHeader.simulate('mouseover');
    $secondRowHeader.simulate('mouseup');
  }
}

function moveFirstDisplayedRowAfterSecondRow(container, firstDisplayedRowIndex) {
  var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first(),
    $rowHeaders = container.find('tbody tr th'),
    $firstRowHeader = $rowHeaders.eq(firstDisplayedRowIndex),
    $secondRowHeader = $rowHeaders.eq(firstDisplayedRowIndex + 1);

  $secondRowHeader.simulate('mouseover');
  var $manualRowMover = $mainContainer.find('.manualRowMover');

  if($manualRowMover.length) {
    $manualRowMover.simulate('mousedown',{
      clientY: $manualRowMover[0].getBoundingClientRect().top
    });

    $manualRowMover.simulate('mousemove',{
      clientY:$manualRowMover[0].getBoundingClientRect().top + 20
    });

    $firstRowHeader.simulate('mouseover');
    $secondRowHeader.simulate('mouseup');
  }
}

function moveSecondDisplayedColumnBeforeFirstColumn(container, secondDisplayedColIndex){
  var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first();
  var $colHeaders = container.find('thead tr:eq(0) th');
  var $firstColHeader = $colHeaders.eq(secondDisplayedColIndex - 1);
  var $secondColHeader = $colHeaders.eq(secondDisplayedColIndex);

  //Enter the second column header
  $secondColHeader.simulate('mouseover');
  var $manualColumnMover = $mainContainer.find('.manualColumnMover');

  //Grab the second column
  $manualColumnMover.simulate('mousedown',{
    pageX : $manualColumnMover[0].getBoundingClientRect().left
  });

  //Drag the second column over the first column
  $manualColumnMover.simulate('mousemove',{
    pageX : $manualColumnMover[0].getBoundingClientRect().left - 20
  });

  $firstColHeader.simulate('mouseover');

  //Drop the second column
  $secondColHeader.simulate('mouseup');
}

function moveFirstDisplayedColumnAfterSecondColumn(container, firstDisplayedColIndex){
  var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first();
  var $colHeaders = container.find('thead tr:eq(0) th');
  var $firstColHeader = $colHeaders.eq(firstDisplayedColIndex);
  var $secondColHeader = $colHeaders.eq(firstDisplayedColIndex + 1);

  //Enter the first column header
  $firstColHeader.simulate('mouseover');
  var $manualColumnMover = $mainContainer.find('.manualColumnMover');

  //Grab the first column
  $manualColumnMover.simulate('mousedown',{
    pageX:$manualColumnMover[0].getBoundingClientRect().left
  });

  //Drag the first column over the second column
  $manualColumnMover.simulate('mousemove',{
    pageX:$manualColumnMover[0].getBoundingClientRect().left + 20
  });

  $secondColHeader.simulate('mouseover');

  //Drop the first column
  $firstColHeader.simulate('mouseup');
}
