
if(!window.Handsontable){
  var Handsontable = {};
}

Handsontable.eventManager = function (instance) {
  if (!instance) {
    throw  new Error ('instance not defined');
  }

  if (!instance.eventListeners) {
    instance.eventListeners = [];
  }

  var addEvent = function (element, event, callback) {
      instance.eventListeners.push({
        element: element,
        event: event,
        callback: callback
      });

      if (window.addEventListener) {
        element.addEventListener(event, callback, false)
      } else {
        element.attachEvent('on' + event, callback);
      }
    },
    removeEvent = function (element, event, callback){
      var len = instance.eventListeners.length;
      while (len--) {
        var tmpEv = instance.eventListeners[len];

        if (tmpEv.event == event && tmpEv.element == element) {
          if (callback && callback != tmpEv.callback) {
            continue;
          }

          instance.eventListeners.splice(len, 1);
          if (tmpEv.element.detachEvent) {
            tmpEv.element.detachEvent('on' + tmpEv.event, tmpEv.callback);
          } else {
            tmpEv.element.removeEventListener(tmpEv.event, tmpEv.callback, false);
          }
        }
      }
    },
    serveImmediatePropagation = function (event) {
      if (event != null && event.isImmediatePropagationEnabled == null) {
        event.stopImmediatePropagation = function () {
          this.isImmediatePropagationEnabled = false;
          this.cancelBubble = true;
        };
        event.isImmediatePropagationEnabled = true;
        event.isImmediatePropagationStopped = function () {
          return !this.isImmediatePropagationEnabled;
        };
      }
      return event;
    },
    clearEvents = function () {
      var len = instance.eventListeners.length;
      while(len--) {
       var event = instance.eventListeners[len];
       removeEvent(event.element, event.event, event.callback);
      }
    },
    fireEvent = function (element, type) {
      var options = {
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

      var event;
      if ( document.createEvent ) {
        event = document.createEvent("MouseEvents");
        event.initMouseEvent(type, options.bubbles, options.cancelable,
          options.view, options.detail,
          options.screenX, options.screenY, options.clientX, options.clientY,
          options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
          options.button, options.relatedTarget || document.body.parentNode);

      } else {
        event = document.createEventObject();
      }



      if (element.detachEvent) {
        element.fireEvent('on' + type, event);
      } else {
        element.dispatchEvent(event);
      }
    };

  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents,
    serveImmediatePropagation : serveImmediatePropagation,
    fireEvent: fireEvent

  }
};
