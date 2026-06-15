import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { TOKENS_PATH } from '../constants.mjs';

/**
 * Ensures the output directory exists, creating it if necessary.
 *
 * @param {string} filePath The directory path to ensure exists.
 */
function ensureOutputDirectory(filePath) {
  if (!existsSync(filePath)) {
    mkdirSync(filePath, { recursive: true });
  }
}

/**
 * Builds a human-readable message for a tokens-load failure, distinguishing a missing file from a
 * read/parse error so a corrupt `tokens.json` is not misreported as missing.
 *
 * @param {Error} error The error thrown while reading or parsing the tokens file.
 * @param {string} tokensPath The resolved path to the tokens file.
 * @returns {string} The diagnostic message to print.
 */
function tokensLoadErrorMessage(error, tokensPath) {
  if (error && error.code === 'ENOENT') {
    return 'Tokens file not found. Place the Figma export at handsontable/scripts/themes/figma/tokens.json.';
  }

  return `Failed to read or parse the tokens file at ${tokensPath}: ${error?.message ?? error}`;
}

/* eslint-disable jsdoc/require-returns-check -- return lives on the try path; the catch calls process.exit(). */
/**
 * Loads and parses the tokens JSON file.
 *
 * @returns {object} The parsed tokens object.
 */
function loadTokens() {
  try {
    const fileContent = readFileSync(TOKENS_PATH, 'utf8');

    return JSON.parse(fileContent);
  } catch (error) {
    console.error(tokensLoadErrorMessage(error, TOKENS_PATH));
    process.exit(1);
  }
}
/* eslint-enable jsdoc/require-returns-check */

export {
  rmSync, existsSync, writeFileSync, readFileSync, ensureOutputDirectory, loadTokens, tokensLoadErrorMessage,
};
