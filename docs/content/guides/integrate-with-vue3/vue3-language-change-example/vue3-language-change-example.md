---
type: tutorial
id: tcabky5c
title: Language change in Vue 3
metaTitle: Language change - Vue 3 Data Grid | Handsontable
description: Change the default language of the context menu from English to any of the built-in translations, using the "language" property.
permalink: /vue3-language-change-example
canonicalUrl: /vue3-language-change-example
react:
  id: sxkgoryi
  metaTitle: Language change - Vue 3 Data Grid | Handsontable
angular:
  id: zjy408sj
  metaTitle: Language change - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---
In this tutorial, you will add a language selection dropdown that changes the Handsontable UI language at runtime in a Vue 3 application.

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

## What you learned

- How to import and register a built-in language pack in a Vue 3 application.
- How to bind the `language` prop dynamically to switch languages at runtime.
- How to build a language selection dropdown that updates the Handsontable UI.

## Next steps

- [Setting up a translation in Vue 3](@/guides/integrate-with-vue3/vue3-setting-up-a-language/vue3-setting-up-a-language.md) -- configure number formats alongside the UI language.
- [Language](@/guides/internationalization/language/language.md) -- explore all available language packs.
- [Custom context menu in Vue 3](@/guides/integrate-with-vue3/vue3-custom-context-menu-example/vue3-custom-context-menu-example.md) -- add custom items to the localized context menu.
