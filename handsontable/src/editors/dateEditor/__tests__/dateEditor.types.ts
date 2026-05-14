import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import { DateEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot = Handsontable(element, {}) as unknown as HotInstance;
const editor = new DateEditor(hot);

editor.showDatepicker();
editor.hideDatepicker();

const options: Record<string, unknown> = editor.getDatePickerConfig();
