---
id: 7ezlo7y5
title: Setting up a translation in Vue 3
metaTitle: Setting up a translation - Vue 3 Data Grid | Handsontable
description: Configure your Vue 3 data grid with different number formats, depending on the specified language and culture.
permalink: /vue3-setting-up-a-translation
canonicalUrl: /vue3-setting-up-a-translation
react:
  id: 5sootj6b
  metaTitle: Setting up a translation - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Setting up a translation in Vue 3

Configure your Vue 3 data grid with different number formats, depending on the specified language and culture.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Vue 3.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-numbro --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-setting-up-a-language/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-setting-up-a-language/vue/example1.js)

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Language](@/guides/internationalization/language/language.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [Locale](@/guides/internationalization/locale/locale.md)

</div>

### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)
