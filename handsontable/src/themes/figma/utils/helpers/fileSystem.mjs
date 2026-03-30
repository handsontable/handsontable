import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { TOKENS_PATH } from "../constants.mjs";

/**
 * Ensures the output directory exists, creating it if necessary
 */
function ensureOutputDirectory(filePath) {
  if (!existsSync(filePath)) {
    mkdirSync(filePath, { recursive: true });
  }
}

/**
 * Loads and parses the tokens JSON file
 */
function loadTokens() {
  try {
    const fileContent = readFileSync(TOKENS_PATH, "utf8");

    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Tokens file not found. Please make sure the file exists and is named "tokens.json".');
    process.exit(1);
  }
}

export { rmSync, existsSync, writeFileSync, readFileSync, ensureOutputDirectory, loadTokens };
