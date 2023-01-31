---
id: da14qoxl
title: Mobile support
metaTitle: Mobile support - JavaScript Data Grid | Handsontable
description: Although Handsontable is used mainly on desktop, many of its features work on mobile as well.
permalink: /mobile-support
canonicalUrl: /mobile-support
tags:
  - mobile
  - device
  - tablet
  - ios
  - android
  - iphone
  - ipad
react:
  id: 6z0c6tlj
  metaTitle: Mobile support - React Data Grid | Handsontable
searchCategory: Guides
---

# Mobile support

Although Handsontable is used mainly on desktop, many of its features work on mobile as well.

[[toc]]

## Overview

Ogolne info o zachowaniu sie handsontable na mobile.
Info o dodatkowych selection handles (te duze kropki na mobile na rogach komorek)
Info o tym jak header mozna przykleic (position sticky) do viewportu komorki w trakcie scrollowania strony (tzn jak polowa handsontable jest schowana “u gory” ekranu).
Info o accessibility: screen readers na mobilkach
Info o stylowaniu wersji mobile
Info o tym jak zastapic scrollowanie ONE finger scrollowaniem TWO fingers. Case google maps. W przypadku gdy handsontable jest wyzsze niz ekran i jest rozciagniete od brzegu do brzegu uzytkownik moze byc “uwieziony” w handsontable.

## Use Handsontable on mobile

## Features tested on mobile

We test the following areas of Handsontable on a number of physical devices:

| Feature                                 | iOS     | Android |
| --------------------------------------- | ------- | ------- |
| Vertical scroll                         | &check; | &check; |
| Horizontal scroll                       | &check; | &check; |
| Rotation between portrait and landscape | &check; | &check; |
|                                         | &check; | &check; |
|                                         | &check; | &check; |

Single click on a cell
Double-click on a cell to open an editor
Touch on cell
Long touch on cell
Touches and clicks on any cell type
Various functionalities have been tested, including:

Setting row height
Sorting
Nested rows
Collapsing headers
Row hiding
All functionalities available in the dropdown menu on iOS and Android devices have been tested, including:

Inserting rows and columns
Removing rows and columns
Undo and redo
Making cells read-only
Text alignment
Copy and cut
Filtering
All functionalities available in the context menu on Android devices have also been tested, including:

Inserting rows and columns
Removing rows and columns
Undo and redo
Making cells read-only
Merging cells
Custom borders
Comments
Row and column fixing and freezing

See the list of [supported mobile browsers](@/guides/technical-specification/supported-browsers.md#supported-mobile-browsers).

## Known limitations

However, there are a few exceptions:

Autofill (fillHandle)
drag and drop: moving rows and columns, resizing them
Row repopulating may not work properly
In addition, the reported bugs show that there are some main blockers:

the context menu may not function correctly on iOS and iPadOS, it doesn't open at all Long-touch doesn't trigger Context-Menu #917
there are some scrolling issues Scrolling issue on mobiles #656, with fixed columns No scrolling when using fixedColumnsLeft (on tablets) #911,
iPad issues iPadOS 13 & 14 issues #905
we have more than 20 bugs in total related to the mobile devices

## Troubleshooting

If you spot a bug, view [GitHub issues](https://github.com/handsontable/handsontable/issues?q=is%3Aissue+is%3Aopen+mobile+label%3Abug+label%3AMobile) related to mobile support, or report a [new GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose).