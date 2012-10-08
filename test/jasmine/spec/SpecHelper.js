var handsontable = function (options) {
  var spec = jasmine.getEnv().currentSpec;
  spec.$container.handsontable(options);
  spec.$keyboardProxy = spec.$container.find('textarea.handsontableInput');
};

var isEditorVisible = function () {
  var spec = jasmine.getEnv().currentSpec;
  var overflow = spec.$keyboardProxy.parent().css('overflow');
  if (overflow === 'visible') {
    return true;
  }
  else if (overflow !== 'hidden') {
    throw new Error("wrong overflow state of the editor");
  }
  return false;
};

var isFillHandleVisible = function () {
  return jasmine.getEnv().currentSpec.$container.find('.htFillHandle').is(':visible');
};

/**
 * Returns a function that triggers a key event
 * @param {String} type Event type
 * @return {Function}
 */
var handsontableKeyTriggerFactory = function (type) {
  return function (key) {
    var spec = jasmine.getEnv().currentSpec;
    var ev = $.Event(type);
    switch (key) {
      case 'tab':
        ev.keyCode = 9;
        break;

      case 'enter':
        ev.keyCode = 13;
        break;
    }
    spec.$keyboardProxy.trigger(ev);
  }
};

var keyDown = handsontableKeyTriggerFactory('keydown');
var keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Returns current value of the keyboard proxy textarea
 * @return {String}
 */
var keyProxy = function () {
  return jasmine.getEnv().currentSpec.$keyboardProxy.val();
};

/**
 * Returns autocomplete instance
 */
var autocomplete = function () {
  var spec = jasmine.getEnv().currentSpec;
  return spec.$container.find('.handsontableInput').data("typeahead");
};

/**
 * Calls a method in current Handsontable instance, returns its output
 * @param method
 * @return {Function}
 */

var handsontableMethodFactory = function (method) {
  return function () {
    var spec = jasmine.getEnv().currentSpec;
    var args = $.extend(true, [], arguments);
    args.unshift(method);
    return spec.$container.handsontable.apply(spec.$container, args);
  }
};

var selectCell = handsontableMethodFactory('selectCell');
var getSelected = handsontableMethodFactory('getSelected');
var setDataAtCell = handsontableMethodFactory('setDataAtCell');
var getCell = handsontableMethodFactory('getCell');
var getDataAtCell = handsontableMethodFactory('getDataAtCell');