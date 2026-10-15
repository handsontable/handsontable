import { registerTheme } from 'handsontable/themes';
import type { ThemeDensitySizes, ThemeSizingConfig, ThemeTokensConfig } from 'handsontable/themes';
import tokens from 'handsontable/themes/static/variables/tokens/main';
import colors from 'handsontable/themes/static/variables/colors/main';
import icons from 'handsontable/themes/static/variables/icons/main';
import horizonTokens from 'handsontable/themes/static/variables/tokens/horizon';
import classicColors from 'handsontable/themes/static/variables/colors/classic';
import materialColors from 'handsontable/themes/static/variables/colors/material';
import horizonIcons from 'handsontable/themes/static/variables/icons/horizon';
import density from 'handsontable/themes/static/variables/density';
import sizing from 'handsontable/themes/static/variables/sizing';

/**
 * Consumer fixture for `scripts/verify-esm-consumer-types.mjs`. It is compiled as an ES module
 * under `node16` and `nodenext`, resolved through the real `exports` map of the composed package.
 * It is not part of any tsconfig of this package.
 */

// The documented usage: a preset is the config object itself, so it fits `registerTheme` as typed.
registerTheme('preset-fixture', {
  tokens,
  colors,
  icons,
  density: 'default',
  colorScheme: 'light',
});

// One variant per preset kind, and the two files one directory higher (`../../types.js`).
registerTheme('preset-fixture-variants', { tokens: horizonTokens, colors: classicColors, icons: horizonIcons });
registerTheme('preset-fixture-material', { colors: materialColors });

export const typedTokens: ThemeTokensConfig = horizonTokens;
export const typedDensity: ThemeDensitySizes = density;
export const typedSizing: ThemeSizingConfig = sizing;

// Guards. Each line must fail to compile. They fail the check when the default import is typed as
// the module namespace (`{ default: ... }`, the DEV-3421 bug) or collapses to `any`.
// The namespace guard (last line) can go stale if `ThemeTokensConfig` ever gains a `default` key or
// an index signature that admits one; the `number` guards below it keep catching `any` regardless.
// @ts-expect-error a preset is not a number, so `tokens` must not be `any`.
export const tokensAreTyped: number = tokens;
// @ts-expect-error a preset is not a number, so `colors` must not be `any`.
export const colorsAreTyped: number = colors;
// @ts-expect-error a preset is not a number, so `icons` must not be `any`.
export const iconsAreTyped: number = icons;
// @ts-expect-error a variant is not a number, so it must not be `any`.
export const horizonTokensAreTyped: number = horizonTokens;
// @ts-expect-error a variant is not a number, so it must not be `any`.
export const classicColorsAreTyped: number = classicColors;
// @ts-expect-error a variant is not a number, so it must not be `any`.
export const horizonIconsAreTyped: number = horizonIcons;
// @ts-expect-error density is not a number, so it must not be `any`.
export const densityIsTyped: number = density;
// @ts-expect-error sizing is not a number, so it must not be `any`.
export const sizingIsTyped: number = sizing;
// @ts-expect-error a preset is the config, not a module namespace that holds a `default` member.
export const tokensAreNotANamespace: { default: unknown } = tokens;
