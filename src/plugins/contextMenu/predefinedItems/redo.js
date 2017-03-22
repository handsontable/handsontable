export const KEY = 'redo';

export default function redoItem() {
  return {
    key: KEY,
    name: 'Redo',

    callback() {
      this.redo();
    },
    disabled() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  };
}
