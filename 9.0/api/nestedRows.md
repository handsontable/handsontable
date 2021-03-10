---
title: NestedRows
permalink: /9.0/api/nested-rows
canonicalUrl: /api/nested-rows
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin responsible for displaying and operating on data sources with nested structures.


## Functions:

### destroy
`nestedRows.destroy()`

Destroys the plugin instance.



### disableCoreAPIModifiers
`nestedRows.disableCoreAPIModifiers()`

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### disablePlugin
`nestedRows.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enableCoreAPIModifiers
`nestedRows.enableCoreAPIModifiers()`

Disable the modify hook skipping flag.



### enablePlugin
`nestedRows.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### isEnabled
`nestedRows.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#NestedRows+enablePlugin) method is called.



### updatePlugin
`nestedRows.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


