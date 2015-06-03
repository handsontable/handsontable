var spec = function () {
  return jasmine.getEnv().currentSpec;
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

var getLeftClone = function () {
  return spec().$container.find('.ht_clone_left');
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
var contextMenu = function () {
  var hot = spec().$container.data('handsontable');
  var selected = hot.getSelected();

  if (!selected) {
    hot.selectCell(0, 0);
    selected = hot.getSelected();
  }

  var cell = getCell(selected[0], selected[1]);
  var cellOffset = $(cell).offset();


  $(cell).simulate('contextmenu',{
    clientX: cellOffset.left,
    clientY: cellOffset.top
  });
};

var closeContextMenu = function () {
  $(document).simulate('mousedown');
//  $(document).trigger('mousedown');
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
    ev.which = button || 1; //left click by default
    element.simulate(type,ev);
//    element.trigger(ev);
  }
};

var mouseDown = handsontableMouseTriggerFactory('mousedown');
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
var getCellMeta = handsontableMethodFactory('getCellMeta');
var setCellMeta = handsontableMethodFactory('setCellMeta');
var removeCellMeta = handsontableMethodFactory('removeCellMeta');
var getCellRenderer = handsontableMethodFactory('getCellRenderer');
var getCellEditor = handsontableMethodFactory('getCellEditor');
var getCellValidator = handsontableMethodFactory('getCellValidator');
var getData = handsontableMethodFactory('getData');
var getCopyableData = handsontableMethodFactory('getCopyableData');
var getDataAtCell = handsontableMethodFactory('getDataAtCell');
var getDataAtRowProp = handsontableMethodFactory('getDataAtRowProp');
var getDataAtRow = handsontableMethodFactory('getDataAtRow');
var getDataAtCol = handsontableMethodFactory('getDataAtCol');
var getSourceDataAtCol = handsontableMethodFactory('getSourceDataAtCol');
var getSourceDataAtRow = handsontableMethodFactory('getSourceDataAtRow');
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
  var height = Handsontable.Dom.outerHeight(TD);
  if(row == 0) {
    height = height - 2;
  }
  else {
    height = height - 1;
  }
  return height;
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
  }
}
