---
id: jn1po47i
title: Themes
metaTitle: Themes - JavaScript Data Grid | Handsontable
description: Use one of the built-in themes - light and dark - or the auto version, which switches between light and dark modes automatically.
permalink: /themes
canonicalUrl: /themes
tags:
  - styling
  - themes
  - figma
  - UI kit
  - CSS variables
  - light theme
  - dark theme
  - colors
  - appearance
  - look and feel
  - visual tokens
  - design system
react:
  id: jn2po47i
  metaTitle: Themes - React Data Grid | Handsontable
searchCategory: Guides
category: Styling
---

# Themes

[[toc]]

adsad

<div class="theme-examples">

<div class="theme-examples-controls">
  <div class="example-container">
    <label>
      <select v-model="$parent.$parent.themeName">
        <option value="main">Main</option>
        <option value="elegant">Elegant</option>
      </select>
    </label>
    <label>
      <select v-model="$parent.$parent.themeVariant">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <style id="color-box-style"></style>
    <div class="color-box">
      <span class="color" style="background: var(--theme-primary);"></span>
      <span class="color" style="background: var(--theme-secondary);"></span>
      <span class="color" style="background: var(--theme-accent);"></span>
    </div>
  </div>
</div>

<div id="example-main-light-container" class="theme-example" :style="{display: $parent.$parent.themeName === 'main' && $parent.$parent.themeVariant === 'light' ? 'block' : 'none'}">

::: example-without-tabs #example-main-light
@[code](@/content/guides/styling/themes/javascript/example-main-light.html)
@[code](@/content/guides/styling/themes/javascript/example-main-light.css)
@[code](@/content/guides/styling/themes/javascript/example-main-light.js)
:::

</div>

<div id="example-main-dark-container" class="theme-example" :style="{display: $parent.$parent.themeName === 'main' && $parent.$parent.themeVariant === 'dark' ? 'block' : 'none'}">

::: example-without-tabs #example-main-dark
@[code](@/content/guides/styling/themes/javascript/example-main-dark.html)
@[code](@/content/guides/styling/themes/javascript/example-main-dark.css)
@[code](@/content/guides/styling/themes/javascript/example-main-dark.js)
:::

</div>
</div>
