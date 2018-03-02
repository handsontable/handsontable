import {align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected} from './../utils';
import {KEY as SEPARATOR} from './separator';
import * as C from './../../../i18n/constants';

export const KEY = 'alignment';

export default function alignmentItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT);
    },
    disabled() {
      return !(this.getSelectedRange() && !this.selection.selectedHeader.corner);
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
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
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htLeft';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:center`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
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
          callback(key, selection) {
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htCenter';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:right`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
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
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htRight';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:justify`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
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
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'horizontal';
            let alignment = 'htJustify';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
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
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
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
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htTop';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:middle`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
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
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htMiddle';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:bottom`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
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
            const selectedRange = this.getSelectedRange();
            let stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            let type = 'vertical';
            let alignment = 'htBottom';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        }
      ]
    }
  };
}
