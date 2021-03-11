---
title: Formulas
permalink: /8.5/api/formulas
canonicalUrl: /api/formulas
---

# {{ $frontmatter.title }}

[[toc]]
## Functions:

### destroy
`formulas.destroy()`

Destroys the plugin instance.



### disablePlugin
`formulas.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`formulas.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getCellValue
`formulas.getCellValue(row, column) ⇒ \*`

Returns cell value (evaluated from formula expression) at specified cell coords.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Row index. |
| column | <code>number</code> | Column index. |



### getVariable
`formulas.getVariable(name) ⇒ \*`

Returns variable name.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Variable name. |



### hasComputedCellValue
`formulas.hasComputedCellValue(row, column) ⇒ boolean`

Checks if there are any formula evaluations made under specific cell coords.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Row index. |
| column | <code>number</code> | Column index. |



### isEnabled
`formulas.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#Formulas+enablePlugin) method is called.



### recalculate
`formulas.recalculate()`

Recalculates all formulas (an algorithm will choose the best method of calculation).



### recalculateFull
`formulas.recalculateFull()`

Recalculates all formulas (rebuild dependencies from scratch - slow approach).



### recalculateOptimized
`formulas.recalculateOptimized()`

Recalculates all formulas (recalculate only changed cells - fast approach).



### setVariable
`formulas.setVariable(name, value)`

Sets predefined variable name which can be visible while parsing formula expression.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Variable name. |
| value | <code>\*</code> | Variable value. |


