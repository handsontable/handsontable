import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const focusGridManager = hot.getFocusManager();

focusGridManager.getFocusMode();
focusGridManager.setFocusMode('cell');
focusGridManager.getRefocusDelay();
focusGridManager.setRefocusDelay(23);
focusGridManager.focusOnHighlightedCell();
focusGridManager.focusOnHighlightedCell();
focusGridManager.refocusToEditorTextarea(23);
focusGridManager.setRefocusElementGetter(() => document.createElement('input'));
focusGridManager.getRefocusElement();
