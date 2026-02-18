import { throwWithCause } from '../../../helpers/errors';

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
    throwWithCause('Not implemented');
  }

  redo() {
    throwWithCause('Not implemented');
  }
}
