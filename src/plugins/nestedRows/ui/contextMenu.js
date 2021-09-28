import { rangeEach } from '../../../helpers/number';
import { arrayEach } from '../../../helpers/array';
import * as C from '../../../i18n/constants';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * Class responsible for the Context Menu entries for the Nested Rows plugin.
 *
 * @class ContextMenuUI
 * @util
 * @private
 * @augments BaseUI
 */
class ContextMenuUI extends BaseUI {
  constructor(nestedRowsPlugin, hotInstance) {
    super(nestedRowsPlugin, hotInstance);

    privatePool.set(this, {
      row_above: (key, selection) => {
        const lastSelection = selection[selection.length - 1];

        this.dataManager.addSibling(lastSelection.start.row, 'above');
      },
      row_below: (key, selection) => {
        const lastSelection = selection[selection.length - 1];

        this.dataManager.addSibling(lastSelection.start.row, 'below');
      }
    });
    /**
     * Reference to the DataManager instance connected with the Nested Rows plugin.
     *
     * @type {DataManager}
     */
    this.dataManager = this.plugin.dataManager;
  }
  /**
   * Append options to the context menu. (Propagated from the `afterContextMenuDefaultOptions` hook callback)
   * f.
   *
   * @private
   * @param {object} defaultOptions Default context menu options.
   * @returns {*}
   */
  appendOptions(defaultOptions) {
    const newEntries = [
      {
        key: 'add_child',
        name() {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD);
        },
        callback: () => {
          const translatedRowIndex = this.dataManager.translateTrimmedRow(this.hot.getSelectedLast()[0]);
          const parent = this.dataManager.getDataObject(translatedRowIndex);

          this.dataManager.addChild(parent);
        },
        disabled: () => {
          const selected = this.hot.getSelectedLast();

          return !selected || selected[0] < 0 || this.hot.selection.isSelectedByColumnHeader() ||
            this.hot.countRows() >= this.hot.getSettings().maxRows;
        }
      },
      {
        key: 'detach_from_parent',
        name() {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD);
        },
        callback: () => {
          this.dataManager.detachFromParent(this.hot.getSelectedLast());
        },
        disabled: () => {
          const selected = this.hot.getSelectedLast();
          const translatedRowIndex = this.dataManager.translateTrimmedRow(selected[0]);
          const parent = this.dataManager.getRowParent(translatedRowIndex);

          return !parent || !selected || selected[0] < 0 || this.hot.selection.isSelectedByColumnHeader() ||
            this.hot.countRows() >= this.hot.getSettings().maxRows;
        }
      },
      {
        name: '---------',
      },
    ];

    rangeEach(0, defaultOptions.items.length - 1, (i) => {
      if (i === 0) {
        arrayEach(newEntries, (val, j) => {
          defaultOptions.items.splice(i + j, 0, val);
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
  modifyRowInsertingOptions(defaultOptions) {
    const priv = privatePool.get(this);

    rangeEach(0, defaultOptions.items.length - 1, (i) => {
      const option = priv[defaultOptions.items[i].key];

      if (option !== null && option !== void 0) {
        defaultOptions.items[i].callback = option;
      }
    });

    return defaultOptions;
  }
}

export default ContextMenuUI;
