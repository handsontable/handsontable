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

  constructor(actionType: string) {
    this.actionType = actionType;
  }

  undo(..._args: unknown[]): void {
    throwWithCause('Not implemented');
  }

  redo(..._args: unknown[]): void {
    throwWithCause('Not implemented');
  }
}
