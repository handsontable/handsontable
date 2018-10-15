'use strict';

exports.__esModule = true;

var _element = require('./../helpers/dom/element');

var _string = require('./../helpers/string');

var _eventManager = require('./../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _unicode = require('./../helpers/unicode');

var _function = require('./../helpers/function');

var _event = require('./../helpers/dom/event');

var _index = require('./index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isListeningKeyDownEvent = new WeakMap();
var isCheckboxListenerAdded = new WeakMap();
var BAD_VALUE_CLASS = 'htBadValue';

/**
 * Checkbox renderer
 *
 * @private
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */
function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
  for (var _len = arguments.length, args = Array(_len > 7 ? _len - 7 : 0), _key = 7; _key < _len; _key++) {
    args[_key - 7] = arguments[_key];
  }

  (0, _index.getRenderer)('base').apply(this, [instance, TD, row, col, prop, value, cellProperties].concat(args));
  registerEvents(instance);

  var input = createInput();
  var labelOptions = cellProperties.label;
  var badValue = false;

  if (typeof cellProperties.checkedTemplate === 'undefined') {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === 'undefined') {
    cellProperties.uncheckedTemplate = false;
  }

  (0, _element.empty)(TD); // TODO identify under what circumstances this line can be removed

  if (value === cellProperties.checkedTemplate || (0, _string.equalsIgnoreCase)(value, cellProperties.checkedTemplate)) {
    input.checked = true;
  } else if (value === cellProperties.uncheckedTemplate || (0, _string.equalsIgnoreCase)(value, cellProperties.uncheckedTemplate)) {
    input.checked = false;
  } else if (value === null) {
    // default value
    (0, _element.addClass)(input, 'noValue');
  } else {
    input.style.display = 'none';
    (0, _element.addClass)(input, BAD_VALUE_CLASS);
    badValue = true;
  }

  input.setAttribute('data-row', row);
  input.setAttribute('data-col', col);

  if (!badValue && labelOptions) {
    var labelText = '';

    if (labelOptions.value) {
      labelText = typeof labelOptions.value === 'function' ? labelOptions.value.call(this, row, col, prop, value) : labelOptions.value;
    } else if (labelOptions.property) {
      labelText = instance.getDataAtRowProp(row, labelOptions.property);
    }
    var label = createLabel(labelText);

    if (labelOptions.position === 'before') {
      label.appendChild(input);
    } else {
      label.insertBefore(input, label.firstChild);
    }
    input = label;
  }

  TD.appendChild(input);

  if (badValue) {
    TD.appendChild(document.createTextNode('#bad-value#'));
  }

  if (!isListeningKeyDownEvent.has(instance)) {
    isListeningKeyDownEvent.set(instance, true);
    instance.addHook('beforeKeyDown', onBeforeKeyDown);
  }

  /**
   * On before key down DOM listener.
   *
   * @private
   * @param {Event} event
   */
  function onBeforeKeyDown(event) {
    var toggleKeys = 'SPACE|ENTER';
    var switchOffKeys = 'DELETE|BACKSPACE';
    var isKeyCode = (0, _function.partial)(_unicode.isKey, event.keyCode);

    if (isKeyCode(toggleKeys + '|' + switchOffKeys) && !(0, _event.isImmediatePropagationStopped)(event)) {
      eachSelectedCheckboxCell(function () {
        (0, _event.stopImmediatePropagation)(event);
        event.preventDefault();
      });
    }
    if (isKeyCode(toggleKeys)) {
      changeSelectedCheckboxesState();
    }
    if (isKeyCode(switchOffKeys)) {
      changeSelectedCheckboxesState(true);
    }
  }

  /**
   * Change checkbox checked property
   *
   * @private
   * @param {Boolean} [uncheckCheckbox=false]
   */
  function changeSelectedCheckboxesState() {
    var uncheckCheckbox = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var selRange = instance.getSelectedRangeLast();

    if (!selRange) {
      return;
    }

    var _selRange$getTopLeftC = selRange.getTopLeftCorner(),
        startRow = _selRange$getTopLeftC.row,
        startColumn = _selRange$getTopLeftC.col;

    var _selRange$getBottomRi = selRange.getBottomRightCorner(),
        endRow = _selRange$getBottomRi.row,
        endColumn = _selRange$getBottomRi.col;

    var changes = [];

    for (var visualRow = startRow; visualRow <= endRow; visualRow += 1) {
      for (var visualColumn = startColumn; visualColumn <= endColumn; visualColumn += 1) {
        var cachedCellProperties = instance.getCellMeta(visualRow, visualColumn);

        if (cachedCellProperties.type !== 'checkbox') {
          return;
        }

        /* eslint-disable no-continue */
        if (cachedCellProperties.readOnly === true) {
          continue;
        }

        if (typeof cachedCellProperties.checkedTemplate === 'undefined') {
          cachedCellProperties.checkedTemplate = true;
        }
        if (typeof cachedCellProperties.uncheckedTemplate === 'undefined') {
          cachedCellProperties.uncheckedTemplate = false;
        }

        var dataAtCell = instance.getDataAtCell(visualRow, visualColumn);

        if (uncheckCheckbox === false) {
          if ([cachedCellProperties.checkedTemplate, cachedCellProperties.checkedTemplate.toString()].includes(dataAtCell)) {
            changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate]);
          } else if ([cachedCellProperties.uncheckedTemplate, cachedCellProperties.uncheckedTemplate.toString(), null, void 0].includes(dataAtCell)) {
            changes.push([visualRow, visualColumn, cachedCellProperties.checkedTemplate]);
          }
        } else {
          changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate]);
        }
      }
    }

    if (changes.length > 0) {
      instance.setDataAtCell(changes);
    }
  }

  /**
   * Call callback for each found selected cell with checkbox type.
   *
   * @private
   * @param {Function} callback
   */
  function eachSelectedCheckboxCell(callback) {
    var selRange = instance.getSelectedRangeLast();

    if (!selRange) {
      return;
    }
    var topLeft = selRange.getTopLeftCorner();
    var bottomRight = selRange.getBottomRightCorner();

    for (var visualRow = topLeft.row; visualRow <= bottomRight.row; visualRow++) {
      for (var visualColumn = topLeft.col; visualColumn <= bottomRight.col; visualColumn++) {
        var cachedCellProperties = instance.getCellMeta(visualRow, visualColumn);

        if (cachedCellProperties.type !== 'checkbox') {
          return;
        }

        var cell = instance.getCell(visualRow, visualColumn);

        if (cell === null || cell === void 0) {
          callback(visualRow, visualColumn, cachedCellProperties);
        } else {
          var checkboxes = cell.querySelectorAll('input[type=checkbox]');

          if (checkboxes.length > 0 && !cachedCellProperties.readOnly) {
            callback(checkboxes);
          }
        }
      }
    }
  }
}

/**
 * Register checkbox listeners.
 *
 * @param {Handsontable} instance Handsontable instance.
 * @returns {EventManager}
 */
function registerEvents(instance) {
  var eventManager = isCheckboxListenerAdded.get(instance);

  if (!eventManager) {
    eventManager = new _eventManager2.default(instance);
    eventManager.addEventListener(instance.rootElement, 'click', function (event) {
      return onClick(event, instance);
    });
    eventManager.addEventListener(instance.rootElement, 'mouseup', function (event) {
      return onMouseUp(event, instance);
    });
    eventManager.addEventListener(instance.rootElement, 'change', function (event) {
      return onChange(event, instance);
    });

    isCheckboxListenerAdded.set(instance, eventManager);
  }

  return eventManager;
}

/**
 * Create input element.
 *
 * @returns {Node}
 */
function createInput() {
  var input = document.createElement('input');

  input.className = 'htCheckboxRendererInput';
  input.type = 'checkbox';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('tabindex', '-1');

  return input.cloneNode(false);
}

/**
 * Create label element.
 *
 * @returns {Node}
 */
function createLabel(text) {
  var label = document.createElement('label');

  label.className = 'htCheckboxRendererLabel';
  label.appendChild(document.createTextNode(text));

  return label.cloneNode(true);
}

/**
 * `mouseup` callback.
 *
 * @private
 * @param {Event} event `mouseup` event.
 * @param {Object} instance Handsontable instance.
 */
function onMouseUp(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return;
  }
  setTimeout(instance.listen, 10);
}

/**
 * `click` callback.
 *
 * @private
 * @param {Event} event `click` event.
 * @param {Object} instance Handsontable instance.
 */
function onClick(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return false;
  }

  var row = parseInt(event.target.getAttribute('data-row'), 10);
  var col = parseInt(event.target.getAttribute('data-col'), 10);
  var cellProperties = instance.getCellMeta(row, col);

  if (cellProperties.readOnly) {
    event.preventDefault();
  }
}

/**
 * `change` callback.
 *
 * @param {Event} event `change` event.
 * @param {Object} instance Handsontable instance.
 * @param {Object} cellProperties Reference to cell properties.
 * @returns {Boolean}
 */
function onChange(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return false;
  }

  var row = parseInt(event.target.getAttribute('data-row'), 10);
  var col = parseInt(event.target.getAttribute('data-col'), 10);
  var cellProperties = instance.getCellMeta(row, col);

  if (!cellProperties.readOnly) {
    var newCheckboxValue = null;

    if (event.target.checked) {
      newCheckboxValue = cellProperties.uncheckedTemplate === void 0 ? true : cellProperties.checkedTemplate;
    } else {
      newCheckboxValue = cellProperties.uncheckedTemplate === void 0 ? false : cellProperties.uncheckedTemplate;
    }

    instance.setDataAtCell(row, col, newCheckboxValue);
  }
}

/**
 * Check if the provided element is the checkbox input.
 *
 * @private
 * @param {HTMLElement} element The element in question.
 * @returns {Boolean}
 */
function isCheckboxInput(element) {
  return element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox';
}

exports.default = checkboxRenderer;