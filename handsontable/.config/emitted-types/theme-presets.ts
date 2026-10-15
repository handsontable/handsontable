import { registerLanguageDictionary } from 'handsontable/i18n';
import { registerTheme } from 'handsontable/themes';
import type {
  ThemeColorsConfig, ThemeDensitySizes, ThemeIconsConfig, ThemeSizingConfig, ThemeTokensConfig,
} from 'handsontable/themes';
import tokensClassic from 'handsontable/themes/static/variables/tokens/classic';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import tokensMain from 'handsontable/themes/static/variables/tokens/main';
import colorsAnt from 'handsontable/themes/static/variables/colors/ant';
import colorsClassic from 'handsontable/themes/static/variables/colors/classic';
import colorsHorizon from 'handsontable/themes/static/variables/colors/horizon';
import colorsMain from 'handsontable/themes/static/variables/colors/main';
import colorsMaterial from 'handsontable/themes/static/variables/colors/material';
import colorsShadcn from 'handsontable/themes/static/variables/colors/shadcn';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import iconsMain from 'handsontable/themes/static/variables/icons/main';
import deDE from 'handsontable/i18n/languages/de-DE';
import density from 'handsontable/themes/static/variables/density';
import sizing from 'handsontable/themes/static/variables/sizing';

/**
 * Consumer fixture for `scripts/verify-esm-consumer-types.mjs`. It is compiled as an ES module
 * under `node16` and `nodenext`, resolved through the real `exports` map of the composed package.
 * It is not part of any tsconfig of this package.
 */

// The documented usage: a preset is the config object itself, so it fits `registerTheme` as typed.
registerTheme('preset-fixture', {
  tokens: tokensMain,
  colors: colorsMain,
  icons: iconsMain,
  density: 'default',
  colorScheme: 'light',
});

// One variant per preset kind, and the two files one directory higher (`../../types.js`).
registerTheme('preset-fixture-variants', { tokens: tokensHorizon, colors: colorsClassic, icons: iconsHorizon });
registerTheme('preset-fixture-material', { colors: colorsMaterial });

// Language dictionaries are default exports too (`./i18n/languages/*`), so typed access must work.
registerLanguageDictionary(deDE);
export const deLanguageCode: string = deDE.languageCode;

// Every preset must be assignable to its config type. A namespace-typed default import is not.
export const typedPresets: [ThemeTokensConfig[], ThemeColorsConfig[], ThemeIconsConfig[]] = [
  [tokensClassic, tokensHorizon, tokensMain],
  [colorsAnt, colorsClassic, colorsHorizon, colorsMain, colorsMaterial, colorsShadcn],
  [iconsHorizon, iconsMain],
];

export const typedTokens: ThemeTokensConfig = tokensHorizon;
export const typedDensity: ThemeDensitySizes = density;
export const typedSizing: ThemeSizingConfig = sizing;

// Guards. Each line must fail to compile. They fail the check when the default import is typed as
// the module namespace (`{ default: ... }`, the DEV-3421 bug) or collapses to `any`.
// The namespace guard (last line) can go stale if `ThemeTokensConfig` ever gains a `default` key or
// an index signature that admits one; the `number` guards below it keep catching `any` regardless.
// Every packaged preset is imported above (the check script fails when one is missing) and must be typed.
// @ts-expect-error `tokensClassic` is not a number, so it must not be `any`.
export const tokensClassicIsTyped: number = tokensClassic;
// @ts-expect-error `tokensHorizon` is not a number, so it must not be `any`.
export const tokensHorizonIsTyped: number = tokensHorizon;
// @ts-expect-error `tokensMain` is not a number, so it must not be `any`.
export const tokensMainIsTyped: number = tokensMain;
// @ts-expect-error `colorsAnt` is not a number, so it must not be `any`.
export const colorsAntIsTyped: number = colorsAnt;
// @ts-expect-error `colorsClassic` is not a number, so it must not be `any`.
export const colorsClassicIsTyped: number = colorsClassic;
// @ts-expect-error `colorsHorizon` is not a number, so it must not be `any`.
export const colorsHorizonIsTyped: number = colorsHorizon;
// @ts-expect-error `colorsMain` is not a number, so it must not be `any`.
export const colorsMainIsTyped: number = colorsMain;
// @ts-expect-error `colorsMaterial` is not a number, so it must not be `any`.
export const colorsMaterialIsTyped: number = colorsMaterial;
// @ts-expect-error `colorsShadcn` is not a number, so it must not be `any`.
export const colorsShadcnIsTyped: number = colorsShadcn;
// @ts-expect-error `iconsHorizon` is not a number, so it must not be `any`.
export const iconsHorizonIsTyped: number = iconsHorizon;
// @ts-expect-error `iconsMain` is not a number, so it must not be `any`.
export const iconsMainIsTyped: number = iconsMain;
// @ts-expect-error `density` is not a number, so it must not be `any`.
export const densityIsTyped: number = density;
// @ts-expect-error `sizing` is not a number, so it must not be `any`.
export const sizingIsTyped: number = sizing;
// @ts-expect-error a dictionary is not a number, so `deDE` must not be `any`.
export const dictionaryIsTyped: number = deDE;
// @ts-expect-error a preset is the config, not a module namespace that holds a `default` member.
export const tokensAreNotANamespace: { default: unknown } = tokensMain;
