---
id: 6i276a7s
title: Setting up a translation in Vue 2
metaTitle: Setting up a translation - Vue 2 Data Grid | Handsontable
description: Configure your Vue 2 data grid with different number formats, depending on the specified language and culture.
permalink: /vue-setting-up-a-translation
canonicalUrl: /vue-setting-up-a-translation
searchCategory: Guides
---

# Setting up a translation in Vue 2

Configure your Vue 2 data grid with different number formats, depending on the specified language and culture.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Vue 2.

::: example #example1 :vue-numbro --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-setting-up-a-language/example1.html)

@[code](@/content/guides/integrate-with-vue/vue-setting-up-a-language/example1.js)

:::

## Related articles

### Related guides

- [Language](@/guides/internationalization/language/language.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [Locale](@/guides/internationalization/locale/locale.md)

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
