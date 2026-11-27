import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByKeys(['control/meta', 'v']);
const hasOwnCopy = gridContext.getShortcuts(['control/meta', 'c']).length > 0;
const hasCut = gridContext.hasShortcut(['Control/Meta', 'X']);

// Other keys and removal by group are not reported.
gridContext.removeShortcutsByKeys(['control/meta', 'z']);
gridContext.removeShortcutsByGroup('myPaste');
