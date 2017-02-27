export const KEY = 'redo';

export default function redoItem() {
  return {
    key: KEY,
    name: 'Redo',

    callback: function() {
      this.redo();
    },
    disabled: function() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  };
}
