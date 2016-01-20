
import {polymerWrap, closest} from './helpers/dom/element';
import {isWebComponentSupportedNatively} from './helpers/browser';

/**
 * Event DOM manager for internal use in Handsontable.
 *
 * @class EventManager
 * @util
 */
class EventManager {
  /**
   * @param {Object} [context=null]
   * @private
   */
  constructor(context = null) {
    this.context = context || this;

    if (!this.context.eventListeners) {
      this.context.eventListeners = [];
    }
  }

  /**
   * Register specified listener (`eventName`) to the element.
   *
   * @param {Element} element Target element.
   * @param {String} eventName Event name.
   * @param {Function} callback Function which will be called after event occur.
   * @returns {Function} Returns function which you can easily call to remove that event
   */
  addEventListener(element, eventName, callback) {
    let context = this.context;

    function callbackProxy(event) {
      if (event.target == void 0 && event.srcElement != void 0) {
        if (event.definePoperty) {
          event.definePoperty('target', {
            value: event.srcElement
          });
        } else {
          event.target = event.srcElement;
        }
      }
      if (event.preventDefault == void 0) {
        if (event.definePoperty) {
          event.definePoperty('preventDefault', {
            value: function() {
              this.returnValue = false;
            }
          });
        } else {
          event.preventDefault = function() {
            this.returnValue = false;
          };
        }
      }
      event = extendEvent(context, event);

      /* jshint validthis:true */
      callback.call(this, event);
    }
    this.context.eventListeners.push({
      element: element,
      event: eventName,
      callback: callback,
      callbackProxy: callbackProxy,
    });

    if (window.addEventListener) {
      element.addEventListener(eventName, callbackProxy, false);
    } else {
      element.attachEvent('on' + eventName, callbackProxy);
    }
    Handsontable.countEventManagerListeners++;

    return () => {
      this.removeEventListener(element, eventName, callback);
    };
  }

  /**
   * Remove the event listener previously registered.
   *
   * @param {Element} element Target element.
   * @param {String} eventName Event name.
   * @param {Function} callback Function to remove from the event target. It must be the same as during registration listener.
   */
  removeEventListener(element, eventName, callback) {
    let len = this.context.eventListeners.length;
    let tmpEvent;

    while (len--) {
      tmpEvent = this.context.eventListeners[len];

      if (tmpEvent.event == eventName && tmpEvent.element == element) {
        if (callback && callback != tmpEvent.callback) {
          continue;
        }
        this.context.eventListeners.splice(len, 1);

        if (tmpEvent.element.removeEventListener) {
          tmpEvent.element.removeEventListener(tmpEvent.event, tmpEvent.callbackProxy, false);
        } else {
          tmpEvent.element.detachEvent('on' + tmpEvent.event, tmpEvent.callbackProxy);
        }
        Handsontable.countEventManagerListeners--;
      }
    }
  }

  /**
   * Clear all previously registered events.
   *
   * @private
   * @since 0.15.0-beta3
   */
  clearEvents() {
    if (!this.context) {
      return;
    }
    let len = this.context.eventListeners.length;

    while (len--) {
      let event = this.context.eventListeners[len];

      if (event) {
        this.removeEventListener(event.element, event.event, event.callback);
      }
    }
  }

  /**
   * Clear all previously registered events.
   */
  clear() {
    this.clearEvents();
  }

  /**
   * Destroy instance of EventManager.
   */
  destroy() {
    this.clearEvents();
    this.context = null;
  }

  /**
   * Trigger event at the specified target element.
   *
   * @param {Element} element Target element.
   * @param {String} eventName Event name.
   */
  fireEvent(element, eventName) {
    let options = {
      bubbles: true,
      cancelable: (eventName !== 'mousemove'),
      view: window,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 1,
      clientY: 1,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: undefined,
    };
    var event;

    if (document.createEvent) {
      event = document.createEvent('MouseEvents');
      event.initMouseEvent(eventName, options.bubbles, options.cancelable,
        options.view, options.detail,
        options.screenX, options.screenY, options.clientX, options.clientY,
        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
        options.button, options.relatedTarget || document.body.parentNode);

    } else {
      event = document.createEventObject();
    }

    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent('on' + eventName, event);
    }
  }
}

/**
 * @param {Object} context
 * @param {Event} event
 * @private
 * @returns {*}
 */
function extendEvent(context, event) {
  let componentName = 'HOT-TABLE';
  let isHotTableSpotted;
  let fromElement;
  let realTarget;
  let target;
  let len;

  event.isTargetWebComponent = false;
  event.realTarget = event.target;

  if (!Handsontable.eventManager.isHotTableEnv) {
    return event;
  }
  event = polymerWrap(event);
  len = event.path ? event.path.length : 0;

  while (len--) {
    if (event.path[len].nodeName === componentName) {
      isHotTableSpotted = true;

    } else if (isHotTableSpotted && event.path[len].shadowRoot) {
      target = event.path[len];

      break;
    }
    if (len === 0 && !target) {
      target = event.path[len];
    }
  }
  if (!target) {
    target = event.target;
  }
  event.isTargetWebComponent = true;

  if (isWebComponentSupportedNatively()) {
    event.realTarget = event.srcElement || event.toElement;

  } else if (context instanceof Handsontable.Core || context instanceof Walkontable) {
    // Polymer doesn't support `event.target` property properly we must emulate it ourselves
    if (context instanceof Handsontable.Core) {
      fromElement = context.view ? context.view.wt.wtTable.TABLE : null;

    } else if (context instanceof Walkontable) {
      // .wtHider
      fromElement = context.wtTable.TABLE.parentNode.parentNode;
    }
    realTarget = closest(event.target, [componentName], fromElement);

    if (realTarget) {
      event.realTarget = fromElement.querySelector(componentName) || event.target;
    } else {
      event.realTarget = event.target;
    }
  }

  Object.defineProperty(event, 'target', {
    get: function() {
      return polymerWrap(target);
    },
    enumerable: true,
    configurable: true,
  });

  return event;
}

export {EventManager, eventManager};

window.Handsontable = window.Handsontable || {};
// used to debug memory leaks
Handsontable.countEventManagerListeners = 0;
// support for older versions of Handsontable, deprecated
Handsontable.eventManager = eventManager;

function eventManager(context) {
  return new EventManager(context);
}
