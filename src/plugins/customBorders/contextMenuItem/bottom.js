import {checkSelectionBorders, markSelected} from './../utils';

export default function bottom(customBordersPlugin) {
  return {
    key: 'borders:bottom',
    name() {
      let label = 'Bottom';
      let hasBorder = checkSelectionBorders(this, 'bottom');
      if (hasBorder) {
        label = markSelected(label);
      }
      return label;
    },
    callback() {
      let hasBorder = checkSelectionBorders(this, 'bottom');
      customBordersPlugin.prepareBorder(this.getSelectedRange(), 'bottom', hasBorder);
    }
  };
}
