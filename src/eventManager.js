
if(!window.Handsontable){
  var Handsontable = {};
}

Handsontable.countEventManagerListeners = 0; //used to debug memory leaks

Handsontable.eventManager = function (instance) {
  var
    addEvent,
    removeEvent,
    clearEvents,
    fireEvent;

  if (!instance) {
    throw new Error ('instance not defined');
  }
  if (!instance.eventListeners) {
    instance.eventListeners = [];
  }

  /**
   * Add Event
   *
   * @param {Element} element
   * @param {String} event
   * @param {Function} callback
   * @returns {Function} Returns function which you can easily call to remove that event
   */
  addEvent = function (element, event, callback) {
    var callbackProxy;

    callbackProxy = function (event) {
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
          event.preventDefault = function () {
            this.returnValue = false;
          };
        }
      }
      callback.call(this, event);
    };

    instance.eventListeners.push({
      element: element,
      event: event,
      callback: callback,
      callbackProxy: callbackProxy
    });

    if (window.addEventListener) {
      element.addEventListener(event, callbackProxy, false);
    } else {
      element.attachEvent('on' + event, callbackProxy);
    }
    Handsontable.countEventManagerListeners ++;

    return function _removeEvent() {
      removeEvent(element, event, callback);
    };
  };

  /**
   * Remove event
   *
   * @param {Element} element
   * @param {String} event
   * @param {Function} callback
   */
  removeEvent = function (element, event, callback) {
    var len = instance.eventListeners.length,
      tmpEvent;

    while (len--) {
      tmpEvent = instance.eventListeners[len];

      if (tmpEvent.event == event && tmpEvent.element == element) {
        if (callback && callback != tmpEvent.callback) {
          continue;
        }
        instance.eventListeners.splice(len, 1);

        if (tmpEvent.element.removeEventListener) {
          tmpEvent.element.removeEventListener(tmpEvent.event, tmpEvent.callbackProxy, false);
        } else {
          tmpEvent.element.detachEvent('on' + tmpEvent.event, tmpEvent.callbackProxy);
        }
        Handsontable.countEventManagerListeners --;
      }
    }
  };

  /**
   * Clear all events
   */
  clearEvents = function () {
    var len = instance.eventListeners.length,
      event;

    while (len--) {
      event = instance.eventListeners[len];

      if (event) {
        removeEvent(event.element, event.event, event.callback);
      }
    }
  };

  /**
   * Trigger event
   *
   * @param {Element} element
   * @param {String} type
   */
  fireEvent = function (element, type) {
    var options, event;

    options = {
      bubbles: true,
      cancelable: (type !== "mousemove"),
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
      relatedTarget: undefined
    };

    if (document.createEvent) {
      event = document.createEvent("MouseEvents");
      event.initMouseEvent(type, options.bubbles, options.cancelable,
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
      element.fireEvent('on' + type, event);
    }
  };

  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents,
    fireEvent: fireEvent
  };
};
