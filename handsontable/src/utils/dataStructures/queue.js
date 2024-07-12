/**
 * @class Queue
 * @util
 */
class Queue {
  constructor(initial = []) {
    /**
     * Items collection.
     *
     * @type {Array}
     */
    this.items = initial;
  }

  /**
   * Add new item or items at the back of the queue.
   *
   * @param {*} items An item to add.
   */
  enqueue(...items) {
    this.items.push(...items);
  }

  /**
   * Remove the first element from the queue and returns it.
   *
   * @returns {*}
   */
  dequeue() {
    return this.items.shift();
  }

  /**
   * Return the first element from the queue (without modification queue stack).
   *
   * @returns {*}
   */
  peek() {
    return this.isEmpty() ? undefined : this.items[0];
  }

  /**
   * Check if the queue is empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return !this.size();
  }

  /**
   * Return number of elements in the queue.
   *
   * @returns {number}
   */
  size() {
    return this.items.length;
  }
}

export default Queue;
