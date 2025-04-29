import { HandsontableEditor } from '../handsontableEditor';
import { arrayMap, pivot } from '../../helpers/array';
import {
  addClass,
  getCaretPosition,
  getScrollbarWidth,
  getSelectionEndPosition,
  outerWidth,
  setAttribute,
  setCaretPosition,
} from '../../helpers/dom/element';
import { isDefined, stringify } from '../../helpers/mixed';
import { stripTags } from '../../helpers/string';
import { KEY_CODES, isPrintableChar } from '../../helpers/unicode';
import { textRenderer } from '../../renderers/textRenderer';
import {
  A11Y_ACTIVEDESCENDANT,
  A11Y_AUTOCOMPLETE,
  A11Y_COMBOBOX,
  A11Y_CONTROLS,
  A11Y_EXPANDED,
  A11Y_HASPOPUP,
  A11Y_LISTBOX,
  A11Y_LIVE,
  A11Y_OPTION,
  A11Y_POSINSET,
  A11Y_PRESENTATION,
  A11Y_RELEVANT,
  A11Y_SELECTED,
  A11Y_SETSIZE,
  A11Y_TEXT
} from '../../helpers/a11y';
import { debounce } from '../../helpers/function';

export const EDITOR_TYPE = 'autocomplete';

/**
 * @private
 * @class AutocompleteEditor
 */
export class AutocompleteEditor extends HandsontableEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Query string to turn available values over.
   *
   * @type {string}
   */
  query = null;
  /**
   * Contains stripped choices.
   *
   * @type {string[]}
   */
  strippedChoices = [];
  /**
   * Contains raw choices.
   *
   * @type {Array}
   */
  rawChoices = [];
  /**
   * Holds the prefix of the editor's id.
   *
   * @type {string}
   */
  #idPrefix = this.hot.guid.slice(0, 9);

  /**
   * Gets current value from editable element.
   *
   * @returns {string}
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
   * Runs focus method after debounce.
   */
  #focusDebounced = debounce(() => {
    this.focus();
  }, 100);

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    super.createElements();

    addClass(this.htContainer, 'autocompleteEditor');
    addClass(this.htContainer, this.hot.rootWindow.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_TEXT(),
        A11Y_COMBOBOX(),
        A11Y_HASPOPUP('listbox'),
        A11Y_AUTOCOMPLETE(),
      ]);
    }
  }

  /**
   * Prepares editor's metadata and configuration of the internal Handsontable's instance.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_EXPANDED('false'),
        A11Y_CONTROLS(`${this.#idPrefix}-listbox-${row}-${col}`),
      ]);
    }
  }

  /**
   * Opens the editor and adjust its size and internal Handsontable's instance.
   */
  open() {
    super.open();

    const trimDropdown = this.cellProperties.trimDropdown === undefined ? true : this.cellProperties.trimDropdown;
    const rootInstanceAriaTagsEnabled = this.hot.getSettings().ariaTags;
    const sourceArray = Array.isArray(this.cellProperties.source) ? this.cellProperties.source : null;
    const sourceSize = sourceArray?.length;
    const { row: rowIndex, col: colIndex } = this;

    this.showEditableElement();
    this.focus();
    this.addHook('beforeKeyDown', event => this.onBeforeKeyDown(event));
    this.htEditor.addHook('afterScroll', this.#focusDebounced);

    this.htEditor.updateSettings({
      colWidths: trimDropdown ? [outerWidth(this.TEXTAREA) - 2] : undefined,
      autoColumnSize: true,
      renderer: (hotInstance, TD, row, col, prop, value, cellProperties) => {
        textRenderer(hotInstance, TD, row, col, prop, value, cellProperties);

        const { filteringCaseSensitive, allowHtml, locale } = this.cellProperties;
        const query = this.query;
        let cellValue = stringify(value);
        let indexOfMatch;
        let match;

        if (cellValue && !allowHtml) {
          indexOfMatch = filteringCaseSensitive === true ?
            cellValue.indexOf(query) : cellValue.toLocaleLowerCase(locale).indexOf(query.toLocaleLowerCase(locale));

          if (indexOfMatch !== -1) {
            match = cellValue.substr(indexOfMatch, query.length);
            cellValue = cellValue.replace(match, `<strong>${match}</strong>`);
          }
        }

        if (rootInstanceAriaTagsEnabled) {
          setAttribute(TD, [
            A11Y_OPTION(),
            // Add `setsize` and `posinset` only if the source is an array.
            ...(sourceArray ? [A11Y_SETSIZE(sourceSize)] : []),
            ...(sourceArray ? [A11Y_POSINSET(sourceArray.indexOf(value) + 1)] : []),
            ['id', `${this.htEditor.rootElement.id}_${row}-${col}`],
          ]);
        }

        TD.innerHTML = cellValue;
      },
      afterSelectionEnd: (startRow, startCol) => {
        if (rootInstanceAriaTagsEnabled) {
          const setA11yAttributes = (TD) => {
            setAttribute(TD, [
              A11Y_SELECTED(),
            ]);

            setAttribute(this.TEXTAREA, ...A11Y_ACTIVEDESCENDANT(TD.id));
          };
          const TD = this.htEditor.getCell(startRow, startCol, true);

          if (TD !== null) {
            setA11yAttributes(TD);

          } else {
            // If TD is null, it means that the cell is not (yet) in the viewport.
            // Moving the logic to after it's been scrolled to the requested cell.
            this.htEditor.addHookOnce('afterScrollVertically', () => {
              const renderedTD = this.htEditor.getCell(startRow, startCol, true);

              setA11yAttributes(renderedTD);
            });
          }
        }
      },
    });

    if (rootInstanceAriaTagsEnabled) {
      // Add `role=presentation` to the main table to prevent the readers from treating the option list as a table.
      setAttribute(this.htEditor.view._wt.wtOverlays.wtTable.TABLE, ...A11Y_PRESENTATION());

      setAttribute(this.htEditor.rootElement, [
        A11Y_LISTBOX(),
        A11Y_LIVE('polite'),
        A11Y_RELEVANT('text'),
        ['id', `${this.#idPrefix}-listbox-${rowIndex}-${colIndex}`],
      ]);

      setAttribute(this.TEXTAREA, ...A11Y_EXPANDED('true'));
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

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_EXPANDED('false'),
      ]);
    }
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be closed until validation is passed.
   */
  discardEditor(result) {
    super.discardEditor(result);

    this.hot.view.render();
  }

  /**
   * Prepares choices list based on applied argument.
   *
   * @param {string} query The query.
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
   * @param {Array} choicesList The choices list to process.
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
      orderByRelevance = this.sortByRelevance(
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

    if (choices.length === 0) {
      this.htEditor.rootElement.style.display = 'none';

    } else {
      this.htEditor.rootElement.style.display = '';
    }

    this.htEditor.loadData(pivot([choices]));

    if (choices.length > 0) {
      this.updateDropdownDimensions();
      this.flipDropdownVerticallyIfNeeded();

      if (this.cellProperties.strict === true) {
        this.highlightBestMatchingChoice(highlightIndex);
      }
    }

    this.hot.listen();

    setCaretPosition(this.TEXTAREA, pos, (pos === endPos ? undefined : endPos));
  }

  /**
   * Calculates the space above and below the editor and flips it vertically if needed.
   *
   * @private
   * @returns {{ isFlipped: boolean, spaceAbove: number, spaceBelow: number}}
   */
  flipDropdownVerticallyIfNeeded() {
    const result = super.flipDropdownVerticallyIfNeeded();
    const {
      isFlipped,
      spaceAbove,
      spaceBelow,
    } = result;

    this.limitDropdownIfNeeded(isFlipped ? spaceAbove : spaceBelow);

    return result;
  }

  /**
   * Checks if the internal table should generate scrollbar or could be rendered without it.
   *
   * @private
   * @param {number} spaceAvailable The free space as height defined in px available for dropdown list.
   */
  limitDropdownIfNeeded(spaceAvailable) {
    const dropdownHeight = this.getDropdownHeight();

    if (dropdownHeight > spaceAvailable) {
      let tempHeight = 0;
      let lastRowHeight = 0;
      let height = null;

      do {
        lastRowHeight = this.htEditor.view.getDefaultRowHeight();
        tempHeight += lastRowHeight;
      } while (tempHeight < spaceAvailable);

      height = tempHeight - lastRowHeight;

      if (this.isFlippedVertically) {
        this.htEditor.rootElement.style.top =
        `${parseInt(this.htEditor.rootElement.style.top, 10) + dropdownHeight - height}px`;
      }

      this.setDropdownHeight(tempHeight - lastRowHeight);
    }
  }

  /**
   * Fix width of the internal Handsontable's instance when editor has vertical scroll.
   */
  #fixDropdownWidth() {
    if (this.htEditor.view.hasVerticalScroll()) {
      this.htEditor.updateSettings({
        width: this.getTargetEditorWidth() + getScrollbarWidth(this.hot.rootDocument),
      });
    }
  }

  /**
   * Updates width and height of the internal Handsontable's instance.
   *
   * @private
   */
  updateDropdownDimensions() {
    this.htEditor.updateSettings({
      width: this.getTargetEditorWidth(),
      height: this.getTargetEditorHeight(),
    });

    this.#fixDropdownWidth();
    this.htEditor.view._wt.wtTable.alignOverlaysWithTrimmingContainer();
  }

  /**
   * Sets new height of the internal Handsontable's instance.
   *
   * @private
   * @param {number} height The new dropdown height.
   */
  setDropdownHeight(height) {
    this.htEditor.updateSettings({
      height
    });

    this.#fixDropdownWidth();
    this.htEditor.view._wt.wtTable.alignOverlaysWithTrimmingContainer();
  }

  /**
   * Creates new selection on specified row index, or deselects selected cells.
   *
   * @private
   * @param {number|undefined} index The visual row index.
   */
  highlightBestMatchingChoice(index) {
    if (typeof index === 'number') {
      this.htEditor.selectCell(index, 0, undefined, undefined, undefined, false);
    } else {
      this.htEditor.deselectCell();
    }
  }

  /**
   * Calculates the proposed/target editor height that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetEditorHeight() {
    let borderCompensation = 0;

    if (!this.hot.getCurrentThemeName()) {
      const containerStyle = this.hot.rootWindow.getComputedStyle(this.htContainer.querySelector('.htCore'));

      borderCompensation = parseInt(containerStyle.borderTopWidth, 10) +
        parseInt(containerStyle.borderBottomWidth, 10);
    }

    const maxItems = Math.min(this.cellProperties.visibleRows, this.strippedChoices.length);
    const height = Array.from({ length: maxItems }, (_, i) => i)
      .reduce((totalHeight, index) => {
        // for the first row, we need to add 1px (border-top compensation)
        const rowHeight = this.htEditor.view.getDefaultRowHeight() + (index === 0 ? 1 : 0);

        return totalHeight + rowHeight;
      }, 0);

    return height + borderCompensation;
  }

  /**
   * Calculates the proposed/target editor width that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetEditorWidth() {
    let borderCompensation = 0;

    if (!this.hot.getCurrentThemeName()) {
      const containerStyle = this.hot.rootWindow.getComputedStyle(this.htContainer.querySelector('.htCore'));

      borderCompensation = parseInt(containerStyle.borderInlineStartWidth, 10) +
        parseInt(containerStyle.borderInlineEndWidth, 10);
    }

    return this.htEditor.getColWidth(0) + borderCompensation;
  }

  /**
   * Sanitizes value from potential dangerous tags.
   *
   * @private
   * @param {string} value The value to sanitize.
   * @returns {string}
   */
  stripValueIfNeeded(value) {
    return this.stripValuesIfNeeded([value])[0];
  }

  /**
   * Sanitizes an array of the values from potential dangerous tags.
   *
   * @private
   * @param {string[]} values The value to sanitize.
   * @returns {string[]}
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
   * @param {number} keyCode The keyboard keycode.
   * @returns {boolean}
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
   * OnBeforeKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onBeforeKeyDown(event) {
    if (isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE ||
      event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
      // for Windows 10 + FF86 there is need to add delay to make sure that the value taken from
      // the textarea is the freshest value. Otherwise the list of choices does not update correctly (see #7570).
      // On the more modern version of the FF (~ >=91) it seems that the issue is not present or it is
      // more difficult to induce.
      let timeOffset = 10;

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
        }, timeOffset);
      }
    }
  }

  /**
   * Filters and sorts by relevance.
   *
   * @param {*} value The selected value.
   * @param {string[]} choices The list of available choices.
   * @param {boolean} caseSensitive Indicates if it's sorted by case.
   * @returns {number[]} Array of indexes in original choices array.
   */
  sortByRelevance = function(value, choices, caseSensitive) {
    const choicesRelevance = [];
    const result = [];
    const valueLength = value.length;
    let choicesCount = choices.length;
    let charsLeft;
    let currentItem;
    let i;
    let valueIndex;

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
        const locale = this.cellProperties.locale;

        valueIndex = currentItem.toLocaleLowerCase(locale).indexOf(value.toLocaleLowerCase(locale));
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
  }
}
