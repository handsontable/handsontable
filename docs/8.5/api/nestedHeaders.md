---
title: NestedHeaders
permalink: /8.5/api/nested-headers
canonicalUrl: /api/nested-headers
---

# {{ $frontmatter.title }}

[[toc]]

## Description


The plugin allows to create a nested header structure, using the HTML's colspan attribute.

To make any header wider (covering multiple table columns), it's corresponding configuration array element should be
provided as an object with `label` and `colspan` properties. The `label` property defines the header's label,
while the `colspan` property defines a number of columns that the header should cover.

__Note__ that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
other words, headers cannot overlap each other.


**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  nestedHeaders: [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 ],
```
## Members:

### detectedOverlappedHeaders
`nestedHeaders.detectedOverlappedHeaders : boolean`

The flag which determines that the nested header settings contains overlapping headers
configuration.


## Functions:

### destroy
`nestedHeaders.destroy()`

Destroys the plugin instance.



### disablePlugin
`nestedHeaders.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`nestedHeaders.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### isEnabled
`nestedHeaders.isEnabled() ⇒ boolean`

Check if plugin is enabled.



### updatePlugin
`nestedHeaders.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


