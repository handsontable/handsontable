---
id: tcabky5c
title: Language change in Vue 3
metaTitle: Language change - Vue 3 Data Grid | Handsontable
description: Change the default language of the context menu from English to any of the built-in translations, using the "language" property.
permalink: /vue3-language-change-example
canonicalUrl: /vue3-language-change-example
react:
  id: sxkgoryi
  metaTitle: Language change - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Language change in Vue 3

Change the default language of the context menu from English to any of the built-in translations, using the `language` property.

[[toc]]

## Example - Select language

The following example implements the `@handsontable/vue3` component with the option to change the Context Menu language configured. Select a language from the selector above the table and open the Context Menu to see the result.

::: tip

Note that the `language` property is bound to the component separately using `language={this.language}"`, but it could be included in the `settings` property just as well.

:::

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-languages --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-language-change-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-language-change-example/vue/example1.js)

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
