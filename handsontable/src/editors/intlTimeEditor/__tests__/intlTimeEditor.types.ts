import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import { IntlTimeEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot = Handsontable(element, {}) as unknown as HotInstance;
const editor = new IntlTimeEditor(hot);

editor.focus();
