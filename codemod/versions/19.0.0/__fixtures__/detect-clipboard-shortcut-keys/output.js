import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const gridContext = hot.getShortcutManager().getContext('grid');

// TODO(handsontable-codemod 19.0.0/clipboard-shortcut-keys): Remove your own entry with removeShortcutsByGroup() instead of by its keys. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-copy-cut-and-paste-shortcuts-are-registered-in-the-grid-context
gridContext.removeShortcutsByKeys(['control/meta', 'v']);
// TODO(handsontable-codemod 19.0.0/clipboard-shortcut-keys): Remove your own entry with removeShortcutsByGroup() instead of by its keys. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-copy-cut-and-paste-shortcuts-are-registered-in-the-grid-context
const hasOwnCopy = gridContext.getShortcuts(['control/meta', 'c']).length > 0;
// TODO(handsontable-codemod 19.0.0/clipboard-shortcut-keys): Remove your own entry with removeShortcutsByGroup() instead of by its keys. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-copy-cut-and-paste-shortcuts-are-registered-in-the-grid-context
const hasCut = gridContext.hasShortcut(['Control/Meta', 'X']);

// Other keys and removal by group are not reported.
gridContext.removeShortcutsByKeys(['control/meta', 'z']);
gridContext.removeShortcutsByGroup('myPaste');
