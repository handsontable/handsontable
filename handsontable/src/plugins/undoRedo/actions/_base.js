export class BaseAction {
  undo() {
    throw new Error('Not implemented');
  }

  redo() {
    throw new Error('Not implemented');
  }
}
