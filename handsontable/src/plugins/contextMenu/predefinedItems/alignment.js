import { align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected } from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';

export const KEY = 'alignment';

/**
 * @returns {object}
 */
export default function alignmentItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT);
    },
    disabled() {
      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htCenter';

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htRight';

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htJustify';

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htTop';

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htMiddle';

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
            const hasClass = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
              const className = this.getCellMeta(row, col).className;

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
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htBottom';

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
