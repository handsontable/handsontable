---
title: ActionBarComponent
metaTitle: ActionBarComponent - API Reference - Handsontable Documentation
permalink: /10.0/api/action-bar-component
canonicalUrl: /api/action-bar-component
hotPlugin: false
editLink: false
---

# ActionBarComponent

[[toc]]
## Options

### filters
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2794

:::

_filters.filters : boolean_

The [Filters](#filters) plugin allows filtering the table data either by the built-in component or with the API.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable filters
filters: true,
```

## Methods

### accept
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/actionBar.js#L84

:::

_actionBarComponent.accept()_

Fire accept event.



### cancel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/actionBar.js#L91

:::

_actionBarComponent.cancel()_

Fire cancel event.



### getMenuItemDescriptor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/actionBar.js#L62

:::

_actionBarComponent.getMenuItemDescriptor() ⇒ object_

Get menu object descriptor.


