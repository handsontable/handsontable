/**
 * An abstract class that defines the structure of an undo/redo action.
 *
 * @class BaseAction
 * @private
 */
export class BaseAction {
  /**
   * @param {string} actionType The action type.
   */
  actionType = '';

  constructor(actionType) {
    this.actionType = actionType;
  }

  undo() {
    throw new Error('Not implemented', { cause: { handsontable: true } });
  }

  redo() {
    throw new Error('Not implemented', { cause: { handsontable: true } });
  }
}
