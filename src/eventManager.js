
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

  var addEvent = function (element, event, delegate, callback, useCapture) {
      if (typeof delegate === 'function') {
        useCapture = callback;
        callback = delegate;
        delegate = null;
      } else {
        throw new Error("Add delegate event not implemented");

        //TODO
        var CB = callback;
        callback = function (event) {
          if (Handsontable.Dom.hasClass(event.target, delegate)) {
            CB();
          }
        }
      }

      useCapture = useCapture || false;

      instance.eventListeners.push({
        element: element,
        event: event,
        delegate: delegate,
        callback: callback,
        useCapture: useCapture
      });

      if (window.addEventListener) {
        element.addEventListener(event, callback, useCapture)
      } else {
        element.attachEvent('on' + event, callback);
      }
    },
    removeEvent = function (element, event, delegate, callback, useCapture){
      if(typeof delegate === 'function') {
        useCapture = callback;
        callback = delegate;
      }
      else {
        throw new Error("Remove delegate event not implemented");
      }

      useCapture = useCapture || false;

      if (element.detachEvent) {
        element.detachEvent('on' + event, handler);
      } else {
        element.removeEventListener(event, callback, useCapture);
      }
    },
    serveImmediatePropagation = function () {
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
      while(instance.eventListeners.length > 0) {
       var event = instance.eventListeners.pop();
        if(event.delegate) {
          removeEvent(event.element, event.event, event.delegate, event.callback, event.useCapture);
        }
        else {
          removeEvent(event.element, event.event, event.callback, event.useCapture);
        }
      }
    };

  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents,
    serveImmediatePropagation : serveImmediatePropagation
  }
};
