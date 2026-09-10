---
type: how-to
title: Clickable links
metaTitle: Clickable links - JavaScript Data Grid | Handsontable
description: Render the URLs, email addresses, and phone numbers in your cell values as clickable links, without changing the data.
permalink: /clickable-links
canonicalUrl: /clickable-links
tags:
  - links
  - hyperlinks
  - urls
  - anchors
  - autolink
react:
  metaTitle: Clickable links - React Data Grid | Handsontable
angular:
  metaTitle: Clickable links - Angular Data Grid | Handsontable
vue:
  metaTitle: Clickable links - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: new
---

Render the URLs, email addresses, and phone numbers in your cell values as clickable links, without changing the data.

[[toc]]

## Overview

By default, a cell value such as `https://handsontable.com` renders as plain text. With the [`autoLink`](@/api/options.md#autolink) option, Handsontable finds the URLs in the text a cell renders and wraps each one in a link element. The cell keeps its own renderer, and the value stays unchanged, so copying, autofill, sorting, filtering, and export work as before.

Handsontable links the `http`, `https`, `mailto`, and `tel` schemes only. Any other scheme, `javascript:` included, stays plain text.

## Enable automatic links

Set the [`autoLink`](@/api/options.md#autolink) option to `true`:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/clickable-links/javascript/example1.js)
@[code](@/content/guides/cell-features/clickable-links/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clickable-links/react/example1.jsx)
@[code](@/content/guides/cell-features/clickable-links/react/example1.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clickable-links/angular/example1.ts)
@[code](@/content/guides/cell-features/clickable-links/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/clickable-links/vue/example1.vue)

:::

:::

A URL inside longer text becomes a link as well. Punctuation that wraps a URL in a sentence, such as a trailing period or a closing parenthesis, stays outside the link.

## Configure the links

Set [`autoLink`](@/api/options.md#autolink) to an object to configure the links:

| Option      | Default    | Description                                                                                  |
| ----------- | ---------- | -------------------------------------------------------------------------------------------- |
| `target`    | `'_blank'` | Where the links open: a new tab (`'_blank'`) or the current one (`'_self'`).                  |
| `schemes`   | all four   | The URL schemes to link, a subset of `'http'`, `'https'`, `'mailto'`, and `'tel'`. A column or cell `schemes` can only narrow this fixed four-scheme allowlist, never widen it, and replaces the grid-level list for those cells. |
| `inline`    | `true`     | `true` links URLs inside longer text. `false` links only a cell whose whole value is one URL. |
| `strict`    | `true`     | `true` links only URLs that carry a scheme. `false` also links bare domains and bare email addresses. See [Link bare domains and email addresses](#link-bare-domains-and-email-addresses). |
| `className` | `''`       | Extra class name(s) added to every link element.                                              |

The plugin is enabled at the grid level. To opt a column or a cell out, set `autoLink: false` in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) option. To override the settings for a column or a cell, set an object there:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/clickable-links/javascript/example2.js)
@[code](@/content/guides/cell-features/clickable-links/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/clickable-links/react/example2.jsx)
@[code](@/content/guides/cell-features/clickable-links/react/example2.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/clickable-links/angular/example2.ts)
@[code](@/content/guides/cell-features/clickable-links/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/clickable-links/vue/example2.vue)

:::

:::

## Link bare domains and email addresses

Keep [`autoLink`](@/api/options.md#autolink)'s `strict` option at its default, `true`, unless your data is known to hold bare domains or email addresses. Set it to `false` only for that data, as an opt-in -- not as a general upgrade to the rest of your grid.

By default (`strict: true`), `autoLink` links only a value that already carries a scheme, such as `https://handsontable.com` or `mailto:jane@example.com`. Set `strict` to `false` to also link a bare domain, such as `handsontable.com`, as an `https` URL, and a bare email address, such as `jane@example.com`, as a `mailto` URL:

```js
autoLink: {
  strict: false,
},
```

A bare domain's top-level domain (the `.com` in `handsontable.com`) is validated against the [IANA top-level domain list](https://data.iana.org/TLD/tlds-alpha-by-domain.txt), bundled with Handsontable at build time. Handsontable makes no network request to validate a bare domain, so `strict: false` works the same in an air-gapped environment as it does anywhere else. A punycode top-level domain (`xn--...`) is never linked; every other IANA top-level domain is used as-is.

::: warning

`strict: false` uses the full top-level domain list, with no exclusion for a generic top-level domain that also reads as a common file extension. A value such as `report.zip` or `README.md` becomes a link. `.zip` and `.mov` are known phishing-bait domains -- one more reason `strict: false` is an opt-in, not a default. Keep `strict: true` (the default), or set `autoLink: false`, on a column that holds file names.

:::

## Keyboard access

A link inside a cell stays out of the tab order, so tabbing still moves between cells. To open the first link of the selected cell, press <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd>. The link opens where `target` says.

Inline mode can link several URLs inside one cell. <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd> always opens the first one -- reach the rest with the mouse. This is a deliberate limitation.

## Styling

Each link element gets the `ht-link` and `ht-auto-link` classes, and takes its color from the `--ht-link-color` and `--ht-link-hover-color` [theme variables](@/guides/styling/themes/themes.md). Add your own class through the `className` option.

A `mailto:` or `tel:` link hides its scheme prefix from view. The prefix stays in the DOM inside a `ht-link-scheme` element, so the cell shows only the address or the number - restyle it through that class if you need the prefix visible.

## Links from formulas

A cell whose formula is `HYPERLINK()` can render as a link through the `hyperlinks` property of the [`formulas`](@/api/options.md#formulas) option. Read more in [Render `HYPERLINK` formulas as links](@/guides/formulas/formula-calculation/formula-calculation.md#render-hyperlink-formulas-as-links). When both features are on, a `HYPERLINK` cell renders the formula's link and `autoLink` leaves it alone.

## Security

Handsontable builds every link element through the DOM and checks the parsed URL scheme against a fixed allowlist, so a value such as `javascript:alert(1)` never becomes a link. Every link carries `rel="noopener noreferrer"`. The `schemes` option can narrow the allowlist, never widen it.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [autoLink](@/api/options.md#autolink)
- [formulas](@/api/options.md#formulas)

</div>

**Plugins**

<div class="boxes-list">

- [AutoLink](@/api/autoLink.md)

</div>
