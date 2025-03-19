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

  constructor({ conditionsStack, previousConditionsStack }) {
    super('filter');
    this.conditionsStack = conditionsStack;
    this.previousConditionsStack = previousConditionsStack;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeFilter', (conditionsStack, previousConditionsStack) => {
      undoRedoPlugin.done(() => new FiltersAction({
        conditionsStack,
        previousConditionsStack,
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const filters = hot.getPlugin('filters');

    hot.addHookOnce('afterViewRender', undoneCallback);

    filters.importConditions(this.previousConditionsStack);
    filters.filter();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const filters = hot.getPlugin('filters');

    hot.addHookOnce('afterViewRender', redoneCallback);

    filters.importConditions(this.conditionsStack);
    filters.filter();
  }
}
