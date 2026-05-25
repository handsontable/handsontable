import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';

/**
 * Action that tracks filter changes.
 *
 * @class FiltersAction
 * @private
 */
export class FiltersAction extends BaseAction {
  /**
   * @param {Array} previousConditionsStack An array of the previous filter conditions.
   */
  conditionsStack;
  /**
   * @param {Array} conditionsStack An array of the filter conditions.
   */
  previousConditionsStack;

  constructor({ conditionsStack, previousConditionsStack }: {
    conditionsStack: unknown, previousConditionsStack: unknown
  }) {
    super('filter');
    this.conditionsStack = conditionsStack;
    this.previousConditionsStack = previousConditionsStack;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeFilter', (conditionsStack: unknown, previousConditionsStack: unknown) => {
      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(() => new FiltersAction({
        conditionsStack,
        previousConditionsStack,
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const filters = hot.getPlugin('filters');

    hot.addHookOnce('afterViewRender', undoneCallback);

    filters.importConditions(this.previousConditionsStack as import('../../filters').ColumnConditions[]);
    filters.filter();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const filters = hot.getPlugin('filters');

    hot.addHookOnce('afterViewRender', redoneCallback);

    filters.importConditions(this.conditionsStack as import('../../filters').ColumnConditions[]);
    filters.filter();
  }
}
