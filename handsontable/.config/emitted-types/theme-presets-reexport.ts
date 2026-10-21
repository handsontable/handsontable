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
import density from 'handsontable/themes/static/variables/density';
import sizing from 'handsontable/themes/static/variables/sizing';

/**
 * Second consumer fixture for `scripts/verify-esm-consumer-types.mjs`. The check compiles it with
 * `declaration: true`, so the inferred type of each constant is written into a `.d.ts` and every
 * name it mentions must be reachable through the `exports` map. A library author writes
 * `export const tokens = presetTokens`. It must stay a separate file that imports no type from
 * `handsontable/themes`: declaration emit reuses an import the file already has, which hides the
 * failure (`TS2742` on TypeScript 5.1.6, `TS2883` on 5.9 and later, for names declared in `themes/types`).
 */
export const reexportedTokensClassic = tokensClassic;
export const reexportedTokensHorizon = tokensHorizon;
export const reexportedTokensMain = tokensMain;
export const reexportedColorsAnt = colorsAnt;
export const reexportedColorsClassic = colorsClassic;
export const reexportedColorsHorizon = colorsHorizon;
export const reexportedColorsMain = colorsMain;
export const reexportedColorsMaterial = colorsMaterial;
export const reexportedColorsShadcn = colorsShadcn;
export const reexportedIconsHorizon = iconsHorizon;
export const reexportedIconsMain = iconsMain;
export const reexportedDensity = density;
export const reexportedSizing = sizing;
