import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable/common';
import { IntlDateEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot = Handsontable(element, {}) as unknown as HotInstance;
const editor = new IntlDateEditor(hot);

editor.focus();
