---
title: Loading
metaTitle: Loading - JavaScript Data Grid | Handsontable
permalink: /api/loading
canonicalUrl: /api/loading
searchCategory: API Reference
hotPlugin: true
editLink: false
id: h2m8p4v9
description: Options, members, and methods of Handsontable's Loading API.
react:
  id: n6k3b8r4
  metaTitle: Loading - React Data Grid | Handsontable
angular:
  id: w7t5x9q2
  metaTitle: Loading - Angular Data Grid | Handsontable
---

# Plugin: Loading

[[toc]]

## Description

The loading plugin provides a loading overlay system for Handsontable using the Dialog plugin.
It displays a loading indicator with customizable title, icon, and description.

In order to enable the loading mechanism, [Options#loading](@/api/options.md#loading) option must be set to `true`.

The plugin provides several configuration options to customize the loading behavior and appearance:
- `icon`: Loading icon to display HTML (as string) in svg format (default: `<svg ... />`).
- `title`: Loading title to display (default: 'Loading...').
- `description`: Loading description to display (default: '').

**Example**  
::: only-for javascript
```js
// Enable loading plugin with default options
loading: true,

// Enable loading plugin with custom configuration
loading: {
  icon: 'A custom loading icon in SVG format',
  title: 'Custom loading title',
  description: 'Custom loading description',
}

// Access to loading plugin instance:
const loadingPlugin = hot.getPlugin('loading');

// Show a loading programmatically:
loadingPlugin.show();

// Hide the loading programmatically:
loadingPlugin.hide();

// Check if dialog is visible:
const isVisible = loadingPlugin.isVisible();
```
:::

::: only-for react
```jsx
const MyComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;
    const loadingPlugin = hot.getPlugin('loading');

    loadingPlugin.show();
  }, []);

  return (
    <HotTable
      ref={hotRef}
      settings={{
        data: data,
        loading: {
          icon: 'A custom loading icon in SVG format',
          title: 'Custom loading title',
          description: 'Custom loading description',
        }
      }}
    />
  );
}
```
:::

::: only-for angular
```ts
hotSettings: Handsontable.GridSettings = {
  data: data,
  loading: {
    icon: 'A custom loading icon in SVG format',
    title: 'Custom loading title',
    description: 'Custom loading description',
  }
}
```

```html
<hot-table
  [settings]="hotSettings">
</hot-table>
```
:::

## Options

### loading
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L3075

:::

_loading.loading : boolean | object_

The `loading` option configures the [`Loading`](@/api/loading.md) plugin.

Loading plugin, automatically loads [`Dialog`](@/api/dialog.md) plugin.

You can set the `loading` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the [`Loading`](@/api/loading.md) plugin                           |
| `true`    | Enable the [`Loading`](@/api/loading.md) plugin with default configuration |
| An object | - Enable the [`Loading`](@/api/loading.md) plugin<br>- Apply custom configuration |

If you set the `loading` option to an object, you can configure the following loading options:

| Option        | Possible settings | Description                                               |
| ------------- | ----------------- | --------------------------------------------------------- |
| `icon`        | A string          | Custom loading icon to display (default: `<svg />`)       |
| `title`       | A string          | Custom loading title to display (default: `'Loading...'`) |
| `description` | A string          | Custom loading description to display (default: `''`)     |

Read more:
- [Plugins: `Loading`](@/api/loading.md)

**Default**: <code>false</code>  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Loading` plugin with default configuration
loading: true,

// enable the `Loading` plugin with custom configuration
loading: {
  icon: 'A custom loading icon in SVG format',
  title: 'Custom loading title',
  description: 'Custom loading description',
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L291

:::

_loading.destroy()_

Destroy plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L177

:::

_loading.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L146

:::

_loading.enablePlugin()_

Enable plugin for this Handsontable instance.



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L226

:::

_loading.hide()_

Hide loading dialog.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L139

:::

_loading.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L188

:::

_loading.isVisible() ⇒ boolean_

Check if loading dialog is currently visible.



### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L200

:::

_loading.show(options)_

Show loading dialog with optional custom options.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### update
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L250

:::

_loading.update(options)_

Update loading description without hiding/showing the dialog.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/loading/loading.js#L167

:::

_loading.updatePlugin()_

Update plugin state after Handsontable settings update.


