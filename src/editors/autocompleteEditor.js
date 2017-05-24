import {KEY_CODES, isPrintableChar} from './../helpers/unicode';
import {stringify, isDefined} from './../helpers/mixed';
import {stripTags} from './../helpers/string';
import {pivot, arrayMap} from './../helpers/array';
import {
  addClass,
  getCaretPosition,
  getScrollbarWidth,
  getSelectionEndPosition,
  outerWidth,
  outerHeight,
  offset,
  getTrimmingContainer,
  setCaretPosition,
} from './../helpers/dom/element';
import HandsontableEditor from './handsontableEditor';

const AutocompleteEditor = HandsontableEditor.prototype.extend();

/**
 * @private
 * @editor AutocompleteEditor
 * @class AutocompleteEditor
 * @dependencies HandsontableEditor
 */
AutocompleteEditor.prototype.init = function() {
  HandsontableEditor.prototype.init.apply(this, arguments);
  this.query = null;
  this.strippedChoices = [];
  this.rawChoices = [];
};

AutocompleteEditor.prototype.getValue = function() {
  const selectedValue = this.rawChoices.find((value) => {
    const strippedValue = this.stripValueIfNeeded(value);

    return strippedValue === this.TEXTAREA.value;
  });

  if (isDefined(selectedValue)) {
    return selectedValue;
  }

  return this.TEXTAREA.value;
};

AutocompleteEditor.prototype.createElements = function() {
  HandsontableEditor.prototype.createElements.apply(this, arguments);

  addClass(this.htContainer, 'autocompleteEditor');
  addClass(this.htContainer, window.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');
};

var skipOne = false;
function onBeforeKeyDown(event) {
  skipOne = false;
  let editor = this.getActiveEditor();

  if (isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE ||
    event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
    let timeOffset = 0;

    // on ctl+c / cmd+c don't update suggestion list
    if (event.keyCode === KEY_CODES.C && (event.ctrlKey || event.metaKey)) {
      return;
    }
    if (!editor.isOpened()) {
      timeOffset += 10;
    }

    if (editor.htEditor) {
      editor.instance._registerTimeout(setTimeout(() => {
        editor.queryChoices(editor.TEXTAREA.value);
        skipOne = true;
      }, timeOffset));
    }
  }
}

AutocompleteEditor.prototype.prepare = function() {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  HandsontableEditor.prototype.prepare.apply(this, arguments);
};

AutocompleteEditor.prototype.open = function() {
  // Ugly fix for handsontable which grab window object for autocomplete scroll listener instead table element.
  this.TEXTAREA_PARENT.style.overflow = 'auto';
  HandsontableEditor.prototype.open.apply(this, arguments);
  this.TEXTAREA_PARENT.style.overflow = '';

  let choicesListHot = this.htEditor.getInstance();
  let _this = this;
  let trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

  this.TEXTAREA.style.visibility = 'visible';
  this.focus();

  choicesListHot.updateSettings({
    colWidths: trimDropdown ? [outerWidth(this.TEXTAREA) - 2] : void 0,
    width: trimDropdown ? outerWidth(this.TEXTAREA) + getScrollbarWidth() + 2 : void 0,
    afterRenderer(TD, row, col, prop, value, cellProperties) {
      let {filteringCaseSensitive, allowHtml} = _this.cellProperties;
      let indexOfMatch;
      let match;

      value = stringify(value);

      if (value && !allowHtml) {
        indexOfMatch = filteringCaseSensitive === true ? value.indexOf(this.query) : value.toLowerCase().indexOf(_this.query.toLowerCase());

        if (indexOfMatch !== -1) {
          match = value.substr(indexOfMatch, _this.query.length);
          value = value.replace(match, `<strong>${match}</strong>`);
        }
      }
      TD.innerHTML = value;
    },
    autoColumnSize: true,
    modifyColWidth(width, col) {
      // workaround for <strong> text overlapping the dropdown, not really accurate
      let autoWidths = this.getPlugin('autoColumnSize').widths;

      if (autoWidths[col]) {
        width = autoWidths[col];
      }

      return trimDropdown ? width : width + 15;
    }
  });

  // Add additional space for autocomplete holder
  this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = `${getScrollbarWidth() + 2}px`;

  if (skipOne) {
    skipOne = false;
  }

  _this.instance._registerTimeout(setTimeout(() => {
    _this.queryChoices(_this.TEXTAREA.value);
  }, 0));
};

AutocompleteEditor.prototype.close = function() {
  HandsontableEditor.prototype.close.apply(this, arguments);
};
AutocompleteEditor.prototype.queryChoices = function(query) {
  this.query = query;
  const source = this.cellProperties.source;

  if (typeof source == 'function') {
    source.call(this.cellProperties, query, (choices) => {
      this.rawChoices = choices;
      this.updateChoicesList(this.stripValuesIfNeeded(choices));
    });

  } else if (Array.isArray(source)) {
    this.rawChoices = source;
    this.updateChoicesList(this.stripValuesIfNeeded(source));

  } else {
    this.updateChoicesList([]);
  }
};

AutocompleteEditor.prototype.updateChoicesList = function(choices) {
  let pos = getCaretPosition(this.TEXTAREA);
  let endPos = getSelectionEndPosition(this.TEXTAREA);
  let sortByRelevanceSetting = this.cellProperties.sortByRelevance;
  let filterSetting = this.cellProperties.filter;
  let orderByRelevance = null;
  let highlightIndex = null;

  if (sortByRelevanceSetting) {
    orderByRelevance = AutocompleteEditor.sortByRelevance(
      this.stripValueIfNeeded(this.getValue()),
      choices,
      this.cellProperties.filteringCaseSensitive
    );
  }
  let orderByRelevanceLength = Array.isArray(orderByRelevance) ? orderByRelevance.length : 0;

  if (filterSetting === false) {
    if (orderByRelevanceLength) {
      highlightIndex = orderByRelevance[0];
    }
  } else {
    let sorted = [];

    for (let i = 0, choicesCount = choices.length; i < choicesCount; i++) {
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

  this.instance.listen();
  this.TEXTAREA.focus();
  setCaretPosition(this.TEXTAREA, pos, (pos === endPos ? void 0 : endPos));
};

AutocompleteEditor.prototype.flipDropdownIfNeeded = function() {
  let textareaOffset = offset(this.TEXTAREA);
  let textareaHeight = outerHeight(this.TEXTAREA);
  let dropdownHeight = this.getDropdownHeight();
  let trimmingContainer = getTrimmingContainer(this.instance.view.wt.wtTable.TABLE);
  let trimmingContainerScrollTop = trimmingContainer.scrollTop;
  let headersHeight = outerHeight(this.instance.view.wt.wtTable.THEAD);
  let containerOffset = {
    row: 0,
    col: 0
  };

  if (trimmingContainer !== window) {
    containerOffset = offset(trimmingContainer);
  }

  let spaceAbove = textareaOffset.top - containerOffset.top - headersHeight + trimmingContainerScrollTop;
  let spaceBelow = trimmingContainer.scrollHeight - spaceAbove - headersHeight - textareaHeight;
  let flipNeeded = dropdownHeight > spaceBelow && spaceAbove > spaceBelow;

  if (flipNeeded) {
    this.flipDropdown(dropdownHeight);
  } else {
    this.unflipDropdown();
  }

  this.limitDropdownIfNeeded(flipNeeded ? spaceAbove : spaceBelow, dropdownHeight);

  return flipNeeded;
};

AutocompleteEditor.prototype.limitDropdownIfNeeded = function(spaceAvailable, dropdownHeight) {
  if (dropdownHeight > spaceAvailable) {
    let tempHeight = 0;
    let i = 0;
    let lastRowHeight = 0;
    let height = null;

    do {
      lastRowHeight = this.htEditor.getRowHeight(i) || this.htEditor.view.wt.wtSettings.settings.defaultRowHeight;
      tempHeight += lastRowHeight;
      i++;
    } while (tempHeight < spaceAvailable);

    height = tempHeight - lastRowHeight;

    if (this.htEditor.flipped) {
      this.htEditor.rootElement.style.top = `${parseInt(this.htEditor.rootElement.style.top, 10) + dropdownHeight - height}px`;
    }

    this.setDropdownHeight(tempHeight - lastRowHeight);
  }
};

AutocompleteEditor.prototype.flipDropdown = function(dropdownHeight) {
  let dropdownStyle = this.htEditor.rootElement.style;

  dropdownStyle.position = 'absolute';
  dropdownStyle.top = `${-dropdownHeight}px`;

  this.htEditor.flipped = true;
};

AutocompleteEditor.prototype.unflipDropdown = function() {
  let dropdownStyle = this.htEditor.rootElement.style;

  if (dropdownStyle.position === 'absolute') {
    dropdownStyle.position = '';
    dropdownStyle.top = '';
  }

  this.htEditor.flipped = void 0;
};

AutocompleteEditor.prototype.updateDropdownHeight = function() {
  var currentDropdownWidth = this.htEditor.getColWidth(0) + getScrollbarWidth() + 2;
  var trimDropdown = this.cellProperties.trimDropdown;

  this.htEditor.updateSettings({
    height: this.getDropdownHeight(),
    width: trimDropdown ? void 0 : currentDropdownWidth
  });

  this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
};

AutocompleteEditor.prototype.setDropdownHeight = function(height) {
  this.htEditor.updateSettings({
    height
  });
};

AutocompleteEditor.prototype.finishEditing = function(restoreOriginalValue) {
  if (!restoreOriginalValue) {
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  }
  HandsontableEditor.prototype.finishEditing.apply(this, arguments);
};

AutocompleteEditor.prototype.highlightBestMatchingChoice = function(index) {
  if (typeof index === 'number') {
    this.htEditor.selectCell(index, 0);
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
AutocompleteEditor.sortByRelevance = function(value, choices, caseSensitive) {
  let choicesRelevance = [];
  let currentItem;
  let valueLength = value.length;
  let valueIndex;
  let charsLeft;
  let result = [];
  let i;
  let choicesCount = choices.length;

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
        charsLeft,
        value: currentItem
      });
    }
  }

  choicesRelevance.sort((a, b) => {

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

AutocompleteEditor.prototype.getDropdownHeight = function() {
  let firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
  let visibleRows = this.cellProperties.visibleRows;

  return this.strippedChoices.length >= visibleRows ? (visibleRows * firstRowHeight) : (this.strippedChoices.length * firstRowHeight) + 8;
};

AutocompleteEditor.prototype.stripValueIfNeeded = function (value) {
  return this.stripValuesIfNeeded([value])[0];
};

AutocompleteEditor.prototype.stripValuesIfNeeded = function (values) {
  const {allowHtml} = this.cellProperties;

  const stringifiedValues = arrayMap(values, (value) => stringify(value));
  const strippedValues = arrayMap(stringifiedValues, (value) => (allowHtml ? value : stripTags(value)));

  return strippedValues;
};

AutocompleteEditor.prototype.allowKeyEventPropagation = function(keyCode) {
  let selected = {row: this.htEditor.getSelectedRange() ? this.htEditor.getSelectedRange().from.row : -1};
  let allowed = false;

  if (keyCode === KEY_CODES.ARROW_DOWN && selected.row > 0 && selected.row < this.htEditor.countRows() - 1) {
    allowed = true;
  }
  if (keyCode === KEY_CODES.ARROW_UP && selected.row > -1) {
    allowed = true;
  }

  return allowed;
};

AutocompleteEditor.prototype.discardEditor = function(result) {
  HandsontableEditor.prototype.discardEditor.apply(this, arguments);

  this.instance.view.render();
};

export default AutocompleteEditor;
