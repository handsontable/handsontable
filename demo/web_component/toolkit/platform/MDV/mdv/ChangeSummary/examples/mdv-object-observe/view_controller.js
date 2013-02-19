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

(function() {
  var CONTROLLER_ATTRIBUTE = 'data-controller';
  var CONTROLLER_SELECTOR = '*[' + CONTROLLER_ATTRIBUTE + ']';

  var ACTION_ATTRIBUTE = 'data-action';
  var ACTION_SELECTOR = '*[' + ACTION_ATTRIBUTE + ']';

  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  function bindController(elm) {
    var controllerClass = elm.getAttribute(CONTROLLER_ATTRIBUTE);
    if (!controllerClass ||
        !this[controllerClass] ||
        typeof this[controllerClass] != 'function') {
      return;
    }

    var controller = new this[controllerClass](elm);
    if (controller.model) {
      elm.model = controller.model;
    }
    elm.controller = controller;
  }

  var registeredEvents = {};

  function getAction(elm) {
    var actionText = elm.getAttribute(ACTION_ATTRIBUTE);
    if (!actionText)
      return;
    var tokens = actionText.split(':');
    if (tokens.length != 2) {
      console.error('Invalid action: ' + actionText);
      return;
    }

    return {
      eventType: tokens[0],
      name: tokens[1]
    }
  }

  function registerAction(elm) {
    var action = getAction(elm);
    if (!action)
      return;
    if (registeredEvents[action.eventType])
      return;

    document.addEventListener(action.eventType, handleAction, false);
    registeredEvents[action.eventType] = true;
  }

  document.addEventListener('DOMContentLoaded', function(e) {
    var controllerElements = document.querySelectorAll(CONTROLLER_SELECTOR);
    forEach(controllerElements, bindController);

    var actionElements = document.querySelectorAll(ACTION_SELECTOR);
    forEach(actionElements, registerAction);

    // Controller constructors may have bound data.
    Model.dirtyCheck();
  }, false);

  document.addEventListener('DOMNodeInserted', function(e) {
    if (e.target.nodeType !== Node.ELEMENT_NODE)
      return;
    bindController(e.target);
    registerAction(e.target);
  }, false);

  function handleAction(e) {
    var action = getAction(e.target);
    if (!action)
      return;

    var currentTarget = e.target;
    var handled = false;
    while (!handled && currentTarget) {
      if (!currentTarget.controller ||
          !currentTarget.controller[action.name] ||
          typeof currentTarget.controller[action.name] != 'function') {
        currentTarget = currentTarget.parentNode;
        continue;
      }

      var func = currentTarget.controller[action.name];
      func.call(currentTarget.controller, e.target.computedModel, e);
      handled = true;
    }

    if (handled)
      Model.dirtyCheck();
    else
      console.error('Error: unhandled action', action, e);
  }
})();
