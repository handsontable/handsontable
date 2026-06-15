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
    console.error('Tokens file not found. Place the Figma export at handsontable/scripts/themes/figma/tokens.json.');
    process.exit(1);
  }
}
/* eslint-enable jsdoc/require-returns-check */

export { rmSync, existsSync, writeFileSync, readFileSync, ensureOutputDirectory, loadTokens };
