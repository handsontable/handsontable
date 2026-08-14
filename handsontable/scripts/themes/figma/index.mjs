import { rmSync, existsSync, loadTokens } from './utils/helpers/fileSystem.mjs';
import { generateAllVariables } from './utils/themeProcessing.mjs';
import { writeJsThemeFiles } from './utils/jsGeneration.mjs';
import { writeCssThemeFiles } from './utils/cssGeneration.mjs';
import { OUTPUT_PATH, TOKENS_KEY } from './utils/constants.mjs';

/**
 * Generates Handsontable theme files (typed TS variable modules + CSS) into src/themes/static.
 * Wipes the static directory first so generation is the single source of truth.
 */
function main() {
  const themes = loadTokens();
  const { themeVariables } = generateAllVariables(themes);

  try {
    // Validate BEFORE the wipe: an empty/malformed export with no themes must not delete the
    // existing committed output and then report success. Abort first so src/themes/static survives.
    if (Object.keys(themeVariables[TOKENS_KEY]).length === 0) {
      throw new Error('No themes found in tokens.json. Aborting before wiping src/themes/static.');
    }

    if (existsSync(OUTPUT_PATH)) {
      rmSync(OUTPUT_PATH, { recursive: true });
    }

    writeJsThemeFiles(themeVariables);
    writeCssThemeFiles(themeVariables);

    console.log('\nTheme files generated successfully.');
  } catch (error) {
    console.error('\nError generating theme files:', error);
    process.exit(1);
  }
}

main();
