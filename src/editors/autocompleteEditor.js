
import * as helper from './../helpers.js';
import * as dom from './../dom.js';
import {getEditorConstructor, registerEditor} from './../editors.js';
import {HandsontableEditor} from './handsontableEditor.js';

var AutocompleteEditor = HandsontableEditor.prototype.extend();

/**
 * @private
 * @editor AutocompleteEditor
 * @class AutocompleteEditor
 * @dependencies HandsontableEditor
 */
AutocompleteEditor.prototype.init = function() {
  HandsontableEditor.prototype.init.apply(this, arguments);

  this.query = null;
  this.choices = [];
};

AutocompleteEditor.prototype.createElements = function() {
  HandsontableEditor.prototype.createElements.apply(this, arguments);

  dom.addClass(this.htContainer, 'autocompleteEditor');
  dom.addClass(this.htContainer, window.navigator.platform.indexOf('Mac') !== -1 ? 'htMacScroll' : '');
};

var skipOne = false;
function onBeforeKeyDown(event) {
  skipOne = false;
  var editor = this.getActiveEditor();
  var keyCodes = helper.keyCode;

  if (helper.isPrintableChar(event.keyCode) || event.keyCode === keyCodes.BACKSPACE ||
      event.keyCode === keyCodes.DELETE || event.keyCode === keyCodes.INSERT) {
    var timeOffset = 0;

    // on ctl+c / cmd+c don't update suggestion list
    if (event.keyCode === keyCodes.C && (event.ctrlKey || event.metaKey)) {
      return;
    }
    if (!editor.isOpened()) {
      timeOffset += 10;
    }

    editor.instance._registerTimeout(setTimeout(function () {
      editor.queryChoices(editor.TEXTAREA.value);
      skipOne = true;
    }, timeOffset));
  }
}

AutocompleteEditor.prototype.prepare = function () {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  HandsontableEditor.prototype.prepare.apply(this, arguments);
};

AutocompleteEditor.prototype.open = function () {
  HandsontableEditor.prototype.open.apply(this, arguments);

  var choicesListHot = this.htEditor.getInstance();
  var that = this;
  var trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

  this.TEXTAREA.style.visibility = 'visible';
  this.focus();

  choicesListHot.updateSettings({
    'colWidths': trimDropdown ? [dom.outerWidth(this.TEXTAREA) - 2] : void 0,
    width: trimDropdown ? dom.outerWidth(this.TEXTAREA) + dom.getScrollbarWidth() + 2 : void 0,
    afterRenderer: function(TD, row, col, prop, value) {
      var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true,
        indexOfMatch,
        match,
		    value = Handsontable.helper.stringify(value);

      if (value) {
        indexOfMatch = caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());

        if (indexOfMatch != -1) {
          match = value.substr(indexOfMatch, that.query.length);
          TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
        }
      }
    },
    modifyColWidth: function (width, col) {
      // workaround for <strong> text overlapping the dropdown, not really accurate
      return trimDropdown ? width : width + 15;
    }
  });

  // Add additional space for autocomplete holder
  this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = dom.getScrollbarWidth() + 2 + 'px';

  if (skipOne) {
    skipOne = false;
  }

  that.instance._registerTimeout(setTimeout(function() {
    that.queryChoices(that.TEXTAREA.value);
  }, 0));
};

AutocompleteEditor.prototype.close = function () {
  HandsontableEditor.prototype.close.apply(this, arguments);
};
AutocompleteEditor.prototype.queryChoices = function(query) {
  this.query = query;

  if (typeof this.cellProperties.source == 'function') {
    var that = this;

    this.cellProperties.source(query, function(choices) {
      that.updateChoicesList(choices);
    });

  } else if (Array.isArray(this.cellProperties.source)) {

    var choices;

    if (!query || this.cellProperties.filter === false) {
      choices = this.cellProperties.source;
    } else {

      var filteringCaseSensitive = this.cellProperties.filteringCaseSensitive === true;
      var lowerCaseQuery = query.toLowerCase();

      choices = this.cellProperties.source.filter(function(choice) {

        if (filteringCaseSensitive) {
          return choice.indexOf(query) != -1;
        } else {
          return choice.toLowerCase().indexOf(lowerCaseQuery) != -1;
        }

      });
    }

    this.updateChoicesList(choices);

  } else {
    this.updateChoicesList([]);
  }

};

AutocompleteEditor.prototype.updateChoicesList = function(choices) {
  var pos = dom.getCaretPosition(this.TEXTAREA),
    endPos = dom.getSelectionEndPosition(this.TEXTAREA);

  var orderByRelevance = AutocompleteEditor.sortByRelevance(this.getValue(), choices, this.cellProperties.filteringCaseSensitive);
  var highlightIndex;

  /* jshint ignore:start */
  if (this.cellProperties.filter != false) {
    var sorted = [];
    for (var i = 0, choicesCount = orderByRelevance.length; i < choicesCount; i++) {
      sorted.push(choices[orderByRelevance[i]]);
    }
    highlightIndex = 0;
    choices = sorted;
  } else {
    highlightIndex = orderByRelevance[0];
  }
  /* jshint ignore:end */

  this.choices = choices;
  this.htEditor.loadData(helper.pivot([choices]));

  this.updateDropdownHeight();

  if (this.cellProperties.strict === true) {
    this.highlightBestMatchingChoice(highlightIndex);
  }

  this.instance.listen();
  this.TEXTAREA.focus();
  dom.setCaretPosition(this.TEXTAREA, pos, (pos != endPos ? endPos : void 0));
};

AutocompleteEditor.prototype.updateDropdownHeight = function() {
  var currentDropdownWidth = this.htEditor.getColWidth(0) + dom.getScrollbarWidth() + 2;
  var trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

  this.htEditor.updateSettings({
    height: this.getDropdownHeight(),
    width: trimDropdown ? void 0 : currentDropdownWidth
  });

  this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
};

AutocompleteEditor.prototype.finishEditing = function(restoreOriginalValue) {
  if (!restoreOriginalValue) {
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  }
  HandsontableEditor.prototype.finishEditing.apply(this, arguments);
};

AutocompleteEditor.prototype.highlightBestMatchingChoice = function(index) {
  if (typeof index === "number") {
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

  var choicesRelevance = [],
    currentItem, valueLength = value.length,
    valueIndex, charsLeft, result = [],
    i, choicesCount;

  if (valueLength === 0) {
    for (i = 0, choicesCount = choices.length; i < choicesCount; i++) {
      result.push(i);
    }
    return result;
  }

  for (i = 0, choicesCount = choices.length; i < choicesCount; i++) {
    currentItem = Handsontable.helper.stringify(choices[i]);

    if (caseSensitive) {
      valueIndex = currentItem.indexOf(value);
    } else {
      valueIndex = currentItem.toLowerCase().indexOf(value.toLowerCase());
    }


    if (valueIndex == -1) {
      continue;
    }
    charsLeft = currentItem.length - valueIndex - valueLength;

    choicesRelevance.push({
      baseIndex: i,
      index: valueIndex,
      charsLeft: charsLeft,
      value: currentItem
    });
  }

  choicesRelevance.sort(function(a, b) {

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
      } else {
        return 0;
      }
    }
  });

  for (i = 0, choicesCount = choicesRelevance.length; i < choicesCount; i++) {
    result.push(choicesRelevance[i].baseIndex);
  }

  return result;
};

AutocompleteEditor.prototype.getDropdownHeight = function() {
  var firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;

  return this.choices.length >= 10 ? 10 * firstRowHeight : this.choices.length * firstRowHeight + 8;
};

export {AutocompleteEditor};

registerEditor('autocomplete', AutocompleteEditor);
