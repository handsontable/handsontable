export const KEY = 'undo';

export function undoItem() {
  return {
    key: KEY,
    name: 'Undo',

    callback: function() {
      this.undo();
    },
    disabled: function() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  };
}
