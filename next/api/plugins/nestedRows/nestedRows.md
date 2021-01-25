---
id: nested-rows
title: NestedRows
sidebar_label: NestedRows
slug: /api/nested-rows
---
## Description


Plugin responsible for displaying and operating on data sources with nested structures.



## Members
### isEnabled
`nestedRows.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#NestedRows+enablePlugin) method is called.



### enablePlugin
`nestedRows.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`nestedRows.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### updatePlugin
`nestedRows.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disableCoreAPIModifiers
`nestedRows.disableCoreAPIModifiers()`

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### enableCoreAPIModifiers
`nestedRows.enableCoreAPIModifiers()`

Disable the modify hook skipping flag.



### destroy
`nestedRows.destroy()`

Destroys the plugin instance.



