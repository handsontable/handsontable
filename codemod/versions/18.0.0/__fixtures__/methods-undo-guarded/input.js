import Handsontable from 'handsontable';

const hot = new Handsontable(document.body, { undo: true });
const other = new Handsontable(document.body, { undo: true });

// Core had no undo methods in 17.x, so each of these tests failed there and the branch never ran.
function cleanUp() {
  if (hot.undoRedo) {
    hot.undoRedo.clear();
  }
}

function earlyReturn() {
  if (!hot.undoRedo) {
    return;
  }

  hot.undoRedo.clear();
}

function feature() {
  return typeof hot.undo === 'function' ? hot.undo() : null;
}

function present() {
  return 'redo' in hot && hot.redo();
}

function chained() {
  return hot.undoRedo?.clear();
}

// No test of undo or redo stands in this function, and the tests above are in other functions.
function plain() {
  other.undo();
  hot.redo();
}
