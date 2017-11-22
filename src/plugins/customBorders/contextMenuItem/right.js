import {checkSelectionBorders, markSelected} from './../utils';

export default function right(customBordersPlugin) {
  return {
    key: 'borders:right',
    name() {
      let label = 'Right';
      let hasBorder = checkSelectionBorders(this, 'right');
      if (hasBorder) {
        label = markSelected(label);
      }
      return label;
    },
    callback() {
      let hasBorder = checkSelectionBorders(this, 'right');
      customBordersPlugin.prepareBorder(this.getSelectedRange(), 'right', hasBorder);
    }
  };
}
