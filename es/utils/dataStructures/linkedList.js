var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
var NodeStructure = function NodeStructure(data) {
  _classCallCheck(this, NodeStructure);

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
};

/**
 * Linked list.
 *
 * @class LinkedList
 * @util
 */


var LinkedList = function () {
  function LinkedList() {
    _classCallCheck(this, LinkedList);

    this.first = null;
    this.last = null;
  }

  /**
   * Add data to the end of linked list.
   *
   * @param {Object} data Data which should be added.
   */


  _createClass(LinkedList, [{
    key: "push",
    value: function push(data) {
      var node = new NodeStructure(data);

      if (this.first === null) {
        this.first = node;
        this.last = node;
      } else {
        var temp = this.last;

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

  }, {
    key: "unshift",
    value: function unshift(data) {
      var node = new NodeStructure(data);

      if (this.first === null) {
        this.first = node;
        this.last = node;
      } else {
        var temp = this.first;

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

  }, {
    key: "inorder",
    value: function inorder(callback) {
      var temp = this.first;

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

  }, {
    key: "remove",
    value: function remove(data) {
      if (this.first === null) {
        return false;
      }

      var temp = this.first;
      var next = void 0;
      var prev = void 0;

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

  }, {
    key: "hasCycle",
    value: function hasCycle() {
      var fast = this.first;
      var slow = this.first;

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

  }, {
    key: "pop",
    value: function pop() {
      if (this.last === null) {
        return null;
      }

      var temp = this.last;
      this.last = this.last.prev;

      return temp;
    }

    /**
     * Return first node from the linked list.
     *
     * @returns {NodeStructure} First node.
     */

  }, {
    key: "shift",
    value: function shift() {
      if (this.first === null) {
        return null;
      }

      var temp = this.first;
      this.first = this.first.next;

      return temp;
    }

    /**
     * Reverses the linked list recursively
     */

  }, {
    key: "recursiveReverse",
    value: function recursiveReverse() {
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
      var temp = this.first;
      this.first = this.last;
      this.last = temp;
    }

    /**
     * Reverses the linked list iteratively
     */

  }, {
    key: "reverse",
    value: function reverse() {
      if (!this.first || !this.first.next) {
        return;
      }

      var current = this.first.next;
      var prev = this.first;
      var temp = void 0;

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
  }]);

  return LinkedList;
}();

export { NodeStructure };
export default LinkedList;