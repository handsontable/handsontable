import { rangeEach } from '../../../helpers/number';
import { arrayEach } from '../../../helpers/array';
import * as C from '../../../i18n/constants';
import BaseUI from './_base';

/**
 * Represents a selection item from the context menu callback.
 */
interface ContextMenuSelection {
  start: { row: number };
  end: { row: number };
}

/**
 * Represents a context menu item.
 */
interface ContextMenuItem {
  key: string;
  callback?: (key: string, selection: ContextMenuSelection[]) => void;
  name?: string | (() => string);
  disabled?: () => boolean;
  [key: string]: unknown;
}

/**
 * Context menu default options with items array.
 */
interface ContextMenuDefaultOptions {
  items: ContextMenuItem[];
  [key: string]: unknown;
}

/**
 * Class responsible for the Context Menu entries for the Nested Rows plugin.
 *
 * @private
 * @class ContextMenuUI
 * @augments BaseUI
 */
class ContextMenuUI extends BaseUI {
  /**
   * Reference to the DataManager instance connected with the Nested Rows plugin.
   *
   * @type {DataManager}
   */
  dataManager = this.plugin.dataManager;

  #menuEntries: Record<string, (key: string, selection: ContextMenuSelection[]) => void> = {
    row_above: (key: string, selection: ContextMenuSelection[]) => {
      const lastSelection = selection[selection.length - 1];

      this.dataManager!.addSibling(lastSelection.start.row, 'above');
    },
    row_below: (key: string, selection: ContextMenuSelection[]) => {
      const lastSelection = selection[selection.length - 1];

      this.dataManager!.addSibling(lastSelection.start.row, 'below');
    }
  };

  /**
   * Append options to the context menu. (Propagated from the `afterContextMenuDefaultOptions` hook callback)
   * f.
   *
   * @private
   * @param {object} defaultOptions Default context menu options.
   * @returns {*}
   */
  appendOptions(defaultOptions: ContextMenuDefaultOptions) {
    const newEntries = [
      {
        key: 'add_child',
        name() {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD);
        },
        callback: () => {
          const selectedActive = this.hot.getSelectedActive();
          const translatedRowIndex = this.dataManager!.translateTrimmedRow(selectedActive?.[0] ?? 0);
          const parent = this.dataManager!.getDataObject(translatedRowIndex);

          this.dataManager!.addChild(parent!);
        },
        disabled: () => {
          const selected = this.hot.getSelectedActive();

          return !selected || (selected[0] ?? 0) < 0 || this.hot.selection.isSelectedByColumnHeader() ||
            this.hot.countRows() >= (this.hot.getSettings().maxRows ?? Infinity);
        }
      },
      {
        key: 'detach_from_parent',
        name() {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD);
        },
        callback: () => {
          this.dataManager!.detachFromParent(this.hot.getSelectedActive() ?? []);
        },
        disabled: () => {
          const selected = this.hot.getSelectedActive();
          const translatedRowIndex = this.dataManager!.translateTrimmedRow(selected?.[0] ?? 0);
          const parent = this.dataManager!.getRowParent(translatedRowIndex);

          return !parent || !selected || (selected[0] ?? 0) < 0 || this.hot.selection.isSelectedByColumnHeader() ||
            this.hot.countRows() >= (this.hot.getSettings().maxRows ?? Infinity);
        }
      },
      {
        name: '---------',
      },
    ];

    rangeEach(0, defaultOptions.items.length - 1, (i) => {
      if (i === 0) {
        arrayEach(newEntries, (val, j) => {
          defaultOptions.items.splice(i + j, 0, val as ContextMenuItem);
        });

        return false;
      }
    });

    return this.modifyRowInsertingOptions(defaultOptions);
  }

  /**
   * Modify how the row inserting options work.
   *
   * @private
   * @param {object} defaultOptions Default context menu items.
   * @returns {*}
   */
  modifyRowInsertingOptions(defaultOptions: ContextMenuDefaultOptions) {
    rangeEach(0, defaultOptions.items.length - 1, (i) => {
      const option = this.#menuEntries[defaultOptions.items[i].key];

      if (option !== null && option !== undefined) {
        defaultOptions.items[i].callback = option;
      }
    });

    return defaultOptions;
  }
}

export default ContextMenuUI;
