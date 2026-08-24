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

  /**
   * Initializes the action with the given action type identifier.
   */
  constructor(actionType: string) {
    this.actionType = actionType;
  }

  /**
   * Reverts the action, restoring the previous state. Subclasses must override this method.
   */
  undo(..._args: unknown[]): void {
    throwWithCause('Not implemented');
  }

  /**
   * Reapplies the action after it has been undone. Subclasses must override this method.
   */
  redo(..._args: unknown[]): void {
    throwWithCause('Not implemented');
  }
}
