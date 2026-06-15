import { rmSync, existsSync, loadTokens } from './utils/helpers/fileSystem.mjs';
import { generateAllVariables } from './utils/themeProcessing.mjs';
import { writeJsThemeFiles } from './utils/jsGeneration.mjs';
import { writeCssThemeFiles } from './utils/cssGeneration.mjs';
import { OUTPUT_PATH } from './utils/constants.mjs';

/**
 * Generates Handsontable theme files (typed TS variable modules + CSS) into src/themes/static.
 * Wipes the static directory first so generation is the single source of truth.
 */
function main() {
  const themes = loadTokens();
  const { themeVariables } = generateAllVariables(themes);

  try {
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
