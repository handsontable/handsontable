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

  var addEvent = function (element, event, delegate, callback, bubbling) {
      bubbling = bubbling || false;

      instance.eventListeners.push({
        element: element,
        event: event,
        delegate: delegate,
        callback: callback,
        bubbling: bubbling
      });

      if (typeof delegate === 'function') {
        callback = delegate;
        bubbling = callback;
      } else {
        //TODO
//        var cbFunction = function (event, callback) {
//          if (Handsontable.Dom.hasClass(event.target, delegate)) {
//            console.log(123);
//            callback();
//          }
//        }
      }

      if (window.addEventListener) {
        element.addEventListener(event, callback, bubbling)
      } else {
        element.attachEvent('on' + event, callback);
      }
      console.log(instance.eventListeners);

    },
    removeEvent = function (element, event, delegate, callback, bubbling){
      bubbling = bubbling || false;

      if (element.detachEvent) {
        element.detachEvent('on' + event, handler);
      } else {
        element.removeEventListener(event, callback, bubbling);
      }
    },
    clearEvents = function () {
      while(instance.eventListeners.length > 0) {
       var event = instance.eventListeners.pop();
        removeEvent(event.element, event.event, event.delegate, event.callback, event.bubbling);
      }
    };

  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents
  }
};
