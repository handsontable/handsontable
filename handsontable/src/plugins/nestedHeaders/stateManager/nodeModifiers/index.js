/**
 * The NodeModifiers module is responsible for the modification of a tree structure
 * in a way to achieve new column headers state.
 */
import { collapseNode } from './collapse';
import { expandNode } from './expand';
import { hideColumn } from './hideColumn';
import { showColumn } from './showColumn';

const availableModifiers = new Map([
  ['collapse', collapseNode],
  ['expand', expandNode],
  ['hide-column', hideColumn],
  ['show-column', showColumn],
]);

/**
 * An entry point for triggering a node modifiers. If the triggered action
 * does not exist the exception is thrown.
 *
 * @param {string} actionName An action name to trigger.
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index that comes from the nested headers grid.
 *                                 The index, as opposed to the `columnIndex` in the tree node
 *                                 (which describes the column index of the root node of the header
 *                                 element), describes the index passed from the grid. Hence, the
 *                                 index can be between the column index of the node and its colspan
 *                                 width.
 * @returns {object}
 */
export function triggerNodeModification(actionName, nodeToProcess, gridColumnIndex) {
  if (!availableModifiers.has(actionName)) {
    throw new Error(`The node modifier action ("${actionName}") does not exist.`);
  }

  return availableModifiers.get(actionName)(nodeToProcess, gridColumnIndex);
}
