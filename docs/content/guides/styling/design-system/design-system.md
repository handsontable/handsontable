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
searchCategory: Guides
category: Styling
---

# Handsontable Design System 

[[toc]]

## Overview

The Design System for Figma is a complete toolkit for building, prototyping, and customizing data grids with Handsontable. It includes grid components and design tokens, making it easy to fit Handsontable into your app’s layout or customize it in ways that wouldn’t be possible without built-in features like auto layout, variables, and more.

### Live preview

<iframe class="iframe-responsive" src="https://embed.figma.com/design/H7qfV5G066Qs1kG6AlWkq6/Handsontable-Design-System-(Community)?node-id=4492-11857&embed-host=share" allowfullscreen></iframe>

[Open the Design System in Figma](https://www.figma.com/community/file/1487445656371116081)

## Use tokens to generate a theme

Inside the Figma file, you’ll find local variables defining all data grid components and their characteristics, such as colors, sizes, spacing, fonts, and icons. Variables are provided for two themes — Main and Horizon — each available in dark and light modes.

Customize any variables as needed, then export them as JSON tokens using a tool of your choice—we recommend the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) plugin available in the Figma Community.

Once you've exported the tokens, you can convert them into a CSS theme file compatible with Handsontable using our official [Theme Generator on GitHub](https://github.com/handsontable/handsontable-figma).

<span class="img-light">

![design_system_light]({{$basePath}}/img/design_system_light.png)

</span>

<span class="img-dark">

![design_system_dark]({{$basePath}}/img/design_system_dark.png)

</span>


## Updates frequency

We consider the design system our main reference when planning new features or redesigns, so it’s always updated first. Occasionally, we update it separately from product releases to improve the design experience.

## Known limitations

- The Classic theme isn’t included in the design system because we no longer recommend using it for new projects.

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help