/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
 /**
  * This module is for normalizing events. Mouse and Touch events will be
  * collected here, and fire PointerEvents that have the same semantics, no
  * matter the source.
  * Events fired:
  *   - pointerdown: a pointing is added
  *   - pointerup: a pointer is removed
  *   - pointermove: a pointer is moved
  *   - pointerover: a pointer crosses into an element
  *   - pointerout: a pointer leaves an element
  *   - pointercancel: a pointer will no longer generate events
  */
  var dispatcher = {
    targets: new SideTable('target'),
    handledEvents: new SideTable('pointer'),
    scrollType: new SideTable('scrollType'),
    pointermap: new PointerMap,
    events: [],
    eventMap: {},
    // Scope objects for native events.
    // This exists for ease of testing.
    eventSources: {},
    /**
     * Add a new event source that will generate pointer events.
     *
     * `inSource` must contain an array of event names named `events`, and
     * functions with the names specified in the `events` array.
     * @param {string} inName A name for the event source
     * @param {Object} inSource A new source of platform events.
     */
    registerSource: function(inName, inSource) {
      var s = inSource;
      var newEvents = s.events;
      if (newEvents) {
        this.events = this.events.concat(newEvents);
        newEvents.forEach(function(e) {
          if (s[e]) {
            this.eventMap[e] = s[e].bind(s);
          }
        }, this);
        this.eventSources[inName] = s;
      }
    },
    // add event listeners for inTarget
    registerTarget: function(inTarget, inAxis) {
      this.scrollType.set(inTarget, inAxis || 'none');
      this.listen(this.events, inTarget, this.boundHandler);
    },
    // remove event listeners for inTarget
    unregisterTarget: function(inTarget) {
      this.scrollType.set(inTarget, null);
      this.unlisten(this.events, inTarget, this.boundHandler);
    },
    // EVENTS
    down: function(inEvent) {
      this.fireEvent('pointerdown', inEvent)
    },
    move: function(inEvent) {
      this.fireEvent('pointermove', inEvent);
    },
    up: function(inEvent) {
      this.fireEvent('pointerup', inEvent);
    },
    enter: function(inEvent) {
      this.fireEvent('pointerenter', inEvent)
    },
    leave: function(inEvent) {
      this.fireEvent('pointerleave', inEvent);
    },
    over: function(inEvent) {
      this.fireEvent('pointerover', inEvent)
    },
    out: function(inEvent) {
      this.fireEvent('pointerout', inEvent);
    },
    cancel: function(inEvent) {
      this.fireEvent('pointercancel', inEvent);
    },
    // LISTENER LOGIC
    eventHandler: function(inEvent) {
      // This is used to prevent multiple dispatch of pointerevents from
      // platform events. This can happen when two elements in different scopes
      // are set up to create pointer events, which is relevant to Shadow DOM.
      if (this.handledEvents.get(inEvent)) {
        return;
      }
      var type = inEvent.type;
      var fn = this.eventMap && this.eventMap[type];
      if (fn) {
        fn(inEvent);
      }
      this.handledEvents.set(inEvent, true);
    },
    // set up event listeners
    listen: function(inEvents, inTarget, inListener) {
      inEvents.forEach(function(e) {
        this.addEvent(e, inListener, false, inTarget);
      }, this);
    },
    // remove event listeners
    unlisten: function(inEvents, inTarget, inListener) {
      inEvents.forEach(function(e) {
        this.removeEvent(e, inListener, false, inTarget);
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
     * @param {string} inType A string representing the type of event to create
     * @param {Event} inEvent A platform event with a target
     * @return {Event} A PointerEvent of type `inType`
     */
    makeEvent: function(inType, inEvent) {
      var e = new PointerEvent(inType, inEvent);
      this.targets.set(e, this.targets.get(inEvent) || inEvent.target);
      return e;
    },
    // make and dispatch an event in one call
    fireEvent: function(inType, inEvent) {
      var e = this.makeEvent(inType, inEvent);
      return this.dispatchEvent(e);
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
    getTarget: function(inEvent) {
      // if pointer capture is set, route all events for the specified pointerId
      // to the capture target
      if (this.captureInfo) {
        if (this.captureInfo.id === inEvent.pointerId) {
          return this.captureInfo.target;
        }
      }
      return this.targets.get(inEvent);
    },
    setCapture: function(inPointerId, inTarget) {
      if (this.captureInfo) {
        this.releaseCapture(this.captureInfo.id);
      }
      this.captureInfo = {id: inPointerId, target: inTarget};
      var e = new PointerEvent('gotpointercapture', { bubbles: true });
      this.implicitRelease = this.releaseCapture.bind(this, inPointerId);
      document.addEventListener('pointerup', this.implicitRelease);
      document.addEventListener('pointercancel', this.implicitRelease);
      this.targets.set(e, inTarget);
      this.asyncDispatchEvent(e);
    },
    releaseCapture: function(inPointerId) {
      if (this.captureInfo && this.captureInfo.id === inPointerId) {
        var e = new PointerEvent('lostpointercapture', { bubbles: true });
        var t = this.captureInfo.target;
        this.captureInfo = null;
        document.removeEventListener('pointerup', this.implicitRelease);
        document.removeEventListener('pointercancel', this.implicitRelease);
        this.targets.set(e, t);
        this.asyncDispatchEvent(e);
      }
    },
    /**
     * Dispatches the event to its target.
     *
     * @param {Event} inEvent The event to be dispatched.
     * @return {Boolean} True if an event handler returns true, false otherwise.
     */
    dispatchEvent: function(inEvent) {
      var t = this.getTarget(inEvent);
      if (t) {
        return t.dispatchEvent(inEvent);
      }
    },
    asyncDispatchEvent: function(inEvent) {
      setTimeout(this.dispatchEvent.bind(this, inEvent), 0);
    }
  };
  dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);
  scope.dispatcher = dispatcher;
  scope.register = dispatcher.registerTarget.bind(dispatcher);
  scope.unregister = dispatcher.unregisterTarget.bind(dispatcher);
})(window.__PointerEventShim__);
