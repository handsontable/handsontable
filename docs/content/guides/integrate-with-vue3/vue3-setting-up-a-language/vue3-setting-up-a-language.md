---
type: how-to
id: 7ezlo7y5
title: Setting up a translation in Vue 3
metaTitle: Setting up a translation - Vue 3 Data Grid | Handsontable
description: Configure your Vue 3 data grid with different number formats, depending on the specified language and culture.
permalink: /vue3-setting-up-a-translation
canonicalUrl: /vue3-setting-up-a-translation
react:
  id: 5sootj6b
  metaTitle: Setting up a translation - Vue 3 Data Grid | Handsontable
angular:
  id: wangjjlr
  metaTitle: Setting up a translation - Vue 3 Data Grid | Handsontable
vue:
  id: luusja1i
searchCategory: Guides
category: Integrate with Vue 3
---
Register a language file with Handsontable and pass the `language` option to the HotTable component to translate the grid UI.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Vue 3.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-numbro

@[code](@/content/guides/integrate-with-vue3/vue3-setting-up-a-language/vue/example1.vue)

:::

## Result

The HotTable component renders with number formatting and locale-specific text determined by the registered language file, and the context menu labels reflect the selected language.

## Related articles

**Related guides**

<div class="boxes-list">

- [Language](@/guides/internationalization/language/language.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [Locale](@/guides/internationalization/locale/locale.md)

</div>

**Configuration options**

<div class="boxes-list">

- [language](@/api/options.md#language)
- [layoutDirection](@/api/options.md#layoutdirection)
- [locale](@/api/options.md#locale)

</div>

**Core methods**

<div class="boxes-list">

- [getDirectionFactor()](@/api/core.md#getdirectionfactor)
- [getTranslatedPhrase()](@/api/core.md#gettranslatedphrase)
- [isLtr()](@/api/core.md#isltr)
- [isRtl()](@/api/core.md#isrtl)

</div>

**Hooks**

<div class="boxes-list">

- [afterLanguageChange](@/api/hooks.md#afterlanguagechange)
- [beforeLanguageChange](@/api/hooks.md#beforelanguagechange)

</div>
