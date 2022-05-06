---
title: Locale
metaTitle: Locale - Guide - Handsontable Documentation
permalink: /12.0/locale
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

You can configure your locale settings, using the [`locale`](@/api/options.md#locale) [configuration option](@/guides/getting-started/setting-options.md).

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag. By default, Handsontable's locale is `en-US`.

You can configure the locale setting:
- [For the entire grid](#setting-the-grid-s-locale)
- [For individual columns](#setting-a-column-s-locale)

## Setting the grid's locale

To configure the locale of the entire grid, set the [`locale`](@/api/options.md#locale) [configuration option](@/guides/getting-started/setting-options.md) as a [top-level grid option](@/guides/getting-started/setting-options.md#setting-grid-options):

```js
const hot = new Handsontable(container, {
  // set the entire grid's locale to Polish
  locale: 'pl-PL',
});
```

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag.

## Setting a column's locale

To configure the locale of an individual column, set the [`locale`](@/api/options.md#locale) [configuration option](@/guides/getting-started/setting-options.md) as a [mid-level column option](@/guides/getting-started/setting-options.md#setting-column-options):

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