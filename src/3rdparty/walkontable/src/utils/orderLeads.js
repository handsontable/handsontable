export function createLeadsFromOrders(previousOrder, currentOrder) {
  let maxSize = Math.max(currentOrder.length, previousOrder.length);
  const currentOrderGetter = createSafeGetter(currentOrder);
  const previousOrderGetter = createSafeGetter(previousOrder);
  const leads = [];

  for (let i = 0; i < maxSize; i++) {
    const currentIndex = currentOrderGetter(i);
    const previousIndex = previousOrderGetter(i);

    if (currentIndex === void 0) {
      leads.push(['remove', previousIndex]);

    } else if (previousIndex === void 0) {
      leads.push(['append', currentIndex]);

    } else if (currentIndex > previousIndex) {
      const indexSinceLastOrder = previousOrder.indexOf(currentIndex);

      // This emulates DOM behavior when we try to append (or replace) an element which is already
      // mounted to the different root. The old index in the array has to be popped out indicating
      // that an element was moved to a different position.
      if (indexSinceLastOrder > -1) {
        previousOrder.splice(indexSinceLastOrder, 1);
      }
      leads.push(['replace', currentIndex, previousIndex]);

    } else if (currentIndex < previousIndex) {
      leads.push(['insert', currentIndex, previousIndex]);
      previousOrder.unshift(currentIndex);
      // Increase loop size to make sure that in the last iteration 'remove' lead will be created.
      maxSize += 1;

    } else { // and when the current and previous indexes are equal to create neutral lead.
      leads.push(['none', currentIndex]);
    }
  }

  return leads;
}

function createSafeGetter(arr) {
  return function(index) {
    return index < arr.length ? arr[index] : void 0;
  }
}
