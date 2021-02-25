---
title: BindRowsWithHeaders
permalink: /8.2/api/bind-rows-with-headers
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin allows binding the table rows with their headers.

If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if
at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.


**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // enable plugin
  bindRowsWithHeaders: true
});
```

## Members
### isEnabled
`bindRowsWithHeaders.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#BindRowsWithHeaders+enablePlugin) method is called.



### enablePlugin
`bindRowsWithHeaders.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`bindRowsWithHeaders.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### destroy
`bindRowsWithHeaders.destroy()`

Destroys the plugin instance.



