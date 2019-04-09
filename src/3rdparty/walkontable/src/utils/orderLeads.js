/**
 * A function which generates leads/commands which has to be executed to achieve new DOM nodes order.
 *
 * For example, if current order looks like this:
 *  +---------+
 *  | row 0   |
 *  +---------+
 * and next order should look like this:
 *  +---------+
 *  | row 0   |
 *  | row 1   |
 *  | row 2   |
 *  | row 4   |
 *  | row 5   |
 *  +---------+
 * the generated leads should look like this:
 *  | none         | # do nothing
 *  | append row 1 |
 *  | append row 2 |
 *  | append row 3 |
 *  | append row 4 |
 *
 * @param {Number[]} currentOrder An array with source indexes which represents the current order of the DOM nodes.
 * @param {Number[]} nextOrder An array with source indexes which represents an order of the DOM nodes which we want to achieve.
 * @return {Array[]} Returns an array with generated leads/commands.
 */
export function createLeadsFromOrders(currentOrder, nextOrder) {
  const nextOrderLength = nextOrder.length;
  let maxSize = Math.max(nextOrderLength, currentOrder.length);
  const nextOrderGetter = createSafeArrayGetter(nextOrder);
  const currentOrderGetter = createSafeArrayGetter(currentOrder);
  const leads = [];

  for (let i = 0; i < maxSize; i++) {
    const nextIndex = nextOrderGetter(i);
    const currentIndex = currentOrderGetter(i);

    if (nextIndex === void 0) {
      leads.push(['remove', currentIndex]);

    } else if (currentIndex === void 0) {
      leads.push(['append', nextIndex]);

    } else if (nextIndex > currentIndex) {
      const indexSinceLastOrder = currentOrder.indexOf(nextIndex);

      // This emulates DOM behavior when we try to append (or replace) an element which is already
      // mounted. The old index in the array has to be popped out indicating that an element was
      // moved to a different position.
      if (indexSinceLastOrder > -1) {
        currentOrder.splice(indexSinceLastOrder, 1);

        // Decrease loop size to prevent generating "remove" leads. "remove" leads are necessary only for nodes
        // which are not mounted in current DOM order.
        if (nextOrderLength <= currentOrder.length) {
          maxSize -= 1;
        }
      }
      leads.push(['replace', nextIndex, currentIndex]);

    } else if (nextIndex < currentIndex) {
      currentOrder.unshift(nextIndex);
      // The last index indicates the index which should be removed after inserting the new element.
      // This keeps nodes size constant.
      leads.push(['insert', nextIndex, currentIndex, currentOrder.pop()]);

    } else { // for the same current and next indexes do nothing.
      leads.push(['none', nextIndex]);
    }
  }

  return leads;
}

function createSafeArrayGetter(arr) {
  return function(index) {
    return index < arr.length ? arr[index] : void 0;
  }
}
