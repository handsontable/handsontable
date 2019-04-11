export default class ViewDiffer {
  constructor() {
    this.currentViewSize = 0;
    this.nextViewSize = 0;
    this.currentOffset = 0;
    this.nextOffset = 0;
  }

  setSize(size) {
    this.currentViewSize = this.nextViewSize;
    this.nextViewSize = size;

    return this;
  }

  setOffset(offset) {
    this.currentOffset = this.nextOffset;
    this.nextOffset = offset;

    return this;
  }

  /**
   * A method which generates commands/leads which has to be executed to achieve new DOM nodes order based on new
   * offset and view size.
   *
   * For example, if current order looks like this (offset = 0, viewSize = 1):
   *  +---------+
   *  | row 0   |
   *  +---------+
   * and next order should look like this (offset: 0, viewSize = 5):
   *  +---------+
   *  | row 0   |
   *  | row 1   |
   *  | row 2   |
   *  | row 4   |
   *  | row 5   |
   *  +---------+
   * the generated commands/leads should look like this:
   *  | none         | # do nothing
   *  | append row 1 |
   *  | append row 2 |
   *  | append row 3 |
   *  | append row 4 |
   *
   * @return {Array[]} Returns an array with generated commands/leads.
   */
  diff() {
    // @TODO(perf-tip): Creating an array is not necessary it would be enought to generate commands based on numeric values.
    const currentOrder = createRange(this.currentOffset, this.currentViewSize);
    const nextOrder = createRange(this.nextOffset, this.nextViewSize);
    const nextOrderGetter = createSafeArrayGetter(nextOrder);
    const currentOrderGetter = createSafeArrayGetter(currentOrder);
    const leads = [];
    let maxSize = Math.max(this.nextViewSize, this.currentViewSize);

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
          if (this.nextViewSize <= currentOrder.length) {
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
}

function createSafeArrayGetter(arr) {
  return function(index) {
    return index < arr.length ? arr[index] : void 0;
  }
}

function createRange(from, length) {
  const range = [];

  for (var i = 0; i < length; i++) {
    range.push(from + i);
  }

  return range;
}
