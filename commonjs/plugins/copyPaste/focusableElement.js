'use strict';

exports.__esModule = true;
exports.destroyElement = exports.deactivateElement = exports.createElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventManager = require('./../../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _localHooks = require('./../../mixins/localHooks');

var _localHooks2 = _interopRequireDefault(_localHooks);

var _object = require('./../../helpers/object');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class FocusableWrapper
 *
 * @plugin CopyPaste
 */
var FocusableWrapper = function () {
  function FocusableWrapper() {
    _classCallCheck(this, FocusableWrapper);

    /**
     * The main/operational focusable element.
     *
     * @type {HTMLElement}
     */
    this.mainElement = null;
    /**
     * Instance of EventManager.
     *
     * @type {EventManager}
     */
    this.eventManager = new _eventManager2.default(this);
    /**
     * An object for tracking information about event listeners attached to the focusable element.
     *
     * @type {WeakSet}
     */
    this.listenersCount = new WeakSet();
  }

  /**
   * Switch to the secondary focusable element. Used when no any main focusable element is provided.
   */


  _createClass(FocusableWrapper, [{
    key: 'useSecondaryElement',
    value: function useSecondaryElement() {
      var el = createOrGetSecondaryElement();

      if (!this.listenersCount.has(el)) {
        this.listenersCount.add(el);
        forwardEventsToLocalHooks(this.eventManager, el, this);
      }

      this.mainElement = el;
    }

    /**
     * Switch to the main focusable element.
     */

  }, {
    key: 'setFocusableElement',
    value: function setFocusableElement(element) {
      if (!this.listenersCount.has(element)) {
        this.listenersCount.add(element);
        forwardEventsToLocalHooks(this.eventManager, element, this);
      }

      this.mainElement = element;
    }

    /**
     * Get currently set focusable element.
     *
     * @return {HTMLElement}
     */

  }, {
    key: 'getFocusableElement',
    value: function getFocusableElement() {
      return this.mainElement;
    }

    /**
     * Set focus to the focusable element.
     */

  }, {
    key: 'focus',
    value: function focus() {
      // Add an empty space to texarea. It is necessary for safari to enable "copy" command from menu bar.
      this.mainElement.value = ' ';
      this.mainElement.select();
    }
  }]);

  return FocusableWrapper;
}();

(0, _object.mixin)(FocusableWrapper, _localHooks2.default);

var refCounter = 0;

/**
 * Create and return the FocusableWrapper instance.
 *
 * @return {FocusableWrapper}
 */
function createElement() {
  var focusableWrapper = new FocusableWrapper();

  refCounter += 1;

  return focusableWrapper;
}

/**
 * Deactivate the FocusableWrapper instance.
 *
 * @param {FocusableWrapper} wrapper
 */
function deactivateElement(wrapper) {
  wrapper.eventManager.clear();
}

var runLocalHooks = function runLocalHooks(eventName, subject) {
  return function (event) {
    return subject.runLocalHooks(eventName, event);
  };
};

/**
 * Register copy/cut/paste events and forward their actions to the subject local hooks system.
 *
 * @param {HTMLElement} element
 * @param {FocusableWrapper} subject
 */
function forwardEventsToLocalHooks(eventManager, element, subject) {
  eventManager.addEventListener(element, 'copy', runLocalHooks('copy', subject));
  eventManager.addEventListener(element, 'cut', runLocalHooks('cut', subject));
  eventManager.addEventListener(element, 'paste', runLocalHooks('paste', subject));
}

var secondaryElement = void 0;

/**
 * Create and attach newly created focusable element to the DOM.
 *
 * @return {HTMLElement}
 */
function createOrGetSecondaryElement() {
  if (secondaryElement) {

    if (!secondaryElement.parentElement) {
      document.body.appendChild(secondaryElement);
    }

    return secondaryElement;
  }

  var element = document.createElement('textarea');

  secondaryElement = element;
  element.id = 'HandsontableCopyPaste';
  element.className = 'copyPaste';
  element.tabIndex = -1;
  element.autocomplete = 'off';
  element.wrap = 'hard';
  element.value = ' ';

  document.body.appendChild(element);

  return element;
}

/**
 * Destroy the FocusableWrapper instance.
 *
 * @param {FocusableWrapper} wrapper
 */
function destroyElement(wrapper) {
  if (!(wrapper instanceof FocusableWrapper)) {
    return;
  }

  if (refCounter > 0) {
    refCounter -= 1;
  }

  deactivateElement(wrapper);

  if (refCounter <= 0) {
    refCounter = 0;

    // Detach secondary element from the DOM.
    if (secondaryElement && secondaryElement.parentNode) {
      secondaryElement.parentNode.removeChild(secondaryElement);
      secondaryElement = null;
    }
    wrapper.mainElement = null;
  }
}

exports.createElement = createElement;
exports.deactivateElement = deactivateElement;
exports.destroyElement = destroyElement;