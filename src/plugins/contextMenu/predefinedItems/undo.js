export const KEY = 'undo';

export default function undoItem() {
  return {
    key: KEY,
    name: 'Undo',

    callback() {
      this.undo();
    },
    disabled() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  };
}
