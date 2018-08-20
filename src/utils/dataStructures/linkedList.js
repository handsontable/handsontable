/**
 * Refactored implementation of LinkedList (part of javascript-algorithms project) by Github users:
 * mgechev, AndriiHeonia, Microfed and Jakeh (part of javascript-algorithms project - all project contributors
 * at repository website)
 *
 * Link to repository: https://github.com/mgechev/javascript-algorithms
 */

/**
 * Linked list node.
 *
 * @class NodeStructure
 * @util
 */
class NodeStructure {
  constructor(data) {
    /**
     * Data of the node.
     * @member {Object}
     */
    this.data = data;
    /**
     * Next node.
     * @member {NodeStructure}
     */
    this.next = null;
    /**
     * Previous node.
     * @member {NodeStructure}
     */
    this.prev = null;
  }
}

/**
 * Linked list.
 *
 * @class LinkedList
 * @util
 */
class LinkedList {
  constructor() {
    this.first = null;
    this.last = null;
  }

  /**
   * Add data to the end of linked list.
   *
   * @param {Object} data Data which should be added.
   */
  push(data) {
    const node = new NodeStructure(data);

    if (this.first === null) {
      this.first = node;
      this.last = node;

    } else {
      const temp = this.last;

      this.last = node;
      node.prev = temp;
      temp.next = node;
    }
  }

  /**
   * Add data to the beginning of linked list.
   *
   * @param {Object} data Data which should be added.
   */
  unshift(data) {
    const node = new NodeStructure(data);

    if (this.first === null) {
      this.first = node;
      this.last = node;

    } else {
      const temp = this.first;

      this.first = node;
      node.next = temp;
      temp.prev = node;
    }
  }

  /**
   * In order traversal of the linked list.
   *
   * @param {Function} callback Callback which should be executed on each node.
   */
  inorder(callback) {
    let temp = this.first;

    while (temp) {
      callback(temp);
      temp = temp.next;
    }
  }

  /**
   * Remove data from the linked list.
   *
   * @param {Object} data Data which should be removed.
   * @returns {Boolean} Returns true if data has been removed.
   */
  remove(data) {
    if (this.first === null) {
      return false;
    }

    let temp = this.first;
    let next;
    let prev;

    while (temp) {
      if (temp.data === data) {
        next = temp.next;
        prev = temp.prev;

        if (next) {
          next.prev = prev;
        }

        if (prev) {
          prev.next = next;
        }

        if (temp === this.first) {
          this.first = next;
        }

        if (temp === this.last) {
          this.last = prev;
        }

        return true;
      }

      temp = temp.next;
    }

    return false;
  }

  /**
   * Check if linked list contains cycle.
   *
   * @returns {Boolean} Returns true if linked list contains cycle.
   */
  hasCycle() {
    let fast = this.first;
    let slow = this.first;

    while (true) {
      if (fast === null) {
        return false;
      }

      fast = fast.next;

      if (fast === null) {
        return false;
      }

      fast = fast.next;
      slow = slow.next;

      if (fast === slow) {
        return true;
      }
    }
  }

  /**
   * Return last node from the linked list.
   *
   * @returns {NodeStructure} Last node.
   */
  pop() {
    if (this.last === null) {
      return null;
    }

    const temp = this.last;
    this.last = this.last.prev;

    return temp;
  }

  /**
   * Return first node from the linked list.
   *
   * @returns {NodeStructure} First node.
   */
  shift() {
    if (this.first === null) {
      return null;
    }

    const temp = this.first;
    this.first = this.first.next;

    return temp;
  }

  /**
   * Reverses the linked list recursively
   */
  recursiveReverse() {
    function inverse(current, next) {
      if (!next) {
        return;
      }
      inverse(next, next.next);
      next.next = current;
    }

    if (!this.first) {
      return;
    }

    inverse(this.first, this.first.next);

    this.first.next = null;
    const temp = this.first;
    this.first = this.last;
    this.last = temp;
  }

  /**
   * Reverses the linked list iteratively
   */
  reverse() {
    if (!this.first || !this.first.next) {
      return;
    }

    let current = this.first.next;
    let prev = this.first;
    let temp;

    while (current) {
      temp = current.next;
      current.next = prev;
      prev.prev = current;
      prev = current;
      current = temp;
    }

    this.first.next = null;
    this.last.prev = null;
    temp = this.first;
    this.first = prev;
    this.last = temp;
  }
}

export { NodeStructure };
export default LinkedList;
