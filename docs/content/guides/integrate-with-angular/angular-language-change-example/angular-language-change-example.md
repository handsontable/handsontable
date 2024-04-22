---
id: 0gszzt14
title: Language change in Angular
metaTitle: Language change - Angular Data Grid | Handsontable
description: Change the default language of the context menu from English to any of the built-in translations, using the "language" property.
permalink: /angular-language-change-example
canonicalUrl: /angular-language-change-example
react:
  id: h7773jg7
  metaTitle: Language change - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Language change in Angular

Change the default language of the context menu from English to any of the built-in translations, using the `language` property.

[[toc]]

## Example

The following example is an implementation of the `@handsontable/angular` component with an option to change the Context Menu language.

Select a language from the selector above the table and open the Context Menu to see the result.

::: example :angular-languages --html 1 --js 2

@[code](@/content/guides/integrate-with-angular/angular-language-change-example/angular/example1.html)
@[code](@/content/guides/integrate-with-angular/angular-language-change-example/angular/example1.js)

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
