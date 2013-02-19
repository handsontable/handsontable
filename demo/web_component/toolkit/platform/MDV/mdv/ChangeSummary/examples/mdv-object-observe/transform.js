// Copyright 2011 Google Inc.
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

function Transform() {}
function IdentityTransform() {}
function ToggleTransform(value) {
  this.value = value;
}
function CurrencyTransform() {}
function NumberTransform() {}
function AbsentTransform() {}
function PresentTransform() {}

(function() {

Transform.registry = {};

Transform.create = function(transformName, transformArgs) {
  var transform;
  var transFunc = Transform.registry[transformName];
  if (transformName && typeof transFunc == 'function') {
     // Construct a new transform using rest args. In Harmony speak:
     //   new transFunc(...transformArgs)
     transform = Object.create(transFunc.prototype);
     transFunc.apply(transform, transformArgs);
  }
  return transform;
};

IdentityTransform.prototype = createObject({
  __proto__: Transform.prototype,
  toTarget: function(source, sourceName, targetNode, propertyName) {
    return source;
  },

  toSource: function(target, sourceName, targetNode, propertyName) {
    return target;
  }
});

ToggleTransform.prototype = createObject({
  __proto__: IdentityTransform.prototype,

  toTarget: function(source, sourceName) {
    return source ? (this.value || sourceName) : '';
  },

  toSource: function(target, sourceName) {
    return (this.value || sourceName) == target;
  }
});

Transform.registry.toggle = ToggleTransform;

CurrencyTransform.prototype = createObject({
  __proto__: IdentityTransform.prototype,
  pattern: /^\$?([-\d\.]*)$/,

  toTarget: function(source) {
    var num = Number(source);
    return isNaN(num) ? 'NaN' : '$' + Number(num).toFixed(2);
  },

  toSource: function(target) {
    var m = target.match(this.pattern) || {};
    return Number(m[1]);
  }
});

Transform.registry.currency = CurrencyTransform;

NumberTransform.prototype = createObject({
  __proto__: IdentityTransform.prototype,

  toSource: function(target) {
    return Number(target);
  }
});

Transform.registry.number = NumberTransform;

AbsentTransform.prototype = createObject({
  __proto__: IdentityTransform.prototype,

  toTarget: function(source) {
    if (source !== null && typeof source == 'object' && 'length' in source)
      return !source.length;
    return !source;
  }
});

Transform.registry.absent = AbsentTransform;

PresentTransform.prototype = createObject({
  __proto__: IdentityTransform.prototype,

  toTarget: function(source) {
    return !AbsentTransform.prototype.toTarget(source);
  }
});

Transform.registry.present = PresentTransform;

})();
