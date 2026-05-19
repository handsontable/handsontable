---
type: explanation
id: xfus5qpz
title: Design System
metaTitle: Design System / UI Kit - JavaScript Data Grid | Handsontable
description: Design, prototype, and customize spreadsheet-like components with the Design System for Figma.
permalink: /handsontable-design-system
canonicalUrl: /handsontable-design-system
tags:
  - styling
  - figma
  - UI kit
  - design system
  - grid components
  - prototyping
  - themes
  - CSS variables
  - local variables
  - tokens
react:
  id: 0mz9id0l
  metaTitle: Design System / UI Kit - React Data Grid | Handsontable
angular:
  id: vru7jook
  metaTitle: Design System / UI Kit - Angular Data Grid | Handsontable
searchCategory: Guides
category: Styling
---
The Handsontable design system defines the tokens, themes, and components that control the grid visual appearance. Read this to understand how themes and CSS variables relate.

[[toc]]

## Overview

The Handsontable Design System is a complete toolkit for building, prototyping, and customizing data grids with Handsontable. It includes grid components and design tokens, making it easy to fit Handsontable into your app’s layout or customize it in ways that wouldn’t be possible without built-in features like auto layout, variables, and more.

## Live preview

<iframe style="width:100%;height:360px;border:0" src="https://embed.figma.com/file/1487445656371116081/hf_embed?community_viewer=true&embed_host=fastma&fuid=644302446942094315&kind=file&page-selector=0&viewer=1" allowfullscreen></iframe>

<a href="https://www.figma.com/community/file/1487445656371116081" target="_blank" rel="noopener noreferrer">Open the Design System in Figma <svg aria-hidden="true" style="display:inline;vertical-align:middle;margin-left:2px" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/><path d="M11 13l9 -9"/><path d="M15 4h5v5"/></svg></a>

## Use tokens to generate a theme

Inside the Figma file, you’ll find local variables that define all parts of the data grid — like colors, spacing, font styles, icon sizes, and more. These variables are organized into three themes: Main, Horizon and Classic each available in both light and dark mode.

You can tweak the variables however you like to match your brand or product style. Once you’re happy with the changes, export them as JSON tokens. We recommend using the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) plugin from the Figma Community — it’s straightforward and does the job well.

After exporting, head over to our [Theme Generator on GitHub](https://github.com/handsontable/handsontable-figma) to convert your tokens into a CSS theme and JavaScript variables object that works with Handsontable.

<span class="img-light">

![design_system_light](/img/design_system_light.png)

</span>

<span class="img-dark">

![design_system_dark](/img/design_system_dark.png)

</span>


## Updates frequency

The design system is our primary reference when planning new features or redesigns, and it’s always kept up to date. In some cases, we update the design system independently of product releases to enhance consistency and streamline the design workflow.

## Known limitations

- The legacy style is not part of the design system. Starting from version 17.0.0, legacy styles are no longer supported and you need to migrate to the Classic theme.

## Related blog articles

<div class="boxes-list gray">

- [From components to tables: Designing a data table component in your design system](https://handsontable.com/blog/from-components-to-tables-designing-a-data-table-component-in-your-design-system)

</div>

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>

## Related

<div class="boxes-list">

- [Themes](@/guides/styling/themes/themes.md)
- [Legacy Style](@/guides/styling/legacy-style/legacy-style.md)

</div>