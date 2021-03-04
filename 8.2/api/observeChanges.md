---
title: ObserveChanges
permalink: /8.2/api/observe-changes
canonicalUrl: /api/observe-changes
---

# {{ $frontmatter.title }}

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

To configure this plugin see [Options#observeChanges](./Options/#observeChanges).
## Functions:

### isEnabled
`observeChanges.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ObserveChanges+enablePlugin) method is called.



### enablePlugin
`observeChanges.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`observeChanges.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### destroy
`observeChanges.destroy()`

Destroys the plugin instance.


