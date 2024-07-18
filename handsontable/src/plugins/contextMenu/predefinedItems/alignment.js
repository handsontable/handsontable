import { align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected } from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';

export const KEY = 'alignment';

/**
 * @param  {string} htClassName The class name to check.
 * @returns {boolean} Returns `true` if the cell has the provided class name.
 */
function getAlignmentComparator(htClassName) {
  return function(row, col) {
    const className = this.getCellMeta(row, col).className;

    if (className && className.indexOf(htClassName) !== -1) {
      return true;
    }

    return false;
  };
}

/**
 * @param {object} context The current context instance.
 * @param {string} htClassName The class name to check.
 * @returns {string} The value of aria-checked parameter.
 */
function ariaChecked(context, htClassName) {
  const hasClass = checkSelectionConsistency(
    context.getSelectedRange(),
    getAlignmentComparator(htClassName).bind(context));

  return hasClass.toString();
}

/**
 * @param {object} context The current context instance.
 * @param {string} rawName The raw name of the menu item.
 * @param {string} htClassName The class name to check.
 * @returns {string} The value of aria-label parameter.
 */
function ariaLabel(context, rawName, htClassName) {
  const hasClass = checkSelectionConsistency(
    context.getSelectedRange(),
    getAlignmentComparator(htClassName).bind(context));

  const checkboxState = hasClass
    ? context.getTranslatedPhrase(C.CHECKBOX_CHECKED)
    : context.getTranslatedPhrase(C.CHECKBOX_UNCHECKED);

  return `${rawName} ${checkboxState.toLowerCase()}`;
}

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

      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT), 'htLeft');
          },
          ariaChecked() {
            return ariaChecked(this, 'htLeft');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER), 'htCenter');
          },
          ariaChecked() {
            return ariaChecked(this, 'htCenter');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT), 'htRight');
          },
          ariaChecked() {
            return ariaChecked(this, 'htRight');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY), 'htJustify');
          },
          ariaChecked() {
            return ariaChecked(this, 'htJustify');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP), 'htTop');
          },
          ariaChecked() {
            return ariaChecked(this, 'htTop');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE), 'htMiddle');
          },
          ariaChecked() {
            return ariaChecked(this, 'htMiddle');
          },
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
          checkable: true,
          ariaLabel() {
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM), 'htBottom');
          },
          ariaChecked() {
            return ariaChecked(this, 'htBottom');
          },
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
