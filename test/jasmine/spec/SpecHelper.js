var spec = function() {
  return jasmine.getEnv().currentSpec;
};

var handsontable = function (options) {
  var currentSpec = spec();
  currentSpec.$container.handsontable(options);
  currentSpec.$keyboardProxy = currentSpec.$container.find('textarea.handsontableInput');
};

var countCols = function() {
  return spec().$container.find('.htCore tbody tr:eq(0) td').length;
};

var countCells = function() {
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
  return spec().$container.find('.htFillHandle').is(':visible');
};

/**
 * Returns a function that triggers a key event
 * @param {String} type Event type
 * @return {Function}
 */
var handsontableKeyTriggerFactory = function (type) {
  return function (key) {
    var ev = $.Event(type);
    switch (key) {
      case 'tab':
        ev.keyCode = 9;
        break;

      case 'enter':
        ev.keyCode = 13;
        break;
    }
    spec().$keyboardProxy.trigger(ev);
  }
};

var keyDown = handsontableKeyTriggerFactory('keydown');
var keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Returns current value of the keyboard proxy textarea
 * @return {String}
 */
var keyProxy = function () {
  return spec().$keyboardProxy.val();
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
var getSelected = handsontableMethodFactory('getSelected');
var setDataAtCell = handsontableMethodFactory('setDataAtCell');
var getCell = handsontableMethodFactory('getCell');
var getDataAtCell = handsontableMethodFactory('getDataAtCell');