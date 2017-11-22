import {checkSelectionBorders} from './../utils';

export default function noBorders(customBordersPlugin) {
  return {
    key: 'borders:no_borders',
    name: 'Remove border(s)',
    callback() {
      customBordersPlugin.prepareBorder(this.getSelectedRange(), 'noBorders');
    },
    disabled() {
      return !checkSelectionBorders(this);
    }
  };
}
