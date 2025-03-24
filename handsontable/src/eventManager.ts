import { stopImmediatePropagation as _stopImmediatePropagation } from './helpers/dom/event';

interface EventListener {
  element: Element;
  event: string;
  callback: (event: Event) => void;
  callbackProxy: (event: Event) => void;
  options: boolean | AddEventListenerOptions;
  eventManager: EventManager;
}

interface EventContext {
  eventListeners: EventListener[];
}

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
 */
class EventManager implements EventContext {
  /**
   * @type {object}
   */
  context: EventContext;
  eventListeners: EventListener[] = [];

  /**
   * @param {object} [context=null] An object to which event listeners will be stored.
   * @private
   */
  constructor(context: EventContext | null = null) {
    this.context = context || this;

    // TODO it modify external object. Rethink that.
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
  addEventListener(element: Element, eventName: string, callback: (event: Event) => void, options: boolean | AddEventListenerOptions = false): () => void {
    /**
     * @private
     * @param {Event} event The event object.
     */
    function callbackProxy(this: any, event: Event): void {
      callback.call(this, extendEvent(event));
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
  removeEventListener(element: Element, eventName: string, callback: (event: Event) => void, onlyOwnEvents: boolean = false): void {
    let len = this.context.eventListeners.length;
    let tmpEvent: EventListener;

    while (len) {
      len -= 1;
      tmpEvent = this.context.eventListeners[len];

      if (tmpEvent.event === eventName && tmpEvent.element === element) {
        if (callback && callback !== tmpEvent.callback) {
          /* eslint-disable no-continue */
          continue;
        }
        // TODO rethink that, main bulk is that it needs multi instances to handle same context, but with a different scopes.
        // TODO I suppose much more efficient way will be comparing string with scope id, or any similar approach.
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
  clearEvents(onlyOwnEvents: boolean = false): void {
    if (!this.context) {
      return;
    }
    let len = this.context.eventListeners.length;

    while (len) {
      len -= 1;
      const event = this.context.eventListeners[len];

      if (onlyOwnEvents && event.eventManager !== this) {
        continue;
      }
      this.context.eventListeners.splice(len, 1);
      event.element.removeEventListener(event.event, event.callbackProxy, event.options);
      listenersCounter -= 1;
    }
  }

  /**
   * Clear all previously registered events.
   */
  clear(): void {
    this.clearEvents();
  }

  /**
   * Destroy instance of EventManager, clearing all events of the context.
   */
  destroy(): void {
    this.clearEvents();
    this.context = this;
  }

  /**
   * Destroy instance of EventManager, clearing only the own events.
   */
  destroyWithOwnEventsOnly(): void {
    this.clearEvents(true);
    this.context = this;
  }

  /**
   * Trigger event at the specified target element.
   *
   * @param {Element} element Target element.
   * @param {string} eventName Event name.
   */
  fireEvent(element: Element, eventName: string): void {
    let rootDocument: Document = (element as any).document;
    let rootWindow: Window = (element as any);

    if (!rootDocument) {
      rootDocument = element.ownerDocument ? element.ownerDocument : (element as any);
      rootWindow = rootDocument.defaultView as Window;
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
    let event: MouseEvent;

    if (rootDocument.createEvent) {
      event = rootDocument.createEvent('MouseEvents') as MouseEvent;
      event.initMouseEvent(eventName, options.bubbles, options.cancelable,
        options.view, options.detail,
        options.screenX, options.screenY, options.clientX, options.clientY,
        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
        options.button, options.relatedTarget || rootDocument.body.parentNode);

    } else {
      event = (rootDocument as any).createEventObject();
    }

    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      (element as any).fireEvent(`on${eventName}`, event);
    }
  }
}

/**
 * @private
 * @param {Event} event The event object.
 * @returns {Event}
 */
function extendEvent(event: Event): Event {
  const nativeStopImmediatePropagation = event.stopImmediatePropagation;

  event.stopImmediatePropagation = function(this: Event): void {
    nativeStopImmediatePropagation.apply(this);
    _stopImmediatePropagation(this);
  };

  return event;
}

export default EventManager;

/**
 * @private
 * @returns {number}
 */
export function getListenersCounter(): number {
  return listenersCounter;
}
