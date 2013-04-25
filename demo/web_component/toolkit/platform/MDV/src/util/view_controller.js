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

(function() {
  var CONTROLLER_ATTRIBUTE = 'data-controller';
  var CONTROLLER_SELECTOR = '*[' + CONTROLLER_ATTRIBUTE + ']';

  var ACTION_ATTRIBUTE = 'data-action';
  var ACTION_SELECTOR = '*[' + ACTION_ATTRIBUTE + ']';

  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  function bindController(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
      return;

    var controllerClass = node.getAttribute(CONTROLLER_ATTRIBUTE);
    if (!controllerClass ||
        !this[controllerClass] ||
        typeof this[controllerClass] != 'function') {
      return;
    }

    var controller = new this[controllerClass](node);
    if (controller.model) {
      // TODO(rafaelw): This should really only visit template elements
      // TODO(rafaelw): It's pretty lame you have to set the delegate here.
      HTMLTemplateElement.bindTree(node, controller.model);
    }
    node.controller = controller;
  }

  var registeredEvents = {};

  function getAction(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
      return;

    var actionText = node.getAttribute(ACTION_ATTRIBUTE);
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

  function registerAction(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
      return;

    var action = getAction(node);
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
    Model.notifyChanges();
  }, false);

  document.addEventListener('DOMNodeInserted', function(e) {
    if (e.target.nodeType !== Node.ELEMENT_NODE)
      return;
    bindController(e.target);
    registerAction(e.target);
  }, false);

  function handleAction(e) {
    var action;
    var currentTarget = e.target;
    while (!action && currentTarget) {
      action = getAction(currentTarget);
      if (!action)
        currentTarget = currentTarget.parentNode;
    }

    var handled = false;
    while (!handled && currentTarget) {
      if (!currentTarget.controller ||
          !currentTarget.controller[action.name] ||
          typeof currentTarget.controller[action.name] != 'function') {
        currentTarget = currentTarget.parentNode;
        continue;
      }

      var func = currentTarget.controller[action.name];
      var templateInstance = e.target.templateInstance;
      func.call(currentTarget.controller,
          templateInstance ? templateInstance.model : undefined, e);
      handled = true;
    }

    if (handled)
      Model.notifyChanges();
    else
      console.error('Error: unhandled action', action, e);
  }
})();
