import {rangeEach} from 'handsontable/helpers/number';
import {arrayEach} from 'handsontable/helpers/array';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * Class responsible for the Context Menu entries for the Nested Rows plugin.
 *
 * @class ContextMenuUI
 * @util
 * @extends BaseUI
 */
class ContextMenuUI extends BaseUI {
  constructor(nestedRowsPlugin, hotInstance) {
    super(nestedRowsPlugin, hotInstance);

    privatePool.set(this, {
      row_above: (key, selection) => {
        this.dataManager.addSibling(selection.start.row, 'above');
      },
      row_below: (key, selection) => {
        this.dataManager.addSibling(selection.start.row, 'below');
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
   * f
   * @private
   * @param {Object} defaultOptions Default context menu options.
   * @returns {*}
   */
  appendOptions(defaultOptions) {
    const newEntries = [
      {
        key: 'add_child',
        name: () => 'Insert child row',
        callback: () => {
          const translatedRowIndex = this.dataManager.translateTrimmedRow(this.hot.getSelected()[0]);
          const parent = this.dataManager.getDataObject(translatedRowIndex);
          this.dataManager.addChild(parent);
        },
        disabled: () => {
          const selected = this.hot.getSelected();

          return !selected || selected[0] < 0 || this.hot.selection.selectedHeader.cols || this.hot.countRows() >= this.hot.getSettings().maxRows;
        }
      },
      {
        key: 'detach_from_parent',
        name: () => 'Detach from parent',
        callback: () => {
          const translatedRowIndex = this.dataManager.translateTrimmedRow(this.hot.getSelected()[0]);
          const element = this.dataManager.getDataObject(translatedRowIndex);

          this.dataManager.detachFromParent(this.hot.getSelected());
        },
        disabled: () => {
          const selected = this.hot.getSelected();
          const translatedRowIndex = this.dataManager.translateTrimmedRow(selected[0]);
          let parent = this.dataManager.getRowParent(translatedRowIndex);

          return !parent || !selected || selected[0] < 0 || this.hot.selection.selectedHeader.cols || this.hot.countRows() >= this.hot.getSettings().maxRows;
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

    defaultOptions = this.modifyRowInsertingOptions(defaultOptions);

    return defaultOptions;
  }

  /**
   * Modify how the row inserting options work.
   *
   * @private
   * @param {Object} defaultOptions Default context menu items.
   * @returns {*}
   */
  modifyRowInsertingOptions(defaultOptions) {
    let priv = privatePool.get(this);

    rangeEach(0, defaultOptions.items.length - 1, (i) => {

      if (priv[defaultOptions.items[i].key] != null) {
        defaultOptions.items[i].callback = priv[defaultOptions.items[i].key];
      }
    });

    return defaultOptions;
  }
}

export default ContextMenuUI;
