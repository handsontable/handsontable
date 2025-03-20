/**
 * @class Queue
 * @util
 */
class Queue<T> {
  /**
   * Items collection.
   *
   * @type {Array}
   */
  private items: T[];
  
  constructor(initial: T[] = []) {
    this.items = initial;
  }

  /**
   * Add new item or items at the back of the queue.
   *
   * @param {*} items An item to add.
   */
  enqueue(...items: T[]): void {
    this.items.push(...items);
  }

  /**
   * Remove the first element from the queue and returns it.
   *
   * @returns {*}
   */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /**
   * Return the first element from the queue (without modification queue stack).
   *
   * @returns {*}
   */
  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[0];
  }

  /**
   * Check if the queue is empty.
   *
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return !this.size();
  }

  /**
   * Return number of elements in the queue.
   *
   * @returns {number}
   */
  size(): number {
    return this.items.length;
  }
}

export default Queue;
