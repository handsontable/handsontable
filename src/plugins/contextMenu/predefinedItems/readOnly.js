import {checkSelectionConsistency, markLabelAsSelected} from './../utils';

export const KEY = 'make_read_only';

export function readOnlyItem() {
  return {
    key: KEY,
    name: function() {
      let label = 'Read only';
      let atLeastOneReadOnly = checkSelectionConsistency(this.getSelectedRange(), (row, col) => this.getCellMeta(row, col).readOnly);

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback: function() {
      let range = this.getSelectedRange();
      let atLeastOneReadOnly = checkSelectionConsistency(range, (row, col) => this.getCellMeta(row, col).readOnly);

      range.forAll((row, col) => {
        this.getCellMeta(row, col).readOnly = atLeastOneReadOnly ? false : true;
      });
      this.render();
    },
    disabled: function() {
      return this.getSelectedRange() && !this.selection.selectedHeader.corner ? false : true;
    }
  };
}
