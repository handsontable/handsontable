import Handsontable from 'handsontable';

const hot = new Handsontable(document.body, { undo: true });
const other = new Handsontable(document.body, { undo: true });

// Core had no undo methods in 17.x, so each of these tests failed there and the branch never ran.
function cleanUp() {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  if (hot.undoRedo) {
    // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
    hot.undoRedo.clear();
  }
}

function earlyReturn() {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  if (!hot.undoRedo) {
    return;
  }

  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  hot.undoRedo.clear();
}

function feature() {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  return typeof hot.undo === 'function' ? hot.undo() : null;
}

function present() {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  return 'redo' in hot && hot.redo();
}

function chained() {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  return hot.undoRedo?.clear();
}

// No test of undo or redo stands in this function, and the tests above are in other functions.
function plain() {
  other.getPlugin('undoRedo').undo();
  hot.getPlugin('undoRedo').redo();
}
