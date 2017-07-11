import {align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected} from './../utils';
import {KEY as SEPARATOR} from './separator';

export const KEY = 'alignment';

export default function alignmentItem() {
  return {
    key: KEY,
    name: 'Alignment',
    disabled() {
      return !(this.getSelectedRange() && !this.selection.selectedHeader.corner);
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htLeft';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:center`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htCenter';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:right`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htRight';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:justify`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htJustify';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          name: SEPARATOR
        },
        {
          key: `${KEY}:top`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htTop';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:middle`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htMiddle';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:bottom`,
          name() {
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
          callback() {
            let range = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(range, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htBottom';

            this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
            align(range, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        }
      ]
    }
  };
}
