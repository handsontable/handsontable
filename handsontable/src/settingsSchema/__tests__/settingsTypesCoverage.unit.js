import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { settingsSchema } from 'handsontable/settingsSchema';

const GENERATOR = resolve(__dirname, '../../../scripts/generate-settings-schema.mjs');

/**
 * Runs the generator in its own process: the script is an ES module that loads the TypeScript compiler,
 * which Jest's CommonJS transform cannot import.
 *
 * @returns {string[]} The documented options the settings types do not declare.
 */
function readFallbackOptions() {
  const { stdout, stderr, status } = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    `import { buildSettingsSchema } from ${JSON.stringify(pathToFileURL(GENERATOR).href)};
     console.log(JSON.stringify(buildSettingsSchema().fromJsDoc));`,
  ], { encoding: 'utf8' });

  if (status !== 0) {
    throw new Error(`The settings schema generator failed:\n${stderr}`);
  }

  return JSON.parse(stdout);
}

describe('settings types coverage', () => {
  it('should declare every documented option in the settings types', () => {
    // An option the types leave out falls into `GridSettings`' `[key: string]: any`: no completion,
    // no type check, and a schema entry built from the coarse JSDoc `@type`. Declare it in
    // `src/core/settings.ts` (or `src/settings.ts` for a cell-meta key).
    expect(readFallbackOptions()).toEqual([]);
  });

  it('should keep every option node small', () => {
    // A type that names a class (`ThemeBuilder`) or a wide config (`ThemeParams`) expands into every
    // field and token it holds: `theme` alone grew the published schema from 65 KB to 167 KB. List a
    // class in the generator's `RUNTIME_OBJECT_TYPES`, or type the option as `object`.
    const oversized = Object.entries(settingsSchema.properties)
      .filter(([, node]) => JSON.stringify(node).length > 3000)
      .map(([name]) => name);

    expect(oversized).toEqual([]);
  });
});
