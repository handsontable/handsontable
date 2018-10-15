"use strict";

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Stack
 * @util
 */
var Stack = function () {
  function Stack() {
    var initial = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Stack);

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


  _createClass(Stack, [{
    key: "push",
    value: function push() {
      var _items;

      (_items = this.items).push.apply(_items, arguments);
    }

    /**
     * Remove the last element from the stack and returns it.
     *
     * @returns {*}
     */

  }, {
    key: "pop",
    value: function pop() {
      return this.items.pop();
    }

    /**
     * Return the last element from the stack (without modification stack).
     *
     * @returns {*}
     */

  }, {
    key: "peek",
    value: function peek() {
      return this.isEmpty() ? void 0 : this.items[this.items.length - 1];
    }

    /**
     * Check if the stack is empty.
     *
     * @returns {Boolean}
     */

  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return !this.size();
    }

    /**
     * Return number of elements in the stack.
     *
     * @returns {Number}
     */

  }, {
    key: "size",
    value: function size() {
      return this.items.length;
    }
  }]);

  return Stack;
}();

exports.default = Stack;