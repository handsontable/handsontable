/**
 * An abstract class that defines the structure of an undo/redo action.
 *
 * @class BaseAction
 * @private
 */
export class BaseAction {
  undo() {
    throw new Error('Not implemented');
  }

  redo() {
    throw new Error('Not implemented');
  }
}
