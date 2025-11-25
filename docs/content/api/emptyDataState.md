---
title: EmptyDataState
metaTitle: EmptyDataState - JavaScript Data Grid | Handsontable
permalink: /api/empty-data-state
canonicalUrl: /api/empty-data-state
searchCategory: API Reference
hotPlugin: true
editLink: false
id: 4k5m6n7o
description: Options, members, and methods of Handsontable's EmptyDataState API.
react:
  id: 2l3m4n5o
  metaTitle: EmptyDataState - React Data Grid | Handsontable
angular:
  id: x8y9z0a1
  metaTitle: EmptyDataState - Angular Data Grid | Handsontable
---

# Plugin: EmptyDataState

[[toc]]

## Description

The empty data state plugin provides a empty data state overlay system for Handsontable.
It displays a empty data state overlay with customizable message.

In order to enable the empty data state mechanism, [Options#emptyDataState](@/api/options.md#emptydatastate) option must be set to `true`.

The plugin provides several configuration options to customize the empty data state behavior and appearance:
- `message`: Message to display in the empty data state overlay.
  - `title`: Title to display in the empty data state overlay.
  - `description`: Description to display in the empty data state overlay.
  - `buttons`: Buttons to display in the empty data state overlay.
    - `text`: Text to display in the button.
    - `type`: Type of the button.
    - `callback`: Callback function to call when the button is clicked.

**Example**  
::: only-for javascript
```javascript
// Enable empty data state plugin with default messages
emptyDataState: true,

// Enable empty data state plugin with custom message
emptyDataState: {
  message: 'No data available',
},

// Enable empty data state plugin with custom message and buttons for any source
emptyDataState: {
  message: {
    title: 'No data available',
    description: 'There’s nothing to display yet.',
    buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
  },
},

// Enable empty data state plugin with custom message and buttons for specific source
emptyDataState: {
  message: (source) => {
    switch (source) {
      case "filters":
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
          buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
        };
      default:
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
        };
    }
  },
},
```
:::

::: only-for react
```jsx
// Enable empty data state plugin with default messages
<HotTable emptyDataState={true} />;

// Enable empty data state plugin with custom message
<HotTable emptyDataState={{ message: 'No data available' }} />;

// Enable empty data state plugin with custom message and buttons for any source
<HotTable emptyDataState={{
  message: {
    title: 'No data available',
    description: 'There’s nothing to display yet.',
    buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
  }
}} />;

// Enable empty data state plugin with custom message and buttons for specific source
<HotTable emptyDataState={{
  message: (source) => {
    switch (source) {
      case "filters":
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
          buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
        };
      default:
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
        };
    }
  }
}} />;
```
:::

::: only-for angular
```ts
// Enable empty data state plugin with default messages
hotSettings: Handsontable.GridSettings = {
  emptyDataState: true
}

// Enable empty data state plugin with custom message
hotSettings: Handsontable.GridSettings = {
  emptyDataState: {
    message: 'No data available'
  }
}

// Enable empty data state plugin with custom message and buttons for any source
hotSettings: Handsontable.GridSettings = {
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'There’s nothing to display yet.',
      buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
    },
  },
},

// Enable empty data state plugin with custom message and buttons for specific source
hotSettings: Handsontable.GridSettings = {
  emptyDataState: {
    message: (source) => {
      switch (source) {
        case "filters":
          return {
            title: 'No data available for filters',
            description: 'There’s nothing to display yet.',
            buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
          };
        default:
          return {
            title: 'No data available',
            description: 'There’s nothing to display yet.',
          };
      }
    }
  }
}
```

```html
<hot-table [settings]="hotSettings"></hot-table>
```
:::

## Options

### emptyDataState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/dataMap/metaManager/metaSchema.js#L2236

:::

_emptyDataState.emptyDataState : boolean | object_

The `emptyDataState` option configures the [`EmptyDataState`](@/api/emptyDataState.md) plugin.

You can set the `emptyDataState` option to one of the following:

| Setting   | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `false`   | Disable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                     |
| `true`    | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin                      |
| An object | Enable the [`EmptyDataState`](@/api/emptyDataState.md) plugin with custom settings |

If you set the `emptyDataState` option to an object, you can configure the following settings:

| Property  | Possible values                    | Description                                         |
| --------  | ---------------------------------- | --------------------------------------------------- |
| `message` | `string` \| `object` \| `function` | Message to display in the empty data state overlay. |

If you set the `message` option to an object, it have following properties:

| Property      | Possible values | Description                                             |
| ------------- | --------------- | ------------------------------------------------------- |
| `title`       | `string`        | Title to display in the empty data state overlay.       |
| `description` | `string`        | Description to display in the empty data state overlay. |
| `buttons`     | `array`         | Buttons to display in the empty data state overlay.     |

If you set the `buttons` option to an array, each item requires following properties:

| Property   | Possible values          | Description                                                  |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `text`     | `string`                 | Text to display in the button.                        |
| `type`     | 'primary' \| 'secondary' | Type of the button.                                   |
| `callback` | `function`               | Callback function to call when the button is clicked. |

Read more:
- [Plugins: `EmptyDataState`](@/api/emptyDataState.md)

**Default**: <code>false</code>  
**Since**: 16.2.0  
**Example**  
```js
// Enable empty data state plugin with default messages
emptyDataState: true,

// Enable empty data state plugin with custom message
emptyDataState: {
  message: 'No data available',
},

// Enable empty data state plugin with custom message and buttons for any source
emptyDataState: {
  message: {
    title: 'No data available',
    description: 'There’s nothing to display yet.',
    buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
  },
},

// Enable empty data state plugin with custom message and buttons for specific source
emptyDataState: {
  message: (source) => {
    switch (source) {
      case "filters":
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
          buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
        };
      default:
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
        };
    }
  },
},
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L557

:::

_emptyDataState.destroy()_

Destroy plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L289

:::

_emptyDataState.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L245

:::

_emptyDataState.enablePlugin()_

Enable plugin for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L238

:::

_emptyDataState.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L304

:::

_emptyDataState.isVisible() ⇒ boolean_

Check if the plugin is currently visible.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/emptyDataState/emptyDataState.js#L273

:::

_emptyDataState.updatePlugin()_

Update plugin state after Handsontable settings update.


