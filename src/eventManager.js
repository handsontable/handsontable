
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

  function extendEvent(event) {
    var
      componentName = 'HOT-TABLE',
      isHotTableSpotted,
      fromElement,
      realTarget,
      target,
      len;

    event.isTargetWebComponent = false;
    event.realTarget = event.target;

    if (!Handsontable.eventManager.isHotTableEnv) {
      return event;
    }
    event = Handsontable.Dom.polymerWrap(event);
    len = event.path.length;

    while (len --) {
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

    if (Handsontable.Dom.isWebComponentSupportedNatively()) {
      event.realTarget = event.srcElement || event.toElement;

    } else if (instance instanceof Handsontable.Core || instance instanceof Walkontable) {
      // Polymer doesn't support `event.target` property properly we must emulate it ourselves
      if (instance instanceof Handsontable.Core) {
        fromElement = instance.view.wt.wtTable.TABLE;

      } else if (instance instanceof Walkontable) {
        // .wtHider
        fromElement = instance.wtTable.TABLE.parentNode.parentNode;
      }
      realTarget = Handsontable.Dom.closest(event.target, [componentName], fromElement);

      if (realTarget) {
        event.realTarget = fromElement.querySelector(componentName) || event.target;
      } else {
        event.realTarget = event.target;
      }
    }

    Object.defineProperty(event, 'target', {
      get: function() {
        return Handsontable.Dom.polymerWrap(target);
      },
      enumerable: true,
      configurable: true
    });

    return event;
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

    callbackProxy = function callbackProxy(event) {
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
      event = extendEvent(event);

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
