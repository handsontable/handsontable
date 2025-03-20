/**
 * Refactored implementation of LinkedList (part of javascript-algorithms project) by Github users:
 * mgechev, AndriiHeonia, Microfed and Jakeh (part of javascript-algorithms project - all project contributors
 * at repository website).
 *
 * Link to repository: https://github.com/mgechev/javascript-algorithms.
 */

/**
 * Linked list node.
 *
 * @class NodeStructure
 * @util
 */
class NodeStructure<T> {
  /**
   * Data of the node.
   *
   * @member {object}
   */
  data: T;
  /**
   * Next node.
   *
   * @member {NodeStructure}
   */
  next: NodeStructure<T> | null = null;
  /**
   * Previous node.
   *
   * @member {NodeStructure}
   */
  prev: NodeStructure<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

/**
 * Linked list.
 *
 * @class LinkedList
 * @util
 */
class LinkedList<T> {
  first: NodeStructure<T> | null = null;
  last: NodeStructure<T> | null = null;

  /**
   * Add data to the end of linked list.
   *
   * @param {object} data Data which should be added.
   * @returns {NodeStructure} Returns the node which has been added.
   */
  push(data: T): NodeStructure<T> {
    const node = new NodeStructure<T>(data);

    if (this.first === null) {
      this.first = node;
      this.last = node;

    } else {
      const temp = this.last as NodeStructure<T>;

      this.last = node;
      node.prev = temp;
      temp.next = node;
    }

    return node;
  }

  /**
   * Add data to the beginning of linked list.
   *
   * @param {object} data Data which should be added.
   */
  unshift(data: T): void {
    const node = new NodeStructure<T>(data);

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
  inorder(callback: (node: NodeStructure<T>) => boolean | void): void {
    let temp = this.first;

    while (temp) {
      const interrupt = callback(temp);

      if (temp === this.last || interrupt === true) {
        break;
      }

      temp = temp.next;
    }
  }

  /**
   * Remove data from the linked list.
   *
   * @param {object} data Data which should be removed.
   * @returns {boolean} Returns true if data has been removed.
   */
  remove(data: T): boolean {
    if (this.first === null) {
      return false;
    }

    let temp = this.first;
    let next: NodeStructure<T> | null;
    let prev: NodeStructure<T> | null;

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
   * @returns {boolean} Returns true if linked list contains cycle.
   */
  hasCycle(): boolean {
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
      slow = slow?.next ?? null;

      if (fast === slow && fast !== null) {
        return true;
      }
    }
  }

  /**
   * Return last node from the linked list.
   *
   * @returns {NodeStructure} Last node.
   */
  pop(): NodeStructure<T> | null {
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
  shift(): NodeStructure<T> | null {
    if (this.first === null) {
      return null;
    }

    const temp = this.first;

    this.first = this.first.next;

    return temp;
  }

  /**
   * Reverses the linked list recursively.
   */
  recursiveReverse(): void {
    /**
     * @param {*} current The current value.
     * @param {*} next The next value.
     */
    function inverse(current: NodeStructure<T>, next: NodeStructure<T> | null): void {
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

    if (this.first) {
      this.first.next = null;
    }
    const temp = this.first;

    this.first = this.last;
    this.last = temp;
  }

  /**
   * Reverses the linked list iteratively
   */
  reverse(): void {
    if (!this.first || !this.first.next) {
      return;
    }

    let current: NodeStructure<T> | null = this.first;
    let next: NodeStructure<T> | null;
    let prev: NodeStructure<T> | null = null;

    while (current) {
      next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }

    this.last = this.first;
    this.first = prev;
  }
}

export default LinkedList;
