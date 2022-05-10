---
title: Locale
metaTitle: Locale - Guide - Handsontable Documentation
permalink: /next/locale
canonicalUrl: /locale
tags:
  - internationalization
  - localization
  - L10n
  - i18n
---

# Locale

[[toc]]

Configure Handsontable's locale settings, to properly handle locale-related data.

## About locale settings

Handsontable's locale settings affect certain actions performed on your data, such as:
- [Filtering](@/guides/columns/column-filter.md)
- [Searching](@/guides/accessories-and-menus/searching-values.md)
- Comparing locale-based data

Without a properly-set locale, the above operations can work incorrectly.

You can configure your locale settings, using the [`locale`](@/api/options.md#locale) configuration option.

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag. By default, Handsontable's locale is `en-US`.

You can configure the locale setting:
- [For the entire grid](#setting-the-grid-s-locale)
- [For individual columns](#setting-a-column-s-locale)

## Setting the grid's locale

To configure the locale of the entire grid, set the [`locale`](@/api/options.md#locale) configuration option as a top-level grid option:

```js
const hot = new Handsontable(container, {
  // set the entire grid's locale to Polish
  locale: 'pl-PL',
});
```

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag.

## Setting a column's locale

To configure the locale of an individual column, set the [`locale`](@/api/options.md#locale) configuration option as a mid-level column option:

```js
const hot = new Handsontable(container, {
  columns: [
    {
      // set the first column's locale to Polish
      locale: 'pl-PL',
    },
    {
      // set the second column's locale to German
      locale: 'de-DE',
    },
    {
      // set the third column's locale to Japanese
      locale: 'ja-JP',
    },
  ],
});
```

## Related articles

#### Related guides

- [IME support](@/guides/internationalization/ime-support.md)
- [Language](@/guides/internationalization/language.md)
- [Layout direction](@/guides/internationalization/layout-direction.md)

#### Related blog articles

- [Handsontable 11.0.0: Modularization for React, Angular, and Vue](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)
- [Handsontable 12.0.0: RTL support, and a new keyboard shortcuts API](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)

#### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)