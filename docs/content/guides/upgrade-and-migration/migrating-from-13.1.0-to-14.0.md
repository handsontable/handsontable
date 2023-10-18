---
id: migrating-13.1.0-to-14.0
title: Migrating from 13.1.0 to 14.0
metaTitle: Migrating from 13.1.0 to 14.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 13.1.04 to Handsontable 14.0, released on X, 2023.
permalink: /migration-from-13.1.0-to-14.0
canonicalUrl: /migration-from-13.1.0-to-14.0
pageClass: migration-guide
react:
  id: migrating-13.1.0-to-14.0-react
  metaTitle: Migrate from 13.1.0 to 14.0 - React Data Grid | Handsontable
searchCategory: Guides
---

# Migrate from 13.1.0 to 14.0

Migrate from Handsontable 13.1.0 to Handsontable 14.0, released on X, 2023.

[[toc]]

## Change how grid traversal with <kbd>Tab</kbd>

https://github.com/handsontable/handsontable/pull/10430

## Improve keyboard shortcuts navigation throughout the context and dropdown menus

https://github.com/handsontable/handsontable/pull/10519

## Fix table's viewport scrolling issues for NestedHeaders

https://github.com/handsontable/handsontable/pull/10508

## `scrollViewportTo` method change

To fix the scrolling behavour [#10508](https://github.com/handsontable/handsontable/pull/10508) with nested headers, we've made changes to `scrollViewportTo` method. Now, when calling the method without aditional options, the viewport will auto-snap the coordinates to the table edges based on thee scroll direction. 

to maintaine existing functionality, developers shoul made the following adjustments: 

Before:

```js
hot.scrollViewportTo(10, 10);
```

```js
hot.scrollViewportTo({
  row: 10,
  col: 10,
  verticalSnap: "top",
  horizontalSnap: "start",
});
```

## Change the behavior of selecting all cells feature

https://github.com/handsontable/handsontable/pull/10464

## Implement a new focusing mechanism.

https://github.com/handsontable/handsontable/pull/10342

## Implement keyboard navigation in headers

https://github.com/handsontable/handsontable/pull/10301

## Refactor Walkontable Selection rendering module

https://github.com/handsontable/handsontable/pull/10265
