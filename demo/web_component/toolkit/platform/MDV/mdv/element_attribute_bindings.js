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

var ElementAttributeBindings;

(function() {
  'use strict';

  function Binding(element, attributeName, bindingText) {
    this.element_ = element;
    this.attributeName_ = attributeName;
    this.binding_ = new TextReplacementsBinding(element.model,
                                                element.modelDelegate,
                                                bindingText, this);
  }

  Binding.prototype = {
    unbind: function() {
      this.binding_.unbind();
    },

    modelChanged: function(newModel) {
      if (this.binding_.setModel(newModel))
        this.valueChanged(this.binding_);
    },

    modelDelegateChanged: function(newModelDelegate) {
      if (this.binding_.setDelegate(this.element_.model, newModelDelegate))
        this.valueChanged(this.binding_);
    },

    valueChanged: function(binding) {
      if (binding.valueIsSimpleNull())
        this.element_.removeAttribute(this.attributeName_);
      else
        this.element_.setAttribute(this.attributeName_, binding.value);
    },

    fire: function() {
      this.valueChanged(this.binding_);
    },

    get bindingText() {
      return this.binding_.bindingText;
    }
  };

  ElementAttributeBindings = function() {
    this.attributeBindings_ = Object.create(null);
  };

  ElementAttributeBindings.prototype = {
    addBinding: function(element, attributeName, path) {
      this.removeBinding(attributeName);

      var binding = new Binding(element, attributeName, path);
      this.attributeBindings_[attributeName] = binding;
      binding.fire();
    },

    removeBinding: function(attributeName) {
      var binding = this.attributeBindings_[attributeName];
      if (binding) {
        binding.unbind();
        delete this.attributeBindings_[attributeName];
      }
    },

    modelChanged: function(newModel) {
      // Should we take a snapshot?
      for (var attributeName in this.attributeBindings_) {
        this.attributeBindings_[attributeName].modelChanged(newModel);
      }
    },

    modelDelegateChanged: function(newModelDelegate) {
      // Should we take a snapshot?
      for (var attributeName in this.attributeBindings_) {
        this.attributeBindings_[attributeName].
            modelDelegateChanged(newModelDelegate);
      }
    },

    bindingText: function(attributeName) {
      var binding = this.attributeBindings_[attributeName];
      return binding ? binding.bindingText : null;
    }
  };

})();