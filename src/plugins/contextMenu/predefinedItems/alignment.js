import {align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected} from './../utils';
import {KEY as SEPARATOR} from './separator';

export const KEY = 'alignment';

export function alignmentItem() {
  return {
    key: KEY,
    name: 'Alignment',
    disabled: function() {
      return this.getSelectedRange() && !this.selection.selectedHeader.corner ? false : true;
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
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
          key: `${KEY}:center`,
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
          key: `${KEY}:right`,
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
          key: `${KEY}:justify`,
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
          key: `${KEY}:top`,
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
          key: `${KEY}:middle`,
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
          key: `${KEY}:bottom`,
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
  };
}
