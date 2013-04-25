/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and

 * limitations under the License.
 */
(function() {

function detectFeatures() {
  var style = document.createElement('style');
  style.textContent = '' +
     'dummyRuleForTesting {' +
     'width: calc(0px);' +
     'width: -webkit-calc(0px); }';
  document.head.appendChild(style);
  var transformCandidates = [
      'transform',
      'webkitTransform',
      'msTransform'
  ];
  var transformProperty = transformCandidates.filter(function(property) {
    return property in style.sheet.cssRules[0].style;
  })[0];
  var calcFunction = style.sheet.cssRules[0].style.width.split('(')[0];
  document.head.removeChild(style);
  return {
    transformProperty: transformProperty,
    calcFunction: calcFunction
  };
}

var features = detectFeatures();
var constructorToken = {};

var createObject = function(proto, obj) {
  var newObject = Object.create(proto);
  Object.getOwnPropertyNames(obj).forEach(function(name) {
    Object.defineProperty(newObject, name,
                          Object.getOwnPropertyDescriptor(obj, name));
  });
  return newObject;
};

var strip = function(str) {
  return str.replace(/^\s+/, '').replace(/\s+$/, '');
};

var IndexSizeError = function(message) {
  Error.call(this);
  this.name = "IndexSizeError";
  this.message = message;
};

IndexSizeError.prototype = Object.create(Error.prototype);

/** @constructor */
var Timing = function(timingDict) {
  this.startDelay = timingDict.startDelay || 0.0;
  this.duration = timingDict.duration;
  if (this.duration < 0.0) {
    throw new IndexSizeError('duration must be >= 0');
  }
  this.iterationCount = isDefined(timingDict.iterationCount) ?
      timingDict.iterationCount : 1.0;
  if (this.iterationCount < 0.0) {
    throw new IndexSizeError('iterationCount must be >= 0');
  }
  this.iterationStart = timingDict.iterationStart || 0.0;
  if (this.iterationStart < 0.0) {
    throw new IndexSizeError('iterationStart must be >= 0');
  }
  this.playbackRate = isDefined(timingDict.playbackRate) ?
      timingDict.playbackRate : 1.0;
  //this.playbackRate = timingDict.playbackRate || 1.0;
  this.direction = timingDict.direction || 'normal';
  if (typeof timingDict.timingFunction === 'string') {
    this.timingFunction =
        TimingFunction.createFromString(timingDict.timingFunction);
  } else {
    this.timingFunction = timingDict.timingFunction;
  }
  this.fillMode = timingDict.fillMode || 'forwards';
};

Timing.prototype = {
  // TODO: Is this supposed to be public?
  clone: function() {
    return new Timing({
      startDelay: this.startDelay,
      duration: this.duration,
      iterationCount: this.iterationCount,
      iterationStart: this.iterationStart,
      playbackRate: this.playbackRate,
      direction: this.direction,
      timingFunction: this.timingFunction ? this.timingFunction.clone() : null,
      fillMode: this.fillMode
    });
  }
};

/** @constructor */
var TimingProxy = function(timing, setter) {
  this._timing = timing;
  this._setter = setter;
};

TimingProxy.prototype = {
  extractMutableTiming: function() {
    return new Timing({
      startDelay: this._timing.startDelay,
      duration: this._timing.duration,
      iterationCount: this._timing.iterationCount,
      iterationStart: this._timing.iterationStart,
      playbackRate: this._timing.playbackRate,
      direction: this._timing.direction,
      timingFunction: this._timing.timingFunction ?
                  this._timing.timingFunction.clone() : null,
      fillMode: this._timing.fillMode
    });
  },
  clone: function() {
    return this._timing.clone();
  }
};

// Configures an accessor descriptor for use with Object.defineProperty() to
// allow the property to be changed and enumerated, to match __defineGetter__()
// and __defineSetter__().
var configureDescriptor = function(descriptor) {
  descriptor.configurable = true,
  descriptor.enumerable = true;
  return descriptor;
};

['startDelay', 'duration', 'iterationCount', 'iterationStart', 'playbackRate',
    'direction', 'timingFunction', 'fillMode'].forEach(function(s) {
  Object.defineProperty(TimingProxy.prototype, s, configureDescriptor({
    get: function() {
      return this._timing[s];
    },
    set: function(v) {
      var old = this._timing[s];
      this._timing[s] = v;
      try {
        this._setter(v);
      } catch (e) {
        this._timing[s] = old;
        throw e;
      }
    },
  }));
});

var isDefined = function(val) {
  return typeof val !== 'undefined';
};

var isDefinedAndNotNull = function(val) {
  return isDefined(val) && (val !== null);
};


/** @constructor */
var Timeline = function(token) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
};

Timeline.prototype = {
  get currentTime() {
    return documentTime();
  },
  play: function(source) {
    return new Player(constructorToken, source, this);
  },
  getCurrentPlayers: function() {
    return PLAYERS.filter(function(player) {
      return !player._isPastEndOfActiveInterval();
    });
  },
};

// TODO: Remove dead Players from here?
var PLAYERS = [];

/** @constructor */
var Player = function(token, source, timeline) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
  this._timeline = timeline;
  this._startTime =
      this.timeline.currentTime === null ? 0 : this.timeline.currentTime;
  this._timeDrift = 0.0;
  this._pauseTime = undefined;
  this._playbackRate = 1.0;

  this.source = source;

  PLAYERS.push(this);
  maybeRestartAnimation();
};

Player.prototype = {
  set source(source) {
    if (isDefinedAndNotNull(this.source)) {
      // To prevent infinite recursion.
      var oldTimedItem = this.source;
      this._source = null;
      oldTimedItem._attach(null);
    }
    this._source = source;
    if (isDefinedAndNotNull(this.source)) {
      this.source._attach(this);
      this._update();
      maybeRestartAnimation();
    }
  },
  get source() {
    return this._source;
  },
  // This is the effective current time.
  set currentTime(currentTime) {
    this._currentTime = currentTime;
  },
  get currentTime() {
    return this._currentTime === null ? 0 : this._currentTime;
  },
  // This is the current time.
  set _currentTime(currentTime) {
    // This seeks by updating _drift. It does not affect the startTime.
    if (isDefined(this._pauseTime)) {
      this._pauseTime = currentTime;
    } else {
      this._timeDrift = (this.timeline.currentTime - this.startTime) *
          this.playbackRate - currentTime;
    }
    this._update();
    maybeRestartAnimation();
  },
  get _currentTime() {
    if (this.timeline.currentTime === null) {
      return null;
    }
    return isDefined(this._pauseTime) ? this._pauseTime :
        (this.timeline.currentTime - this.startTime) * this.playbackRate -
        this._timeDrift;
  },
  set startTime(startTime) {
    // This seeks by updating _startTime and hence the currentTime. It does not
    // affect _drift.
    this._startTime = startTime;
    this._update();
    maybeRestartAnimation();
  },
  get startTime() {
    return this._startTime;
  },
  set paused(isPaused) {
    if (isPaused) {
      this._pauseTime = this.currentTime;
    } else if (isDefined(this._pauseTime)) {
      this._timeDrift = (this.timeline.currentTime - this.startTime) *
          this.playbackRate - this._pauseTime;
      this._pauseTime = undefined;
      maybeRestartAnimation();
    }
  },
  get paused() {
    return isDefined(this._pauseTime);
  },
  get timeline() {
    return this._timeline;
  },
  set playbackRate(playbackRate) {
    var cachedCurrentTime = this.currentTime;
    // This will impact currentTime, so perform a compensatory seek.
    this._playbackRate = playbackRate;
    this.currentTime = cachedCurrentTime;
  },
  get playbackRate(playbackRate) {
    return this._playbackRate;
  },
  _update: function() {
    if (this.source !== null) {
      this.source._updateInheritedTime(this._currentTime);
    }
  },
  _isPastEndOfActiveInterval: function() {
    return this.source === null ||
        this.source._isPastEndOfActiveInterval();
  },
  _getLeafItemsInEffect: function(items) {
    if (this.source) {
      this.source._getLeafItemsInEffect(items);
    }
  },
};


/** @constructor */
var TimedItem = function(token, timing, parentGroup) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
  this.timing = new TimingProxy(interpretTimingParam(timing), function() {
    this._updateInternalState();
  }.bind(this));
  this._inheritedTime = null;
  this.currentIteration = null;
  this.iterationTime = null;
  this.animationTime = null;
  this._startTime = 0.0;

  // A TimedItem has either a _player, or a _parentGroup, or neither, but
  // never both.
  this._player = null;

  // Note that we don't use the public setter, because we call _addInternal()
  // below.
  if (parentGroup === this) {
    throw new Error('parentGroup can not be set to self!');
  }
  this._parentGroup = this._sanitizeParent(parentGroup);

  if (this.parentGroup) {
    // This will set our inheritedTime via _childrenStateModified().
    this.parentGroup._addInternal(this);
  }
  this._updateInternalState();
};

TimedItem.prototype = {
  // TODO: It would be good to avoid the need for this. We would need to modify
  // call sites to instead rely on a call from the parent.
  get _effectiveParentTime() {
    return
        this.parentGroup !== null && this.parentGroup.iterationTime !== null ?
        this.parentGroup.iterationTime : 0;
  },
  get localTime() {
    return this._inheritedTime === null ?
        null : this._inheritedTime - this._startTime;
  },
  get startTime() {
    return this._startTime;
  },
  set duration(duration) {
    this._duration = duration;
    this._updateInternalState();
  },
  get duration() {
    return isDefined(this._duration) ?
        this._duration : (isDefined(this.timing.duration) ?
            this.timing.duration : this._intrinsicDuration());
  },
  set animationDuration(animationDuration) {
    this._animationDuration = animationDuration;
    this._updateInternalState();
  },
  get animationDuration() {
    if (isDefined(this._animationDuration)) {
      return this._animationDuration;
    }
    var repeatedDuration = this.duration * this.timing.iterationCount;
    return repeatedDuration / Math.abs(this.timing.playbackRate);
  },
  get endTime() {
    return this._startTime + this.animationDuration + this.timing.startDelay;
  },
  get parentGroup() {
    return this._parentGroup;
  },
  _attach: function(player) {
    // Remove ourselves from our parent, if we have one. This also removes any
    // exsisting player.
    this._reparent(null);
    this._player = player;
  },
  _sanitizeParent: function(parentGroup) {
    if (parentGroup === null || parentGroup instanceof TimingGroup) {
      return parentGroup;
    } else if (!isDefined(parentGroup)) {
      return null;
    }
    throw new TypeError('parentGroup is not a TimingGroup');
  },
  // Takes care of updating the outgoing parent. This is called with a non-null
  // parent only from TimingGroup.splice(), which takes care of calling
  // TimingGroup._childrenStateModified() for the new parent.
  _reparent: function(parentGroup) {
    if (parentGroup === this) {
      throw new Error('parentGroup can not be set to self!');
    }
    if (this._player !== null) {
      this._player.source = null;
      this._player = null;
    }
    if (this.parentGroup !== null) {
      this.parentGroup.remove(this.parentGroup.indexOf(this), 1);
    }
    this._parentGroup = parentGroup;
    // In the case of a SeqGroup parent, _startTime will be updated by
    // TimingGroup.splice().
    if (this.parentGroup === null || this.parentGroup.type !== 'seq') {
      this._startTime =
          this._stashedStartTime === undefined ? 0.0 : this._stashedStartTime;
      this._stashedStartTime = undefined;
    }
    // In the case of the parent being non-null, _childrenStateModified() will
    // call this via _updateChildInheritedTimes().
    // TODO: Consider optimising this case by skipping this call.
    this._updateTimeMarkers();
  },
  _intrinsicDuration: function() {
    return 0.0;
  },
  _updateInternalState: function() {
    if (this.parentGroup) {
      this.parentGroup._childrenStateModified();
    }
    this._updateTimeMarkers();
  },
  // We push time down to children. We could instead have children pull from
  // above, but this is tricky because a TimedItem may use either a parent
  // TimedItem or an Player. This requires either logic in
  // TimedItem, or for TimedItem and Player to implement Timeline
  // (or an equivalent), both of which are ugly.
  _updateInheritedTime: function(inheritedTime) {
    this._inheritedTime = inheritedTime;
    this._updateTimeMarkers();
  },
  _updateAnimationTime: function() {
    if (this.localTime < this.timing.startDelay) {
      if (this.timing.fillMode === 'backwards' ||
          this.timing.fillMode === 'both') {
        this.animationTime = 0;
      } else {
        this.animationTime = null;
      }
    } else if (this.localTime <=
        this.timing.startDelay + this.animationDuration) {
      this.animationTime = this.localTime - this.timing.startDelay;
    } else {
      if (this.timing.fillMode === 'forwards' ||
          this.timing.fillMode === 'both') {
        this.animationTime = this.animationDuration;
      } else {
        this.animationTime = null;
      }
    }
  },
  _updateIterationParamsZeroDuration: function() {
    this.iterationTime = 0;
    var isAtEndOfIterations = this.timing.iterationCount != 0 &&
        this.localTime >= this.timing.startDelay;
    this.currentIteration = isAtEndOfIterations ?
       this._floorWithOpenClosedRange(this.timing.iterationStart +
           this.timing.iterationCount, 1.0) :
       this._floorWithClosedOpenRange(this.timing.iterationStart, 1.0);
    // Equivalent to unscaledIterationTime below.
    var unscaledFraction = isAtEndOfIterations ?
        this._modulusWithOpenClosedRange(this.timing.iterationStart +
            this.timing.iterationCount, 1.0) :
        this._modulusWithClosedOpenRange(this.timing.iterationStart, 1.0);
    this._timeFraction = this._isCurrentDirectionForwards() ?
            unscaledFraction :
            1.0 - unscaledFraction;
    if (this.timing.timingFunction) {
      this._timeFraction = this.timing.timingFunction.scaleTime(
          this._timeFraction);
    }
  },
  _getAdjustedAnimationTime: function(animationTime) {
    var startOffset =
        multiplyZeroGivesZero(this.timing.iterationStart, this.duration);
    return (this.timing.playbackRate < 0 ?
        (animationTime - this.animationDuration) : animationTime) *
        this.timing.playbackRate + startOffset;
  },
  _scaleIterationTime: function(unscaledIterationTime) {
    return this._isCurrentDirectionForwards() ?
        unscaledIterationTime :
        this.duration - unscaledIterationTime;
  },
  _updateIterationParams: function() {
    var adjustedAnimationTime =
        this._getAdjustedAnimationTime(this.animationTime);
    var repeatedDuration = this.duration * this.timing.iterationCount;
    var startOffset = this.timing.iterationStart * this.duration;
    var isAtEndOfIterations = (this.timing.iterationCount != 0) &&
        (adjustedAnimationTime - startOffset == repeatedDuration);
    this.currentIteration = isAtEndOfIterations ?
        this._floorWithOpenClosedRange(
            adjustedAnimationTime, this.duration) :
        this._floorWithClosedOpenRange(
            adjustedAnimationTime, this.duration);
    var unscaledIterationTime = isAtEndOfIterations ?
        this._modulusWithOpenClosedRange(
            adjustedAnimationTime, this.duration) :
        this._modulusWithClosedOpenRange(
            adjustedAnimationTime, this.duration);
    this.iterationTime = this._scaleIterationTime(unscaledIterationTime);
    this._timeFraction = this.iterationTime / this.duration;
    if (this.timing.timingFunction) {
      this._timeFraction = this.timing.timingFunction.scaleTime(
          this._timeFraction);
      this.iterationTime = this._timeFraction * this.duration;
    }
  },
  _updateTimeMarkers: function() {
    if (this.localTime === null) {
      this.animationTime = null;
      this.iterationTime = null;
      this.currentIteration = null;
      this._timeFraction = null;
      return false;
    }
    this._updateAnimationTime();
    if (this.animationTime === null) {
      this.iterationTime = null;
      this.currentIteration = null;
      this._timeFraction = null;
    } else if (this.duration == 0) {
      this._updateIterationParamsZeroDuration();
    } else {
      this._updateIterationParams();
    }
    maybeRestartAnimation();
  },
  _floorWithClosedOpenRange: function(x, range) {
    return Math.floor(x / range);
  },
  _floorWithOpenClosedRange: function(x, range) {
    return Math.ceil(x / range) - 1;
  },
  _modulusWithClosedOpenRange: function(x, range) {
    return x % range;
  },
  _modulusWithOpenClosedRange: function(x, range) {
    var ret = this._modulusWithClosedOpenRange(x, range);
    return ret == 0 ? range : ret;
  },
  _isCurrentDirectionForwards: function() {
    if (this.timing.direction == 'normal') {
      return true;
    }
    if (this.timing.direction == 'reverse') {
      return false;
    }
    var d = this.currentIteration;
    if (this.timing.direction == 'alternate-reverse') {
      d += 1;
    }
    // TODO: 6.13.3 step 3. wtf?
    return d % 2 == 0;
  },
  clone: function() {
    throw new Error(
        "Derived classes must override TimedItem.clone()");
  },
  // Gets the leaf TimedItems currently in effect. Note that this is a superset
  // of the leaf TimedItems in their active interval, as a TimedItem can have an
  // effect outside its active interval due to fill.
  _getLeafItemsInEffect: function(items) {
    if (this._timeFraction !== null) {
      this._getLeafItemsInEffectImpl(items);
    }
  },
  _getLeafItemsInEffectImpl: function(items) {
    throw new Error(
        "Derived classes must override TimedItem._getLeafItemsInEffectImpl()");
  },
  _isPastEndOfActiveInterval: function() {
    return this._inheritedTime > this.endTime;
  },
  getPlayer: function() {
    return this.parentGroup === null ?
        this._player : this.parentGroup.getPlayer();
  },
  _netEffectivePlaybackRate: function() {
    var effectivePlaybackRate = this._isCurrentDirectionForwards() ?
        this.timing.playbackRate : -this.timing.playbackRate;
    return this.parentGroup === null ? effectivePlaybackRate :
        effectivePlaybackRate * this.parentGroup._netEffectivePlaybackRate();
  },
};

var isCustomAnimationEffect = function(animationEffect) {
  // TODO: How does WebIDL actually differentiate different callback interfaces?
  return typeof animationEffect === "object" &&
      animationEffect.hasOwnProperty("sample") &&
      typeof animationEffect.sample === "function";
};

var interpretAnimationEffect = function(animationEffect) {
  if (animationEffect instanceof AnimationEffect) {
    return animationEffect;
  } else if (typeof animationEffect === 'object') {
    if (isCustomAnimationEffect(animationEffect)) {
      return animationEffect;
    } else {
      return AnimationEffect.createFromProperties(animationEffect);
    }
  } else {
    try {
      throw new Error('TypeError');
    } catch (e) { console.log(e.stack); throw e; }
  }
};

var cloneAnimationEffect = function(animationEffect) {
  if (animationEffect instanceof AnimationEffect) {
    return animationEffect.clone();
  } else if (isCustomAnimationEffect(animationEffect)) {
    if (typeof animationEffect.clone === "function") {
      return animationEffect.clone();
    } else {
      return animationEffect;
    }
  } else {
    return null;
  }
};

var interpretTimingParam = function(timing) {
  if (!isDefinedAndNotNull(timing)) {
    return new Timing({});
  }
  if (timing instanceof Timing || timing instanceof TimingProxy) {
    return timing;
  }
  if (typeof(timing) === 'number') {
    return new Timing({duration: timing});
  }
  if (typeof(timing) === 'object') {
    return new Timing(timing);
  }
  throw new TypeError('timing parameters must be undefined, Timing objects, ' +
      'numbers, or timing dictionaries; not \'' + timing + '\'');
};

/** @constructor */
var Animation = function(target, animationEffect, timing, parentGroup) {
  this.animationEffect = interpretAnimationEffect(animationEffect);
  this.timing = interpretTimingParam(timing);

  TimedItem.call(this, constructorToken, timing, parentGroup);

  this.targetElement = target;
  this.name = this.animationEffect instanceof KeyframeAnimationEffect ?
      this.animationEffect.property : '<anon>';
};

Animation.prototype = createObject(TimedItem.prototype, {
  _sample: function() {
    this.animationEffect.sample(this._timeFraction,
        this.currentIteration, this.targetElement,
        this.underlyingValue);
  },
  _getLeafItemsInEffectImpl: function(items) {
    items.push(this);
  },
  clone: function() {
    return new Animation(this.targetElement,
        cloneAnimationEffect(this.animationEffect), this.timing.clone());
  },
  toString: function() {
    var funcDescr = this.animationEffect instanceof AnimationEffect ?
        this.animationEffect.toString() : 'Custom scripted function';
    return 'Animation ' + this.startTime + '-' + this.endTime + ' (' +
        this.localTime + ') ' + funcDescr;
  }
});


/** @constructor */
var TimingGroup = function(token, type, children, timing, parentGroup) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
  // Take a copy of the children array, as it could be modified as a side-effect
  // of creating this object. See
  // https://github.com/web-animations/web-animations-js/issues/65 for details.
  var childrenCopy = (children && Array.isArray(children)) ?
      children.slice() : [];
  // used by TimedItem via _intrinsicDuration(), so needs to be set before
  // initializing super.
  this.type = type || 'par';
  this.children = [];
  this.length = 0;
  TimedItem.call(this, constructorToken, timing, parentGroup);
  // We add children after setting the parent. This means that if an ancestor
  // (including the parent) is specified as a child, it will be removed from our
  // ancestors and used as a child,
  for (var i = 0; i < childrenCopy.length; i++) {
    this.add(childrenCopy[i]);
  }
  // TODO: Work out where to expose name in the API
  // this.name = properties.name || '<anon>';
};

TimingGroup.prototype = createObject(TimedItem.prototype, {
  _childrenStateModified: function() {
    // See _updateChildStartTimes().
    this._isInChildrenStateModified = true;

    // We need to walk up and down the tree to re-layout. endTime and the
    // various durations (which are all calculated lazily) are the only
    // properties of a TimedItem which can affect the layout of its ancestors.
    // So it should be sufficient to simply update start times and time markers
    // on the way down.

    // This calls up to our parent, then calls _updateTimeMarkers().
    this._updateInternalState();
    this._updateChildInheritedTimes();

    // Update child start times before walking down.
    this._updateChildStartTimes();

    this._isInChildrenStateModified = false;
  },
  _updateInheritedTime: function(inheritedTime) {
    this._inheritedTime = inheritedTime;
    this._updateTimeMarkers();
    this._updateChildInheritedTimes();
  },
  _updateChildInheritedTimes: function() {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      child._updateInheritedTime(this.iterationTime);
    }
  },
  _updateChildStartTimes: function() {
    if (this.type == 'seq') {
      var cumulativeStartTime = 0;
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child._stashedStartTime === undefined) {
          child._stashedStartTime = child._startTime;
        }
        child._startTime = cumulativeStartTime;
        // Avoid updating the child's inherited time and time markers if this is
        // about to be done in the down phase of _childrenStateModified().
        if (!child._isInChildrenStateModified) {
          // This calls _updateTimeMarkers() on the child.
          child._updateInheritedTime(this.iterationTime);
        }
        cumulativeStartTime += Math.max(0, child.timing.startDelay +
            child.animationDuration);
      }
    }
  },
  getAnimationsForElement: function(elem) {
    var result = [];
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].getAnimationsForElement) {
        result = result.concat(this.children[i].getAnimationsForElement(elem));
      } else if (this.children[i].targetElement == elem) {
        result.push(this.children[i]);
      }
    }
    return result;
  },
  _intrinsicDuration: function() {
    if (this.type == 'par') {
      var dur = Math.max.apply(undefined, this.children.map(function(a) {
        return a.endTime;
      }));
      return Math.max(0, dur);
    } else if (this.type == 'seq') {
      var result = 0;
      this.children.forEach(function(a) {
        result += a.animationDuration + a.timing.startDelay;
      });
      return result;
    } else {
      throw 'Unsupported type ' + this.type;
    }
  },
  _getLeafItemsInEffectImpl: function(items) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i]._getLeafItemsInEffect(items);
    }
  },
  clone: function() {
    var children = [];
    this.children.forEach(function(child) {
      children.push(child.clone());
    });
    return this.type === "par" ?
        new ParGroup(children, this.timing.clone()) :
        new SeqGroup(children, this.timing.clone());
  },
  _lengthChanged: function() {
    while (this.length < this.children.length) {
      var i = this.length++;
      Object.defineProperty(this, i, configureDescriptor({
        set: function(x) { this.children[i] = x; },
        get: function() { return this.children[i]; },
      }));
    }
    while (this.length > this.children.length) {
      var i = --this.length;
      delete this[i];
    }
  },
  clear: function() {
    this.splice(0, this.children.length);
  },
  add: function() {
    var newItems = [];
    for (var i = 0; i < arguments.length; i++) {
      newItems.push(arguments[i]);
    }
    this.splice(this.length, 0, newItems);
    return newItems;
  },
  _addInternal: function(child) {
    this.children.push(child);
    this._lengthChanged();
    this._childrenStateModified();
  },
  indexOf: function(item) {
    return this.children.indexOf(item);
  },
  splice: function(start, deleteCount, newItems) {
    var args = arguments;
    if (args.length == 3) {
      args = [start, deleteCount].concat(newItems);
    }
    for (var i = 2; i < args.length; i++) {
      var newChild = args[i];
      // Check whether the new child is an ancestor. If so, we need to break the
      // chain immediately below the new child.
      for (var ancestor = this; ancestor.parentGroup != null;
          ancestor = ancestor.parentGroup) {
        if (ancestor.parentGroup === newChild) {
          newChild.remove(ancestor);
          break;
        }
      }
      newChild._reparent(this);
    }
    var result = Array.prototype['splice'].apply(this.children, args);
    for (var i = 0; i < result.length; i++) {
      result[i]._parentGroup = null;
    }
    this._lengthChanged();
    this._childrenStateModified();
    return result;
  },
  remove: function(index, count) {
    if (!isDefined(count)) {
      count = 1;
    }
    return this.splice(index, count);
  },
  toString: function() {
    return this.type + ' ' + this.startTime + '-' + this.endTime + ' (' +
        this.localTime + ') ' + ' [' +
        this.children.map(function(a) { return a.toString(); }) + ']'
  },
});

/** @constructor */
var  ParGroup = function(children, timing, parentGroup) {
  TimingGroup.call(this, constructorToken, 'par', children, timing, parentGroup);
};

ParGroup.prototype = Object.create(TimingGroup.prototype);

/** @constructor */
var SeqGroup = function(children, timing, parentGroup) {
  TimingGroup.call(this, constructorToken, 'seq', children, timing, parentGroup);
};

SeqGroup.prototype = Object.create(TimingGroup.prototype);


/** @constructor */
var MediaReference = function(mediaElement, timing, parentGroup) {
  TimedItem.call(this, constructorToken, timing, parentGroup);
  this._media = mediaElement;

  // We can never be sure when _updtaeInheritedTime() is going to be called
  // next, due to skipped frames or the player being seeked. Plus the media
  // element's currentTime may drift from our iterationTime. So if a media
  // element has loop set, we can't be sure that we'll stop it before it wraps.
  // For this reason, we simply disable looping.
  // TODO: Maybe we should let it loop if our duration exceeds it's length?
  this._media.loop = false;

  // If the media element has a media controller, we detach it. This mirrors the
  // behaviour when re-parenting a TimedItem, or attaching one to a Player.
  // TODO: It would be neater to assign to controller, but this currently fails
  // in Chrome. See https://bugs.webkit.org/show_bug.cgi?id=112641
  this._media.mediaGroup = '';
};

MediaReference.prototype = createObject(TimedItem.prototype, {
  _intrinsicDuration: function() {
    // TODO: This should probably default to zero. But doing so means that as
    // soon as our inheritedTime is zero, the polyfill deems the animation to be
    // done and stops ticking, so we don't get any further calls to
    // _updateInheritedTime(). One way around this would be to modify
    // TimedItem._isPastEndOfActiveInterval() to recurse down the tree, then we
    // could override it here.
    return isNaN(this._media.duration) ?
        Infinity : this._media.duration / this._media.defaultPlaybackRate;
  },
  _unscaledMediaCurrentTime: function() {
    return this._media.currentTime / this._media.defaultPlaybackRate;
  },
  _getLeafItemsInEffectImpl: function(items) {
    items.push(this);
  },
  _ensurePlaying: function() {
    // The media element is paused when created.
    if (this._media.paused) {
      this._media.play();
    }
  },
  _ensurePaused: function() {
    if (!this._media.paused) {
      this._media.pause();
    }
  },
  _isSeekableUnscaledTime: function(time) {
    var seekTime = time * this._media.defaultPlaybackRate;
    var ranges = this._media.seekable;
    for (var i = 0; i < ranges.length; i++) {
      if (seekTime >= ranges.start(i) && seekTime <= ranges.end(i)) {
        return true;
      }
    }
    return false;
  },
  // Note that a media element's timeline may not start at zero, although it's
  // duration is always the timeline time at the end point. This means that an
  // element's duration isn't always it's length and not all values of the
  // timline are seekable. Furthermore, some types of media further limit the
  // range of seekable timeline times. For this reason, we always map an
  // iteration to the range [0, duration] and simply seek to the nearest
  // seekable time.
  _ensureIsAtUnscaledTime: function(time) {
    if (this._unscaledMediaCurrentTime() !== time) {
      this._media.currentTime = time * this._media.defaultPlaybackRate;
    }
  },
  // This is called by the polyfill on each tick when our Player's tree is
  // active.
  _updateInheritedTime: function(inheritedTime) {
    this._inheritedTime = inheritedTime;
    this._updateTimeMarkers();

    // The polyfill uses a sampling model whereby time values are propagated
    // down the tree at each sample. However, for the media item, we need to use
    // play() and pause().

    // Handle the case of being outside our effect interval.
    if (this.iterationTime === null) {
      this._ensureIsAtUnscaledTime(0);
      this._ensurePaused();
      return;
    }

    if (this.iterationTime >= this._intrinsicDuration()) {
      // Our iteration time exceeds the media element's duration, so just make
      // sure the media element is at the end. It will stop automatically, but
      // that could take some time if the seek below is significant, so force
      // it.
      this._ensureIsAtUnscaledTime(this._intrinsicDuration());
      this._ensurePaused();
      return;
    }

    var finalIteration = this._floorWithOpenClosedRange(
        this.timing.iterationStart + this.timing.iterationCount, 1.0);
    var endTimeFraction = this._modulusWithOpenClosedRange(
        this.timing.iterationStart + this.timing.iterationCount, 1.0);
    if (this.currentIteration === finalIteration &&
        this._timeFraction === endTimeFraction &&
        this._intrinsicDuration() >= this.duration) {
      // We have reached the end of our final iteration, but the media element
      // is not done.
      this._ensureIsAtUnscaledTime(this.duration * endTimeFraction);
      this._ensurePaused();
      return;
    }

    // Set the appropriate playback rate.
    var playbackRate =
        this._media.defaultPlaybackRate * this._netEffectivePlaybackRate();
    if (this._media.playbackRate !== playbackRate) {
      this._media.playbackRate = playbackRate;
    }

    // Set the appropriate play/pause state. Note that we may not be able to
    // seek to the desired time. In this case, the media element's seek
    // algorithm repositions the seek to the nearest seekable time. This is OK,
    // but in this case, we don't want to play the media element, as it prevents
    // us from synchronising properly.
    if (this.getPlayer().paused ||
        !this._isSeekableUnscaledTime(this.iterationTime)) {
      this._ensurePaused();
    } else {
      this._ensurePlaying();
    }

    // Seek if required. This could be due to our Player being seeked, or video
    // slippage. We need to handle the fact that the video may not play at
    // exactly the right speed. There's also a variable delay when the video is
    // first played.
    // TODO: What's the right value for this delta?
    var delta = 0.2 * Math.abs(this._media.playbackRate);
    if (Math.abs(this.iterationTime - this._unscaledMediaCurrentTime()) >
        delta) {
      this._ensureIsAtUnscaledTime(this.iterationTime);
    }
  },
});


/** @constructor */
var AnimationEffect = function(token, operation, accumulateOperation) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
  this.operation = operation === undefined ? 'replace' : operation;
  this.accumulateOperation =
      accumulateOperation == undefined ? 'replace' : operation;
};

AnimationEffect.prototype = {
  sample: function(timeFraction, currentIteration, target) {
    throw 'Unimplemented sample function';
  },
  getValue: function(target) {
    return;
  },
  clone: function() {
    throw 'Unimplemented clone method'
  }
};

AnimationEffect.createFromProperties = function(properties) {
  // Step 1 - determine set of animation properties
  var animProps = [];
  for (var candidate in properties) {
    if (candidate == 'operation') {
      continue;
    }
    animProps.push(candidate);
  }

  // Step 2 - Create AnimationEffect objects
  if (animProps.length === 0) {
    return null;
  } else if (animProps.length === 1) {
    return AnimationEffect._createKeyframeFunction(
        animProps[0], properties[animProps[0]], properties.operation);
  } else {
    var result = new GroupedAnimationEffect();
    for (var i = 0; i < animProps.length; i++) {
      result.add(AnimationEffect._createKeyframeFunction(
          animProps[i], properties[animProps[i]], properties.operation));
    }
    return result;
  }
}

// Step 3 - Create a KeyframeAnimationEffect object
AnimationEffect._createKeyframeFunction =
    function(property, value, operation) {
  var func = new KeyframeAnimationEffect(property);

  if (typeof value === 'string') {
    func.frames.add(new Keyframe(value, 0));
    func.frames.add(new Keyframe(value, 1));
    func.operation = 'merge';
  } else if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
        var val = isDefinedAndNotNull(value[i].value) ? value[i].value : "";
        var offset = isDefinedAndNotNull(value[i].offset) ? value[i].offset : 1;
        func.frames.add(new Keyframe(val, offset));
      } else {
        var offset = i / (value.length - 1);
        func.frames.add(new Keyframe(value[i], offset));
      }
    }
  } else {
    try {
      throw new Error('TypeError');
    } catch (e) { console.log(e.stack); throw e; }
  }

  if (isDefinedAndNotNull(operation)) {
    func.operation = operation;
  }

  return func;
}

/** @constructor */
var GroupedAnimationEffect = function() {
  AnimationEffect.call(this, constructorToken);
  this.children = [];
};

GroupedAnimationEffect.prototype = createObject(AnimationEffect.prototype, {
  item: function(i) {
    return this.children[i];
  },
  add: function(func) {
    this.children.push(func);
  },
  remove: function(i) {
    this.children.splice(i, 1);
  },
  sample: function(timeFraction, currentIteration, target) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].sample(timeFraction, currentIteration, target);
    }
  },
  clone: function() {
    var result = new GroupedAnimationEffect();
    for (var i = 0; i < this.children.length; i++) {
      result.add(this.children[i].clone());
    }
  },
  get length() {
    return this.children.length;
  }
});

/** @constructor */
var PathAnimationEffect = function(path, operation, accumulateOperation) {
  AnimationEffect.call(this, constructorToken, operation, accumulateOperation);
  // TODO: path argument is not in the spec -- seems useful since
  // SVGPathSegList doesn't have a constructor.
  this._path = path;
};

PathAnimationEffect.prototype = createObject(AnimationEffect.prototype, {
  sample: function(timeFraction, currentIteration, target) {
    var length = this._path.getTotalLength();
    var point = this._path.getPointAtLength(timeFraction * length);
    var x = point.x - target.offsetWidth / 2;
    var y = point.y - target.offsetHeight / 2;
    // TODO: calc(point.x - 50%) doesn't work?
    var value = [{t: 'translate', d: [{px: x}, {px: y}]}];
    if (this.rotate) {
      // Super hacks
      var lastPoint = this._path.getPointAtLength(timeFraction *
          length - 0.01);
      var dx = point.x - lastPoint.x;
      var dy = point.y - lastPoint.y;
      var rotation = Math.atan2(dy, dx);
      value.push({t:'rotate', d: [rotation / 2 / Math.PI * 360]});
    }
    compositor.setAnimatedValue(target, "transform",
        new AnimatedResult(value, this.operation, timeFraction));
  },
  clone: function() {
    return new PathAnimationEffect(this._path.getAttribute('d'));
  },
  set segments(segments) {
    // TODO: moving the path segments is not entirely correct, but we can't
    // assign the list to the path.
    var targetSegments = this._path.pathSegList;
    targetSegments.clear();
    for (var i = 0; i < segments.numberOfItems; i++) {
      this._path.pathSegList.appendItem(segments.getItem(i));
    }
  },
  get segments() {
    return this._path.pathSegList;
  }
});

/** @constructor */
var KeyframeAnimationEffect =
    function(property, operation, accumulateOperation) {
  AnimationEffect.call(this, constructorToken, operation, accumulateOperation);
  this.property = property;
  this.frames = new KeyframeList(constructorToken);
};

KeyframeAnimationEffect.prototype = createObject(
    AnimationEffect.prototype, {
  sample: function(timeFraction, currentIteration, target) {
    var frames = this.frames._sorted();
    if (frames.length == 0) {
      return;
    }
    var afterFrameNum = null;
    var beforeFrameNum = null;
    var i = 0;
    while (i < frames.length) {
      if (frames[i].offset == timeFraction) {
        // TODO: This should probably call fromCssValue and toCssValue for
        // cases where we have to massage the data before setting e.g.
        // 'rotate(45deg)' is valid, but for UAs that don't support CSS
        // Transforms syntax on SVG content we have to convert that to
        // 'rotate(45)' before setting.
        this.ensureRawValue(frames[i]);
        compositor.setAnimatedValue(target, this.property,
            new AnimatedResult(frames[i].rawValue, this.operation,
            timeFraction));
        return;
      }
      if (frames[i].offset > timeFraction) {
        afterFrameNum = i;
        break;
      }
      i++;
    }
    if (afterFrameNum == 0) {
      // In the case where we have a negative time fraction and a keyframe at
      // offset 0, the expected behavior is to extrapolate the interval that
      // starts at 0, rather than to use the base value.
      if (frames[0].offset === 0) {
        afterFrameNum = frames.length > 1 ? 1 : frames.length;
        beforeFrameNum = 0;
      } else {
        beforeFrameNum = -1;
      }
    } else if (afterFrameNum == null) {
      // In the case where we have a time fraction greater than 1 and a
      // keyframe at 1, the expected behavior is to extrapolate the interval
      // that ends at 1, rather than to use the base value.
      if (frames[frames.length-1].offset === 1) {
        afterFrameNum = frames.length - 1;
        beforeFrameNum = frames.length > 1 ? frames.length - 2 : -1;
      } else {
        beforeFrameNum = frames.length - 1;
        afterFrameNum = frames.length;
      }
    } else {
      beforeFrameNum = afterFrameNum - 1;
    }
    if (beforeFrameNum == -1) {
      beforeFrame = {
        rawValue: zero(this.property, frames[afterFrameNum].value),
        offset: 0
      };
    } else {
      beforeFrame = frames[beforeFrameNum];
      this.ensureRawValue(beforeFrame);
    }

    if (afterFrameNum == frames.length) {
      afterFrame = {
        rawValue: zero(this.property, frames[beforeFrameNum].value),
        offset: 1
      };
    } else {
      afterFrame = frames[afterFrameNum];
      this.ensureRawValue(afterFrame);
    }
    // TODO: apply time function
    var localTimeFraction = (timeFraction - beforeFrame.offset) /
        (afterFrame.offset - beforeFrame.offset);
    // TODO: property-based interpolation for things that aren't simple
    var animationValue = interpolate(this.property, beforeFrame.rawValue,
        afterFrame.rawValue, localTimeFraction);
    compositor.setAnimatedValue(target, this.property,
        new AnimatedResult(animationValue, this.operation, timeFraction));
  },
  getValue: function(target) {
    return getValue(target, this.property);
  },
  clone: function() {
    var result = new KeyframeAnimationEffect(
        this.property, this.operation, this.accumulateOperation);
    result.frames = this.frames.clone();
    return result;
  },
  ensureRawValue: function(frame) {
    if (isDefinedAndNotNull(frame.rawValue)) {
      return;
    }
    frame.rawValue = fromCssValue(this.property, frame.value);
  },
  toString: function() {
    return this.property;
  }
});

/** @constructor */
var Keyframe = function(value, offset, timingFunction) {
  this.value = value;
  this.rawValue = null;
  this.offset = offset;
  this.timingFunction = timingFunction;
};

/** @constructor */
var KeyframeList = function(token) {
  if (token !== constructorToken) {
    throw new TypeError('Illegal constructor');
  }
  this.frames = [];
  this._isSorted = true;
};

KeyframeList.prototype = {
  _sorted: function() {
    if (!this._isSorted) {
      this.frames.sort(function(a, b) {
        if (a.offset < b.offset) {
          return -1;
        }
        if (a.offset > b.offset) {
          return 1;
        }
        return 0;
      });
      this._isSorted = true;
    }
    return this.frames;
  },
  item: function(index) {
    if (index >= this.length || index < 0) {
      return null;
    }
    return this.frames[index];
  },
  add: function(frame) {
    this.frames.push(frame);
    this._isSorted = false;
    return frame;
  },
  remove: function(frame) {
    var index = this.frames.indexOf(frame);
    if (index == -1) {
      return undefined;
    }
    this.frames.splice(index, 1);
    return frame;
  },
  clone: function() {
    var result = new KeyframeList(constructorToken);
    for (var i = 0; i < this.frames.length; i++) {
      result.add(new Keyframe(this.frames[i].value, this.frames[i].offset,
          this.frames[i].timingFunction));
    }
    return result;
  },
  get length() {
    return this.frames.length;
  }
};

var presetTimings = {
  'ease': [0.25, 0.1, 0.25, 1.0],
  'linear': [0.0, 0.0, 1.0, 1.0],
  'ease-in': [0.42, 0, 1.0, 1.0],
  'ease-out': [0, 0, 0.58, 1.0],
  'ease-in-out': [0.42, 0, 0.58, 1.0]
};

/** @constructor */
var TimingFunction = function() {
  throw new TypeError('Illegal constructor');
};

TimingFunction.createFromString = function(spec) {
  var preset = presetTimings[spec];
  if (preset) {
    return new SplineTimingFunction(presetTimings[spec]);
  }
  var stepMatch = /steps\(\s*(\d+)\s*,\s*(start|end|middle)\s*\)/.exec(spec);
  if (stepMatch) {
    return new StepTimingFunction(Number(stepMatch[1]), stepMatch[2]);
  }
  var bezierMatch =
      /cubic-bezier\(([^,]*),([^,]*),([^,]*),([^)]*)\)/.exec(spec);
  if (bezierMatch) {
    return new SplineTimingFunction([
        Number(bezierMatch[1]),
        Number(bezierMatch[2]),
        Number(bezierMatch[3]),
        Number(bezierMatch[4])]);
  }
  throw 'not a timing function: ' + spec;
};

/** @constructor */
var SplineTimingFunction = function(spec) {
  this.params = spec;
  this.map = []
  for (var ii = 0; ii <= 100; ii += 1) {
    var i = ii / 100;
    this.map.push([
      3*i*(1-i)*(1-i)*this.params[0] + 3*i*i*(1-i)*this.params[2] + i*i*i,
      3*i*(1-i)*(1-i)*this.params[1] + 3*i*i*(1-i)*this.params[3] + i*i*i
    ]);
  }
};

SplineTimingFunction.prototype = createObject(TimingFunction.prototype, {
  scaleTime: function(fraction) {
    var fst = 0;
    while (fst != 100 && fraction > this.map[fst][0]) {
      fst += 1;
    }
    if (fraction == this.map[fst][0] || fst == 0) {
      return this.map[fst][1];
    }
    var yDiff = this.map[fst][1] - this.map[fst - 1][1];
    var xDiff = this.map[fst][0] - this.map[fst - 1][0];
    var p = (fraction - this.map[fst - 1][0]) / xDiff;
    return this.map[fst - 1][1] + p * yDiff;
  },
  clone: function() {
    return new SplineTimingFunction(this.params);
  }
});

/** @constructor */
var StepTimingFunction = function(numSteps, position) {
  this.numSteps = numSteps;
  this.position = position || 'end';
};

StepTimingFunction.prototype = createObject(TimingFunction.prototype, {
  scaleTime: function(fraction) {
    if (fraction >= 1)
      return 1;
    var stepSize = 1 / this.numSteps;
    if (this.position == 'start') {
      fraction += stepSize;
    } else if (this.position == 'middle') {
      fraction += stepSize / 2;
    }
    return fraction - fraction % stepSize;
  },
  clone: function() {
    return new StepTimingFunction(this.numSteps, this.position);
  }
});

var interp = function(from, to, f, type) {
  if (Array.isArray(from) || Array.isArray(to)) {
    return interpArray(from, to, f, type);
  }
  var zero = type == 'scale' ? 1.0 : 0.0;
  to   = isDefinedAndNotNull(to) ? to : zero;
  from = isDefinedAndNotNull(from) ? from : zero;

  return to * f + from * (1 - f);
};

var interpArray = function(from, to, f, type) {
  console.assert(Array.isArray(from) || from === null,
      'From is not an array or null');
  console.assert(Array.isArray(to) || to === null,
      'To is not an array or null');
  console.assert(from === null || to === null || from.length === to.length,
      'Arrays differ in length ' + from + " : " + to);
  var length = from ? from.length : to.length;

  var result = [];
  for (var i = 0; i < length; i++) {
    result[i] = interp(from ? from[i] : null, to ? to[i] : null, f, type);
  }
  return result;
};

var numberType = {
  zero: function() { return 0; },
  add: function(base, delta) { return base + delta; },
  interpolate: interp,
  toCssValue: function(value) { return value + ''; },
  fromCssValue: function(value) { return value !== '' ? Number(value): null; }
};

var integerType = createObject(numberType, {
  interpolate: function(from, to, f) { return Math.floor(interp(from, to, f)); }
});

var fontWeightType = {
  zero: function() { return 0; },
  add: function(base, delta) { return base + delta; },
  interpolate: function(from, to, f) {
    return interp(from, to, f);
  },
  toCssValue: function(value) {
      value = Math.round(value / 100) * 100
      value = Math.min(900, Math.max(100, value));
      return String(value);
  },
  fromCssValue: function(value) {
    if (value == 'normal') {
      return 400;
    }
    if (value == 'bold') {
      return 700;
    }
    // TODO: support lighter / darker ?
    return Number(value);
  }
};

// This regular expression is intentionally permissive, so that
// platform-prefixed versions of calc will still be accepted as
// input. While we are restrictive with the transform property
// name, we need to be able to read underlying calc values from
// computedStyle so can't easily restrict the input here.
var outerCalcRE = /calc\s*\(\s*([^)]*)\)/;
var valueRE = /\s*([0-9.]*)([a-zA-Z%]*)/;
var operatorRE = /\s*([+-])/;
var percentLengthType = {
  zero: function() { return {}; },
  add: function(base, delta) {
    var out = {};
    for (value in base) {
      out[value] = base[value] + (delta[value] || 0);
    }
    for (value in delta) {
      if (value in base) {
        continue;
      }
      out[value] = delta[value];
    }
    return out;
  },
  interpolate: function(from, to, f) {
    var out = {};
    for (var value in from) {
      out[value] = interp(from[value], to[value], f);
    }
    for (var value in to) {
      if (value in out) {
        continue;
      }
      out[value] = interp(0, to[value], f);
    }
    return out;
  },
  toCssValue: function(value) {
    var s = '';
    var single_value = true;
    for (var item in value) {
      if (s === '') {
        s = value[item] + item;
      } else if (single_value) {
        s = features.calcFunction + '(' + s + ' + ' + value[item] + item + ')';
        single_value = false;
      } else {
        s = s.substring(0, s.length - 1) + ' + ' + value[item] + item + ')';
      }
    }
    return s;
  },
  fromCssValue: function(value) {
    var out = {}
    var innards = outerCalcRE.exec(value);
    if (!innards) {
      var singleValue = valueRE.exec(value);
      if (singleValue && (singleValue.length == 3)) {
        out[singleValue[2]] = Number(singleValue[1]);
        return out;
      }
      return {};
    }
    innards = innards[1];
    var first_time = true;
    while (true) {
      var reversed = false;
      if (first_time) {
        first_time = false;
      } else {
        var op = operatorRE.exec(innards);
        if (!op) {
          return {};
        }
        if (op[1] == '-') {
          reversed = true;
        }
        innards = innards.substring(op[0].length);
      }
      value = valueRE.exec(innards);
      if (!value) {
        return {};
      }
      if (!isDefinedAndNotNull(out[value[2]])) {
        out[value[2]] = 0;
      }
      if (reversed) {
        out[value[2]] -= Number(value[1]);
      } else {
        out[value[2]] += Number(value[1]);
      }
      innards = innards.substring(value[0].length);
      if (/\s*/.exec(innards)[0].length == innards.length) {
        return out;
      }
    }
  }
};

var rectangleRE = /rect\(([^,]+),([^,]+),([^,]+),([^)]+)\)/;
var rectangleType = {
  zero: function() {
    return {
      top: percentLengthType.zero(),
      right: percentLengthType.zero(),
      bottom: percentLengthType.zero(),
      left: percentLengthType.zero()
    };
  },
  add: function(base, delta) {
    return {
      top: percentLengthType.add(base.top, delta.top),
      right: percentLengthType.add(base.right, delta.right),
      bottom: percentLengthType.add(base.bottom, delta.bottom),
      left: percentLengthType.add(base.left, delta.left)
    };
  },
  interpolate: function(from, to, f) {
    return {
      top: percentLengthType.interpolate(from.top, to.top, f),
      right: percentLengthType.interpolate(from.right, to.right, f),
      bottom: percentLengthType.interpolate(from.bottom, to.bottom, f),
      left: percentLengthType.interpolate(from.left, to.left, f)
    };
  },
  toCssValue: function(value) {
    return 'rect(' +
        percentLengthType.toCssValue(value.top) + ',' +
        percentLengthType.toCssValue(value.right) + ',' +
        percentLengthType.toCssValue(value.bottom) + ',' +
        percentLengthType.toCssValue(value.left) + ')';
  },
  fromCssValue: function(value) {
    var match = rectangleRE.exec(value);
    return {
      top: percentLengthType.fromCssValue(match[1]),
      right: percentLengthType.fromCssValue(match[2]),
      bottom: percentLengthType.fromCssValue(match[3]),
      left: percentLengthType.fromCssValue(match[4])
    };
  }
};

var shadowType = {
  zero: function() {
      return [];
  },
  _addSingle: function(base, delta) {
    if (base && delta && base.inset != delta.inset) {
      return delta;
    }
    var result = {
      inset: base ? base.inset : delta.inset,
      hOffset: lengthType.add(
          base ? base.hOffset : lengthType.zero(),
          delta ? delta.hOffset : lengthType.zero()),
      vOffset: lengthType.add(
          base ? base.vOffset : lengthType.zero(),
          delta ? delta.vOffset : lengthType.zero()),
      blur: lengthType.add(
          base && base.blur || lengthType.zero(),
          delta && delta.blur || lengthType.zero()),
    };
    if (base && base.spread || delta && delta.spread) {
      result.spread = lengthType.add(
          base && base.spread || lengthType.zero(),
          delta && delta.spread || lengthType.zero());
    }
    if (base && base.color || delta && delta.color) {
      result.color = colorType.add(
          base && base.color || colorType.zero(),
          delta && delta.color || colorType.zero());
    }
    return result;
  },
  add: function(base, delta) {
    var result = [];
    for (var i = 0; i < base.length || i < delta.length; i++) {
      result.push(this._addSingle(base[i], delta[i]));
    }
    return result;
  },
  _interpolateSingle: function(from, to, f) {
    if (from && to && from.inset != to.inset) {
      return f < 0.5 ? from : to;
    }
    var result = {
      inset: from ? from.inset : to.inset,
      hOffset: lengthType.interpolate(
          from ? from.hOffset : lengthType.zero(),
          to ? to.hOffset : lengthType.zero(), f),
      vOffset: lengthType.interpolate(
          from ? from.vOffset : lengthType.zero(),
          to ? to.vOffset : lengthType.zero(), f),
      blur: lengthType.interpolate(
          from && from.blur || lengthType.zero(),
          to && to.blur || lengthType.zero(), f),
    };
    if (from && from.spread || to && to.spread) {
      result.spread = lengthType.interpolate(
          from && from.spread || lengthType.zero(),
          to && to.spread || lengthType.zero(), f);
    }
    if (from && from.color || to && to.color) {
      result.color = colorType.interpolate(
          from && from.color || colorType.zero(),
          to && to.color || colorType.zero(), f);
    }
    return result;
  },
  interpolate: function(from, to, f) {
    var result = [];
    for (var i = 0; i < from.length || i < to.length; i++) {
      result.push(this._interpolateSingle(from[i], to[i], f));
    }
    return result;
  },
  _toCssValueSingle: function(value) {
    return (value.inset ? 'inset ' : '') +
        lengthType.toCssValue(value.hOffset) + ' ' +
        lengthType.toCssValue(value.vOffset) + ' ' +
        lengthType.toCssValue(value.blur) +
        (value.spread ? ' ' + lengthType.toCssValue(value.spread) : '') +
        (value.color ? ' ' + colorType.toCssValue(value.color) : '');
  },
  toCssValue: function(value) {
    return value.map(this._toCssValueSingle).join(', ');
  },
  fromCssValue: function(value) {
    var shadows = value.split(/\s*,\s*/);
    var result = shadows.map(function(value) {
      value = value.replace(/^\s+|\s+$/g, '');
      var parts = value.split(/\s+/);
      if (parts.length < 2 || parts.length > 6) {
        return undefined;
      }
      var result = {
        inset: false
      };
      if (parts[0] == 'inset') {
        parts.shift();
        result.inset = true;
      }
      var color;
      var lengths = [];
      while (parts.length) {
        var part = parts.shift();
        // TODO: what's the contract for fromCssValue, assuming it returns
        // undefined if it cannot parse the value (colorType behaves this way)
        color = colorType.fromCssValue(part);
        if (color) {
          result.color = color;
          if (parts.length) {
            return undefined;
          }
          break;
        }
        var length = lengthType.fromCssValue(part);
        lengths.push(length);
      }
      if (lengths.length < 2 || lengths.length > 4) {
        return undefined;
      }
      result.hOffset = lengths[0];
      result.vOffset = lengths[1];
      if (lengths.length > 2) {
        result.blur = lengths[2];
      }
      if (lengths.length > 3) {
        result.spread = lengths[3];
      }
      if (color) {
        result.color = color;
      }
      return result;
    });
    return result.every(isDefined) ? result : [];
  }
};

var nonNumericType = {
  zero: function() {
    return undefined;
  },
  add: function(base, delta) {
    return isDefined(delta) ? delta : base;
  },
  interpolate: function(from, to, f) {
    return f < 0.5 ? from : to;
  },
  toCssValue: function(value) {
    return value;
  },
  fromCssValue: function(value) {
    return value;
  }
};

var visibilityType = createObject(nonNumericType, {
  interpolate: function(from, to, f) {
    if (from != 'visible' && to != 'visible') {
      return nonNumericType.interpolate(from, to, f);
    }
    if (f <= 0) {
      return from;
    }
    if (f >= 1) {
      return to;
    }
    return 'visible';
  },
});

var lengthType = percentLengthType;

var rgbRE = /^\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
var rgbaRE =
    /^\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)/;

var namedColors = {
  aliceblue: [240, 248, 255, 1], antiquewhite: [250, 235, 215, 1],
  aqua: [0, 255, 255, 1], aquamarine: [127, 255, 212, 1],
  azure: [240, 255, 255, 1], beige: [245, 245, 220, 1],
  bisque: [255, 228, 196, 1], black: [0, 0, 0, 1],
  blanchedalmond: [255, 235, 205, 1], blue: [0, 0, 255, 1],
  blueviolet: [138, 43, 226, 1], brown: [165, 42, 42, 1],
  burlywood: [222, 184, 135, 1], cadetblue: [95, 158, 160, 1],
  chartreuse: [127, 255, 0, 1], chocolate: [210, 105, 30, 1],
  coral: [255, 127, 80, 1], cornflowerblue: [100, 149, 237, 1],
  cornsilk: [255, 248, 220, 1], crimson: [220, 20, 60, 1],
  cyan: [0, 255, 255, 1], darkblue: [0, 0, 139, 1],
  darkcyan: [0, 139, 139, 1], darkgoldenrod: [184, 134, 11, 1],
  darkgray: [169, 169, 169, 1], darkgreen: [0, 100, 0, 1],
  darkgrey: [169, 169, 169, 1], darkkhaki: [189, 183, 107, 1],
  darkmagenta: [139, 0, 139, 1], darkolivegreen: [85, 107, 47, 1],
  darkorange: [255, 140, 0, 1], darkorchid: [153, 50, 204, 1],
  darkred: [139, 0, 0, 1], darksalmon: [233, 150, 122, 1],
  darkseagreen: [143, 188, 143, 1], darkslateblue: [72, 61, 139, 1],
  darkslategray: [47, 79, 79, 1], darkslategrey: [47, 79, 79, 1],
  darkturquoise: [0, 206, 209, 1], darkviolet: [148, 0, 211, 1],
  deeppink: [255, 20, 147, 1], deepskyblue: [0, 191, 255, 1],
  dimgray: [105, 105, 105, 1], dimgrey: [105, 105, 105, 1],
  dodgerblue: [30, 144, 255, 1], firebrick: [178, 34, 34, 1],
  floralwhite: [255, 250, 240, 1], forestgreen: [34, 139, 34, 1],
  fuchsia: [255, 0, 255, 1], gainsboro: [220, 220, 220, 1],
  ghostwhite: [248, 248, 255, 1], gold: [255, 215, 0, 1],
  goldenrod: [218, 165, 32, 1], gray: [128, 128, 128, 1],
  green: [0, 128, 0, 1], greenyellow: [173, 255, 47, 1],
  grey: [128, 128, 128, 1], honeydew: [240, 255, 240, 1],
  hotpink: [255, 105, 180, 1], indianred: [205, 92, 92, 1],
  indigo: [75, 0, 130, 1], ivory: [255, 255, 240, 1],
  khaki: [240, 230, 140, 1], lavender: [230, 230, 250, 1],
  lavenderblush: [255, 240, 245, 1], lawngreen: [124, 252, 0, 1],
  lemonchiffon: [255, 250, 205, 1], lightblue: [173, 216, 230, 1],
  lightcoral: [240, 128, 128, 1], lightcyan: [224, 255, 255, 1],
  lightgoldenrodyellow: [250, 250, 210, 1], lightgray: [211, 211, 211, 1],
  lightgreen: [144, 238, 144, 1], lightgrey: [211, 211, 211, 1],
  lightpink: [255, 182, 193, 1], lightsalmon: [255, 160, 122, 1],
  lightseagreen: [32, 178, 170, 1], lightskyblue: [135, 206, 250, 1],
  lightslategray: [119, 136, 153, 1], lightslategrey: [119, 136, 153, 1],
  lightsteelblue: [176, 196, 222, 1], lightyellow: [255, 255, 224, 1],
  lime: [0, 255, 0, 1], limegreen: [50, 205, 50, 1],
  linen: [250, 240, 230, 1], magenta: [255, 0, 255, 1],
  maroon: [128, 0, 0, 1], mediumaquamarine: [102, 205, 170, 1],
  mediumblue: [0, 0, 205, 1], mediumorchid: [186, 85, 211, 1],
  mediumpurple: [147, 112, 219, 1], mediumseagreen: [60, 179, 113, 1],
  mediumslateblue: [123, 104, 238, 1], mediumspringgreen: [0, 250, 154, 1],
  mediumturquoise: [72, 209, 204, 1], mediumvioletred: [199, 21, 133, 1],
  midnightblue: [25, 25, 112, 1], mintcream: [245, 255, 250, 1],
  mistyrose: [255, 228, 225, 1], moccasin: [255, 228, 181, 1],
  navajowhite: [255, 222, 173, 1], navy: [0, 0, 128, 1],
  oldlace: [253, 245, 230, 1], olive: [128, 128, 0, 1],
  olivedrab: [107, 142, 35, 1], orange: [255, 165, 0, 1],
  orangered: [255, 69, 0, 1], orchid: [218, 112, 214, 1],
  palegoldenrod: [238, 232, 170, 1], palegreen: [152, 251, 152, 1],
  paleturquoise: [175, 238, 238, 1], palevioletred: [219, 112, 147, 1],
  papayawhip: [255, 239, 213, 1], peachpuff: [255, 218, 185, 1],
  peru: [205, 133, 63, 1], pink: [255, 192, 203, 1],
  plum: [221, 160, 221, 1], powderblue: [176, 224, 230, 1],
  purple: [128, 0, 128, 1], red: [255, 0, 0, 1],
  rosybrown: [188, 143, 143, 1], royalblue: [65, 105, 225, 1],
  saddlebrown: [139, 69, 19, 1], salmon: [250, 128, 114, 1],
  sandybrown: [244, 164, 96, 1], seagreen: [46, 139, 87, 1],
  seashell: [255, 245, 238, 1], sienna: [160, 82, 45, 1],
  silver: [192, 192, 192, 1], skyblue: [135, 206, 235, 1],
  slateblue: [106, 90, 205, 1], slategray: [112, 128, 144, 1],
  slategrey: [112, 128, 144, 1], snow: [255, 250, 250, 1],
  springgreen: [0, 255, 127, 1], steelblue: [70, 130, 180, 1],
  tan: [210, 180, 140, 1], teal: [0, 128, 128, 1],
  thistle: [216, 191, 216, 1], tomato: [255, 99, 71, 1],
  turquoise: [64, 224, 208, 1], violet: [238, 130, 238, 1],
  wheat: [245, 222, 179, 1], white: [255, 255, 255, 1],
  whitesmoke: [245, 245, 245, 1], yellow: [255, 255, 0, 1],
  yellowgreen: [154, 205, 50, 1]
};

var colorType = {
  zero: function() { return [0,0,0,0]; },
  add: function(base, delta) {
    return [base[0] + delta[0], base[1] + delta[1],
            base[2] + delta[2], base[3] + delta[3]];
  },
  interpolate: function(from, to, f) {
    return [interp(from[0], to[0], f), interp(from[1], to[1], f),
            interp(from[2], to[2], f), interp(from[3], to[3], f)];
  },
  toCssValue: function(value) {
    return 'rgba(' + Math.round(value[0]) + ', ' + Math.round(value[1]) +
              ', ' + Math.round(value[2]) + ', ' + value[3] + ')';
  },
  fromCssValue: function(value) {
    var r = rgbRE.exec(value);
    if (r) {
      return [Number(r[1]), Number(r[2]), Number(r[3]), 1];
    }
    r = rgbaRE.exec(value);
    if (r) {
      return [Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4])];
    }
    return namedColors[value];
  }
};

var convertToDeg = function(num, type) {
  switch (type) {
  case 'grad':
    return num / 400 * 360;
  case 'rad':
    return num / 2 / Math.PI * 360;
  case 'turn':
    return num * 360;
  default:
    return num;
  }
};

var extractValue = function(values, pos, hasUnits) {
  var value = Number(values[pos]);
  if (!hasUnits) {
    return value;
  }
  var type = values[pos + 1];
  if (type == '') { type = 'px'; }
  var result = {};
  result[type] = value;
  return result;
}

var extractValues = function(values, numValues, hasOptionalValue, 
    hasUnits) {
  var result = [];
  for (var i = 0; i < numValues; i++) {
    result.push(extractValue(values, 1 + 2 * i, hasUnits));
  }
  if (hasOptionalValue && values[1 + 2 * numValues]) {
    result.push(extractValue(values, 1 + 2 * numValues, hasUnits));
  }
  return result;
};

var SPACES = '\\s*';
var NUMBER = '[+-]?(?:\\d+|\\d*\\.\\d+)';
var RAW_OPEN_BRACKET = '\\(';
var RAW_CLOSE_BRACKET = '\\)';
var RAW_COMMA = ',';
var UNIT = '[a-zA-Z%]*';
var START = '^';

function capture(x) { return '(' + x + ')'; }
function optional(x) { return '(?:' + x + ')?'; }

var OPEN_BRACKET = [SPACES, RAW_OPEN_BRACKET, SPACES].join("");
var CLOSE_BRACKET = [SPACES, RAW_CLOSE_BRACKET, SPACES].join("");
var COMMA = [SPACES, RAW_COMMA, SPACES].join("");
var UNIT_NUMBER = [capture(NUMBER), capture(UNIT)].join("");

function transformRE(name, numParms, hasOptionalParm) {
  var tokenList = [START, SPACES, name, OPEN_BRACKET];
  for (var i = 0; i < numParms - 1; i++) {
    tokenList.push(UNIT_NUMBER);
    tokenList.push(COMMA);
  }
  tokenList.push(UNIT_NUMBER);
  if (hasOptionalParm) {
    tokenList.push(optional([COMMA, UNIT_NUMBER].join("")));
  }
  tokenList.push(CLOSE_BRACKET);
  return new RegExp(tokenList.join("")); 
}

function buildMatcher(name, numValues, hasOptionalValue, hasUnits,
    baseValue) {
  var baseName = name;
  if (baseValue) {
    if (name[name.length - 1] == 'X' || name[name.length - 1] == 'Y') {
      baseName = name.substring(0, name.length - 1);
    } else if (name[name.length - 1] == 'Z') {
      baseName = name.substring(0, name.length - 1) + "3d";
    }
  }
  
  return [transformRE(name, numValues, hasOptionalValue),
      function(x) { 
        var r = extractValues(x, numValues, hasOptionalValue, hasUnits);
        if (baseValue !== undefined) {
          if (name[name.length - 1] == 'X') {
            r.push(baseValue);
          } else if (name[name.length - 1] == 'Y') {
            r = [baseValue].concat(r);
          } else if (name[name.length - 1] == 'Z') {
            r = [baseValue, baseValue].concat(r);
          } else if (hasOptionalValue) {
            while (r.length < 2) {
              if (baseValue == "copy") {
                r.push(r[0]);
              } else {
                r.push(baseValue);
              }
            }
          }
        }
        return r;
      },
      baseName];
}

function buildRotationMatcher(name, numValues, hasOptionalValue, 
    baseValue) {
  var m = buildMatcher(name, numValues, hasOptionalValue, true, baseValue);
  return [m[0], 
      function(x) {
        var r = m[1](x);
        return r.map(function(v) {
          result = 0;
          for (type in v) {
            result += convertToDeg(v[type], type);
          }
          return result;
        });
      },
      m[2]];
}

function build3DRotationMatcher() {
  var m = buildMatcher('rotate3d', 4, false, true);
  return [m[0],
    function(x) {
      var r = m[1](x);
      var out = [];
      for (var i = 0; i < 3; i++) {
        out.push(r[i].px);
      }
      out.push(r[3]);
      return out;
    },
    m[2]];
}

var transformREs = [
  buildRotationMatcher('rotate', 1, false),
  buildRotationMatcher('rotateX', 1, false),
  buildRotationMatcher('rotateY', 1, false),
  buildRotationMatcher('rotateZ', 1, false),
  build3DRotationMatcher(),
  buildRotationMatcher('skew', 1, true, 0),
  buildRotationMatcher('skewX', 1, false),
  buildRotationMatcher('skewY', 1, false),
  buildMatcher('translateX', 1, false, true, {px: 0}),
  buildMatcher('translateY', 1, false, true, {px: 0}),
  buildMatcher('translateZ', 1, false, true, {px: 0}),
  buildMatcher('translate', 1, true, true, {px: 0}),
  buildMatcher('translate3d', 3, false, true),
  buildMatcher('scale', 1, true, false, "copy"),
  buildMatcher('scaleX', 1, false, false, 1),
  buildMatcher('scaleY', 1, false, false, 1),
  buildMatcher('scaleZ', 1, false, false, 1),
  buildMatcher('scale3d', 3, false, false),
  buildMatcher('perspective', 1, false, true),
  buildMatcher('matrix', 6, false, false)
];

var decomposeMatrix = function() {
  // this is only ever used on the perspective matrix, which has 0, 0, 0, 1 as
  // last column
  function determinant(m) {
    return m[0][0] * m[1][1] * m[2][2] + 
           m[1][0] * m[2][1] * m[0][2] +
           m[2][0] * m[0][1] * m[1][2] -
           m[0][2] * m[1][1] * m[2][0] -
           m[1][2] * m[2][1] * m[0][0] -
           m[2][2] * m[0][1] * m[1][0];
  }

  // this is only ever used on the perspective matrix, which has 0, 0, 0, 1 as
  // last column
  //
  // from Wikipedia:
  //
  // [A B]^-1 = [A^-1 + A^-1B(D - CA^-1B)^-1CA^-1     -A^-1B(D - CA^-1B)^-1]
  // [C D]      [-(D - CA^-1B)^-1CA^-1                (D - CA^-1B)^-1      ]
  //
  // Therefore
  //
  // [A [0]]^-1 = [A^-1       [0]]
  // [C  1 ]      [ -CA^-1     1 ]
  function inverse(m) {
    var iDet = 1 / determinant(m);
    var a = m[0][0], b = m[0][1], c = m[0][2];
    var d = m[1][0], e = m[1][1], f = m[1][2];
    var g = m[2][0], h = m[2][1], k = m[2][2];
    var Ainv = [[(e*k - f*h) * iDet, (c*h - b*k) * iDet, (b*f - c*e) * iDet, 0],
                [(f*g - d*k) * iDet, (a*k - c*g) * iDet, (c*d - a*f) * iDet, 0],
                [(d*h - e*g) * iDet, (g*b - a*h) * iDet, (a*e - b*d) * iDet, 0]
               ];
    var lastRow = []
    for (var i = 0; i < 3; i++) {
      var val = 0;
      for (var j = 0; j < 3; j++) {
        val += m[3][j] * Ainv[j][i];
      }
      lastRow.push(val);
    }
    lastRow.push(1);
    Ainv.push(lastRow);
    return Ainv;
  }

  function transposeMatrix4(m) {
    return [[m[0][0], m[1][0], m[2][0], m[3][0]],
            [m[0][1], m[1][1], m[2][1], m[3][1]],
            [m[0][2], m[1][2], m[2][2], m[3][2]],
            [m[0][3], m[1][3], m[2][3], m[3][3]]];
  }

  function multVecMatrix(v, m) {
    var result = [];
    for (var i = 0; i < 4; i++) {
      var val = 0;
      for (var j = 0; j < 4; j++) {
        val += v[j] * m[j][i];
      }
      result.push(val);
    }
    return result;
  }

  function normalize(v) {
    var len = length(v);
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function length(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }

  function combine(v1, v2, v1s, v2s) {
    return [v1s * v1[0] + v2s * v2[0], v1s * v1[1] + v2s * v2[1], 
            v1s * v1[2] + v2s * v2[2]];
  }

  function cross(v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]];
  }

  function decomposeMatrix(matrix) {
    var m3d = [[matrix[0], matrix[1], 0, 0],
               [matrix[2], matrix[3], 0, 0],
               [0,         0,         1, 0],
               [matrix[4], matrix[5], 0, 1]];

    // skip normalization step as m3d[3][3] should always be 1
    if (m3d[3][3] != 1) {
      throw 'attempt to decompose non-normalized matrix';
    }

    var perspectiveMatrix = m3d.concat(); // copy m3d
    for (var i = 0; i < 3; i++)
      perspectiveMatrix[i][3] = 0;

    if (determinant(perspectiveMatrix) == 0)
      return false;

    var rhs = [];

    if (m3d[0][3] != 0 || m3d[1][3] != 0 || m3d[2][3] != 0) {
      rhs.push(m3d[0][3]);
      rhs.push(m3d[1][3]);
      rhs.push(m3d[2][3]);
      rhs.push(m3d[3][3]);

      var inversePerspectiveMatrix = inverse(perspectiveMatrix);
      var transposedInversePerspectiveMatrix =
          transposeMatrix4(inversePerspectiveMatrix);
      var perspective = multVecMatrix(rhs, transposedInversePerspectiveMatrix);
    } else {
      var perspective = [0, 0, 0, 1];
    }

    var translate = m3d[3].slice(0, 3);

    var row = [];
    row.push(m3d[0].slice(0, 3));
    var scale = [];
    scale.push(length(row[0]));
    row[0] = normalize(row[0]);

    var skew = [];
    row.push(m3d[1].slice(0, 3));
    skew.push(dot(row[0], row[1]));
    row[1] = combine(row[1], row[0], 1.0, -skew[0]);

    scale.push(length(row[1]));
    row[1] = normalize(row[1]);
    skew[0] /= scale[1];

    row.push(m3d[2].slice(0, 3));
    skew.push(dot(row[0], row[2]));
    row[2] = combine(row[2], row[0], 1.0, -skew[1]);
    skew.push(dot(row[1], row[2]));
    row[2] = combine(row[2], row[1], 1.0, -skew[2]);

    scale.push(length(row[2]));
    row[2] = normalize(row[2]);
    skew[1] /= scale[2];
    skew[2] /= scale[2];

    var pdum3 = cross(row[1], row[2]);
    if (dot(row[0], pdum3) < 0) {
      for (var i = 0; i < 3; i++) {
        scale[0] *= -1;
        row[i][0] *= -1;
        row[i][1] *= -1;
        row[i][2] *= -1;
      }
    } 
    
    var quaternion = [
      0.5 * Math.sqrt(Math.max(1 + row[0][0] - row[1][1] - row[2][2], 0)),
      0.5 * Math.sqrt(Math.max(1 - row[0][0] + row[1][1] - row[2][2], 0)),
      0.5 * Math.sqrt(Math.max(1 - row[0][0] - row[1][1] + row[2][2], 0)),
      0.5 * Math.sqrt(Math.max(1 + row[0][0] + row[1][1] + row[2][2], 0))
    ];

    if (row[2][1] > row[1][2])
      quaternion[0] = -quaternion[0];
    if (row[0][2] > row[2][0])
      quaternion[1] = -quaternion[1];
    if (row[1][0] > row[0][1])
      quaternion[2] = -quaternion[2];

    return {translate: translate, scale: scale, skew: skew, 
            quaternion: quaternion, perspective: perspective};
  }
  return decomposeMatrix;
}();

function dot(v1, v2) {
  var result = 0;
  for (var i = 0; i < v1.length; i++) {
    result += v1[i] * v2[i];
  }
  return result;
}

function multiplyMatrices(a, b) {
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
          a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
          a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}

function convertItemToMatrix(item) {
  switch(item.t) {
    case 'rotate':
      var amount = item.d * Math.PI / 180;
      return [Math.cos(amount), Math.sin(amount), 
              -Math.sin(amount), Math.cos(amount), 0, 0];
    case 'scale':
      return [item.d[0], 0, 0, item.d[1], 0, 0];
    // TODO: Work out what to do with non-px values.
    case 'translate':
      return [1, 0, 0, 1, item.d[0].px, item.d[1].px];
    case 'matrix':
      return item.d;
  }
}

function convertToMatrix(transformList) {
  return transformList.map(convertItemToMatrix).reduce(multiplyMatrices);
}

var composeMatrix = function() {
  function multiply(a, b) {
    var result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        for (var k = 0; k < 4; k++) {
          result[i][j] += b[i][k] * a[k][j];
        }
      }
    }
    return result;
  }

  function composeMatrix(translate, scale, skew, quat, perspective) {
    var matrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

    for (var i = 0; i < 4; i++) {
      matrix[i][3] = perspective[i];
    }

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        matrix[3][i] += translate[j] * matrix[j][i];
      }
    }

    var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
    
    var rotMatrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

    rotMatrix[0][0] = 1 - 2 * (y * y + z * z);
    rotMatrix[0][1] = 2 * (x * y - z * w);
    rotMatrix[0][2] = 2 * (x * z + y * w);
    rotMatrix[1][0] = 2 * (x * y + z * w);
    rotMatrix[1][1] = 1 - 2 * (x * x + z * z);
    rotMatrix[1][2] = 2 * (y * z - x * w);
    rotMatrix[2][0] = 2 * (x * z - y * w);
    rotMatrix[2][1] = 2 * (y * z + x * w);
    rotMatrix[2][2] = 1 - 2 * (x * x + y * y);

    matrix = multiply(matrix, rotMatrix);

    var temp = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    if (skew[2]) {
      temp[2][1] = skew[2];
      matrix = multiply(matrix, temp);
    }

    if (skew[1]) {
      temp[2][1] = 0;
      temp[2][0] = skew[0];
      matrix = multiply(matrix, temp);
    }

    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        matrix[i][j] *= scale[i];
      }
    }

    return {t: 'matrix', d: [matrix[0][0], matrix[0][1],
                             matrix[1][0], matrix[1][1],
                             matrix[3][0], matrix[3][1]]};
  }
  return composeMatrix;
}();

function interpolateTransformsWithMatrices(from, to, f) {
  var fromM = decomposeMatrix(convertToMatrix(from));
  var toM = decomposeMatrix(convertToMatrix(to));

  var product = dot(fromM.quaternion, toM.quaternion);
  product = Math.max(Math.min(product, 1.0), -1.0);
  if (product == 1.0) {
    var quat = fromM.quaternion;
  } else {
    var theta = Math.acos(product);
    var w = Math.sin(f * theta) * 1 / Math.sqrt(1 - product * product);

    var quat = [];
    for (var i = 0; i < 4; i++) {
      quat.push(fromM.quaternion[i] * (Math.cos(f * theta) - product * w) +
                toM.quaternion[i] * w);
    }
  }

  var translate = interp(fromM.translate, toM.translate, f);
  var scale = interp(fromM.scale, toM.scale, f);
  var skew = interp(fromM.skew, toM.skew, f);
  var perspective = interp(fromM.perspective, toM.perspective, f);

  return composeMatrix(translate, scale, skew, quat, perspective);
}

function interpTransformValue(from, to, f) {
  var type = from.t ? from.t : to.t;
  switch(type) {
    case 'rotate':
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'scale':
    case 'scaleX':
    case 'scaleY':
    case 'scaleZ':
    case 'scale3d':
    case 'skew':
    case 'skewX':
    case 'skewY':
      return {t: type, d:interp(from.d, to.d, f, type)};
      break;
    default:
      var result = [];
      if (from.d && to.d) {
        var maxVal = Math.max(from.d.length, to.d.length);
      } else if (from.d) {
        var maxVal = from.d.length;
      }  else {
        var maxVal = to.d.length;
      }
      for (var j = 0; j < maxVal; j++) {
        fromVal = from.d ? from.d[j] : {};
        toVal = to.d ? to.d[j] : {};
        result.push(lengthType.interpolate(fromVal, toVal, f));
      }
      return {t: type, d: result};
      break;
  }
}

// The CSSWG decided to disallow scientific notation in CSS property strings 
// (see http://lists.w3.org/Archives/Public/www-style/2010Feb/0050.html).
// We need this function to hakonitize all numbers before adding them to
// property strings.
// TODO: Apply this function to all property strings 
function n(num) {
  return Number(num).toFixed(4);
}

var transformType = {
  zero: function(t) { throw 'UNIMPLEMENTED'; },
  add: function(base, delta) { return base.concat(delta); },
  interpolate: function(from, to, f) {
    var out = []
    for (var i = 0; i < Math.min(from.length, to.length); i++) {
      if (from[i].t != to[i].t) {
        break;
      }
      out.push(interpTransformValue(from[i], to[i], f));
    }

    if (i < Math.min(from.length, to.length)) {
      out.push(interpolateTransformsWithMatrices(from.slice(i), to.slice(i), 
          f));
      return out;
    }

    for (; i < from.length; i++)
      out.push(interpTransformValue(from[i], {t: null, d: null}, f));

    for (; i < to.length; i++)
      out.push(interpTransformValue({t: null, d: null}, to[i], f));
    return out;
  },
  toCssValue: function(value, svgMode) {
    // TODO: fix this :)
    var out = ''
    for (var i = 0; i < value.length; i++) {
      console.assert(value[i].t, 'transform type should be resolved by now');
      switch (value[i].t) {
        case 'rotate':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'skewX':
        case 'skewY':
          var unit = svgMode ? '' : 'deg';
          out += value[i].t + '(' + value[i].d + unit + ') ';
          break;
        case 'skew':
          var unit = svgMode ? '' : 'deg';
          out += value[i].t + '(' + value[i].d[0] + unit;
          if (value[i].d[1] === 0) {
            out += ') ';
          } else {
            out += ', ' + value[i].d[1] + unit + ') ';
          }
          break;
        case 'translateX':
        case 'translateY':
        case 'translateZ':
        case 'perspective':
          out += value[i].t + '(' + lengthType.toCssValue(value[i].d[0])
              + ') ';
          break;
        case 'translate':
          if (svgMode) {
            if (value[i].d[1] === undefined) {
              out += value[i].t + '(' + value[i].d[0]['px'] + ') ';
            } else {
              out += value[i].t + '(' + value[i].d[0]['px'] + ', ' +
                    value[i].d[1]['px'] + ') ';
            }
            break;
          }
          if (value[i].d[1] === undefined) {
            out += value[i].t + '(' + lengthType.toCssValue(value[i].d[0])
                + ') ';
          } else {
            out += value[i].t + '(' + lengthType.toCssValue(value[i].d[0])
                + ', ' + lengthType.toCssValue(value[i].d[1]) + ') ';
          }
          break;
        case 'translate3d':
          var values = value[i].d.map(lengthType.toCssValue);
          out += value[i].t + '(' + values[0] + ', ' + values[1] +
              ', ' + values[2] + ') ';
          break;
        case 'scale':
          if (value[i].d[0] === value[i].d[1]) {
            out += value[i].t + '(' + value[i].d[0] + ') ';
          } else {
            out += value[i].t + '(' + value[i].d[0] + ', ' + value[i].d[1] +
                ') ';
          }
          break;
        case 'scaleX':
        case 'scaleY':
        case 'scaleZ':
          out += value[i].t + '(' + value[i].d[0] + ') ';
          break;
        case 'scale3d':
          out += value[i].t + '(' + value[i].d[0] + ', ' +
              value[i].d[1] + ', ' + value[i].d[2] + ') ';
          break;
        case 'matrix':
          out += value[i].t + '(' + n(value[i].d[0]) + ', ' + n(value[i].d[1])
              + ', ' + n(value[i].d[2]) + ', ' + n(value[i].d[3]) + ', ' + 
              n(value[i].d[4]) + ', ' + n(value[i].d[5]) + ') ';
          break;
      }
    }
    return out.substring(0, out.length - 1);
  },
  fromCssValue: function(value) {
    // TODO: fix this :)
    if (value === undefined) {
      return "";
    }
    var result = []
    while (value.length > 0) {
      var r = undefined;
      for (var i = 0; i < transformREs.length; i++) {
        var reSpec = transformREs[i];
        r = reSpec[0].exec(value);
        if (r) {
          result.push({t: reSpec[2], d: reSpec[1](r)});
          value = value.substring(r[0].length);
          break;
        }
      }
      if (!isDefinedAndNotNull(r))
        return result;
    }
    return result;
  }
};

var propertyTypes = {
  'backgroundColor': colorType,
  'backgroundPosition': percentLengthType,
  'borderBottomColor': colorType,
  'borderBottomWidth': lengthType,
  'borderLeftColor': colorType,
  'borderLeftWidth': lengthType,
  'borderRightColor': colorType,
  'borderRightWidth': lengthType,
  'borderSpacing': lengthType,
  'borderTopColor': colorType,
  'borderTopWidth': lengthType,
  'bottom': percentLengthType,
  'clip': rectangleType,
  'color': colorType,
  'crop': rectangleType,
  'cx': lengthType,
  'fontSize': percentLengthType,
  'fontWeight': fontWeightType,
  'height': percentLengthType,
  'left': percentLengthType,
  'letterSpacing': lengthType,
  // TODO: should be both number and percentLength
  'lineHeight': percentLengthType,
  'marginBottom': lengthType,
  'marginLeft': lengthType,
  'marginRight': lengthType,
  'marginTop': lengthType,
  'maxHeight': percentLengthType,
  'maxWidth': percentLengthType,
  'minHeight': percentLengthType,
  'minWidth': percentLengthType,
  'opacity': numberType,
  'outlineColor': colorType,
  // TODO: not clear why this is an integer in the transitions spec
  'outlineOffset': integerType,
  'outlineWidth': lengthType,
  'paddingBottom': lengthType,
  'paddingLeft': lengthType,
  'paddingRight': lengthType,
  'paddingTop': lengthType,
  'right': percentLengthType,
  'textIndent': percentLengthType,
  'textShadow': shadowType,
  'top': percentLengthType,
  'transform': transformType,
  'verticalAlign': percentLengthType,
  'visibility': visibilityType,
  'width': percentLengthType,
  'wordSpacing': percentLengthType,
  'x': lengthType,
  'y': lengthType,
  'zIndex': integerType,
};

var svgProperties = {
  'cx': 1,
  'width': 1,
  'x': 1,
  'y': 1,
};


var propertyIsSVGAttrib = function(property, target) {
  return target.namespaceURI == 'http://www.w3.org/2000/svg' &&
      property in svgProperties;
};

var getType = function(property) {
  return propertyTypes[property] || nonNumericType;
}

var zero = function(property, value) {
  return getType(property).zero(value);
};

var add = function(property, base, delta) {
  return getType(property).add(base, delta);
}

/**
 * Interpolate the given property name (f*100)% of the way from 'from' to 'to'.
 * 'from' and 'to' are both CSS value strings. Requires the target element to
 * be able to determine whether the given property is an SVG attribute or not,
 * as this impacts the conversion of the interpolated value back into a CSS
 * value string for transform translations.
 *
 * e.g. interpolate('transform', elem, 'rotate(40deg)', 'rotate(50deg)', 0.3);
 *   will return 'rotate(43deg)'.
 */
var interpolate = function(property, from, to, f) {
  return getType(property).interpolate(from, to, f);
}

/**
 * Convert the provided interpolable value for the provided property to a CSS
 * value string. Note that SVG transforms do not require units for translate
 * or rotate values while CSS properties require 'px' or 'deg' units.
 */
var toCssValue = function(property, value, svgMode) {
  return getType(property).toCssValue(value, svgMode);
}

var fromCssValue = function(property, value) {
  return getType(property).fromCssValue(value);
}

/** @constructor */
var AnimatedResult = function(value, operation, fraction) {
  this.value = value;
  this.operation = operation;
  this.fraction = fraction;
};

/** @constructor */
var CompositedPropertyMap = function(target) {
  this.properties = {};
  this.target = target;
};

CompositedPropertyMap.prototype = {
  addValue: function(property, animValue) {
    if (!(property in this.properties)) {
      this.properties[property] = [];
    }
    if (!(animValue instanceof AnimatedResult)) {
      throw new TypeError('expected AnimatedResult');
    }
    this.properties[property].push(animValue);
  },
  applyAnimatedValues: function() {
    for (var property in this.properties) {
      var resultList = this.properties[property];
      if (resultList.length > 0) {
        var i;
        for (i = resultList.length - 1; i >= 0; i--) {
          if (resultList[i].operation == 'replace') {
            break;
          }
        }
        // the baseValue will either be retrieved after clearing the value or
        // will be overwritten by a 'replace'.
        var baseValue = undefined;
        if (i == -1) {
          clearValue(this.target, property);
          baseValue = fromCssValue(property, getValue(this.target, property));
          i = 0;
        }
        for ( ; i < resultList.length; i++) {
          var inValue = resultList[i].value;
          switch (resultList[i].operation) {
          case 'replace':
            baseValue = inValue;
            continue;
          case 'add':
            baseValue = add(property, baseValue, inValue);
            continue;
          case 'merge':
            baseValue = interpolate(property, baseValue, inValue,
                resultList[i].fraction);
            continue;
          }
        }
        var svgMode = propertyIsSVGAttrib(property, this.target);
        setValue(this.target, property, toCssValue(property, baseValue,
            svgMode));
        this.properties[property] = [];
      } else {
        // property has previously been set but no value was accumulated
        // in this animation iteration. Reset value and stop tracking.
        clearValue(this.target, property);
        delete this.properties[property];
      }
    }
  }
};

/** @constructor */
var Compositor = function() {
  this.targets = []
};

Compositor.prototype = {
  setAnimatedValue: function(target, property, animValue) {
    if (target._anim_properties === undefined) {
      target._anim_properties = new CompositedPropertyMap(target);
      this.targets.push(target);
    }
    target._anim_properties.addValue(property, animValue);
  },
  applyAnimatedValues: function() {
    for (var i = 0; i < this.targets.length; i++) {
      var target = this.targets[i];
      target._anim_properties.applyAnimatedValues();
    }
  }
};

var initializeIfSVGAndUninitialized = function(property, target) {
  if (propertyIsSVGAttrib(property, target)) {
    if (!isDefinedAndNotNull(target._actuals)) {
      target._actuals = {};
      target._bases = {};
      target.actuals = {};
      target._getAttribute = target.getAttribute;
      target._setAttribute = target.setAttribute;
      target.getAttribute = function(name) {
        if (isDefinedAndNotNull(target._bases[name])) {
          return target._bases[name];
        }
        return target._getAttribute(name);
      };
      target.setAttribute = function(name, value) {
        if (isDefinedAndNotNull(target._actuals[name])) {
          target._bases[name] = value;
        } else {
          target._setAttribute(name, value);
        }
      };
    }
    if(!isDefinedAndNotNull(target._actuals[property])) {
      var baseVal = target.getAttribute(property);
      target._actuals[property] = 0;
      target._bases[property] = baseVal;

      Object.defineProperty(target.actuals, property, configureDescriptor({
        set: function(value) {
          if (value == null) {
            target._actuals[property] = target._bases[property];
            target._setAttribute(property, target._bases[property]);
          } else {
            target._actuals[property] = value;
            target._setAttribute(property, value)
          }
        },
        get: function() {
          return target._actuals[property];
        },
      }));
    }
  }
}

var setValue = function(target, property, value) {
  initializeIfSVGAndUninitialized(property, target);
  if (property == "transform") {
    property = features.transformProperty;
  }
  if (propertyIsSVGAttrib(property, target)) {
    target.actuals[property] = value;
  } else {
    target.style[property] = value;
  }
}

var clearValue = function(target, property) {
  initializeIfSVGAndUninitialized(property, target);
  if (property == "transform") {
    property = features.transformProperty;
  }
  if (propertyIsSVGAttrib(property, target)) {
    target.actuals[property] = null;
  } else {
    target.style[property] = null;
  }
}

var getValue = function(target, property) {
  initializeIfSVGAndUninitialized(property, target);
  if (property == "transform") {
    property = features.transformProperty;
  }
  if (propertyIsSVGAttrib(property, target)) {
    return target.actuals[property];
  } else {
    return getComputedStyle(target)[property];
  }
}

var rafScheduled = false;

var compositor = new Compositor();

// ECMA Script does not guarantee stable sort.
var stableSort = function(array, compare) {
  var indicesAndValues = array.map(function(value, index) {
    return { index: index, value: value };
  });
  indicesAndValues.sort(function(a, b) {
    var r = compare(a.value, b.value);
    return r == 0 ? a.index - b.index : r;
  });
  array.length = 0;
  array.push.apply(array, indicesAndValues.map(function(value) {
    return value.value;
  }));
};

var usePerformanceTiming =
    typeof performance === "object" &&
    typeof performance.timing === "object" &&
    typeof performance.now === "function";

// Don't use a local named requestAnimationFrame, to avoid potential problems
// with hoisting.
var raf = window.requestAnimationFrame;
if (!raf) {
  var nativeRaf =  window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame;
  if (!nativeRaf) {
    // requestAnimationFrame is not available, simulate it.
    raf = function(callback) {
      setTimeout(function() {
        callback(clockMillis());
      }, 1000/60);
    };
  } else if (usePerformanceTiming) {
    // platform requestAnimationFrame provides only millisecond accuracy, wrap
    // it and use performance.now()
    raf = function(callback) {
      nativeRaf(function() {
        callback(performance.now());
      });
    };
  } else {
    // platform requestAnimationFrame provides only millisecond accuracy, and
    // we can't do any better
    raf = nativeRaf;
  }
}

var clockMillis = function() {
  return usePerformanceTiming ? performance.now() : Date.now();
};
// Set up the zero times for document time. Document time is relative to the
// document load event.
var documentTimeZeroAsRafTime = undefined;
var documentTimeZeroAsClockTime = undefined;
if (usePerformanceTiming) {
  var load = function() {
    // RAF time is relative to the navigationStart event.
    documentTimeZeroAsRafTime =
        performance.timing.loadEventStart - performance.timing.navigationStart;
    // performance.now() uses the same origin as RAF time.
    documentTimeZeroAsClockTime = documentTimeZeroAsRafTime;
  };
} else {
  // The best approximation we have for the relevant clock and RAF times is to
  // listen to the load event.
  load = function() {
    raf(function(rafTime) {
      documentTimeZeroAsRafTime = rafTime;
    });
    documentTimeZeroAsClockTime = Date.now();
  };
}
// Start timing when load event fires or if this script is processed when
// document loading is already complete.
if (document.readyState == 'complete') {
  // When performance timing is unavailable and this script is loaded
  // dynamically, document zero time is incorrect.
  // Warn the user in this case.
  if (!usePerformanceTiming) {
    console.warn('Web animations can\'t discover document zero time when ' +
      'asynchronously loaded in the absence of performance timing.');
  }
  load();
} else {
  addEventListener('load', function() {
    load();
    if (usePerformanceTiming) {
      // We use setTimeout() to clear cachedDocumentTimeMillis at the end of a
      // frame, but this will not run until after other load handlers. We need
      // those handlers to pick up the new value of clockMillis(), so we must
      // clear the cached value.
      cachedDocumentTimeMillis = undefined;
    }
  });
}

// A cached document time for use during the current callstack.
var cachedDocumentTimeMillis = undefined;
// Calculates one time relative to another, returning null if the zero time is
// undefined.
var relativeTime = function(time, zeroTime) {
  return isDefined(zeroTime) ? time - zeroTime : null;
}

var documentTime = function() {
  // Cache a document time for the remainder of this callstack.
  if (!isDefined(cachedDocumentTimeMillis)) {
    cachedDocumentTimeMillis =
        relativeTime(clockMillis(), documentTimeZeroAsClockTime);
    setTimeout(function() { cachedDocumentTimeMillis = undefined; }, 0);
  }
  return cachedDocumentTimeMillis === null ?
      null : cachedDocumentTimeMillis / 1000;
};

var ticker = function(rafTime) {
  cachedDocumentTimeMillis = relativeTime(rafTime, documentTimeZeroAsRafTime);

  // Get animations for this sample. We order first by Player start time, and
  // second by DFS order within each Player's tree.
  var sortedPlayers = PLAYERS;
  stableSort(sortedPlayers, function(a, b) {
    return a.startTime - b.startTime;
  });
  var finished = true;
  var paused = true;
  var animations = [];
  sortedPlayers.forEach(function(player) {
    player._update();
    finished = finished && player._isPastEndOfActiveInterval();
    paused = paused && player.paused;
    player._getLeafItemsInEffect(animations);
  });

  // Apply animations in order
  for (var i = 0; i < animations.length; i++) {
    if (animations[i] instanceof Animation) {
      animations[i]._sample();
    }
  }

  // Composite animated values into element styles
  compositor.applyAnimatedValues();

  if (window.webAnimVisUpdateAnims) {
    webAnimVisUpdateAnims();
  }

  if (finished || paused) {
    rafScheduled = false;
  } else {
    raf(ticker);
  }

  cachedDocumentTimeMillis = undefined;
};

// Multiplication where zero multiplied by any value (including infinity)
// gives zero.
var multiplyZeroGivesZero = function(a, b) {
  return (a === 0 || b === 0) ? 0 : a * b;
};

var maybeRestartAnimation = function() {
  if (rafScheduled) {
    return;
  }
  raf(ticker);
  rafScheduled = true;
};

var DOCUMENT_TIMELINE = new Timeline(constructorToken);
document.timeline = DOCUMENT_TIMELINE;

window.Element.prototype.animate = function(effect, timing) {
  var anim = new Animation(this, effect, timing);
  DOCUMENT_TIMELINE.play(anim);
  return anim;
};

window.Animation = Animation;
window.AnimationEffect = AnimationEffect;
window.GroupedAnimationEffect = GroupedAnimationEffect;
window.Keyframe = Keyframe;
window.KeyframeAnimationEffect = KeyframeAnimationEffect;
window.KeyframeList = KeyframeList;
window.MediaReference = MediaReference;
window.ParGroup = ParGroup;
window.PathAnimationEffect = PathAnimationEffect;
window.Player = Player;
window.SeqGroup = SeqGroup;
window.SplineTimingFunction = SplineTimingFunction;
window.StepTimingFunction = StepTimingFunction;
window.TimedItem = TimedItem;
window.Timeline = Timeline;
window.TimingEvent = null; // TODO
window.TimingFunction = TimingFunction;
window.TimingGroup = TimingGroup;

})();
