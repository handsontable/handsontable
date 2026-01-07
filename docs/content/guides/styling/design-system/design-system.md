---
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

# Handsontable Design System

Design, prototype, and customize your data grid with the Design System for Figma.

[[toc]]

## Overview

The Handsontable Design System is a complete toolkit for building, prototyping, and customizing data grids with Handsontable. It includes grid components and design tokens, making it easy to fit Handsontable into your app’s layout or customize it in ways that wouldn’t be possible without built-in features like auto layout, variables, and more.

## Live preview

<iframe class="iframe-responsive" src="https://embed.figma.com/file/1487445656371116081/hf_embed?community_viewer=true&embed_host=fastma&fuid=644302446942094315&kind=file&page-selector=0&viewer=1" allowfullscreen></iframe>

[Open the Design System in Figma](https://www.figma.com/community/file/1487445656371116081)

## Use tokens to generate a theme

Inside the Figma file, you’ll find local variables that define all parts of the data grid — like colors, spacing, font styles, icon sizes, and more. These variables are organized into two themes: Main and Horizon, each available in both light and dark mode.

You can tweak the variables however you like to match your brand or product style. Once you’re happy with the changes, export them as JSON tokens. We recommend using the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) plugin from the Figma Community — it’s straightforward and does the job well.

After exporting, head over to our [Theme Generator on GitHub](https://github.com/handsontable/handsontable-figma) to convert your tokens into a CSS theme file that works with Handsontable.

<span class="img-light">

![design_system_light]({{$basePath}}/img/design_system_light.png)

</span>

<span class="img-dark">

![design_system_dark]({{$basePath}}/img/design_system_dark.png)

</span>


## Updates frequency

The design system is our primary reference when planning new features or redesigns, and it’s always kept up to date. In some cases, we update the design system independently of product releases to enhance consistency and streamline the design workflow.

## Known limitations

- The legacy style is not part of the design system as we advise against its use in new projects. Starting from version 16.1, you can utilize the new Classic theme.

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help