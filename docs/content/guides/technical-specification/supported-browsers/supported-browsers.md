---
type: reference
title: Supported browsers
metaTitle: Supported browsers | Handsontable DataGrid for JavaScript
description: Handsontable DataGrid supports the most popular desktop and mobile browsers, such as Chrome, Safari, Firefox, Edge, Opera, Samsung Internet, and others.
permalink: /supported-browsers
canonicalUrl: /supported-browsers
tags:
  - compatibility
react:
  metaTitle: Supported browsers | Handsontable DataGrid for React
angular:
  metaTitle: Supported browsers | Handsontable DataGrid for Angular
vue:
  metaTitle: Supported browsers | Handsontable DataGrid for Vue
searchCategory: Guides
category: Technical specification
menuTag: updated
---
Handsontable DataGrid supports all the most popular desktop and mobile browsers.

[[toc]]

## Overview

We carefully test our code on the **two latest versions** of most-popular modern browser, on both mobile and desktop devices. In addition to running unit and end-to-end tests, we focus on two factors that are crucial for all users: performance and accuracy of the user interface.

## Testing compatibility

Tests are run in [BrowserStack](https://www.browserstack.com/) as well as on a limited number of physical desktop and mobile devices. Access to physical machines gives us an opportunity to measure the performance better which is hard to do with virtual machines.

## List of supported browsers

| Desktop Browsers | Mobile Browsers     |
| :--------------- | :------------------ |
| Chrome           | Chrome              |
| Firefox          | Safari iOS          |
| Safari           |                     |
| Edge             |                     |

## Minimum versions

Each Handsontable release is built to run on a minimum version of each browser. In an older version, the grid can throw errors or render without parts of its theme.

| Browser        | Handsontable 18.x | Handsontable 19.0 |
| :------------- | :---------------- | :---------------- |
| Chrome         | 110               | 130               |
| Edge           | Not declared      | 130               |
| Firefox        | 110               | 132               |
| Safari (macOS) | 14.1              | 18.2              |
| Safari (iOS)   | Not declared      | 18.2              |

Handsontable 18.x declares minimum versions for Chrome, Firefox, and Safari only. It declares none for Edge or for Safari on iOS. Chrome and Firefox on Android have no minimum declared separately.

Handsontable doesn't ship polyfills. In a browser below the minimum, the grid can fail with errors such as `X is not a function`. Transpiling or polyfilling Handsontable yourself isn't tested.

The minimum versions are not the versions Handsontable is tested on. Tests run on the two latest versions of each browser, which are newer than the minimums.

If you upgrade from 18.1 to 19.0, see [The minimum browser versions are higher](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#the-minimum-browser-versions-are-higher).
