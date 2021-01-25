---
id: header-tooltips
title: HeaderTooltips
sidebar_label: HeaderTooltips
slug: /api/header-tooltips
---
## Description


Allows to add a tooltip to the table headers.

Available options:
* the `rows` property defines if tooltips should be added to row headers,
* the `columns` property defines if tooltips should be added to column headers,
* the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).


**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // enable and configure header tooltips
  headerTooltips: {
    rows: true,
    columns: true,
    onlyTrimmed: false
  }
});
```

## Members
### isEnabled
`headerTooltips.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HeaderTooltips+enablePlugin) method is called.



### enablePlugin
`headerTooltips.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`headerTooltips.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### destroy
`headerTooltips.destroy()`

Destroys the plugin instance.



