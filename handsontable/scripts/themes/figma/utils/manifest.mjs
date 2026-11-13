import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Hashes a generated file's text. Line endings are normalized first, so a checkout that converts LF
 * to CRLF (Git `autocrlf` on Windows) matches the manifest the generator wrote.
 *
 * @param {string} content The file content.
 * @returns {string} The SHA-256 of the content, hex-encoded.
 */
function hashContent(content) {
  return createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex');
}

/**
 * Lists every file under a directory, recursively, as paths relative to it. Dotfiles and dot
 * directories (`.DS_Store` from Finder, for example) are skipped: the generator never writes one.
 *
 * @param {string} dir The directory to walk.
 * @param {string} [root] The directory the returned paths are relative to.
 * @returns {string[]} The relative paths, with `/` separators.
 */
function listFiles(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) {
      return [];
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(fullPath, root);
    }

    return [relative(root, fullPath).split(sep).join('/')];
  });
}

/**
 * Builds the manifest of a generated directory: one SHA-256 per file, keyed by its relative path
 * and sorted, so the committed JSON diffs cleanly.
 *
 * @param {string} dir The generated directory (`src/themes/static`).
 * @returns {Record<string, string>} The manifest.
 */
function buildManifest(dir) {
  return Object.fromEntries(
    listFiles(dir)
      .sort()
      .map(file => [file, hashContent(readFileSync(join(dir, file), 'utf8'))]),
  );
}

/**
 * Writes the manifest of a generated directory to a JSON file.
 *
 * @param {string} dir The generated directory.
 * @param {string} manifestPath The JSON file to write.
 */
function writeManifest(dir, manifestPath) {
  writeFileSync(manifestPath, `${JSON.stringify(buildManifest(dir), null, 2)}\n`);
}

export { buildManifest, hashContent, writeManifest };
