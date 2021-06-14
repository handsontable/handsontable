---
title: Plugins
metaTitle: Plugins - Guide - Handsontable Documentation
permalink: /next/plugins
canonicalUrl: /plugins
tags:
  - custom plugin
  - skeleton
  - internal
  - external
  - extend
---

# Plugins

## Overview

Plugin is a one great way to extend the capabilities of Handsontable. In fact, most of the features available in this library are provided by plugins.

### Plugin template

There are two types of plugins: internal and external. While both extend Handsontable's functionality, the former is incorporated into the Handsontable build, and the latter needs to be included from a separate file.

Regardless of which plugin you are going to build, using a template will save you lots of time.

#### Internal plugin

The source code of this template is [available on GitHub](https://github.com/handsontable/handsontable-skeleton/tree/master/plugins/internal). Start off by cloning the entire project or copying the code to your application.

```js
// You need to import the BasePlugin class in order to inherit from it.
import BasePlugin from './../../_base';
import {registerPlugin} from './../../../plugins';

/**
 * @plugin InternalPluginSkeleton
 * Note: keep in mind, that Handsontable instance creates one instance of the plugin class.
 *
 * @description
 * Blank plugin template. It needs to inherit from the BasePlugin class.
 */
class InternalPluginSkeleton extends BasePlugin {

  // The argument passed to the constructor is the currently processed Handsontable instance object.
  constructor(hotInstance) {
    super(hotInstance);

    // Initialize all your public properties in the class' constructor.
    /**
     * yourProperty description.
     *
     * @type {String}
     */
    this.yourProperty = '';
    /**
     * anotherProperty description.
     * @type {Array}
     */
    this.anotherProperty = [];
  }

  /**
   * Checks if the plugin is enabled in the settings.
   */
  isEnabled() {
    return !!this.hot.getSettings().internalPluginSkeleton;
  }

  /**
   * The enablePlugin method is triggered on the beforeInit hook. It should contain your initial plugin setup, along with
   * the hook connections.
   * Note, that this method is run only if the statement in the isEnabled method is true.
   */
  enablePlugin() {
    this.yourProperty = 'Your Value';

    // Add all your plugin hooks here. It's a good idea to make use of the arrow functions to keep the context consistent.
    this.addHook('afterChange', (changes, source) => this.onAfterChange(changes, source));

    // The super method assigns the this.enabled property to true, which can be later used to check if plugin is already enabled.
    super.enablePlugin();
  }

  /**
   * The disablePlugin method is used to disable the plugin. Reset all of your classes properties to their default values here.
   */
  disablePlugin() {
    this.yourProperty = '';
    this.anotherProperty = [];

    // The super method takes care of clearing the hook connections and assigning the 'false' value to the 'this.enabled' property.
    super.disablePlugin();
  }

  /**
   * The updatePlugin method is called on the afterUpdateSettings hook (unless the updateSettings method turned the plugin off).
   * It should contain all the stuff your plugin needs to do to work properly after the Handsontable instance settings were modified.
   */
  updatePlugin() {

    // The updatePlugin method needs to contain all the code needed to properly re-enable the plugin. In most cases simply disabling and enabling the plugin should do the trick.
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * The afterChange hook callback.
   *
   * @param {Array} changes Array of changes.
   * @param {String} source Describes the source of the change.
   */
  onAfterChange(changes, source) {
    // afterChange callback goes here.
  }

  /**
   * The destroy method should de-assign all of your properties.
   */
  destroy() {
    // The super method takes care of de-assigning the event callbacks, plugin hooks and clearing all the plugin properties.
    super.destroy();
  }
}

export {InternalPluginSkeleton};

// You need to register your plugin in order to use it within Handsontable.
registerPlugin('internalPluginSkeleton', InternalPluginSkeleton);

```

#### External plugin

Similarly to the above, this template is [hosted on GitHub](https://github.com/handsontable/handsontable-skeleton/tree/master/plugins/external).

```js
/**
 * @plugin External plugin skeleton.
 * Note: keep in mind, that Handsontable instance creates one instance of the plugin class.
 *
 * @param hotInstance
 * @constructor
 */
function ExternalPluginSkeleton(hotInstance) {

  // Call the BasePlugin constructor.
  Handsontable.plugins.BasePlugin.call(this, hotInstance);

  this._superClass = Handsontable.plugins.BasePlugin;

  // Initialize all your public properties in the class' constructor.
  /**
   * yourProperty description.
   *
   * @type {String}
   */
  this.yourProperty = '';
  /**
   * anotherProperty description.
   * @type {Array}
   */
  this.anotherProperty = [];
}

// Inherit the BasePlugin prototype.
ExternalPluginSkeleton.prototype = Object.create(Handsontable.plugins.BasePlugin.prototype, {
  constructor: {
    writable: true,
    configurable: true,
    value: ExternalPluginSkeleton
  },
});

/**
 * Checks if the plugin is enabled in the settings.
 */
ExternalPluginSkeleton.prototype.isEnabled = function() {
  return !!this.hot.getSettings().externalPluginSkeleton;
};

/**
 * The enablePlugin method is triggered on the beforeInit hook. It should contain your initial plugin setup, along with
 * the hook connections.
 * Note, that this method is run only if the statement in the isEnabled method is true.
 */
ExternalPluginSkeleton.prototype.enablePlugin = function() {
  this.yourProperty = 'Your Value';

  // Add all your plugin hooks here. It's a good idea to make use of the arrow functions to keep the context consistent.
  this.addHook('afterChange', this.onAfterChange.bind(this));

  // The super class' method assigns the this.enabled property to true, which can be later used to check if plugin is already enabled.
  this._superClass.prototype.enablePlugin.call(this);
};

/**
 * The disablePlugin method is used to disable the plugin. Reset all of your classes properties to their default values here.
 */
ExternalPluginSkeleton.prototype.disablePlugin = function() {
  this.yourProperty = '';
  this.anotherProperty = [];

  // The super class' method takes care of clearing the hook connections and assigning the 'false' value to the 'this.enabled' property.
  this._superClass.prototype.disablePlugin.call(this);
};

/**
 * The updatePlugin method is called on the afterUpdateSettings hook (unless the updateSettings method turned the plugin off).
 * It should contain all the stuff your plugin needs to do to work properly after the Handsontable instance settings were modified.
 */
ExternalPluginSkeleton.prototype.updatePlugin = function() {

  // The updatePlugin method needs to contain all the code needed to properly re-enable the plugin. In most cases simply disabling and enabling the plugin should do the trick.
  this.disablePlugin();
  this.enablePlugin();

  this._superClass.prototype.updatePlugin.call(this);
};

/**
 * The afterChange hook callback.
 *
 * @param {Array} changes Array of changes.
 * @param {String} source Describes the source of the change.
 */
ExternalPluginSkeleton.prototype.onAfterChange = function(changes, source) {
  // afterChange callback goes here.
};

/**
 * The destroy method should de-assign all of your properties.
 */
ExternalPluginSkeleton.prototype.destroy = function() {
  // The super method takes care of de-assigning the event callbacks, plugin hooks and clearing all the plugin properties.
  this._superClass.prototype.destroy.call(this);
};

// You need to register your plugin in order to use it within Handsontable.
Handsontable.plugins.registerPlugin('externalPluginSkeleton', ExternalPluginSkeleton);
```
