/*
 * This file is auto-generated. Do not edit directly.
 */

import { deprecatedWarnOnce } from '../../../../helpers/console';
import { iconStyles } from './iconStyles';

/**
 * Generates the icon stylesheet for a theme.
 *
 * Kept only so the published `handsontable/themes/static/variables/helpers/iconsMap` import path
 * keeps working: the pseudo-element selectors it used to generate no longer exist, since every
 * icon is an `<i class="ht-icon ht-icon-<name>">` element. It now returns the `iconStyles()`
 * output – the `--ht-icon-*` variables, scoped to the theme when `themePrefix` is passed, plus
 * the `.ht-icon-<name>` glyph rules that paint the icon elements.
 *
 * @deprecated Since 19.0.0. The pseudo-element selectors it generated were replaced by icon
 * elements. It will be removed in 20.0.0. Use `iconStyles(icons, scopeSelector)` from
 * `handsontable/themes/static/variables/helpers/iconStyles` instead.
 * @param {object} icons The icon glyph URLs keyed by icon name.
 * @param {string} [themePrefix] The theme class the variables are scoped to (for example,
 * `ht-theme-main`). Without it, the variables are declared on `:root`.
 * @returns {string} The generated CSS.
 */
export const iconsMap = (icons: Record<string, string>, themePrefix?: string): string => {
  deprecatedWarnOnce('themes.iconsMap',
    'The `iconsMap()` helper (`handsontable/themes/static/variables/helpers/iconsMap`) is deprecated and ' +
    'will be removed in Handsontable 20.0.0. It now returns the `iconStyles()` output. Use `iconStyles(icons, ' +
    'scopeSelector)` from `handsontable/themes/static/variables/helpers/iconStyles` instead.');

  return iconStyles(icons, themePrefix ? `[class*=${themePrefix}]` : ':root');
};
