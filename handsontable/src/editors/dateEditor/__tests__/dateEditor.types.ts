import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import { DateEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot = Handsontable(element, {}) as unknown as HotInstance;
const editor = new DateEditor(hot);

// Note: showDatepicker, hideDatepicker, getDatePickerConfig were Pikaday-specific and removed in 18.0.
editor.open();
editor.close();
editor.focus();
