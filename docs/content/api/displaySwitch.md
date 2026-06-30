---
title: DisplaySwitch
metaTitle: DisplaySwitch API reference – JavaScript Data Grid | Handsontable
permalink: /api/display-switch
canonicalUrl: /api/display-switch
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Display switch for the Comments plugin. Manages the time of delayed displaying / hiding comments.



## Description

Initializes the display switch and configures the debounced show delay.


## Members

### hidingTimer

::: ask-about-api hidingTimer|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L87

:::

_displaySwitch.hidingTimer : number_

Reference to timer, run by `setTimeout`, which is hiding comment.



### showDebounced

::: ask-about-api showDebounced|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L82

:::

_displaySwitch.showDebounced : function_

Show comment after predefined delay. It keeps reference to immutable `debounce` function.



### wasLastActionShow

::: ask-about-api wasLastActionShow|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L77

:::

_displaySwitch.wasLastActionShow : boolean_

Flag to determine if comment can be showed or hidden. State `true` mean that last performed action
was an attempt to show comment element. State `false` mean that it was attempt to hide comment element.


## Methods

### cancelHiding

::: ask-about-api cancelHiding|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L47

:::

_displaySwitch.cancelHiding()_

Cancel hiding comment.



### destroy

::: ask-about-api destroy|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L66

:::

_displaySwitch.destroy()_

Destroy the switcher.



### hide

::: ask-about-api hide|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L29

:::

_displaySwitch.hide()_

Responsible for hiding comment after proper delay.



### show

::: ask-about-api show|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L41

:::

_displaySwitch.show(range)_

Responsible for showing comment after proper delay.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Coordinates of selected cell. |



### updateDelay

::: ask-about-api updateDelay|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/displaySwitch.ts#L56

:::

_displaySwitch.updateDelay(displayDelay)_

Update the switch settings.


| Param | Type | Description |
| --- | --- | --- |
| displayDelay | `number` | Delay of showing the comments (in milliseconds). |


