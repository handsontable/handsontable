
import {objectEach} from './../../helpers/object';
import {align, getAlignmentClasses, getValidSelection, checkSelectionConsistency, markLabelAsSelected} from './utils';

export const ROW_ABOVE = 'row_above';
export const ROW_BELOW = 'row_below';
export const COLUMN_LEFT = 'col_left';
export const COLUMN_RIGHT = 'col_right';
export const REMOVE_ROW = 'remove_row';
export const REMOVE_COLUMN = 'remove_col';
export const UNDO = 'undo';
export const REDO = 'redo';
export const READ_ONLY = 'make_read_only';
export const ALIGNMENT = 'alignment';
export const SEPARATOR = '---------';

/**
 * Gets new object with all predefined menu items.
 *
 * @returns {Object}
 */
export function predefinedItems() {
  const items = {};

  objectEach(_predefinedItems, (value, key) => items[key] = value);

  return items;
}

const _predefinedItems = {
  [SEPARATOR]: {
    name: SEPARATOR
  },
  [ROW_ABOVE]: {
    key: ROW_ABOVE,
    name: 'Insert row above',

    callback: function(key, selection) {
      this.alter('insert_row', selection.start.row);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      let entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]];

      return entireColumnSelection.join(',') === selected.join(',');
    },
    hidden: function() {
      return !this.getSettings().allowInsertRow;
    }
  },
  [ROW_BELOW]: {
    key: ROW_BELOW,
    name: 'Insert row below',

    callback: function(key, selection) {
      this.alter('insert_row', selection.end.row + 1);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      let entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]];

      return entireColumnSelection.join(',') === selected.join(',');
    },
    hidden: function() {
      return !this.getSettings().allowInsertRow;
    }
  },
  [COLUMN_LEFT]: {
    key: COLUMN_LEFT,
    name: 'Insert column on the left',
    callback: function(key, selection) {
      this.alter('insert_col', selection.start.col);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }
      let entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1];
      let rowSelected = entireRowSelection.join(',') == selected.join(',');

      return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
    },
    hidden: function() {
      return !this.getSettings().allowInsertColumn;
    }
  },
  [COLUMN_RIGHT]: {
    key: COLUMN_RIGHT,
    name: 'Insert column on the right',

    callback: function(key, selection) {
      this.alter('insert_col', selection.end.col + 1);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }
      let entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1];
      let rowSelected = entireRowSelection.join(',') == selected.join(',');

      return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
    },
    hidden: function() {
      return !this.getSettings().allowInsertColumn;
    }
  },
  [REMOVE_ROW]: {
    key: REMOVE_ROW,
    name: 'Remove row',

    callback: function(key, selection) {
      let amount = selection.end.row - selection.start.row + 1;

      this.alter('remove_row', selection.start.row, amount);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      let entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]];

      return entireColumnSelection.join(',') === selected.join(',');
    },
    hidden: function() {
      return !this.getSettings().allowRemoveRow;
    }
  },
  [REMOVE_COLUMN]: {
    key: REMOVE_COLUMN,
    name: 'Remove column',

    callback: function(key, selection) {
      let amount = selection.end.col - selection.start.col + 1;

      this.alter('remove_col', selection.start.col, amount);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }
      let entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1];
      let rowSelected = entireRowSelection.join(',') == selected.join(',');

      return (selected[1] < 0 || rowSelected);
    },
    hidden: function() {
      return !this.getSettings().allowRemoveColumn;
    }
  },
  [UNDO]: {
    key: UNDO,
    name: 'Undo',

    callback: function() {
      this.undo();
    },
    disabled: function() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  },
  [REDO]: {
    key: REDO,
    name: 'Redo',

    callback: function() {
      this.redo();
    },
    disabled: function() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  },
  [READ_ONLY]: {
    key: READ_ONLY,
    name: function() {
      const contextMenu = this.getPlugin('contextMenu');
      let label = 'Read only';
      let atLeastOneReadOnly = checkSelectionConsistency(this.getSelectedRange(), (row, col) => this.getCellMeta(row, col).readOnly);

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback: function() {
      const contextMenu = this.getPlugin('contextMenu');
      let atLeastOneReadOnly = checkSelectionConsistency(this.getSelectedRange(), (row, col) => this.getCellMeta(row, col).readOnly);

      this.getSelectedRange().forAll((row, col) => {
        this.getCellMeta(row, col).readOnly = atLeastOneReadOnly ? false : true;
      });
      this.render();
    }
  },
  [ALIGNMENT]: {
    key: ALIGNMENT,
    name: 'Alignment',
    submenu: {
      items: [
        {
          key: `${ALIGNMENT}:left`,
          name: function() {
            let label = 'Left';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htLeft') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htLeft';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          key: `${ALIGNMENT}:center`,
          name: function() {
            let label = 'Center';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htCenter') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htCenter';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          key: `${ALIGNMENT}:right`,
          name: function() {
            let label = 'Right';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htRight') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htRight';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          key: `${ALIGNMENT}:justify`,
          name: function() {
            let label = 'Justify';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htJustify') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htJustify';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          name: SEPARATOR
        },
        {
          key: `${ALIGNMENT}:top`,
          name: function() {
            let label = 'Top';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htTop') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }
            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htTop';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          key: `${ALIGNMENT}:middle`,
          name: function() {
            let label = 'Middle';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htMiddle') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htMiddle';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        },
        {
          key: `${ALIGNMENT}:bottom`,
          name: function() {
            let label = 'Bottom';
            let hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              let className = this.getCellMeta(row, col).className;

              if (className && className.indexOf('htBottom') !== -1) {
                return true;
              }
            });

            if (hasClass) {
              label = markLabelAsSelected(label);
            }

            return label;
          },
          callback: function() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htBottom';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col));
            this.render();
          },
          disabled: false
        }
      ]
    }
  }
};
