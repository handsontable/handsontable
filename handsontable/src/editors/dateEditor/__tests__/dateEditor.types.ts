import Handsontable from 'handsontable';
import { PikadayOptions } from '@handsontable/pikaday';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.DateEditor(hot);

editor.showDatepicker();
editor.hideDatepicker();

const options: PikadayOptions = editor.getDatePickerConfig();
