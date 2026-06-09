---
type: reference
title: Locale
metaTitle: Locale - JavaScript Data Grid | Handsontable
description: Configure Handsontable's locale settings, to properly handle locale-related data and actions such as filtering, searching, or sorting.
permalink: /locale
canonicalUrl: /locale
tags:
  - internationalization
  - localization
  - L10n
  - i18n
react:
  metaTitle: Locale - React Data Grid | Handsontable
angular:
  metaTitle: Locale - Angular Data Grid | Handsontable
vue:
  metaTitle: Locale - Vue Data Grid | Handsontable
searchCategory: Guides
category: Internationalization
---
The `locale` option configures number and date formatting using a BCP 47 language tag (for example `'en-US'` or `'de-DE'`).

[[toc]]

## Overview

Handsontable's locale settings affect certain actions performed on your data, such as:

- [Filtering](@/guides/columns/column-filter/column-filter.md)
- [Searching](@/guides/navigation/searching-values/searching-values.md)
- Comparing locale-based data

Without a properly-set locale, the above operations can work incorrectly.

You can configure your locale settings, using the [`locale`](@/api/options.md#locale) configuration option.

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag. By default, Handsontable's locale is `en-US`.

You can configure the locale setting:

- [For the entire grid](#set-the-grid-s-locale)
- [For individual columns](#set-a-column-s-locale)

## Set the grid's locale

To configure the locale of the entire grid, set the [`locale`](@/api/options.md#locale) configuration option as a top-level grid option:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // set the entire grid's locale to Polish
  locale: 'pl-PL',
});
```

:::

::: only-for react

```jsx
<HotTable
  // set the entire grid's locale to Polish
  locale="pl-PL"
/>
```

:::

::: only-for angular

```ts
settings = {
  // set the entire grid's locale to Polish
  locale: "pl-PL",
};
```

```html
<hot-table [settings]="settings" />
```

:::

::: only-for vue

```js
const hotSettings = ref({
  // set the entire grid's locale to Polish
  locale: 'pl-PL',
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

You can set the [`locale`](@/api/options.md#locale) option to any valid and canonicalized Unicode BCP 47 locale tag.

## Set a column's locale

To configure the locale of an individual column, set the [`locale`](@/api/options.md#locale) configuration option as a mid-level column option:

::: only-for javascript

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

:::

::: only-for react

```jsx
<HotTable
  columns={[{
      // set the first column's locale to Polish
      locale: 'pl-PL',
    }, {
      // set the second column's locale to German
      locale: 'de-DE',
    }, {
      // set the third column's locale to Japanese
      locale: 'ja-JP',
    },
  ]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      // set the first column's locale to Polish
      locale: "pl-PL",
    },
    {
      // set the second column's locale to German
      locale: "de-DE",
    },
    {
      // set the third column's locale to Japanese
      locale: "ja-JP",
    },
  ],
};
```

```html
<hot-table [settings]="settings" />
```

:::

::: only-for vue

```js
const hotSettings = ref({
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

```html
<HotTable :settings="hotSettings" />
```

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Language](@/guides/internationalization/language/language.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [IME support](@/guides/internationalization/ime-support/ime-support.md)

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

## Related

<div class="boxes-list">

- [Language](@/guides/internationalization/language/language.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)

</div>
