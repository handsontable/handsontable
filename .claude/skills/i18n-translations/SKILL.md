---
name: i18n-translations
path: handsontable/src/i18n/**
description: Use when adding user-facing text to Handsontable, creating new language constants, updating translation files, or working with RTL layouts and internationalization
---

# Internationalization and Translations

Route all user-visible strings through the i18n system in `src/i18n/`.

## Adding a language constant

1. Define it in `src/i18n/constants.ts` in `UPPER_SNAKE_CASE`, built from a namespace prefix and key:

```js
export const CONTEXTMENU_ITEMS_ROW_ABOVE = `${CM_ALIAS}.insertRowAbove`;
```

2. Add the English text to every language file in `src/i18n/languages/` (20+ locales, e.g. `en-US.ts`, `de-DE.ts`). Each file imports constants as `* as C`:

```js
[C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insert row above',
```

Pluralizable strings use an array: `['Remove row', 'Remove rows']`.

3. A new language file also needs the barrel export in `src/i18n/languages/index.ts`.

## Consuming translations

```js
import * as C from '../../i18n/constants';

const label = this.hot.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
```

## RTL

`layoutDirection: 'rtl'`. Use logical CSS properties (`inset-inline-start` in place of `left`). Test with `ar-AR` or `fa-IR`.

## IME

Editors handle `compositionstart`, `compositionupdate`, `compositionend` for CJK input; leave composition state untouched when changing editor behavior.

## Locale-aware casing

Lowercase cell data with `localeLowerCase(value, locale)` from `src/helpers/string.ts`, in place of `String.prototype.toLocaleLowerCase` (ESLint `no-restricted-syntax` enforces it). It keeps Turkish/Azeri/Lithuanian special casing, takes the fast `toLowerCase()` path elsewhere, and does not throw on an invalid `locale` tag.
