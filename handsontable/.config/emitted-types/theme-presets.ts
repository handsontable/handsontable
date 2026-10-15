import { registerTheme } from 'handsontable/themes';
import tokens from 'handsontable/themes/static/variables/tokens/main';
import colors from 'handsontable/themes/static/variables/colors/main';
import icons from 'handsontable/themes/static/variables/icons/main';

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

// Guards. Each line must fail to compile. They fail the check when the default import is typed as
// the module namespace (`{ default: ... }`, the DEV-3421 bug) or collapses to `any`.
// @ts-expect-error a preset is not a number, so `tokens` must not be `any`.
export const tokensAreTyped: number = tokens;
// @ts-expect-error a preset is not a number, so `colors` must not be `any`.
export const colorsAreTyped: number = colors;
// @ts-expect-error a preset is not a number, so `icons` must not be `any`.
export const iconsAreTyped: number = icons;
// @ts-expect-error a preset is the config, not a module namespace that holds a `default` member.
export const tokensAreNotANamespace: { default: unknown } = tokens;
