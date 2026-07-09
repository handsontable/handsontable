import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Resolves a `handsontable/styles/*.css` import specifier to a local file
 * inside the monorepo `handsontable/` package (regression guard for #12890).
 *
 * `handsontable/styles/` is gitignored build output -- it only exists after
 * `npm run build --prefix handsontable`. The built file is preferred; when
 * the build has not run yet, theme `.min.css` imports are mapped to their
 * unminified source counterpart in `src/themes/static/css/theme/` (then
 * `icons/`), so the docs server always resolves to a local monorepo file and
 * never falls through to pnpm's virtual store copy of the published package.
 *
 * @param {string} id - The raw import specifier seen by Vite's `resolveId`.
 * @param {string} hotDir - Absolute path to the monorepo `handsontable/` package root.
 * @returns {string|undefined} Absolute path of the local CSS file, or
 * `undefined` when the specifier is not a `handsontable/styles/*.css` import
 * or no local counterpart exists.
 */
export function resolveHotStylesId(id, hotDir) {
  if (!id.startsWith('handsontable/styles/') || !id.endsWith('.css')) {
    return undefined;
  }

  const cssFileName = id.slice('handsontable/styles/'.length);
  const builtPath = resolve(hotDir, 'styles', cssFileName);

  if (existsSync(builtPath)) return builtPath;

  // Strip ".min" suffix to locate the unminified source counterpart.
  const srcBaseName = cssFileName.replace(/\.min\.css$/, '.css');
  const srcThemePath = resolve(hotDir, 'src/themes/static/css/theme', srcBaseName);

  if (existsSync(srcThemePath)) return srcThemePath;

  const srcIconsPath = resolve(hotDir, 'src/themes/static/css/icons', srcBaseName);

  if (existsSync(srcIconsPath)) return srcIconsPath;

  return undefined;
}
