var spec = function () {
  return jasmine.getEnv().currentSpec;
};

var handsontable = function (options) {
  var currentSpec = spec();
  currentSpec.$container.handsontable(options);
  currentSpec.$keyboardProxy = currentSpec.$container.find('textarea.handsontableInput');
};

var countRows = function () {
  return spec().$container.find('.htCore tbody tr').length;
};

var countCols = function () {
  return spec().$container.find('.htCore tbody tr:eq(0) td').length;
};

var countCells = function () {
  return spec().$container.find('.htCore tbody td').length;
};

var isEditorVisible = function () {
  var overflow = spec().$keyboardProxy.parent().css('overflow');
  if (overflow === 'visible') {
    return true;
  }
  else if (overflow !== 'hidden') {
    throw new Error("wrong overflow state of the editor");
  }
  return false;
};

var isFillHandleVisible = function () {
  return !!spec().$container.find('.wtBorder.corner:visible').length;
};

var isAutocompleteVisible = function () {
  return spec().$keyboardProxy.data("typeahead").$menu.is(":visible");
};

/**
 * Shows context menu
 */
var contextMenu = function () {
  var ev = $.Event('contextmenu');
  ev.button = 2;
  var instance = spec().$container.data('handsontable');
  var selector = "#" + instance.rootElement.attr('id') + ' table, #' + instance.rootElement.attr('id') + ' div';
  $(selector).trigger(ev);
};

/**
 * Returns a function that triggers a key event
 * @param {String} type Event type
 * @return {Function}
 */
var handsontableKeyTriggerFactory = function (type) {
  return function (key) {
    var ev = $.Event(type);
    if (key.indexOf('shift+') > -1) {
      key = key.substring(6);
      ev.shiftKey = true;
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

      default:
        throw new Error('unknown key');
    }
    spec().$keyboardProxy.trigger(ev);
  }
};

var keyDown = handsontableKeyTriggerFactory('keydown');
var keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Presses keyDown, then keyUp
 */
var keyDownUp = function (key) {
  keyDown(key);
  keyUp(key);
};

/**
 * Returns current value of the keyboard proxy textarea
 * @return {String}
 */
var keyProxy = function () {
  return spec().$keyboardProxy.val();
};

/**
 * Sets text cursor inside keyboard proxy
 */
var setCaretPosition = function (pos) {
  var el = spec().$keyboardProxy[0];
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
  return spec().$container.find('.handsontableInput').data("typeahead");
};

/**
 * Calls a method in current Handsontable instance, returns its output
 * @param method
 * @return {Function}
 */

var handsontableMethodFactory = function (method) {
  return function () {
    var args = $.extend(true, [], arguments);
    args.unshift(method);
    return spec().$container.handsontable.apply(spec().$container, args);
  }
};

var selectCell = handsontableMethodFactory('selectCell');
var deselectCell = handsontableMethodFactory('deselectCell');
var getSelected = handsontableMethodFactory('getSelected');
var setDataAtCell = handsontableMethodFactory('setDataAtCell');
var getCell = handsontableMethodFactory('getCell');
var getData = handsontableMethodFactory('getData');
var getDataAtCell = handsontableMethodFactory('getDataAtCell');
var alter = handsontableMethodFactory('alter');
var loadData = handsontableMethodFactory('loadData');
var destroyEditor = handsontableMethodFactory('destroyEditor');
var setCellReadOnly = handsontableMethodFactory('setCellReadOnly');
var setCellEditable = handsontableMethodFactory('setCellEditable');
var render = handsontableMethodFactory('render');
var updateSettings = handsontableMethodFactory('updateSettings');