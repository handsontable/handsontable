/**
 * @class Stack
 * @util
 */
class Stack<T> {
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
   * Add new item or items at the back of the stack.
   *
   * @param {*} items An item to add.
   */
  push(...items: T[]): void {
    this.items.push(...items);
  }

  /**
   * Remove the last element from the stack and returns it.
   *
   * @returns {*}
   */
  pop(): T | undefined {
    return this.items.pop();
  }

  /**
   * Return the last element from the stack (without modification stack).
   *
   * @returns {*}
   */
  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.items.length - 1];
  }

  /**
   * Check if the stack is empty.
   *
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return !this.size();
  }

  /**
   * Return number of elements in the stack.
   *
   * @returns {number}
   */
  size(): number {
    return this.items.length;
  }
}

export default Stack;
