import type { HotInstance } from '../../core/types';
import EventManager from '../../eventManager';
import { empty, addClass, eventTargetEl, setAttribute, isHTMLElement } from '../../helpers/dom/element';
import { isEmpty, stringify } from '../../helpers/mixed';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import { Hooks } from '../../core/hooks';
import { A11Y_CHECKBOX, A11Y_CHECKED, A11Y_LABEL } from '../../helpers/a11y';
import { CHECKBOX_CHECKED, CHECKBOX_UNCHECKED } from '../../i18n/constants';
import { BAD_VALUE_TEXT } from '../../helpers/constants';

const isListeningKeyDownEvent = new WeakMap();
const isCheckboxListenerAdded = new WeakMap();
const BAD_VALUE_CLASS = 'htBadValue';
const ATTR_ROW = 'data-row';
const ATTR_COLUMN = 'data-col';
const SHORTCUTS_GROUP = 'checkboxRenderer';

export const RENDERER_TYPE: 'checkbox' = 'checkbox';

Hooks.getSingleton().add('modifyAutoColumnSizeSeed',
  function(_bundleSeed: unknown, cellMeta: unknown, cellValue: unknown) {
    const { label, type, row, column, prop } = cellMeta as Record<string, unknown>;

    if (type !== RENDERER_TYPE || !label) {
      return;
    }

    const labelObj = label as Record<string, unknown>;
    const { value: labelValue, property: labelProperty } = labelObj;
    let labelText = cellValue;

    if (labelValue) {
      labelText = typeof labelValue === 'function' ?
        labelValue(row, column, prop, cellValue) : labelValue;

    } else if (labelProperty) {
      const labelData = this.getDataAtRowProp(row, labelProperty);

      labelText = labelData !== null ? labelData : cellValue;
    }

    return `${stringify(labelText).length}`;
  });
/**
 * Checkbox renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function checkboxRenderer(
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, cellProperties: Record<string, unknown>): void {
  const { rootDocument } = hotInstance;
  const ariaEnabled = hotInstance.getSettings().ariaTags;

  registerEvents(hotInstance);

  const input: HTMLInputElement = createInput(rootDocument);
  let inputOrWrapper: HTMLElement = input;
  const labelOptions = cellProperties.label as Record<string, unknown> | undefined;
  let badValue = false;

  if (typeof cellProperties.checkedTemplate === 'undefined') {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === 'undefined') {
    cellProperties.uncheckedTemplate = false;
  }

  empty(TD); // TODO identify under what circumstances this line can be removed

  const locale = cellProperties.locale as string | undefined;

  if (value === cellProperties.checkedTemplate ||
    stringify(value).toLocaleLowerCase(locale) ===
    stringify(cellProperties.checkedTemplate).toLocaleLowerCase(locale)) {
    input.checked = true;

  } else if (value === cellProperties.uncheckedTemplate ||
    stringify(value).toLocaleLowerCase(locale) ===
    stringify(cellProperties.uncheckedTemplate).toLocaleLowerCase(locale)) {
    input.checked = false;

  } else if (isEmpty(value)) { // default value
    addClass(input, 'noValue');

  } else {
    input.style.display = 'none';
    addClass(input, BAD_VALUE_CLASS);
    badValue = true;
  }

  setAttribute(input, [
    [ATTR_ROW, row],
    [ATTR_COLUMN, col],
  ]);

  if (ariaEnabled) {
    setAttribute(input, [
      A11Y_LABEL(input.checked ?
        hotInstance.getTranslatedPhrase(CHECKBOX_CHECKED) :
        hotInstance.getTranslatedPhrase(CHECKBOX_UNCHECKED)
      ),
      A11Y_CHECKED(input.checked),
      A11Y_CHECKBOX(),
    ]);
  }

  if (!badValue && labelOptions) {
    let labelText = '';

    if (labelOptions.value) {
      labelText = typeof labelOptions.value === 'function' ?
        labelOptions.value.call(this, row, col, prop, value) : String(labelOptions.value);

    } else if (labelOptions.property) {
      const labelValue = hotInstance.getDataAtRowProp(row, String(labelOptions.property));

      labelText = labelValue !== null ? String(labelValue) : '';
    }

    const label = createLabel(rootDocument, labelText, labelOptions.separated !== true);

    if (labelOptions.position === 'before') {
      if (labelOptions.separated) {
        TD.appendChild(label);
        TD.appendChild(input);

      } else {
        label.appendChild(input);
        inputOrWrapper = label;
      }
    } else if (!labelOptions.position || labelOptions.position === 'after') {
      if (labelOptions.separated) {
        TD.appendChild(input);
        TD.appendChild(label);

      } else {
        label.insertBefore(input, label.firstChild);
        inputOrWrapper = label;
      }
    }
  }

  if (!labelOptions || (labelOptions && !labelOptions.separated)) {
    TD.appendChild(inputOrWrapper);
  }

  if (badValue) {
    TD.appendChild(rootDocument.createTextNode(BAD_VALUE_TEXT));
  }

  if (!isListeningKeyDownEvent.has(hotInstance)) {
    isListeningKeyDownEvent.set(hotInstance, true);
    registerShortcuts();
  }

  /**
   * Register shortcuts responsible for toggling checkbox state.
   *
   * @private
   */
  function registerShortcuts() {
    const shortcutManager = hotInstance.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const config = {
      group: SHORTCUTS_GROUP,
      relativeToGroup: SHORTCUTS_GROUP_EDITOR,
      position: 'before' as const,
    };

    gridContext?.addShortcuts([{
      keys: [['space']],
      callback: () => {
        changeSelectedCheckboxesState();

        return !areSelectedCheckboxCells(); // False blocks next action associated with the keyboard shortcut.
      },
      runOnlyIf: (): boolean => !!(hotInstance.getSelectedRangeActive()?.highlight.isCell()),
    }, {
      keys: [['enter']],
      callback: () => {
        changeSelectedCheckboxesState();

        return !areSelectedCheckboxCells(); // False blocks next action associated with the keyboard shortcut.
      },
      runOnlyIf: (): boolean => {
        const range = hotInstance.getSelectedRangeActive();

        return !!(hotInstance.getSettings().enterBeginsEditing &&
          range?.highlight.isCell() &&
          !hotInstance.selection.isMultiple());
      },
    }, {
      keys: [['delete'], ['backspace']],
      callback: () => {
        changeSelectedCheckboxesState(true);

        return !areSelectedCheckboxCells(); // False blocks next action associated with the keyboard shortcut.
      },
      runOnlyIf: (): boolean => !!(hotInstance.getSelectedRangeActive()?.highlight.isCell()),
    }], config);
  }

  /**
   * Change checkbox checked property.
   *
   * @private
   * @param {boolean} [uncheckCheckbox=false] The new "checked" state for the checkbox elements.
   */
  function changeSelectedCheckboxesState(uncheckCheckbox = false) {
    type CellTemplates = { checkedTemplate: unknown; uncheckedTemplate: unknown };
    type ChangeEntry = [number, number, unknown, CellTemplates?];

    const selRange = hotInstance.getSelectedRange();
    const changesPerSubSelection: number[] = [];
    const nonCheckboxChanges = new Map();
    let changes: ChangeEntry[] = [];
    let changeCounter = 0;

    if (!selRange) {
      return;
    }

    for (let key = 0; key < selRange.length; key++) {
      const { row: startRow, col: startColumn } = selRange[key].getTopStartCorner();
      const { row: endRow, col: endColumn } = selRange[key].getBottomEndCorner();

      if (startRow === null || startColumn === null || endRow === null || endColumn === null) {
        continue;
      }

      for (let visualRow = startRow; visualRow <= endRow; visualRow += 1) {
        for (let visualColumn = startColumn; visualColumn <= endColumn; visualColumn += 1) {
          const cachedCellProperties = hotInstance.getCellMeta(visualRow, visualColumn);

          /* eslint-disable no-continue */
          if (cachedCellProperties.hidden) {
            continue;
          }

          const templates = {
            checkedTemplate: cachedCellProperties.checkedTemplate,
            uncheckedTemplate: cachedCellProperties.uncheckedTemplate,
          };

          // TODO: In the future it'd be better if non-checkbox changes were handled by the non-checkbox
          //  `delete` keypress logic.
          /* eslint-disable no-continue */
          if (cachedCellProperties.type !== 'checkbox') {
            if (uncheckCheckbox === true && !cachedCellProperties.readOnly) {
              if (nonCheckboxChanges.has(changesPerSubSelection.length)) {
                nonCheckboxChanges.set(changesPerSubSelection.length, [
                  ...nonCheckboxChanges.get(changesPerSubSelection.length),
                  [visualRow, visualColumn, null]
                ]);

              } else {
                nonCheckboxChanges.set(changesPerSubSelection.length, [[visualRow, visualColumn, null]]);
              }
            }

            continue;
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

          const dataAtCell = hotInstance.getDataAtCell(visualRow, visualColumn);

          if (uncheckCheckbox === false) {
            if ([cachedCellProperties.checkedTemplate, String(cachedCellProperties.checkedTemplate)].includes(dataAtCell)) { // eslint-disable-line max-len
              changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate, templates]);

            } else if ([cachedCellProperties.uncheckedTemplate, String(cachedCellProperties.uncheckedTemplate), null, undefined].includes(dataAtCell)) { // eslint-disable-line max-len
              changes.push([visualRow, visualColumn, cachedCellProperties.checkedTemplate, templates]);
            }

          } else {
            changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate, templates]);
          }

          changeCounter += 1;
        }
      }

      changesPerSubSelection.push(changeCounter);
      changeCounter = 0;
    }

    if (!changes.every(([, , cellValue]) => cellValue === changes[0][2])) {
      changes = changes.map(
        ([visualRow, visualColumn, , templates]) => [visualRow, visualColumn, templates?.checkedTemplate]
      );
    } else {
      changes = changes.map(([visualRow, visualColumn, cellValue]) => [visualRow, visualColumn, cellValue]);
    }

    if (changes.length > 0) {
      // TODO: This is workaround for handsontable/dev-handsontable#1747 not being a breaking change.
      // Technically, the changes don't need to be split into chunks when sent to `setDataAtCell`.
      const changesChunks: ChangeEntry[][] = [];

      changesPerSubSelection.forEach((changesCount, sectionCount) => {
        let changesChunk = changes.splice(0, changesCount);

        if (nonCheckboxChanges.size && nonCheckboxChanges.has(sectionCount)) {
          changesChunk = [
            ...changesChunk,
            ...nonCheckboxChanges.get(sectionCount)
          ];
        }

        changesChunks.push(changesChunk);
      });

      if (uncheckCheckbox) {
        const allChanges: ChangeEntry[] = [];

        changesChunks.forEach((changesChunk) => {
          changesChunk.forEach((change) => {
            allChanges.push(change);
          });
        });

        if (allChanges.length > 0) {
          hotInstance.setDataAtCell(allChanges);
        }

      } else {
        changesChunks.forEach((changesChunk) => {
          if (changesChunk.length > 0) {
            hotInstance.setDataAtCell(changesChunk);
          }
        });
      }
    }
  }

  /**
   * Check whether all selected cells are with checkbox type.
   *
   * @returns {boolean}
   * @private
   */
  function areSelectedCheckboxCells() {
    const selRange = hotInstance.getSelectedRange();

    if (!selRange) {
      return;
    }

    for (let key = 0; key < selRange.length; key++) {
      const topLeft = selRange[key].getTopStartCorner();
      const bottomRight = selRange[key].getBottomEndCorner();

      if (topLeft.row === null || topLeft.col === null || bottomRight.row === null || bottomRight.col === null) {
        continue;
      }

      for (let visualRow = topLeft.row; visualRow <= bottomRight.row; visualRow++) {
        for (let visualColumn = topLeft.col; visualColumn <= bottomRight.col; visualColumn++) {
          const cellMeta = hotInstance.getCellMeta(visualRow, visualColumn);

          /* eslint-disable no-continue */
          if (cellMeta.readOnly) {
            continue;
          }

          const cell = hotInstance.getCell(visualRow, visualColumn);

          if (isHTMLElement(cell)) {
            const checkboxes = cell.querySelectorAll('input[type=checkbox]');

            if (checkboxes.length > 0) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

}

checkboxRenderer.RENDERER_TYPE = RENDERER_TYPE;

/**
 * Register checkbox listeners.
 *
 * @param {Core} instance The Handsontable instance.
 * @returns {EventManager}
 */
function registerEvents(instance: HotInstance) {
  let eventManager = isCheckboxListenerAdded.get(instance);

  if (!eventManager) {
    const { rootElement } = instance;

    eventManager = new EventManager(instance);

    eventManager.addEventListener(rootElement, 'click', (event: Event) => onClick(event, instance));
    eventManager.addEventListener(rootElement, 'mouseup', (event: Event) => onMouseUp(event, instance));
    eventManager.addEventListener(rootElement, 'change', (event: Event) => onChange(event, instance));

    isCheckboxListenerAdded.set(instance, eventManager);
  }

  return eventManager;
}

/**
 * Create input element.
 *
 * @param {Document} rootDocument The document owner.
 * @returns {HTMLInputElement}
 */
function createInput(rootDocument: Document): HTMLInputElement {
  const input = rootDocument.createElement('input');

  input.className = 'htCheckboxRendererInput';
  input.type = 'checkbox';
  input.setAttribute('tabindex', '-1');

  return input.cloneNode(false) as HTMLInputElement;
}

/**
 * Create label element.
 *
 * @param {Document} rootDocument The document owner.
 * @param {string} text The label text.
 * @param {boolean} fullWidth Determines whether label should have full width.
 * @returns {HTMLElement}
 */
function createLabel(rootDocument: Document, text: string, fullWidth: boolean): HTMLElement {
  const label = rootDocument.createElement('label');

  label.className = `htCheckboxRendererLabel ${fullWidth ? 'fullWidth' : ''}`;

  const textNode = rootDocument.createTextNode(text);

  if (fullWidth) {
    const span = rootDocument.createElement('span');

    span.appendChild(textNode);
    label.appendChild(span);
  } else {
    label.appendChild(textNode);
  }

  return label.cloneNode(true) as HTMLElement;
}

/**
 * `mouseup` callback.
 *
 * @private
 * @param {Event} event `mouseup` event.
 * @param {Core} instance The Handsontable instance.
 */
function onMouseUp(event: Event, instance: HotInstance) {
  const target = eventTargetEl(event)!;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  setTimeout(instance.listen, 10);
}

/**
 * `click` callback.
 *
 * @private
 * @param {MouseEvent} event `click` event.
 * @param {Core} instance The Handsontable instance.
 */
function onClick(event: Event, instance: HotInstance) {
  const target = eventTargetEl(event)!;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  const row = Number.parseInt(target.getAttribute(ATTR_ROW)!, 10);
  const col = Number.parseInt(target.getAttribute(ATTR_COLUMN)!, 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (cellProperties.readOnly) {
    event.preventDefault();
  }
}

/**
 * `change` callback.
 *
 * @param {Event} event `change` event.
 * @param {Core} instance The Handsontable instance.
 */
function onChange(event: Event, instance: HotInstance) {
  const target = eventTargetEl<HTMLInputElement>(event)!;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  const row = Number.parseInt(target.getAttribute(ATTR_ROW)!, 10);
  const col = Number.parseInt(target.getAttribute(ATTR_COLUMN)!, 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (!cellProperties.readOnly) {
    let newCheckboxValue = null;

    if (target.checked) {
      newCheckboxValue = cellProperties.uncheckedTemplate === undefined ? true : cellProperties.checkedTemplate;
    } else {
      newCheckboxValue = cellProperties.uncheckedTemplate === undefined ? false : cellProperties.uncheckedTemplate;
    }

    instance.setDataAtCell(row, col, newCheckboxValue);
  }
}

/**
 * Check if the provided element is the checkbox input.
 *
 * @private
 * @param {HTMLElement} element The element in question.
 * @returns {boolean}
 */
function isCheckboxInput(element: HTMLElement) {
  return element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox';
}
