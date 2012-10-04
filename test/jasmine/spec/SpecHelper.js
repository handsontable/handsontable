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
 * Simulates keydown event on element
 * @string key
 */
var keyDown = function (key) {
  var spec = jasmine.getEnv().currentSpec;
  var keydown = $.Event('keydown');
  switch (key) {
    case 'tab':
      keydown.keyCode = 9;
      break;

    case 'enter':
      keydown.keyCode = 13;
      break;
  }
  spec.$keyboardProxy.trigger(keydown);
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