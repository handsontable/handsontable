import { loadTokens } from "./utils/helpers/fileSystem.mjs";
import { generateAllVariables } from "./utils/themeProcessing.mjs";
import { writeJsThemeFiles } from "./utils/jsGeneration.mjs";
import { writeCssThemeFiles } from "./utils/cssGeneration.mjs";

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  const themes = loadTokens();
  const { themeVariables } = generateAllVariables(themes);

  try {
    // Output writes directly to src/themes/static/ (CSS and variables).
    // Files are overwritten in place — the static/ directory is not deleted
    // because it may contain manually maintained files.
    writeJsThemeFiles(themeVariables);
    writeCssThemeFiles(themeVariables);

    console.log("\nDesign token files generated successfully in src/themes/static/.");
  } catch (error) {
    console.error("\nError generating theme files:", error);
  }
}

main();
