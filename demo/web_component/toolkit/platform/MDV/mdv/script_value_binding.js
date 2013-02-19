// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var ScriptValueBinding;
var DelegatedValueBinding;

(function() {
  'use strict';

  function isObject(value) {
    return Object(value) === value;
  }

  function toUint32(v) {
    return v >>> 0;
  }

  function isFunction(v) {
    return typeof v === 'function';
  }

  function assert(v) {
    if (!v)
      throw new Error('Assertion failed');
  }

  ScriptValueBinding = function(model, path, observer) {
    this.model_ = null;
    this.path_ = path;
    this.observer_ = observer;
    this.boundCallback_ = this.scriptPropertyChanged.bind(this);
    this.setModel(model);
  };

  ScriptValueBinding.prototype = {
    unbind: function() {
      Model.unobservePath(this.model_, this.path_, this.boundCallback_);
    },

    scriptPropertyChanged: function(newValue) {
      if (isObject(newValue) && newValue.mutation) {
        // TODO(arv): This happens becaues Model.observe checks if the model
        // is an array and we get here.
        return;
      }

      // FIXME: This check may not be neccessary.
      // Consider refactoring ScriptValue & ScriptValueTrackers.
      if (this.value_ !== newValue) {
        this.value_ = newValue;
        this.observer_.valueChanged(this);
      }
    },

    setModel: function(model) {
      Model.unobservePath(this.model_, this.path_, this.boundCallback_);
      this.model_ = model;
      var oldValue = this.value_;
      this.value_ = Model.observePath(this.model_, this.path_,
                                      this.boundCallback_);
      return this.value_ !== oldValue;
    },

    get value() {
      return this.value_;
    },

    set value(value) {
      Model.setValueAtPath(this.model_, this.path_, value);
    }
  };

  DelegatedValueBinding = function(model, delegate, bindingText, type,
                                   observer) {
    this.observer_ = observer;
    this.bindingText_ = bindingText;
    this.type_ = type;
    this.paths_ = [];
    this.bindings_ = [];
    this.toSourceFunction_ = null;
    this.toTargetFunction_ = null;

    this.setDelegate(model, delegate);
  };

  var ONE_WAY = 1;
  var TWO_WAY = 2;

  DelegatedValueBinding.Type = {
    ONE_WAY: ONE_WAY,
    TWO_WAY: TWO_WAY
  };

  DelegatedValueBinding.prototype = {
    unbind: function() {
      this.bindings_.forEach(function(binding) {
        binding.unbind();
      });
    },

    valueChanged: function(binding) {
      if (this.computeValue())
        this.observer_.valueChanged(this);
    },

    setModel: function(model) {
      var changed = false;
      this.bindings_.forEach(function(binding) {
        changed = binding.setModel(model) || changed;
      });

      if (changed)
        return this.computeValue();

      return false;
    },

    setDelegate: function(model, delegate) {
      this.paths_ = [];
      this.bindings_ = [];

      if (!this.constructDelegate(delegate))
        this.paths_.push(this.bindingText_);

      for (var i = 0; i < this.paths_.length; i++) {
        this.bindings_.push(
            new ScriptValueBinding(model, this.paths_[i], this));
      }

      return this.computeValue();
    },

    set value(value) {
      assert(this.type_ === TWO_WAY);

      // FIXME: Is it weird that a delegated binding can have multiple paths, but only push to one?
      this.bindings_[0].value = this.invokeToSource(value);
    },

    get value() {
      return this.value_;
    },

    constructDelegate: function(delegate) {
      if (!delegate || !isFunction(delegate))
        return false;

      // FIXME: We'll need feedback when the delegate isn't the right shape?
      var result = delegate(this.bindingText_);
      if (!isObject(result))
        return false;

      var pathValues = result[0];
      if (!isObject(pathValues))
        return false;

      var count = toUint32(pathValues.length);
      if (!count)
        return false;
      for (var i = 0; i < count; i++) {
        var pathValue = pathValues[i];
        if (typeof pathValue !== 'string') {
          this.paths_ = [];
          return false;
        }
        this.paths_.push(pathValue);
      }

      var toTargetFunction = result[1];
      if (isFunction(toTargetFunction))
        this.toTargetFunction_ = toTargetFunction;

      var toSourceFunction = result[2];
      if (this.type_ === TWO_WAY && isFunction(toSourceFunction))
        this.toSourceFunction_ = toSourceFunction;

      return true;
    },

    invokeToTarget: function() {
      if (!this.toTargetFunction_)
        return this.bindings_[0].value;

      assert(isFunction(this.toTargetFunction_));
      var args = this.bindings_.map(function(binding) {
        return binding.value;
      });

      return this.toTargetFunction_.apply(null, args);
    },

    invokeToSource: function(value) {
      if (!this.toSourceFunction_)
        return value;

      assert(isFunction(this.toSourceFunction_));
      return (this.toSourceFunction_)(value);  // intentionally lose 'this'
    },

    computeValue: function() {
      var newValue = this.invokeToTarget();

      if (this.value_ === newValue)
        return false;

      this.value_ = newValue;
      return true;
    }
  };

})();