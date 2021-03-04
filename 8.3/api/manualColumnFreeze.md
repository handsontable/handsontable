---
title: ManualColumnFreeze
permalink: /8.3/api/manual-column-freeze
canonicalUrl: /api/manual-column-freeze
---

# {{ $frontmatter.title }}

[[toc]]
## Functions:

### isEnabled
`manualColumnFreeze.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualColumnFreeze+enablePlugin) method is called.



### enablePlugin
`manualColumnFreeze.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`manualColumnFreeze.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### updatePlugin
`manualColumnFreeze.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



### freezeColumn
`manualColumnFreeze.freezeColumn(column)`

Freezes the given column (add it to fixed columns).


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |



### unfreezeColumn
`manualColumnFreeze.unfreezeColumn(column)`

Unfreezes the given column (remove it from fixed columns and bring to it's previous position).


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |


