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

var TextReplacementsBinding;

(function() {
  'use strict';

  var ONE_WAY = DelegatedValueBinding.Type.ONE_WAY;

  function assert(v) {
    if (!v)
      throw new Error('Assertion failed');
  }

  var TEXT = 0;
  var BINDING = 1;

  function Token(type, value) {
    this.type = type;
    this.value = value;
  }

  function parse(s) {
    var result = [];
    var length = s.length;
    var index = 0, lastIndex = 0;
    while (lastIndex < length) {
      index = s.indexOf('{{', lastIndex);
      if (index < 0) {
        result.push(new Token(TEXT, s.slice(lastIndex)));
        break;
      } else {
        // There is a non-empty text run before the next path token.
        if (index > 0 && lastIndex < index) {
          result.push(new Token(TEXT, s.slice(lastIndex, index)));
        }
        lastIndex = index + 2;
        index = s.indexOf('}}', lastIndex);
        if (index < 0) {
          var text = s.slice(lastIndex - 2);
          var lastToken = result[result.length - 1];
          if (lastToken && lastToken.type == TEXT)
            lastToken.value += text;
          else
            result.push(new Token(TEXT, text));
          break;
        }

        var value = s.slice(lastIndex, index).trim();
        result.push(new Token(BINDING, value));
        lastIndex = index + 2;
      }
    }
    return result;
  }

  TextReplacementsBinding = function(model, delegate, bindingText, observer) {
    this.observer_ = observer;
    this.value_ = '';
    this.bindingText_ = bindingText;
    this.bindings_ = [];
    this.tokens_ = parse(bindingText);
    this.bindPlaceHolders(model, delegate);
    this.computeValue();
  };

  TextReplacementsBinding.prototype = {
    unbind: function() {
      this.bindings_.forEach(function(binding) {
        binding.unbind();
      });
    },

    get value() {
      return this.value_;
    },

    valueIsSimpleNull: function() {
      return this.tokens_.length === 1 && this.bindings_.length === 1 &&
          this.bindings_[0].value === null;
    },

    setModel: function(model) {
      var changed = false;
      for (var i = 0; i < this.bindings_.length; i++) {
        changed = this.bindings_[i].setModel(model) || changed;
      }

      if (changed)
        return this.computeValue();

      return false;
    },

    setDelegate: function(model, delegate) {
      var changed = false;
      for (var i = 0; i < this.bindings_.length; i++) {
        changed = this.bindings_[i].setDelegate(model, delegate) || changed;
      }

      if (changed)
        this.computeValue();

      return changed;
    },

    get bindingText() {
      return this.bindingText_;
    },

    valueChanged: function(binding){
      if (this.computeValue())
        this.observer_.valueChanged(this);
    },

    computeValue: function() {
      var newValue = '';
      var tokens = this.tokens_;
      var bindings = this.bindings_;
      var value;

      var bindingIndex = 0;
      for (var i = 0; i < this.tokens_.length; i++) {
        var token = tokens[i];
        if (token.type === TEXT) {
          newValue += token.value;
        } else {
          assert(bindingIndex < this.bindings_.length);
          value = bindings[bindingIndex++].value;
          if (value !== undefined)
            newValue += value;
        }
      }

      if (newValue !== this.value_) {
        this.value_ = newValue;
        return true;
      }

      return false;
    },

    bindPlaceHolders: function(model, delegate) {
      for (var i = 0; i < this.tokens_.length; i++) {
        if (this.tokens_[i].type === BINDING) {
          this.bindings_.push(
              new DelegatedValueBinding(model, delegate, this.tokens_[i].value,
                                        ONE_WAY, this));
        }
      }
    }
  };

})();