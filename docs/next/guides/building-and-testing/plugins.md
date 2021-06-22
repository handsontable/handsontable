---
title: Plugins
metaTitle: Plugins - Guide - Handsontable Documentation
permalink: /next/plugins
canonicalUrl: /plugins
tags:
  - custom plugin
  - skeleton
  - extend
---

# Plugins

[[toc]]

## Overview

Plugin is a one great way to extend the capabilities of Handsontable. In fact, most of features available in this library are provided by plugins.

This guide will lead you, step-by-step, through the process of creating a custom extension.

### 1. Prerequisites

You need to import the following things:
- `BasePlugin` - contains the basic interface to work within Handsontable's lifecycle,
- `registerPlugin` - utility to register the plugin in Handsontable plugins registry.

Both provide the basic interface necessary to create a reusable plugin.

```js
import { BasePlugin, registerPlugin } from 'handsontable/plugins';
```

### 2. Extend BasePlugin
Extending our `BasePlugin` is a recommended way to start creating your next extension.
In this built-in interface, we care about many factors such as backward compatibility, memory leaks preventions and proper binding plugin's instance with Handsontable.


```js
export class CustomPlugin extends BasePlugin {
  /**
   * Define a unique plugin's key.
   * Handsontable uses that string to register the plugin under that alias.
   * Moreover, you might also use the same parameter to recognize the plugin's
   * options passed through the Setting object at Handsontable initialization.
   *
   * @returns {string}
   */
  static get PLUGIN_KEY() {
    return 'customPlugin';
  }

  /**
   * Extend the default constructor and define internal properties for your plugin.
   *
   * @param {Handsontable} hotInstance
   */
  constructor(hotInstance) {
    /**
     * BasePlugin's constructor adds to our custom plugin the following properties:
     * - `this.hot` - a reference to the Handsontable instance, you can't overwrite this property,
     */
    super(hotInstance);

    // Initialize all your public properties in the class' constructor.
    this.configuration = {
      enabled: false,
      msg: ''
    };
  }

  /**
   * Unifies configuration passed to settings object.
   *
   * @returns {object}
   * @throws {Error}
   */
  unifyConfiguration() {
    const pluginSettings = this.hot.getSettings()[CustomPlugin.PLUGIN_KEY];

    if (pluginSettings === true) {
      return {
        enabled: true,
        msg: 'default msg boolean'
      };
    }
    if (Object.prototype.toString.call(pluginSettings) === '[object Object]') {
      return {
        enabled: true,
        msg: 'default msg obj',
        ...pluginSettings
      };
    }
    if (pluginSettings === false) {
      return {
        enabled: false,
        msg: ''
      };
    }

    throw new Error(
      `${CustomPlugin.PLUGIN_KEY} - incorrect plugins configuration.
      Passed:
        - type: ${typeof pluginSettings}
        - value: ${JSON.stringify(pluginSettings, null, ' ')}

      Expected:
        - boolean
        - object
      `
    );
  }

  /**
   * Checks if the plugin is enabled in the settings.
   */
  isEnabled() {
    const pluginSettings = this.unifyConfiguration();

    return pluginSettings.enabled;
  }

  /**
   * The `enablePlugin` method is triggered on the `beforeInit` hook.
   * It should contain your initial plugin setup, along with the hooks connections.
   * Note, that this method is run only if the statement in the `isEnabled` method returns true.
   */
  enablePlugin() {
    // Read the plugins' configuration from the initialization object.
    this.configuration = this.unifyConfiguration(
      this.hot.getSettings()[CustomPlugin.PLUGIN_KEY]
    );

    // Add all your plugin hooks here. It's a good idea to use arrow functions to keep the plugin as a context.
    this.addHook('afterChange', (changes, source) => this.onAfterChange(changes, source));

    // The super method assigns the this.enabled property to true.
    // It is a necessary step to update the plugin's settings properly.
    super.enablePlugin();
  }

  /**
   * The disablePlugin method is used to disable the plugin.
   */
  disablePlugin() {
    // Reset all of your plugin class properties to their default values here.
    this.configuration = this.verifyConfiguration(this.hot.getSettings()[CustomPlugin.PLUGIN_KEY]);

    // The `BasePlugin.disablePlugin` method takes care of clearing the hook connections
    // and assigning the 'false' value to the 'this.enabled' property.
    super.disablePlugin();
  }

  /**
   * The updatePlugin method is called on the `afterUpdateSettings` hook
   * (unless the updateSettings method turned the plugin off).
   *
   * It should contain all the stuff your plugin needs to do to work correctly
   * after updating Handsontable instance settings.
   */
  updatePlugin() {
    // The `updatePlugin` method needs to contain all the code needed to properly re-enable the plugin.
    // In most cases simply disabling and enabling the plugin should do the trick.
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Define your external methods.
   */
  externalMethodExample() {
    // Method definition.
  }

  /**
   * The afterChange hook callback.
   *
   * @param {CellChange[]} changes An array of changes.
   * @param {string} source Describes the source of the change.
   */
  onAfterChange(changes, source) {
    // afterChange callback goes here.
    console.log(
      `${CustomPlugin.PLUGIN_KEY}.onAfterChange - ${this.configuration.msg}`,
      changes,
      source
    );
  }

  /**
   * The `destroy` method is the best place to clean up any instances,
   * objects or index mappers created during the plugin's lifecycle.
   */
  destroy() {
    // The super method takes care of de-assigning the event callbacks,
    // plugin hooks and clearing all the plugin properties.
    super.destroy();
  }
}
```

### 3. Register CustomPlugin
Last but not least, you need to register the plugin. This is the only way to use plugins in Handsontable.
There are two ways to do that.

- You can define a static getter named `PLUGIN_KEY` that the `registerPlugin` utility uses as the plugin's alias. Usage example you can find in the above code snippet.
  ```js
  // You need to register your plugin in order to use it within Handsontable.
  registerPlugin(CustomPlugin);
  ```
- You can also use the alternative alias.
  ```js
  registerPlugin('CustomAlias', CustomPlugin);
  ```

### 4. Use plugin in Handsontable
Accordingly, to the supported options for the plugin, you might control it, passing in its options the boolean or object.
The following snippet presents all possible approaches:

```js
import Handsontable from 'handsontable';
import { CustomPlugin } from './customPlugin';

const hotInstance = new Handsontable(container, {
  // You can enable plugin by passing `true` to use default options.
  [CustomPlugin.PLUGIN_KEY]: true,
  // You can also enable the plugin by passing an object with options.
  [CustomPlugin.PLUGIN_KEY]: {
    optionA: 'a',
  },
  // You can also initialize the plugin without enabling it at the beginning.
  [CustomPlugin.PLUGIN_KEY]: false,
});
```

### 5. Get a reference to the plugin's instance
To use the plugin's API you may use [`getPlugin`](../api/core/#getplugin) method to get a reference to its instance.

```js
const pluginInstance = hotInstance.getPlugin(CustomPlugin.PLUGIN_KEY);

pluginInstance.externalMethodExample();
```
