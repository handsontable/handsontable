export const KEY = 'undo';

export default function undoItem() {
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
