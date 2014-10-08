
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
      } else if(delegate) {
//        throw new Error("Add delegate event not implemented");

        var id,className, tagName;

        if (typeof delegate == 'object') {
          id = delegate[0].id;
          className = delegate[0].className;
        } else {
          if (delegate.indexOf('#') != -1) {
            id = delegate.split('#')[1];
          } else {
            if (delegate.indexOf('.') != -1) {
              className = delegate.split('.')[1];
            } else {
              tagName = delegate;
            }
          }
        }

        var originalCallBack = callback;
        callback = function (event) {
          if (id) {
            if (event.target.id == id){
              return originalCallBack.apply(this, arguments);
            }
          } else {
            if (tagName){
              if (event.target.tagName.toUpperCase() == tagName.toUpperCase()) {
                return originalCallBack.apply(this, arguments);
              }
            } else {
              if (Handsontable.Dom.hasClass(event.target, className)) {
                return originalCallBack.apply(this, arguments);
              }
            }
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
        delegate = null;
      }
      else {
//        throw new Error("Remove delegate event not implemented");
      }

      useCapture = useCapture || false;


      var len = instance.eventListeners.length;

      while (len--) {
        var tmpEv =instance.eventListeners[len];

        if (tmpEv && tmpEv.event == event && tmpEv.element == element) {
          if (callback) {
            if (callback == tmpEv.callback) {
              instance.eventListeners.splice(len,1);
            }
          } else {
            instance.eventListeners.splice(len,1);
          }
        }
      }

      if (element.detachEvent) {
        element.detachEvent('on' + event, callback);
      } else {
        element.removeEventListener(event, callback, useCapture);
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

      while(instance.eventListeners.length > 0) {
       var event = instance.eventListeners.pop();

       removeEvent(event.element, event.event, event.delegate, event.callback, event.useCapture);

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
