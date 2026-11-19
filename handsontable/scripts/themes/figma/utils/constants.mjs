import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import iconsMain from '../icons/main.mjs';
import iconsHorizon from '../icons/horizon.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Constants
export const PREFIX = 'ht';
export const THEME_KEY = 'themes';
export const MODE_KEY = 'mode';
export const TOKENS_KEY = 'tokens';
export const COLORS_KEY = 'colors';
export const DENSITY_KEY = 'density';
export const SIZING_KEY = 'sizing';

// `tokens.json` is the Figma "Design Tokens" plugin export — gitignored, user-provided.
// It lives next to the generator (handsontable/scripts/themes/figma/tokens.json).
export const TOKENS_PATH = resolve(__dirname, '..', 'tokens.json');

// Generated theme files are written straight into the published source tree.
export const OUTPUT_PATH = resolve(__dirname, '../../../../src/themes/static');

// One SHA-256 per generated file, rewritten on every run and committed. It lives outside
// OUTPUT_PATH so it never ships in the package. `src/themes/__tests__/staticThemesGenerated.unit.js`
// fails when a file under OUTPUT_PATH no longer matches it, which is how a hand edit shows up.
export const MANIFEST_PATH = resolve(__dirname, '..', 'static-manifest.json');

export const VARIANTS = ['light', 'dark'];
export const OTHER_VARIABLES = ['density'];
export const EXCEPTION_KEYS = ['font-family'];
export const ICONS_SET = {
  main: iconsMain,
  horizon: iconsHorizon,
};
