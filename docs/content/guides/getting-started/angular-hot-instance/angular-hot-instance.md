---
type: how-to
title: Instance access
metaTitle: Instance access - Javascript Data Grid | Handsontable
description: Reference a Handsontable instance from within a Angular component, to programmatically perform actions.
permalink: /instance-access
canonicalUrl: /instance-access
tags:
  - referring
  - referencing
  - instance
angular:
  metaTitle: Instance access - Angular Data Grid | Handsontable
searchCategory: Guides
onlyFor: angular
category: Getting started
---
Use @ViewChild to get a reference to the Handsontable instance from your Angular component, then call API methods programmatically.

[[toc]]

## Use Handsontable's API

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do this, call the API methods of the relevant Handsontable instance associated with your instance of the [`HotTableComponent`](@/guides/getting-started/installation/installation.md#use-the-hottable-component). Access to the Handsontable instance can be obtained as early as in the `ngAfterViewInit()` lifecycle hook by using the `@ViewChild` decorator, which holds a reference to the wrapper component.

The following example implements the [`HotTableComponent`](@/guides/getting-started/installation/installation.md#use-the-hottable-component) showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/angular-hot-instance/angular/example1.ts)
@[code](@/content/guides/getting-started/angular-hot-instance/angular/example1.html)

:::

## Result

Your Angular component now holds a reference to the Handsontable instance through `@ViewChild`. You can call any Handsontable API method on that instance from within the component's lifecycle hooks or event handlers.
