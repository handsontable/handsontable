import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});
const focusManager = hot.getFocusManager();

focusManager.getFocusMode();
focusManager.setFocusMode('cell');
focusManager.getRefocusDelay();
focusManager.setRefocusDelay(23);
focusManager.focusOnHighlightedCell();
focusManager.refocusToEditorTextarea(23);
focusManager.setRefocusElementGetter(() => document.createElement('input'));
focusManager.getRefocusElement();
