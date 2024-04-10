---
id: pzccidkj
title: Setting up a translation in Angular
metaTitle: Setting up a translation - Angular Data Grid | Handsontable
description: Configure your Angular data grid with different number formats, depending on the specified language and culture.
permalink: /angular-setting-up-a-translation
canonicalUrl: /angular-setting-up-a-translation
react:
  id: x0ixc386
  metaTitle: Setting up a translation - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Setting up a translation in Angular

Configure your Angular data grid with different number formats, depending on the specified language and culture.

[[toc]]

## Example

The following example shows a Handsontable instance with translations set up in Angular.

::: example :angular-numbro --html 1 --js 2

@[code](@/content/guides/integrate-with-angular/angular-setting-up-a-translation/angular/example1.html)
@[code](@/content/guides/integrate-with-angular/angular-setting-up-a-translation/angular/example1.js)

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
