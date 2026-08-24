/**
 * @class Queue
 * @util
 */
class Queue {
  /**
   * The ordered collection of items held in the queue, where index 0 is the front.
   */
  declare items: unknown[];
  /**
   * Initializes the queue with an optional pre-populated array of items.
   */
  constructor(initial: unknown[] = []) {
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
  enqueue(...items: unknown[]) {
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
