/**
 * @class Stack
 * @util
 */
class Stack {
  constructor(initial = []) {
    /**
     * Items collection.
     *
     * @type {Array}
     */
    this.items = initial;
  }

  /**
   * Add new item or items at the back of the stack.
   *
   * @param {*} items An item to add.
   */
  push(...items) {
    this.items.push(...items);
  }

  /**
   * Remove the last element from the stack and returns it.
   *
   * @returns {*}
   */
  pop() {
    return this.items.pop();
  }

  /**
   * Return the last element from the stack (without modification stack).
   *
   * @returns {*}
   */
  peek() {
    return this.isEmpty() ? void 0 : this.items[this.items.length - 1];
  }

  /**
   * Check if the stack is empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return !this.size();
  }

  /**
   * Return number of elements in the stack.
   *
   * @returns {number}
   */
  size() {
    return this.items.length;
  }
}

export default Stack;
