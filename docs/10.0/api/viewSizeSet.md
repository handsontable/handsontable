---
title: ViewSizeSet
metaTitle: ViewSizeSet - API Reference - Handsontable Documentation
permalink: /10.0/api/view-size-set
canonicalUrl: /api/view-size-set
hotPlugin: false
editLink: false
---

# ViewSizeSet

[[toc]]

## Description

The class is a source of the truth of information about the current and
next size of the rendered DOM elements and current and next offset of
the view. That information allows us to calculate diff between current
DOM order and this which should be rendered without touching the DOM API at all.

Mostly the ViewSizeSet is created for each individual renderer. But in
the table, there is one case where this size information should be shared
between two different instances (different table renderers). This is a TR
element which can contain TH elements - managed by own renderer and
TD elements - managed by another renderer. To generate correct DOM order
for them it is required to connect these two instances by reference
through `sharedSize`.



