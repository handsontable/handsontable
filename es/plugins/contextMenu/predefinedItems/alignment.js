import { align, getAlignmentClasses, checkSelectionConsistency, markLabelAsSelected } from './../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from './../../../i18n/constants';

export var KEY = 'alignment';

export default function alignmentItem() {
  return {
    key: KEY,
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT);
    },
    disabled: function disabled() {
      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    },

    submenu: {
      items: [{
        key: KEY + ':left',
        name: function name() {
          var _this = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this.getCellMeta(row, col).className;

            if (className && className.indexOf('htLeft') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this2 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this2.getCellMeta(row, col).className;
          });
          var type = 'horizontal';
          var alignment = 'htLeft';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this2.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this2.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        key: KEY + ':center',
        name: function name() {
          var _this3 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this3.getCellMeta(row, col).className;

            if (className && className.indexOf('htCenter') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this4 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this4.getCellMeta(row, col).className;
          });
          var type = 'horizontal';
          var alignment = 'htCenter';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this4.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this4.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        key: KEY + ':right',
        name: function name() {
          var _this5 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this5.getCellMeta(row, col).className;

            if (className && className.indexOf('htRight') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this6 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this6.getCellMeta(row, col).className;
          });
          var type = 'horizontal';
          var alignment = 'htRight';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this6.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this6.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        key: KEY + ':justify',
        name: function name() {
          var _this7 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this7.getCellMeta(row, col).className;

            if (className && className.indexOf('htJustify') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this8 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this8.getCellMeta(row, col).className;
          });
          var type = 'horizontal';
          var alignment = 'htJustify';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this8.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this8.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        name: SEPARATOR
      }, {
        key: KEY + ':top',
        name: function name() {
          var _this9 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this9.getCellMeta(row, col).className;

            if (className && className.indexOf('htTop') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }
          return label;
        },
        callback: function callback() {
          var _this10 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this10.getCellMeta(row, col).className;
          });
          var type = 'vertical';
          var alignment = 'htTop';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this10.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this10.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        key: KEY + ':middle',
        name: function name() {
          var _this11 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this11.getCellMeta(row, col).className;

            if (className && className.indexOf('htMiddle') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this12 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this12.getCellMeta(row, col).className;
          });
          var type = 'vertical';
          var alignment = 'htMiddle';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this12.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this12.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }, {
        key: KEY + ':bottom',
        name: function name() {
          var _this13 = this;

          var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
          var hasClass = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
            var className = _this13.getCellMeta(row, col).className;

            if (className && className.indexOf('htBottom') !== -1) {
              return true;
            }
          });

          if (hasClass) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: function callback() {
          var _this14 = this;

          var selectedRange = this.getSelectedRange();
          var stateBefore = getAlignmentClasses(selectedRange, function (row, col) {
            return _this14.getCellMeta(row, col).className;
          });
          var type = 'vertical';
          var alignment = 'htBottom';

          this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
          align(selectedRange, type, alignment, function (row, col) {
            return _this14.getCellMeta(row, col);
          }, function (row, col, key, value) {
            return _this14.setCellMeta(row, col, key, value);
          });
          this.render();
        },

        disabled: false
      }]
    }
  };
}