---
title: DisplaySwitch
metaTitle: DisplaySwitch API reference | Handsontable DataGrid for JavaScript
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L219

:::

_displaySwitch.hidingTimer : number_

Reference to timer, run by `setTimeout`, which is hiding comment.



### showDebounced

::: ask-about-api showDebounced|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L214

:::

_displaySwitch.showDebounced : function_

Show comment after predefined delay. It keeps reference to immutable `debounce` function.



### wasLastActionShow

::: ask-about-api wasLastActionShow|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L209

:::

_displaySwitch.wasLastActionShow : boolean_

Flag to determine if comment can be showed or hidden. State `true` mean that last performed action
was an attempt to show comment element. State `false` mean that it was attempt to hide comment element.


## Methods

### cancel

::: ask-about-api cancel|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L149

:::

_displaySwitch.cancel()_

Drops every pending action: the delayed show, the delayed hide, and the show a rebuild would carry
over. The plugin calls it when it is turned off, because a show armed by a hover before that ran
later and opened the editor over a grid with the plugin off, where nothing could close it. The
last-action flag goes back to its initial `true`, which also silences an older hide timer that
`hide()` left running beside the one it tracks.



### cancelHiding

::: ask-about-api cancelHiding|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L105

:::

_displaySwitch.cancelHiding()_

Cancel hiding comment.



### cancelShow

::: ask-about-api cancelShow|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L139

:::

_displaySwitch.cancelShow()_

Drops the delayed show only, and the range it waits on. A pending hide and the last-action flag
stay as they are, so a comment on screen still hides when its hide was already armed.



### destroy

::: ask-about-api destroy|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L189

:::

_displaySwitch.destroy()_

Destroy the switcher.



### getPendingShowCell

::: ask-about-api getPendingShowCell|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L129

:::

_displaySwitch.getPendingShowCell() ⇒ object | null_

Returns the cell a delayed show waits to open (`row`, `col`), or `null` when no show is pending.



### hide

::: ask-about-api hide|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L81

:::

_displaySwitch.hide()_

Responsible for hiding comment after proper delay.



### keepVisible

::: ask-about-api keepVisible|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L120

:::

_displaySwitch.keepVisible()_

Keeps the comment that is on screen on screen: cancels a pending hide, and drops a pending
show as well.

Dropping the show is what separates this from `cancelHiding()`, and it is required rather than
tidy. `cancelHiding()` also sets `wasLastActionShow` back to `true`, which is the only thing
suppressing a show that a `hide()` had already overruled - so canceling a hide on its own
revives that show, and the comment on screen is replaced by another cell's a moment later.
The caller here is reacting to the pointer resting ON the editor, where the comment already
displayed is the one that belongs there.



### show

::: ask-about-api show|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L98

:::

_displaySwitch.show(range)_

Responsible for showing comment after proper delay.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Coordinates of selected cell. |



### updateDelay

::: ask-about-api updateDelay|DisplaySwitch

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/displaySwitch.ts#L160

:::

_displaySwitch.updateDelay(displayDelay)_

Update the switch settings.


| Param | Type | Description |
| --- | --- | --- |
| displayDelay | `number` | Delay of showing the comments (in milliseconds). |


