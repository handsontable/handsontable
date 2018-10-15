var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Queue
 * @util
 */
var Queue = function () {
  function Queue() {
    var initial = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Queue);

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


  _createClass(Queue, [{
    key: "enqueue",
    value: function enqueue() {
      var _items;

      (_items = this.items).push.apply(_items, arguments);
    }

    /**
     * Remove the first element from the queue and returns it.
     *
     * @returns {*}
     */

  }, {
    key: "dequeue",
    value: function dequeue() {
      return this.items.shift();
    }

    /**
     * Return the first element from the queue (without modification queue stack).
     *
     * @returns {*}
     */

  }, {
    key: "peek",
    value: function peek() {
      return this.isEmpty() ? void 0 : this.items[0];
    }

    /**
     * Check if the queue is empty.
     *
     * @returns {Boolean}
     */

  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return !this.size();
    }

    /**
     * Return number of elements in the queue.
     *
     * @returns {Number}
     */

  }, {
    key: "size",
    value: function size() {
      return this.items.length;
    }
  }]);

  return Queue;
}();

export default Queue;