import { throwWithCause } from '../../../../helpers/errors';

/**
 * The NodeModifiers module is responsible for the modification of a tree structure
 * in a way to achieve new column headers state.
 */
import { collapseNode } from './collapse';
import { expandNode } from './expand';
import type TreeNode from '../../../../utils/dataStructures/tree';

/**
 * The result of a collapse/expand node modification: the visual column indexes the action
 * hid/showed, by how much the colspan changed, and a rollback that reverses the modification.
 */
export interface NodeModificationResult {
  rollbackModification: Function;
  affectedColumns: number[];
  colspanCompensation: number;
}

const availableModifiers = new Map<string, Function>([
  ['collapse', collapseNode],
  ['expand', expandNode],
]);

/**
 * An entry point for triggering a node modifiers.
 *
 * @param {string} actionName An action name to trigger.
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index.
 * @returns {object}
 */
export function triggerNodeModification(
  actionName: string,
  nodeToProcess: TreeNode,
  gridColumnIndex: number
): NodeModificationResult | void {
  const modifier = availableModifiers.get(actionName);

  if (!modifier) {
    throwWithCause(`The node modifier action ("${actionName}") does not exist.`);
  }

  return modifier(nodeToProcess, gridColumnIndex) as NodeModificationResult | void;
}
