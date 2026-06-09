---
name: i18n-translations
path: handsontable/src/i18n/**
description: Use when adding user-facing text to Handsontable, creating new language constants, updating translation files, or working with RTL layouts and internationalization
---

# Internationalization and Translations

**Golden rule:** Never hardcode user-visible text in source code. All user-facing strings must go through the i18n system in `src/i18n/`.

## Adding a new language constant

1. **Define the constant** in `src/i18n/constants.ts` using `UPPER_SNAKE_CASE`. Constants are built from a namespace prefix and a descriptive key:

```js
export const CONTEXTMENU_ITEMS_ROW_ABOVE = `${CM_ALIAS}.insertRowAbove`;
```

2. **Add the English text to every language file** in `src/i18n/languages/`. There are 20+ locale files (e.g., `en-US.ts`, `de-DE.ts`, `ja-JP.ts`, `zh-CN.ts`). Each file imports constants as `* as C` and maps them in a dictionary object:

```js
[C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insert row above',
```

For pluralizable strings, use an array: `['Remove row', 'Remove rows']`.

3. **Do not forget the barrel export** in `src/i18n/languages/index.ts` if adding a new language file.

## Consuming translations in plugins

Import constants and call `getTranslatedPhrase()`:

```js
import * as C from '../../i18n/constants';

// Inside a plugin method:
const label = this.hot.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
```

## RTL layout considerations

Handsontable supports RTL via `layoutDirection: 'rtl'`. When adding UI elements, ensure they render correctly in both LTR and RTL. Use logical CSS properties (`inset-inline-start` instead of `left`) where possible. Test with an RTL locale such as `ar-AR` or `fa-IR`.

## IME and Unicode input

The editor system handles IME composition events (`compositionstart`, `compositionupdate`, `compositionend`) for CJK input methods. Do not interfere with composition state when modifying editor behavior.

## Workflow checklist

- [ ] Define constant in `src/i18n/constants.ts`
- [ ] Add English text to **all** language files in `src/i18n/languages/`
- [ ] Use `this.hot.getTranslatedPhrase(C.CONSTANT_NAME)` in source code
- [ ] Test with RTL if adding directional UI elements

## Key files

| File | Purpose |
|---|---|
| `src/i18n/constants.ts` | All language constant definitions |
| `src/i18n/languages/` | Per-locale dictionary files (20+ locales) |
| `src/i18n/languages/index.ts` | Barrel export for language modules |
