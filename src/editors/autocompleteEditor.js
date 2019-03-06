import { KEY_CODES, isPrintableChar } from './../helpers/unicode';
import { stringify, isDefined } from './../helpers/mixed';
import { stripTags } from './../helpers/string';
import { pivot, arrayMap } from './../helpers/array';
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

const privatePool = new WeakMap();

/**
 * @private
 * @editor AutocompleteEditor
 * @class AutocompleteEditor
 * @dependencies HandsontableEditor
 */
class AutocompleteEditor extends HandsontableEditor {
  constructor(instance) {
    super(instance);
    /**
     * Query string to turn available values over.
     *
     * @type {String}
     */
    this.query = null;
    /**
     * Contains stripped choices.
     *
     * @type {String[]}
     */
    this.strippedChoices = [];
    /**
     * Contains raw choices.
     *
     * @type {Array}
     */
    this.rawChoices = [];

    privatePool.set(this, {
      skipOne: false,
    });
  }

  /**
   * Gets current value from editable element.
   *
   * @returns {String}
   */
  getValue() {
    const selectedValue = this.rawChoices.find((value) => {
      const strippedValue = this.stripValueIfNeeded(value);

      return strippedValue === this.TEXTAREA.value;
    });

    if (isDefined(selectedValue)) {
      return selectedValue;
    }

    return this.TEXTAREA.value;
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    super.createElements();

    addClass(this.htContainer, 'autocompleteEditor');
    addClass(this.htContainer, this.hot.rootWindow.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');
  }

  /**
   * Opens the editor and adjust its size and internal Handsontable's instance.
   */
  open() {
    const priv = privatePool.get(this);

    // this.addHook('beforeKeyDown', event => this.onBeforeKeyDown(event));
    // Ugly fix for handsontable which grab window object for autocomplete scroll listener instead table element.
    this.TEXTAREA_PARENT.style.overflow = 'auto';
    super.open();
    this.TEXTAREA_PARENT.style.overflow = '';

    const choicesListHot = this.htEditor.getInstance();
    const trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

    this.showEditableElement();
    this.focus();

    const scrollbarWidth = getScrollbarWidth(this.hot.rootDocument);

    choicesListHot.updateSettings({
      colWidths: trimDropdown ? [outerWidth(this.TEXTAREA) - 2] : void 0,
      width: trimDropdown ? outerWidth(this.TEXTAREA) + scrollbarWidth + 2 : void 0,
      afterRenderer: (TD, row, col, prop, value) => {
        const { filteringCaseSensitive, allowHtml } = this.cellProperties;
        const query = this.query;
        let cellValue = stringify(value);
        let indexOfMatch;
        let match;

        if (cellValue && !allowHtml) {
          indexOfMatch = filteringCaseSensitive === true ? cellValue.indexOf(query) : cellValue.toLowerCase().indexOf(query.toLowerCase());

          if (indexOfMatch !== -1) {
            match = cellValue.substr(indexOfMatch, query.length);
            cellValue = cellValue.replace(match, `<strong>${match}</strong>`);
          }
        }

        TD.innerHTML = cellValue;
      },
      autoColumnSize: true,
      modifyColWidth(width, col) {
        // workaround for <strong> text overlapping the dropdown, not really accurate
        const autoColumnSize = this.getPlugin('autoColumnSize');
        let columnWidth = width;

        if (autoColumnSize) {
          const autoWidths = autoColumnSize.widths;

          if (autoWidths[col]) {
            columnWidth = autoWidths[col];
          }
        }

        return trimDropdown ? columnWidth : columnWidth + 15;
      }
    });

    // Add additional space for autocomplete holder
    this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = `${scrollbarWidth + 2}px`;

    if (priv.skipOne) {
      priv.skipOne = false;
    }

    this.hot._registerTimeout(() => {
      this.queryChoices(this.TEXTAREA.value);
    });
  }

  /**
   * Closes the editor.
   */
  close() {
    this.removeHooksByKey('beforeKeyDown');
    super.close();
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes. Re-renders WalkOnTable.
   *
   * @param {Boolean|undefined} result
   */
  discardEditor(result) {
    super.discardEditor(result);

    this.hot.view.render();
  }

  /**
   * Prepares choices list based on applied argument.
   *
   * @private
   * @param {String} query
   */
  queryChoices(query) {
    const source = this.cellProperties.source;
    this.query = query;

    if (typeof source === 'function') {
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
  }

  /**
   * Updates list of the possible completions to choose.
   *
   * @private
   * @param {Array} choicesList
   */
  updateChoicesList(choicesList) {
    const pos = getCaretPosition(this.TEXTAREA);
    const endPos = getSelectionEndPosition(this.TEXTAREA);
    const sortByRelevanceSetting = this.cellProperties.sortByRelevance;
    const filterSetting = this.cellProperties.filter;
    let orderByRelevance = null;
    let highlightIndex = null;
    let choices = choicesList;

    if (sortByRelevanceSetting) {
      orderByRelevance = AutocompleteEditor.sortByRelevance(
        this.stripValueIfNeeded(this.getValue()),
        choices,
        this.cellProperties.filteringCaseSensitive
      );
    }
    const orderByRelevanceLength = Array.isArray(orderByRelevance) ? orderByRelevance.length : 0;

    if (filterSetting === false) {
      if (orderByRelevanceLength) {
        highlightIndex = orderByRelevance[0];
      }

    } else {
      const sorted = [];

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

    this.hot.listen(false);

    setCaretPosition(this.TEXTAREA, pos, (pos === endPos ? void 0 : endPos));
  }

  /**
   * Checks where is enough place to open editor.
   *
   * @private
   * @returns {Boolean}
   */
  flipDropdownIfNeeded() {
    const textareaOffset = offset(this.TEXTAREA);
    const textareaHeight = outerHeight(this.TEXTAREA);
    const dropdownHeight = this.getDropdownHeight();
    const trimmingContainer = getTrimmingContainer(this.hot.view.wt.wtTable.TABLE);
    const trimmingContainerScrollTop = trimmingContainer.scrollTop;
    const headersHeight = outerHeight(this.hot.view.wt.wtTable.THEAD);
    let containerOffset = {
      row: 0,
      col: 0
    };

    if (trimmingContainer !== this.hot.rootWindow) {
      containerOffset = offset(trimmingContainer);
    }

    const spaceAbove = textareaOffset.top - containerOffset.top - headersHeight + trimmingContainerScrollTop;
    const spaceBelow = trimmingContainer.scrollHeight - spaceAbove - headersHeight - textareaHeight;
    const flipNeeded = dropdownHeight > spaceBelow && spaceAbove > spaceBelow;

    if (flipNeeded) {
      this.flipDropdown(dropdownHeight);
    } else {
      this.unflipDropdown();
    }

    this.limitDropdownIfNeeded(flipNeeded ? spaceAbove : spaceBelow, dropdownHeight);

    return flipNeeded;
  }

  /**
   * Checks if the internal table should generate scrollbar or could be rendered without it.
   *
   * @private
   * @param {Number} spaceAvailable
   * @param {Number} dropdownHeight
   */
  limitDropdownIfNeeded(spaceAvailable, dropdownHeight) {
    if (dropdownHeight > spaceAvailable) {
      let tempHeight = 0;
      let i = 0;
      let lastRowHeight = 0;
      let height = null;

      do {
        lastRowHeight = this.htEditor.getRowHeight(i) || this.htEditor.view.wt.wtSettings.settings.defaultRowHeight;
        tempHeight += lastRowHeight;
        i += 1;
      } while (tempHeight < spaceAvailable);

      height = tempHeight - lastRowHeight;

      if (this.htEditor.flipped) {
        this.htEditor.rootElement.style.top = `${parseInt(this.htEditor.rootElement.style.top, 10) + dropdownHeight - height}px`;
      }

      this.setDropdownHeight(tempHeight - lastRowHeight);
    }
  }

  /**
   * Configures editor to open it at the top.
   *
   * @private
   * @param {Number} dropdownHeight
   */
  flipDropdown(dropdownHeight) {
    const dropdownStyle = this.htEditor.rootElement.style;

    dropdownStyle.position = 'absolute';
    dropdownStyle.top = `${-dropdownHeight}px`;

    this.htEditor.flipped = true;
  }

  /**
   * Configures editor to open it at the bottom.
   *
   * @private
   */
  unflipDropdown() {
    const dropdownStyle = this.htEditor.rootElement.style;

    if (dropdownStyle.position === 'absolute') {
      dropdownStyle.position = '';
      dropdownStyle.top = '';
    }

    this.htEditor.flipped = void 0;
  }

  /**
   * Updates width and height of the internal Handsontable's instance.
   *
   * @private
   */
  updateDropdownHeight() {
    const currentDropdownWidth = this.htEditor.getColWidth(0) + getScrollbarWidth(this.hot.rootDocument) + 2;
    const trimDropdown = this.cellProperties.trimDropdown;

    this.htEditor.updateSettings({
      height: this.getDropdownHeight(),
      width: trimDropdown ? void 0 : currentDropdownWidth
    });

    this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
  }

  /**
   * Sets new height of the internal Handsontable's instance.
   *
   * @private
   * @param {Number} height
   */
  setDropdownHeight(height) {
    this.htEditor.updateSettings({
      height
    });
  }

  /**
   * Creates new selection on specified row index, or deselects selected cells.
   *
   * @private
   * @param {Number|undefined} index
   */
  highlightBestMatchingChoice(index) {
    if (typeof index === 'number') {
      this.htEditor.selectCell(index, 0, void 0, void 0, void 0, false);
    } else {
      this.htEditor.deselectCell();
    }
  }

  /**
   * Calculates and return the internal Handsontable's height.
   *
   * @private
   * @returns {Number}
   */
  getDropdownHeight() {
    const firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
    const visibleRows = this.cellProperties.visibleRows;

    return this.strippedChoices.length >= visibleRows ? (visibleRows * firstRowHeight) : (this.strippedChoices.length * firstRowHeight) + 8;
  }

  /**
   * Sanitizes value from potential dangerous tags.
   *
   * @private
   * @param {String} value
   * @returns {String}
   */
  stripValueIfNeeded(value) {
    return this.stripValuesIfNeeded([value])[0];
  }

  /**
   * Sanitizes an array of the values from potential dangerous tags.
   *
   * @private
   * @param {String[]} values
   * @returns {String[]}
   */
  stripValuesIfNeeded(values) {
    const { allowHtml } = this.cellProperties;

    const stringifiedValues = arrayMap(values, value => stringify(value));
    const strippedValues = arrayMap(stringifiedValues, value => (allowHtml ? value : stripTags(value)));

    return strippedValues;
  }

  /**
   * Captures use of arrow down and up to control their behaviour.
   *
   * @private
   * @param {Number} keyCode
   * @returns {Boolean}
   */
  allowKeyEventPropagation(keyCode) {
    const selectedRange = this.htEditor.getSelectedRangeLast();
    const selected = { row: selectedRange ? selectedRange.from.row : -1 };
    let allowed = false;

    if (keyCode === KEY_CODES.ARROW_DOWN && selected.row > 0 && selected.row < this.htEditor.countRows() - 1) {
      allowed = true;
    }
    if (keyCode === KEY_CODES.ARROW_UP && selected.row > -1) {
      allowed = true;
    }

    return allowed;
  }

  /**
   * onBeforeKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event
   */
  onBeforeKeyDown(event) {
    const priv = privatePool.get(this);

    priv.skipOne = false;

    if (isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE ||
      event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
      let timeOffset = 0;

      // on ctl+c / cmd+c don't update suggestion list
      if (event.keyCode === KEY_CODES.C && (event.ctrlKey || event.metaKey)) {
        return;
      }
      if (!this.isOpened()) {
        timeOffset += 10;
      }

      if (this.htEditor) {
        this.hot._registerTimeout(() => {
          this.queryChoices(this.TEXTAREA.value);
          priv.skipOne = true;
        }, timeOffset);
      }
    }

    super.onBeforeKeyDown(event);
  }
}

/**
 * Filters and sorts by relevance.
 *
 * @param value
 * @param choices
 * @param caseSensitive
 * @returns {Number[]} array of indexes in original choices array
 */
AutocompleteEditor.sortByRelevance = function(value, choices, caseSensitive) {
  const choicesRelevance = [];
  let currentItem;
  const valueLength = value.length;
  let valueIndex;
  let charsLeft;
  const result = [];
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

export default AutocompleteEditor;
