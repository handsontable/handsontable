/* eslint-disable jsdoc/require-description-complete-sentence */
import { WORKING_SPACE_BOTTOM } from './constants';

export class ViewDiffer {
  constructor(sizeSet) {
    this.sizeSet = sizeSet;
  }

  /**
   * A method which generates commands/leads which has to be executed to achieve new DOM nodes order based on new
   * offset and view size.
   *
   * For example, if current order looks like this (offset = 0, viewSize = 1):
   *   <body> (root node)
   *     └ <tr> (row 0)
   * and next order should look like this (offset: 0, viewSize = 5):
   *   <body> (root node)
   *     ├ <tr> (row 0)
   *     ├ <tr> (row 1)
   *     ├ <tr> (row 2)
   *     ├ <tr> (row 3)
   *     └ <tr> (row 4)
   * the generated commands/leads will look like this:
   *   <body> (root node)
   *     ├ <tr> (none, do nothing, leave as it is)
   *     ├ <tr> (append this element at index 1)
   *     ├ <tr> (append this element at index 2)
   *     ├ <tr> (append this element at index 3)
   *     └ <tr> (append this element at index 4)
   *
   * @returns {Array[]} Returns an array with generated commands/leads.
   */
  diff() {
    const { sizeSet } = this;
    const {
      currentOffset,
      currentSize: currentViewSize,
      nextOffset,
      nextSize: nextViewSize,
    } = sizeSet.getViewSize();

    // @TODO(perf-tip): Creating an array (createRange) is not necessary it would be enought to generate
    // commands based on numeric values.
    const currentOrder = createRange(currentOffset, currentViewSize);
    const nextOrder = createRange(nextOffset, nextViewSize);
    const nextOrderGetter = createSafeArrayGetter(nextOrder);
    const currentOrderGetter = createSafeArrayGetter(currentOrder);
    const leads = [];
    let maxSize = Math.max(nextViewSize, currentViewSize);

    for (let i = 0; i < maxSize; i++) {
      const nextIndex = nextOrderGetter(i);
      const currentIndex = currentOrderGetter(i);

      // Current index exceeds the next DOM index so it is necessary to generate a "remove" command
      // to achieve new order.
      if (nextIndex === void 0) {
        leads.push(['remove', currentIndex]);

      // Next index exceeds the current DOM index so it is necessary to generate a "append" command
      // to achieve new order.
      } else if (currentIndex === void 0) {
        // Check what command should be generated (depends on if this work as a shared root node
        // and in what position or not)
        if (!sizeSet.isShared() || sizeSet.isShared() && sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM)) {
          /**
           * If the differ has only one root node to manage with, the "append" command is generated.
           *
           * For example:
           *     ┌─────────── <body> (root node)
           *     │              <tr>
           *     │              <tr>
           *  (managed by one   <tr>
           *   differ - TRs)    <tr>
           *     │              <tr>
           *     └───────────   <tr> <--- Generates "append" command (which later executes `rootNode.appendChild(node)`)
           */
          leads.push(['append', nextIndex]);
        } else {
          /**
           * If the differ is sharing root node, the "prepend" command is generated.
           *
           * For example:
           *     ┌─────────── <tr> (root node, shared between two differs)
           *  (first differ)    <th> <--- Generates "prepend" command (which later executes `rootNode.insertBefore(...)`)
           *     ├───────────   <td>
           *     │              <td>
           *  (second differ    <td>
           *   - TDs)           <td>
           *     │              <td>
           *     └───────────   <td>
           */
          leads.push(['prepend', nextIndex]);
        }

      } else if (nextIndex > currentIndex) {
        const indexSinceLastOrder = currentOrder.indexOf(nextIndex);

        // This emulates DOM behavior when we try to append (or replace) an element which is already
        // mounted. The old index in the array has to be popped out indicating that an element was
        // moved to a different position.
        if (indexSinceLastOrder > -1) {
          currentOrder.splice(indexSinceLastOrder, 1);

          // Decrease loop size to prevent generating "remove" leads. "remove" leads are necessary only for nodes
          // which are not mounted in current DOM order.
          if (nextViewSize <= currentOrder.length) {
            maxSize -= 1;
          }
        }
        leads.push(['replace', nextIndex, currentIndex]);

      } else if (nextIndex < currentIndex) {
        currentOrder.unshift(nextIndex);
        // The last index indicates the index which should be removed after inserting the new element.
        // This keeps nodes size constant.
        leads.push(['insert_before', nextIndex, currentIndex, currentOrder.pop()]);

      } else { // for the same current and next indexes do nothing.
        leads.push(['none', nextIndex]);
      }
    }

    return leads;
  }
}

/**
 * Creates a function which returns an element from the array based on the index.
 *
 * @param {Array} arr An array from which the element should be returned.
 * @returns {function(): Array}
 */
function createSafeArrayGetter(arr) {
  return function(index) {
    return index < arr.length ? arr[index] : void 0;
  };
}

/**
 * Creates an array of numbers starting from `from` and ending at `from + length`.
 *
 * @param {number} from The first number in the range.
 * @param {number} length The length of the range.
 * @returns {Array}
 */
function createRange(from, length) {
  const range = [];

  for (let i = 0; i < length; i++) {
    range.push(from + i);
  }

  return range;
}
