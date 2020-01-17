import { isPassiveEventSupported } from './helpers/feature';
import { stopImmediatePropagation as _stopImmediatePropagation } from './helpers/dom/event';

/**
 * Counter which tracks unregistered listeners (useful for detecting memory leaks).
 *
 * @type {number}
 */
let listenersCounter = 0;

/**
 * Event DOM manager for internal use in Handsontable.
 *
 * @class EventManager
 * @util
 */
class EventManager {
  /**
   * @param {object} [context=null] An object to which event listeners will be stored.
   * @private
   */
  constructor(context = null) {
    this.context = context || this;

    if (!this.context.eventListeners) {
      this.context.eventListeners = []; // TODO perf It would be more performant if every instance of EventManager tracked its own listeners only
    }
  }

  /**
   * Register specified listener (`eventName`) to the element.
   *
   * @param {Element} element Target element.
   * @param {string} eventName Event name.
   * @param {Function} callback Function which will be called after event occur.
   * @param {AddEventListenerOptions|boolean} [options] Listener options if object or useCapture if boolean.
   * @returns {Function} Returns function which you can easily call to remove that event.
   */
  addEventListener(element, eventName, callback, options = false) {
    /**
     * @param {Event} event The event object.
     */
    function callbackProxy(event) {
      callback.call(this, extendEvent(event));
    }

    if (typeof options !== 'boolean' && !isPassiveEventSupported()) {
      options = false;
    }

    this.context.eventListeners.push({
      element,
      event: eventName,
      callback,
      callbackProxy,
      options,
      eventManager: this
    });

    element.addEventListener(eventName, callbackProxy, options);
    listenersCounter += 1;

    return () => {
      this.removeEventListener(element, eventName, callback);
    };
  }

  /**
   * Remove the event listener previously registered.
   *
   * @param {Element} element Target element.
   * @param {string} eventName Event name.
   * @param {Function} callback Function to remove from the event target. It must be the same as during registration listener.
   * @param {boolean} [onlyOwnEvents] Whether whould remove only events registered using this instance of EventManager.
   */
  removeEventListener(element, eventName, callback, onlyOwnEvents = false) {
    let len = this.context.eventListeners.length;
    let tmpEvent;

    while (len) {
      len -= 1;
      tmpEvent = this.context.eventListeners[len];

      if (tmpEvent.event === eventName && tmpEvent.element === element) {
        if (callback && callback !== tmpEvent.callback) {
          /* eslint-disable no-continue */
          continue;
        }
        if (onlyOwnEvents && tmpEvent.eventManager !== this) {
          continue;
        }
        this.context.eventListeners.splice(len, 1);
        tmpEvent.element.removeEventListener(tmpEvent.event, tmpEvent.callbackProxy, tmpEvent.options);
        listenersCounter -= 1;
      }
    }
  }

  /**
   * Clear all previously registered events.
   *
   * @private
   * @since 0.15.0-beta3
   * @param {boolean} [onlyOwnEvents] Whether whould remove only events registered using this instance of EventManager.
   */
  clearEvents(onlyOwnEvents = false) {
    if (!this.context) {
      return;
    }
    let len = this.context.eventListeners.length;

    while (len) {
      len -= 1;
      const event = this.context.eventListeners[len];

      if (event) {
        this.removeEventListener(event.element, event.event, event.callback, onlyOwnEvents);
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
   * Destroy instance of EventManager, clearing all events of the context.
   */
  destroy() {
    this.clearEvents();
    this.context = null;
  }

  /**
   * Destroy instance of EventManager, clearing only the own events.
   */
  destroyWithOwnEventsOnly() {
    this.clearEvents(true);
    this.context = null;
  }

  /**
   * Trigger event at the specified target element.
   *
   * @param {Element} element Target element.
   * @param {string} eventName Event name.
   */
  fireEvent(element, eventName) {
    let rootDocument = element.document;
    let rootWindow = element;

    if (!rootDocument) {
      rootDocument = element.ownerDocument ? element.ownerDocument : element;
      rootWindow = rootDocument.defaultView;
    }

    const options = {
      bubbles: true,
      cancelable: (eventName !== 'mousemove'),
      view: rootWindow,
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
    let event;

    if (rootDocument.createEvent) {
      event = rootDocument.createEvent('MouseEvents');
      event.initMouseEvent(eventName, options.bubbles, options.cancelable,
        options.view, options.detail,
        options.screenX, options.screenY, options.clientX, options.clientY,
        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
        options.button, options.relatedTarget || rootDocument.body.parentNode);

    } else {
      event = rootDocument.createEventObject();
    }

    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent(`on${eventName}`, event);
    }
  }
}

/**
 * @private
 * @param {Event} event The event object.
 * @returns {Event}
 */
function extendEvent(event) {
  const nativeStopImmediatePropagation = event.stopImmediatePropagation;

  event.stopImmediatePropagation = function() {
    nativeStopImmediatePropagation.apply(this);
    _stopImmediatePropagation(this);
  };

  return event;
}

export default EventManager;

/**
 * @returns {number}
 */
export function getListenersCounter() {
  return listenersCounter;
}
