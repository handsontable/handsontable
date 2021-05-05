---
title: ObserveChanges
permalink: /next/api/observe-changes
canonicalUrl: /api/observe-changes
editLink: false
---

# ObserveChanges

[[toc]]

## Description

This plugin allows to observe data source changes. By default, the plugin is declared as `undefined`, which makes it
disabled. Enabling this plugin switches the table into one-way data binding where changes are applied into the data
source (outside from the table) will be automatically reflected in the table.

**Example**  
```js
// as a boolean
observeChanges: true,
```

To configure this plugin see [observeChanges](#Options+observeChanges).

## Options

### observeChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L2961

:::

_observeChanges.observeChanges : boolean_

***Deprecated***

Enables the [ObserveChanges](./observe-changes/) plugin switches table into one-way data binding where changes are applied into
data source (from outside table) will be automatically reflected in the table.

For every data change [afterChangesObserved](./hooks/#afterchangesobserved) hook will be fired.

**Default**: <code>undefined</code>  
**Example**  
```js
observeChanges: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/observeChanges/observeChanges.js#L182

:::

_observeChanges.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/observeChanges/observeChanges.js#L86

:::

_observeChanges.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/observeChanges/observeChanges.js#L62

:::

_observeChanges.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/observeChanges/observeChanges.js#L55

:::

_observeChanges.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ObserveChanges+enablePlugin) method is called.


