import type { HotInstance } from '../../core/types';
import { BaseEditor } from '../baseEditor';
import EventManager from '../../eventManager';
import { DropdownController } from './controllers/dropdownController';
import { SelectedItemsController } from './controllers/selectedItemsController';
import { addClass, setAttribute } from '../../helpers/dom/element';
import { isPrintableChar } from '../../helpers/unicode';
import { A11Y_LABEL, A11Y_GROUP } from '../../helpers/a11y';
import { EDITOR_EDIT_GROUP } from '../../shortcuts/contexts/constants';
import {
  getValuesIntersection,
  parseStringifiedValue,
} from './utils/utils';

export const EDITOR_TYPE = 'multiselect';

const DROPDOWN_ELEMENT_CSS_CLASSNAME = 'ht-multi-select-editor';
const DROPDOWN_ARIA_LABEL = 'Select options';
const SHORTCUTS_GROUP = 'multiselectEditor';
const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';

/**
 * @private
 * @class MultiSelectEditor
 */
export class MultiSelectEditor extends BaseEditor {
  _closeAfterDataChange = false;

  #selectedItems = new SelectedItemsController();
  #editorContainer: HTMLDivElement | null = null;

  dropdownContainerElement: HTMLDivElement | null = null;
  dropdownController: DropdownController | null = null;

  declare eventManager: InstanceType<typeof EventManager>;

  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  constructor(hotInstance: HotInstance) {
    super(hotInstance);

    this.eventManager = new EventManager(this);

    this.createElements();
    this.bindEvents();
  }

  createElements(): void {
    const { rootDocument } = this.hot;

    this.#editorContainer = rootDocument.createElement('div');
    this.#editorContainer.style.display = 'none';
    addClass(this.#editorContainer, 'handsontableEditor');

    this.dropdownContainerElement = this.hot.rootDocument.createElement('div');

    addClass(this.dropdownContainerElement, `${DROPDOWN_ELEMENT_CSS_CLASSNAME} handsontableEditor`);
    setAttribute(this.dropdownContainerElement, [
      A11Y_LABEL(DROPDOWN_ARIA_LABEL),
      A11Y_GROUP(),
    ]);

    this.#editorContainer.appendChild(this.dropdownContainerElement);
    this.hot.rootElement.appendChild(this.#editorContainer);

    this.dropdownController = new DropdownController(this.dropdownContainerElement, this.hot.guid);
  }

  prepare(
    row: number,
    col: number,
    prop: string | number,
    td: HTMLTableCellElement,
    value: unknown,
    cellProperties: Record<string, unknown>
  ): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    const parsedValue = parseStringifiedValue(value);
    const valuesArray: unknown[] = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
    const valuesIntersection = getValuesIntersection(valuesArray, this.#getSource());

    this.dropdownController!.reset();

    if (valuesIntersection.length >= this.#getEditorSetting<number>('maxSelections')) {
      this.#blockNewSelections();
    }

    this.#syncSelectedValues(valuesIntersection);

    type SortFn = ((entries: unknown[]) => unknown[]) | undefined;
    this.dropdownController!.setSourceSortFunction(this.#getEditorSetting<SortFn>('sourceSortFunction'));
    this.dropdownController!.fillDropdown(this.#getSource(), valuesIntersection);
    this.dropdownController!.setVisibleRowsNumberSetting(this.#getEditorSetting<number>('visibleRows'));
    this.dropdownController!.setSearchInputVisibility(this.#getEditorSetting<boolean>('searchInput'));

    if (cellProperties.maxSelections !== undefined) {
      this.#selectedItems.setMaxSelectionCount(this.#getEditorSetting<number>('maxSelections'));
    }
  }

  finishEditing(restoreOriginalValue: boolean, ctrlDown: boolean, callback?: Function): void {
    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  bindEvents(): void {
    this.dropdownController!.addLocalHook('afterDropdownItemChecked',
      (selectedKey: string, selectedValue: string) => {
        this.#addSelectedValue(selectedKey, selectedValue);

        if (this.#selectedItems.getSize() >= (this.#getEditorSetting<number>('maxSelections'))) {
          this.#blockNewSelections();
        }
      }
    );
    this.dropdownController!.addLocalHook('afterDropdownItemUnchecked',
      (deselectedKey: string, deselectedValue: string) => {
        this.#removeSelectedValue(deselectedKey, deselectedValue);

        if (this.#selectedItems.getSize() < (this.#getEditorSetting<number>('maxSelections'))) {
          this.#unblockNewSelections();
        }
      }
    );

    this.addHook('afterDestroy', () => this.destroy());
    this.addHook('afterSetSourceDataAtCell',
      (changes: unknown[][], source: string) => this.#onAfterSetSourceDataAtCell(changes, source));
    this.addHook('afterScrollHorizontally', () => this.refreshDimensions());
    this.addHook('afterScrollVertically', () => this.refreshDimensions());

    this.dropdownController!.getInputController()!.addLocalHook(
      'triggerFilter', (value: string) => this.#filterEntries(value));
  }

  open(event?: Event | null): void {
    const keyCode = event && 'keyCode' in event ? (event as { keyCode: number }).keyCode : 0;
    const keyStr = event && 'key' in event ? (event as { key: string }).key : '';

    if (keyCode && isPrintableChar(keyCode)) {
      const character = keyStr.length === 1 ? keyStr : String.fromCharCode(keyCode);

      if (this.dropdownController!.getInputController()!.enabled) {
        this.dropdownController!.getInputController()!.setValue(character);
        this.#filterEntries(character);
      }

      event?.preventDefault();

      this.enableFullEditMode();
    }

    this.#showEditableElement();
    this.refreshDimensions();
    this.hot.getShortcutManager().setActiveContextName('editor');
    this.#registerShortcuts();
    this.dropdownController!.getInputController()!.listen();

    this.dropdownController!.updateDimensions(this.#getAvailableSpace());

  }

  close(): void {
    this.#hideEditableElement();
    this.#unregisterShortcuts();
    this.dropdownController!.getInputController()!.unlisten();
  }

  getValue(): unknown[] {
    return this.#selectedItems.getItemsArray();
  }

  setValue(): void {
    // Currently not implemented - MultiSelectEditor saves data after every change.
  }

  refreshDimensions(): void {
    if (!this.getEditedCell()) {
      this.close();

      return;
    }

    const { top, start, height } = this.getEditedCellRect()!;
    const editorStyle = this.#editorContainer!.style;

    editorStyle.top = `${top + height}px`;
    editorStyle[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;

    addClass(this.#editorContainer!, EDITOR_VISIBLE_CLASS_NAME);
  }

  focus(): void {
    if (this.#getEditorSetting('searchInput') === false) {
      this.dropdownController!.focusFirstItem();
    } else {
      this.dropdownController!.focusSearchInput();
    }
  }

  getInputElement(): HTMLInputElement {
    return this.dropdownController!.getInputController()!.getInputElement();
  }

  destroy(): void {
    this.close();
    this.dropdownController!.reset();
  }

  #getSource(): unknown[] {
    return (this.cellProperties.source as unknown[]) ?? [];
  }

  #registerShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.addShortcuts([{
      keys: [['ArrowUp']],
      callback: () => {
        this.dropdownController!.focusPreviousItem();
      },
    }, {
      keys: [['ArrowDown']],
      callback: () => {
        if (this.hot.rootDocument.activeElement === this.getInputElement()) {
          this.dropdownController!.focusFirstItem();
        } else {
          this.dropdownController!.focusNextItem();
        }
      },
    }], {
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcuts([{
      keys: [['enter'], ['shift', 'enter'], ['control/meta', 'enter'], ['control/meta', 'shift', 'enter']],
      runOnlyIf: () => !this.#getEditorSetting('enterCommits'),
      callback: (event: Event) => {
        const activeElement = this.hot.rootDocument.activeElement;

        if (activeElement instanceof HTMLInputElement && activeElement.type === 'checkbox') {
          activeElement.checked = !activeElement.checked;
          activeElement.dispatchEvent(new Event('change'));
        }

        event.preventDefault();

        return false;
      },
    }, {
      keys: [['space']],
      runOnlyIf: () => !this.#getEditorSetting('enterCommits'),
      callback: (event: Event) => {
        event.preventDefault();
      },
    }], {
      group: SHORTCUTS_GROUP,
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before',
    });
  }

  #unregisterShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  #showEditableElement(): void {
    this.#editorContainer!.style.display = '';
  }

  #hideEditableElement(): void {
    this.#editorContainer!.style.display = 'none';
  }

  #blockNewSelections(): void {
    this.dropdownController!.disableCheckboxes();
  }

  #unblockNewSelections(): void {
    this.dropdownController!.enableCheckboxes();
  }

  #filterEntries(
    query: string,
    filterSelectedItems: boolean = this.#getEditorSetting<boolean>('filterSelectedItems') ?? true
  ): void {
    const filteredItems = this.#getSource().filter((item: unknown) => {
      const value = (typeof item === 'object' && item !== null && 'value' in item)
        ? item.value
        : item;

      if (!filterSelectedItems && this.#selectedItems.has(item)) {
        return true;
      }

      if (this.cellProperties.filteringCaseSensitive) {
        return String(value).includes(query);
      }

      return String(value).toLowerCase().includes(query.toLowerCase());
    });

    this.dropdownController!.fillDropdown(filteredItems, this.#selectedItems.getItemsArray());
    this.dropdownController!.updateDimensions(this.#getAvailableSpace(), true);
  }

  #getAvailableSpace(): { spaceAbove: number; spaceBelow: number; cellHeight: number } {
    const cellRect = this.getEditedCellRect()!;
    const isVerticallyScrollableByWindow = this.hot.view.isVerticallyScrollableByWindow();
    const workspaceHeight = this.hot.view.getWorkspaceHeight();

    let spaceAbove = cellRect.top;

    if (isVerticallyScrollableByWindow) {
      const topOffset = this.hot.view.getTableOffset().top - this.hot.rootWindow.scrollY;

      spaceAbove = Math.max(spaceAbove + topOffset, 0);
    }

    const spaceBelow = workspaceHeight - spaceAbove - cellRect.height;

    return {
      spaceAbove,
      spaceBelow,
      cellHeight: cellRect.height,
    };
  }

  #saveCurrentSelection(): void {
    const value = this.#selectedItems.getItemsArray();

    this.saveValue([[value]]);
  }

  #addSelectedValue(selectedKey: string, selectedValue: string): void {
    if (selectedKey) {
      this.#selectedItems.add({ key: selectedKey, value: selectedValue });
    } else {
      this.#selectedItems.add(selectedValue);
    }
    this.#saveCurrentSelection();
    this.refreshDimensions();
  }

  #removeSelectedValue(deselectedKey: string, deselectedValue: string): void {
    if (deselectedKey) {
      this.#selectedItems.remove({ key: deselectedKey, value: deselectedValue });
    } else {
      this.#selectedItems.remove(deselectedValue);
    }
    this.#saveCurrentSelection();
    this.refreshDimensions();
  }

  #syncSelectedValues(valuesArray: unknown[]): void {
    if (valuesArray.length > 0) {
      this.#selectedItems = new SelectedItemsController(valuesArray);
    } else {
      this.#selectedItems = new SelectedItemsController();
    }
  }

  #getEditorSetting<T>(settingKey: string): T {
    return this.cellProperties[settingKey] as T;
  }

  #onAfterSetSourceDataAtCell(changes: unknown[][], source: string): void {
    if (
      this.isOpened() &&
      source === `${EDITOR_TYPE}-renderer` &&
      parseInt(String(changes[0][0]), 10) === this.cellProperties.visualRow &&
      parseInt(String(changes[0][1]), 10) === this.cellProperties.visualCol
    ) {
      this.#syncSelectedValues(changes[0][3] as unknown[]);
      this.dropdownController!.fillDropdown(this.#getSource(), this.#selectedItems.getItemsArray());
      this.dropdownController!.focusItem(0);

      if (this.#selectedItems.getSize() >= (this.#getEditorSetting<number>('maxSelections'))) {
        this.#blockNewSelections();
      } else {
        this.#unblockNewSelections();
      }
    }
  }
}
