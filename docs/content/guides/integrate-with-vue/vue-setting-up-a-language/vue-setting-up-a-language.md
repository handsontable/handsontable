---
id: 6i276a7s
title: Setting up a translation in Vue 2
metaTitle: Setting up a translation - Vue 2 Data Grid | Handsontable
description: Configure your Vue 2 data grid with different number formats, depending on the specified language and culture.
permalink: /vue-setting-up-a-translation
canonicalUrl: /vue-setting-up-a-translation
react:
  id: dt7dct4e
  metaTitle: Setting up a translation - Vue 2 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 2
---

# Setting up a translation in Vue 2

Configure your Vue 2 data grid with different number formats, depending on the specified language and culture.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Vue 2.

::: example #example1 :vue-numbro --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-setting-up-a-language/vue/example1.html)
@[code](@/content/guides/integrate-with-vue/vue-setting-up-a-language/vue/example1.js)

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
