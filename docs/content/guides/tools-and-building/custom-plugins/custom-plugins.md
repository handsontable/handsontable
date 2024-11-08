---
id: 39o3uw0q
title: Custom plugins
metaTitle: Custom plugins - JavaScript Data Grid | Handsontable
description: Extend Handsontable's functionality by writing your custom plugin. Use the BasePlugin for a quick start.
permalink: /custom-plugins
canonicalUrl: /custom-plugins
tags:
  - plugin development
  - skeleton
  - extend
react:
  id: y66k6b2h
  metaTitle: Custom plugins - React Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
---

# Custom plugins

Extend Handsontable's functionality by writing your custom plugin. Use the BasePlugin for a quick start.

[[toc]]

## Overview

Plugins are a great way of extending Handsontable's capabilities. In fact, most Handsontable features are provided by plugins.

::: only-for react

You can create a custom plugin in JavaScript, and then reference it from within your React app.

:::

### 1. Prerequisites

Import the following:
- [`BasePlugin`](@/api/basePlugin.md) - a built-in interface that lets you work within Handsontable's lifecycle,
- `registerPlugin` - a utility to register a plugin in the Handsontable plugin registry.


```js
import { BasePlugin, registerPlugin } from 'handsontable/plugins';
```

### 2. Extend the [`BasePlugin`](@/api/basePlugin.md)
The best way to start creating your own plugin is to extend the [`BasePlugin`](@/api/basePlugin.md).

The [`BasePlugin`](@/api/basePlugin.md) interface takes care of:
- Backward compatibility
- Memory leak prevention
- Properly binding your plugin's instance to Handsontable

```js
export class CustomPlugin extends BasePlugin {
 /**
  * Define a unique key (a string) for your plugin.
  * The key becomes the plugin's alias.
  * Handsontable registers the plugin under that alias.
  * When an `updateSettings()` call includes the plugin's alias,
  * your plugin's state gets updated.
  * You can also use the alias to recognize the plugin's
  * options passed through the Setting object at Handsontable's initialization.
  *
  * @returns {string}
  */
  static get PLUGIN_KEY() {
    return 'customPlugin';
  }

 /**
  * Define additional setting keys (an array of strings) for your plugin.
  * When an `updateSettings()` call includes at least one of those setting keys,
  * your plugin's state gets updated.
  * If you set SETTING_KEYS() to return `true`, your plugin updates on every `updateSettings()` call.
  * If you set SETTING_KEYS() to return `false`, your plugin never updates on any `updateSettings()` call.
  *
  * @returns {Array|boolean}
  */
  static get SETTING_KEYS() {
    return true;
  }

  /**
   * Extend the default constructor and define internal properties for your plugin.
   *
   * @param {Handsontable} hotInstance
   */
  constructor(hotInstance) {
     /**
     * The [`BasePlugin`](@/api/basePlugin.md)'s constructor adds a `this.hot` property to your plugin.
     * The `this.hot` property:
     * - Is a reference to the Handsontable instance.
     * - Can't be overwritten.
     * - Gives you access to columns' and rows' index mappers.
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
  getUnifiedConfig() {
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
    const pluginSettings = this.getUnifiedConfig();

    return pluginSettings.enabled;
  }

  /**
   * The `enablePlugin` method is triggered on the `beforeInit` hook.
   * It should contain your plugin's initial setup and hook connections.
   * This method is run only if the `isEnabled` method returns `true`.
   */
  enablePlugin() {
    // Get the plugin's configuration from the initialization object.
    this.configuration = this.getUnifiedConfig();

    // Add all your plugin hooks here. It's a good idea to use arrow functions to keep the plugin as a context.
    this.addHook('afterChange', (changes, source) => this.onAfterChange(changes, source));

    // The `super` method sets the `this.enabled` property to `true`.
    // It is a necessary step to update the plugin's settings properly.
    super.enablePlugin();
  }

  /**
   * The `disablePlugin` method disables the plugin.
   */
  disablePlugin() {
    // Reset all of your plugin class properties to their default values here.
    this.configuration = null;

    // The `BasePlugin.disablePlugin` method takes care of clearing the hook connections
    // and assigning the 'false' value to the 'this.enabled' property.
    super.disablePlugin();
  }

  /**
   * The `updatePlugin` method is called on the `afterUpdateSettings` hook
   * (unless the `updateSettings` method turned the plugin off),
   * but only if the config object passed to the `updateSettings` method
   * contains entries relevant to that particular plugin.
   *
   * The `updatePlugin` method should contain anything that your plugin needs to do to work correctly
   * after updating the Handsontable instance settings.
   */
  updatePlugin() {
    // The `updatePlugin` method needs to contain all the code needed to properly re-enable the plugin.
    // In most cases simply disabling and enabling the plugin should do the trick.
    const { enabled, msg } = this.getUnifiedConfig();

    // You can decide if updating the settings triggers the the disable->enable routine or not.
    if (enabled === false && this.enabled === true) {
      this.disablePlugin();

    } else if (enabled === true && this.enabled === false) {
      this.enablePlugin();
    }

    // If you need to update just a single option.
    if (this.configuration !== null && msg && this.configuration.msg !== msg) {
      this.configuration.msg = msg;
    }

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
    // The `super` method cleans up the plugin's event callbacks, hook connections, and properties.
    super.destroy();
  }
}
```

### 3. Register CustomPlugin
Now, register your plugin.

There are two ways to register a plugin:

- **Option 1**: Define a static getter named `PLUGIN_KEY` that the `registerPlugin` utility uses as the plugin's alias. Check the example in the code snippet above.
  ```js
  // You need to register your plugin in order to use it within Handsontable.
  registerPlugin(CustomPlugin);
  ```
- **Option 2**: Use a custom alias. Put a string in the first argument. The registerer uses that string as an alias, instead of the `PLUGIN_KEY` getter from `CustomPlugin`.
  ```js
  registerPlugin('CustomAlias', CustomPlugin);
  ```

### 4. Use your plugin in Handsontable
To control the plugin's options, pass a boolean or an object at the plugin's initialization:

::: only-for javascript

```js
import Handsontable from 'handsontable';
import { CustomPlugin } from './customPlugin';

const hotInstance = new Handsontable(container, {
  // Pass `true` to enable the plugin with default options.
  [CustomPlugin.PLUGIN_KEY]: true,
  // You can also enable the plugin by passing an object with options.
  [CustomPlugin.PLUGIN_KEY]: {
    msg: 'user-defined message',
  },
  // You can also initialize the plugin without enabling it at the beginning.
  [CustomPlugin.PLUGIN_KEY]: false,
});
```

:::

::: only-for react

```jsx
import Handsontable from 'handsontable';
import { CustomPlugin } from './customPlugin';

<HotTable
  // Pass `true` to enable the plugin with default options.
  customPlugin={true}
  // You can also enable the plugin by passing an object with options.
  customPlugin={{
    msg: 'user-defined message',
  }}
  // You can also initialize the plugin without enabling it at the beginning.
  customPlugin={false}
/>
```

:::

### 5. Get a reference to the plugin's instance
To use the plugin's API, call the [`getPlugin`](@/api/core.md#getplugin) method to get a reference to the plugin's instance.

::: only-for javascript

```js
const pluginInstance = hotInstance.getPlugin(CustomPlugin.PLUGIN_KEY);

pluginInstance.externalMethodExample();
```

:::

::: only-for react

::: tip

To use the Handsontable API, create a reference to the `HotTable` component, and read its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

```jsx
const hotTableComponentRef = useRef(null);

const pluginInstance = hotTableComponentRef.current.hotInstance.getPlugin(CustomPlugin.PLUGIN_KEY);
```

:::

## Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Core methods:
  - [`getPlugin()`](@/api/core.md#getplugin)
- Hooks:
  - [`afterPluginsInitialized`](@/api/hooks.md#afterpluginsinitialized)
