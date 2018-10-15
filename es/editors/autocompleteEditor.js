import { KEY_CODES, isPrintableChar } from './../helpers/unicode';
import { stringify, isDefined } from './../helpers/mixed';
import { stripTags } from './../helpers/string';
import { pivot, arrayMap } from './../helpers/array';
import { addClass, getCaretPosition, getScrollbarWidth, getSelectionEndPosition, outerWidth, outerHeight, offset, getTrimmingContainer, setCaretPosition } from './../helpers/dom/element';
import HandsontableEditor from './handsontableEditor';

var AutocompleteEditor = HandsontableEditor.prototype.extend();

/**
 * @private
 * @editor AutocompleteEditor
 * @class AutocompleteEditor
 * @dependencies HandsontableEditor
 */
AutocompleteEditor.prototype.init = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  HandsontableEditor.prototype.init.apply(this, args);
  this.query = null;
  this.strippedChoices = [];
  this.rawChoices = [];
};

AutocompleteEditor.prototype.getValue = function () {
  var _this2 = this;

  var selectedValue = this.rawChoices.find(function (value) {
    var strippedValue = _this2.stripValueIfNeeded(value);

    return strippedValue === _this2.TEXTAREA.value;
  });

  if (isDefined(selectedValue)) {
    return selectedValue;
  }

  return this.TEXTAREA.value;
};

AutocompleteEditor.prototype.createElements = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  HandsontableEditor.prototype.createElements.apply(this, args);

  addClass(this.htContainer, 'autocompleteEditor');
  addClass(this.htContainer, window.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');
};

var skipOne = false;
function onBeforeKeyDown(event) {
  skipOne = false;
  var editor = this.getActiveEditor();

  if (isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE || event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
    var timeOffset = 0;

    // on ctl+c / cmd+c don't update suggestion list
    if (event.keyCode === KEY_CODES.C && (event.ctrlKey || event.metaKey)) {
      return;
    }
    if (!editor.isOpened()) {
      timeOffset += 10;
    }

    if (editor.htEditor) {
      editor.instance._registerTimeout(function () {
        editor.queryChoices(editor.TEXTAREA.value);
        skipOne = true;
      }, timeOffset);
    }
  }
}

AutocompleteEditor.prototype.prepare = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  HandsontableEditor.prototype.prepare.apply(this, args);
};

AutocompleteEditor.prototype.open = function () {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  // Ugly fix for handsontable which grab window object for autocomplete scroll listener instead table element.
  this.TEXTAREA_PARENT.style.overflow = 'auto';

  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  HandsontableEditor.prototype.open.apply(this, args);
  this.TEXTAREA_PARENT.style.overflow = '';

  var choicesListHot = this.htEditor.getInstance();
  var _this = this;
  var trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

  this.showEditableElement();
  this.focus();

  choicesListHot.updateSettings({
    colWidths: trimDropdown ? [outerWidth(this.TEXTAREA) - 2] : void 0,
    width: trimDropdown ? outerWidth(this.TEXTAREA) + getScrollbarWidth() + 2 : void 0,
    afterRenderer: function afterRenderer(TD, row, col, prop, value) {
      var _this$cellProperties = _this.cellProperties,
          filteringCaseSensitive = _this$cellProperties.filteringCaseSensitive,
          allowHtml = _this$cellProperties.allowHtml;

      var cellValue = stringify(value);
      var indexOfMatch = void 0;
      var match = void 0;

      if (cellValue && !allowHtml) {
        indexOfMatch = filteringCaseSensitive === true ? cellValue.indexOf(this.query) : cellValue.toLowerCase().indexOf(_this.query.toLowerCase());

        if (indexOfMatch !== -1) {
          match = cellValue.substr(indexOfMatch, _this.query.length);
          cellValue = cellValue.replace(match, '<strong>' + match + '</strong>');
        }
      }
      TD.innerHTML = cellValue;
    },

    autoColumnSize: true,
    modifyColWidth: function modifyColWidth(width, col) {
      // workaround for <strong> text overlapping the dropdown, not really accurate
      var autoWidths = this.getPlugin('autoColumnSize').widths;
      var columnWidth = width;

      if (autoWidths[col]) {
        columnWidth = autoWidths[col];
      }

      return trimDropdown ? columnWidth : columnWidth + 15;
    }
  });

  // Add additional space for autocomplete holder
  this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = getScrollbarWidth() + 2 + 'px';

  if (skipOne) {
    skipOne = false;
  }

  _this.instance._registerTimeout(function () {
    _this.queryChoices(_this.TEXTAREA.value);
  });
};

AutocompleteEditor.prototype.queryChoices = function (query) {
  var _this3 = this;

  this.query = query;
  var source = this.cellProperties.source;

  if (typeof source === 'function') {
    source.call(this.cellProperties, query, function (choices) {
      _this3.rawChoices = choices;
      _this3.updateChoicesList(_this3.stripValuesIfNeeded(choices));
    });
  } else if (Array.isArray(source)) {
    this.rawChoices = source;
    this.updateChoicesList(this.stripValuesIfNeeded(source));
  } else {
    this.updateChoicesList([]);
  }
};

AutocompleteEditor.prototype.updateChoicesList = function (choicesList) {
  var pos = getCaretPosition(this.TEXTAREA);
  var endPos = getSelectionEndPosition(this.TEXTAREA);
  var sortByRelevanceSetting = this.cellProperties.sortByRelevance;
  var filterSetting = this.cellProperties.filter;
  var orderByRelevance = null;
  var highlightIndex = null;
  var choices = choicesList;

  if (sortByRelevanceSetting) {
    orderByRelevance = AutocompleteEditor.sortByRelevance(this.stripValueIfNeeded(this.getValue()), choices, this.cellProperties.filteringCaseSensitive);
  }
  var orderByRelevanceLength = Array.isArray(orderByRelevance) ? orderByRelevance.length : 0;

  if (filterSetting === false) {
    if (orderByRelevanceLength) {
      highlightIndex = orderByRelevance[0];
    }
  } else {
    var sorted = [];

    for (var i = 0, choicesCount = choices.length; i < choicesCount; i++) {
      if (sortByRelevanceSetting && orderByRelevanceLength <= i) {
        break;
      }
      if (orderByRelevanceLength) {
        sorted.push(choices[orderByRelevance[i]]);
      } else {
        sorted.push(choices[i]);
      }
    }

    highlightIndex = 0;
    choices = sorted;
  }

  this.strippedChoices = choices;
  this.htEditor.loadData(pivot([choices]));

  this.updateDropdownHeight();

  this.flipDropdownIfNeeded();

  if (this.cellProperties.strict === true) {
    this.highlightBestMatchingChoice(highlightIndex);
  }

  this.instance.listen(false);

  setCaretPosition(this.TEXTAREA, pos, pos === endPos ? void 0 : endPos);
};

AutocompleteEditor.prototype.flipDropdownIfNeeded = function () {
  var textareaOffset = offset(this.TEXTAREA);
  var textareaHeight = outerHeight(this.TEXTAREA);
  var dropdownHeight = this.getDropdownHeight();
  var trimmingContainer = getTrimmingContainer(this.instance.view.wt.wtTable.TABLE);
  var trimmingContainerScrollTop = trimmingContainer.scrollTop;
  var headersHeight = outerHeight(this.instance.view.wt.wtTable.THEAD);
  var containerOffset = {
    row: 0,
    col: 0
  };

  if (trimmingContainer !== window) {
    containerOffset = offset(trimmingContainer);
  }

  var spaceAbove = textareaOffset.top - containerOffset.top - headersHeight + trimmingContainerScrollTop;
  var spaceBelow = trimmingContainer.scrollHeight - spaceAbove - headersHeight - textareaHeight;
  var flipNeeded = dropdownHeight > spaceBelow && spaceAbove > spaceBelow;

  if (flipNeeded) {
    this.flipDropdown(dropdownHeight);
  } else {
    this.unflipDropdown();
  }

  this.limitDropdownIfNeeded(flipNeeded ? spaceAbove : spaceBelow, dropdownHeight);

  return flipNeeded;
};

AutocompleteEditor.prototype.limitDropdownIfNeeded = function (spaceAvailable, dropdownHeight) {
  if (dropdownHeight > spaceAvailable) {
    var tempHeight = 0;
    var i = 0;
    var lastRowHeight = 0;
    var height = null;

    do {
      lastRowHeight = this.htEditor.getRowHeight(i) || this.htEditor.view.wt.wtSettings.settings.defaultRowHeight;
      tempHeight += lastRowHeight;
      i += 1;
    } while (tempHeight < spaceAvailable);

    height = tempHeight - lastRowHeight;

    if (this.htEditor.flipped) {
      this.htEditor.rootElement.style.top = parseInt(this.htEditor.rootElement.style.top, 10) + dropdownHeight - height + 'px';
    }

    this.setDropdownHeight(tempHeight - lastRowHeight);
  }
};

AutocompleteEditor.prototype.flipDropdown = function (dropdownHeight) {
  var dropdownStyle = this.htEditor.rootElement.style;

  dropdownStyle.position = 'absolute';
  dropdownStyle.top = -dropdownHeight + 'px';

  this.htEditor.flipped = true;
};

AutocompleteEditor.prototype.unflipDropdown = function () {
  var dropdownStyle = this.htEditor.rootElement.style;

  if (dropdownStyle.position === 'absolute') {
    dropdownStyle.position = '';
    dropdownStyle.top = '';
  }

  this.htEditor.flipped = void 0;
};

AutocompleteEditor.prototype.updateDropdownHeight = function () {
  var currentDropdownWidth = this.htEditor.getColWidth(0) + getScrollbarWidth() + 2;
  var trimDropdown = this.cellProperties.trimDropdown;

  this.htEditor.updateSettings({
    height: this.getDropdownHeight(),
    width: trimDropdown ? void 0 : currentDropdownWidth
  });

  this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
};

AutocompleteEditor.prototype.setDropdownHeight = function (height) {
  this.htEditor.updateSettings({
    height: height
  });
};

AutocompleteEditor.prototype.finishEditing = function (restoreOriginalValue) {
  for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
    args[_key5 - 1] = arguments[_key5];
  }

  HandsontableEditor.prototype.finishEditing.apply(this, [restoreOriginalValue].concat(args));
};

AutocompleteEditor.prototype.highlightBestMatchingChoice = function (index) {
  if (typeof index === 'number') {
    this.htEditor.selectCell(index, 0, void 0, void 0, void 0, false);
  } else {
    this.htEditor.deselectCell();
  }
};

/**
 * Filters and sorts by relevance
 * @param value
 * @param choices
 * @param caseSensitive
 * @returns {Array} array of indexes in original choices array
 */
AutocompleteEditor.sortByRelevance = function (value, choices, caseSensitive) {
  var choicesRelevance = [];
  var currentItem = void 0;
  var valueLength = value.length;
  var valueIndex = void 0;
  var charsLeft = void 0;
  var result = [];
  var i = void 0;
  var choicesCount = choices.length;

  if (valueLength === 0) {
    for (i = 0; i < choicesCount; i++) {
      result.push(i);
    }
    return result;
  }

  for (i = 0; i < choicesCount; i++) {
    currentItem = stripTags(stringify(choices[i]));

    if (caseSensitive) {
      valueIndex = currentItem.indexOf(value);
    } else {
      valueIndex = currentItem.toLowerCase().indexOf(value.toLowerCase());
    }

    if (valueIndex !== -1) {
      charsLeft = currentItem.length - valueIndex - valueLength;

      choicesRelevance.push({
        baseIndex: i,
        index: valueIndex,
        charsLeft: charsLeft,
        value: currentItem
      });
    }
  }

  choicesRelevance.sort(function (a, b) {

    if (b.index === -1) {
      return -1;
    }
    if (a.index === -1) {
      return 1;
    }

    if (a.index < b.index) {
      return -1;
    } else if (b.index < a.index) {
      return 1;
    } else if (a.index === b.index) {
      if (a.charsLeft < b.charsLeft) {
        return -1;
      } else if (a.charsLeft > b.charsLeft) {
        return 1;
      }
    }

    return 0;
  });

  for (i = 0, choicesCount = choicesRelevance.length; i < choicesCount; i++) {
    result.push(choicesRelevance[i].baseIndex);
  }

  return result;
};

AutocompleteEditor.prototype.getDropdownHeight = function () {
  var firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
  var visibleRows = this.cellProperties.visibleRows;

  return this.strippedChoices.length >= visibleRows ? visibleRows * firstRowHeight : this.strippedChoices.length * firstRowHeight + 8;
};

AutocompleteEditor.prototype.stripValueIfNeeded = function (value) {
  return this.stripValuesIfNeeded([value])[0];
};

AutocompleteEditor.prototype.stripValuesIfNeeded = function (values) {
  var allowHtml = this.cellProperties.allowHtml;


  var stringifiedValues = arrayMap(values, function (value) {
    return stringify(value);
  });
  var strippedValues = arrayMap(stringifiedValues, function (value) {
    return allowHtml ? value : stripTags(value);
  });

  return strippedValues;
};

AutocompleteEditor.prototype.allowKeyEventPropagation = function (keyCode) {
  var selectedRange = this.htEditor.getSelectedRangeLast();
  var selected = { row: selectedRange ? selectedRange.from.row : -1 };
  var allowed = false;

  if (keyCode === KEY_CODES.ARROW_DOWN && selected.row > 0 && selected.row < this.htEditor.countRows() - 1) {
    allowed = true;
  }
  if (keyCode === KEY_CODES.ARROW_UP && selected.row > -1) {
    allowed = true;
  }

  return allowed;
};

AutocompleteEditor.prototype.close = function () {
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);

  for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    args[_key6] = arguments[_key6];
  }

  HandsontableEditor.prototype.close.apply(this, args);
};

AutocompleteEditor.prototype.discardEditor = function () {
  for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
    args[_key7] = arguments[_key7];
  }

  HandsontableEditor.prototype.discardEditor.apply(this, args);

  this.instance.view.render();
};

export default AutocompleteEditor;