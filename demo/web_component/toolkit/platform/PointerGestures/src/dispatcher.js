/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  var dispatcher = {
    handledEvents: new SideTable('gesture'),
    targets: new SideTable('target'),
    handlerQueue: {},
    events: [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointerover',
      'pointerout',
      'pointercancel'
    ],
    /**
     * Add a new gesture recognizer to the event listeners.
     * @param {Object} inRecognizer A new recognizer to add to the queue of
     *   event handlers. inRecognizer must contain an array of event names
     *   called 'events', and functions with the names specified in the 'events'
     *   array.
     */
    registerRecognizer: function(inRecognizer) {
      var r = inRecognizer;
      this.events.forEach(function(e) {
        if (r[e]) {
          var f = r[e].bind(r);
          this.addHandler(e, f);
        }
      }, this);
    },
    addHandler: function(inEvent, inFn) {
      var e = inEvent;
      if (!this.handlerQueue[e]) {
        this.handlerQueue[e] = [];
      }
      this.handlerQueue[e].push(inFn);
    },
    // add event listeners for inTarget
    registerTarget: function(inTarget) {
      this.listen(this.events, inTarget);
    },
    // remove event listeners for inTarget
    unregisterTarget: function(inTarget) {
      this.unlisten(this.events, inTarget);
    },
    // LISTENER LOGIC
    eventHandler: function(inEvent) {
      if (this.handledEvents.get(inEvent)) {
        return;
      }
      var type = inEvent.type, q;
      if (q = this.handlerQueue[type]) {
        this.runQueue(q, inEvent);
      }
      this.handledEvents.set(inEvent, true);
    },
    // Run all the handlers for the gesture modules
    runQueue: function(inQueue, inEvent) {
      // TODO(dfreedman): query for stopPropagation instead of return true
      for (var i = 0, f, ql = inQueue.length; (i < ql) && (f = inQueue[i]); i++) {
        if(f(inEvent) === true) {
          break;
        }
      }
    },
    // set up event listeners
    listen: function(inEvents, inTarget) {
      inEvents.forEach(function(e) {
        this.addEvent(e, this.boundHandler, false, inTarget);
      }, this);
    },
    // remove event listeners
    unlisten: function(inEvents) {
      inEvents.forEach(function(e) {
        this.removeEvent(e, this.boundHandler, false, inTarget);
      }, this);
    },
    addEvent: function(inEventName, inEventHandler, inCapture, inTarget) {
      inTarget.addEventListener(inEventName, inEventHandler, inCapture);
    },
    removeEvent: function(inEventName, inEventHandler, inCapture, inTarget) {
      inTarget.removeEventListener(inEventName, inEventHandler, inCapture);
    },
    // EVENT CREATION AND TRACKING
    /**
     * Creates a new Event of type `inType`, based on the information in
     * `inEvent`.
     *
     * @param {Event} inEvent A platform event with a target
     * @param {string} inType A string representing the type of event to create
     * @return {Event} A Gesture event of type `inType`
     */
    makeEvent: function(inType, inDict) {
      return new PointerGestureEvent(inType, inDict);
    },
    /**
     * Returns a snapshot of inEvent, with writable properties.
     *
     * @param {Event} inEvent An event that contains properties to copy.
     * @return {Object} An object containing shallow copies of `inEvent`'s
     *    properties.
     */
    cloneEvent: function(inEvent) {
      var eventCopy = {};
      for (var n in inEvent) {
        eventCopy[n] = inEvent[n];
      }
      return eventCopy;
    },
    /**
     * Dispatches the event to its target.
     *
     * @param {Event} inEvent The event to be dispatched.
     * @param {Element=} inTarget (Optional) The target for the event. If no
     * target is set, the target of the source event is used.
     * @return {Boolean} True if an event handler returns true, false otherwise.
     */
    dispatchEvent: function(inEvent, inTarget) {
      var t = inTarget || this.targets.get(inEvent);
      if (t) {
        return t.dispatchEvent(inEvent);
      }
    },
    asyncDispatchEvent: function(inEvent, inTarget) {
      var fn = function() {
        this.dispatchEvent(inEvent, inTarget);
      }.bind(this);
      setTimeout(fn, 0);
    },
  };
  dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);
  scope.dispatcher = dispatcher;
  /**
   * Convenience function for users to register targets that may be out of the
   * scope of document.
   *
   * @param {Element} InTarget A scope that will create and route gesture events
   */
  scope.register = function(inTarget) {
    dispatcher.registerTarget(inTarget);
  };
  /**
   * Convenience function for users to unregister targets that may be out of the
   * scope of document.
   *
   * @param {Element} InTarget A scope created and routed gesture events
   */
  scope.unregister = function(inTarget) {
    dispatcher.unregisterTarget(inTarget);
  };
  scope.enableGestures = function(inScope) {
    var pe = window.__PointerEventShim__;
    if (pe) {
      pe.enablePointerEvents(inScope);
    }
    scope.register(inScope);
  };
  dispatcher.registerTarget(document);
})(window.__PointerGestureShim__);
