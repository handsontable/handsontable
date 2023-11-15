---
id: migrating-13.1.0-to-14.0
title: Migrating from 13.1.0 to 14.0
metaTitle: Migrating from 13.1.0 to 14.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 13.1.0 to Handsontable 14.0, released on November 15th, 2023.
permalink: /migration-from-13.1.0-to-14.0
canonicalUrl: /migration-from-13.1.0-to-14.0
pageClass: migration-guide
react:
  id: migrating-13.1.0-to-14.0-react
  metaTitle: Migrate from 13.1.0 to 14.0 - React Data Grid | Handsontable
searchCategory: Guides
---

# Migrate from 13.1.0 to 14.0

Migrate from Handsontable 13.1.0 to Handsontable 14.0, released on November 15th, 2023.

[[toc]]

<!-- ## Fix table's viewport scrolling issues for NestedHeaders -->
<!-- https://github.com/handsontable/handsontable/pull/10508 -->

## `scrollViewportTo method change
To maintain the previous behavior when using the scrollViewportTo method, developers should make the following adjustments:

Before:

```js
hot.scrollViewportTo(10, 10);
```

After:
```js
hot.scrollViewportTo({
  row: 10,
  col: 10,
  verticalSnap: "top",
  horizontalSnap: "start",
});
```

<!-- 
## Implement a new focusing mechanism.
https://github.com/handsontable/handsontable/pull/10342
Potentially mention ime -->