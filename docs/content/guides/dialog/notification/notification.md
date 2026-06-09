---
type: how-to
title: Notification
metaTitle: Notification - JavaScript Data Grid | Handsontable
description: Show non-blocking toast notifications anchored to the grid with the Notification plugin.
permalink: /notification
canonicalUrl: /notification
tags:
  - notification
  - toast
  - dialog
  - accessibility
react:
  metaTitle: Notification - React Data Grid | Handsontable
angular:
  metaTitle: Notification - Angular Data Grid | Handsontable
vue:
  metaTitle: Notification - Vue Data Grid | Handsontable
searchCategory: Guides
category: Dialog
menuTag: new
---

Show non-blocking toast notifications for save confirmations, errors, and other transient feedback. Toasts are anchored to the Handsontable root, support stacking per corner, and work with the design system themes.

[[toc]]

## Overview

The Notification plugin adds a small API on top of the grid: `showMessage`, `hide`, `hideAll`, `isVisible`, and `getQueueSize`. You can choose severity variants, corner positions, optional titles, action buttons, and auto-dismiss timing. The plugin is disabled by default; set [`notification`](@/api/options.md#notification) to `true` or to a configuration object.

Toasts use `aria-live="polite"` for informational variants and `aria-live="assertive"` for the `error` variant so assistive technologies announce them without moving keyboard focus. Press **F6** to move focus into the notification region when at least one toast is visible; **Tab** and **Shift+Tab** then move between controls across visible toasts. **Tab** from the last control in the region moves focus to the highlighted grid cell (the notification host follows the grid in the DOM, so default tab order would otherwise leave the table). **Shift+Tab** from the first control behaves like **Escape** and returns focus to the element that was active before you entered. Press **Escape** to leave the region the same way. Hiding the last toast while focus is in the notification region or on that toast restores focus the same way as **Escape**. Opening a toast does not move focus on its own.

## Basic configuration

Enable the plugin with [`notification: true`](@/api/options.md#notification), then call [`showMessage()`](@/api/notification.md#showmessage) for each toast. The example below opens four toasts at once (`duration: 0`), one in each corner (`top-start`, `top-end`, `bottom-start`, and `bottom-end`), with `info`, `success`, `warning`, and `error` variants.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/dialog/notification/javascript/example1.js)
@[code](@/content/guides/dialog/notification/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/dialog/notification/react/example1.jsx)
@[code](@/content/guides/dialog/notification/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/notification/angular/example1.ts)
@[code](@/content/guides/dialog/notification/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/dialog/notification/vue/example1.vue)

:::

:::

## Toolbar actions (inventory-style)

Use separate buttons for save, error recovery, and warnings. Primary and secondary actions on an error toast can call `hideAll()` before showing follow-up feedback.

::: only-for javascript

::: example #example2 --js 1 --ts 2 --html 3

@[code](@/content/guides/dialog/notification/javascript/example2.js)
@[code](@/content/guides/dialog/notification/javascript/example2.ts)
@[code](@/content/guides/dialog/notification/javascript/example2.html)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/dialog/notification/react/example2.jsx)
@[code](@/content/guides/dialog/notification/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/notification/angular/example2.ts)
@[code](@/content/guides/dialog/notification/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/dialog/notification/vue/example2.vue)

:::

:::

## API summary

| Method | Description |
| ------ | ----------- |
| `showMessage(options)` | Shows a toast. Returns a string id. |
| `hide(id)` | Hides one toast. |
| `hideAll()` | Hides every visible toast and clears the queue. |
| `isVisible(id?)` | Returns whether a given toast or any toast is visible. |
| `getQueueSize()` | Returns how many toasts are waiting when `stackLimit` is reached. |

Hooks: `beforeNotificationShow`, `afterNotificationShow`, `beforeNotificationHide`, and `afterNotificationHide`. Returning `false` from `beforeNotificationShow` cancels `showMessage` (no id, nothing enqueued). That hook runs once per call to `showMessage`, including when the toast is queued because `stackLimit` is full; it does not run again when a queued toast mounts. Returning `false` from `beforeNotificationHide` keeps the toast visible and stops automatic dismissal for that toast.

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 16.2.0: Simplified theming and advanced user notifications](https://handsontable.com/blog/handsontable-16.2.0-simplified-theming-and-advanced-user-notifications)

</div>

## Read more

- [`Notification`](@/api/notification.md) plugin reference.
- [`notification`](@/api/options.md#notification) grid option.
