import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// `src/themes/static` is generated from the Figma design system export by `npm run generate:themes`,
// which also writes one SHA-256 per file to `scripts/themes/figma/static-manifest.json`. A file that no
// longer matches the manifest was edited by hand, and the next regeneration would silently undo it.
// The hash mirrors `hashContent()` in `scripts/themes/figma/utils/manifest.mjs` (LF-normalized
// SHA-256); if the two ever disagree, this test fails on the first regeneration.
const STATIC_DIR = path.join(__dirname, '../static');
const MANIFEST_PATH = path.join(__dirname, '../../../scripts/themes/figma/static-manifest.json');
const FILE_SET_FIX = 'src/themes/static must hold exactly the files in scripts/themes/figma/static-manifest.json: ' +
  'run `npm run generate:themes` and commit the regenerated files together with the manifest.';
const HOW_TO_FIX = 'Do not hand-edit src/themes/static: add the token to the Handsontable Design System in ' +
  'Figma, export tokens.json, and run `npm run generate:themes` (see scripts/themes/figma/AGENTS.md).';

/**
 * Hashes a generated file's text the way the generator does.
 *
 * @param {string} content The file content.
 * @returns {string} The hex-encoded SHA-256.
 */
function hashContent(content) {
  return crypto.createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex');
}

/**
 * Lists every file under a directory, recursively, as `/`-separated relative paths. Dotfiles (a
 * `.DS_Store` from Finder, for example) are skipped, as in the generator.
 *
 * @param {string} dir The directory to walk.
 * @param {string} [root] The directory the paths are relative to.
 * @returns {string[]} The relative paths.
 */
function listFiles(dir, root = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) {
      return [];
    }

    const fullPath = path.join(dir, entry.name);

    return entry.isDirectory()
      ? listFiles(fullPath, root)
      : [path.relative(root, fullPath).split(path.sep).join('/')];
  });
}

describe('generated theme files (src/themes/static)', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const files = listFiles(STATIC_DIR).sort();

  it('should hold exactly the files the generator wrote', () => {
    const added = files.filter(file => !(file in manifest));
    const removed = Object.keys(manifest).filter(file => !files.includes(file));

    expect({ added, removed, fix: FILE_SET_FIX }).toEqual({ added: [], removed: [], fix: FILE_SET_FIX });
  });

  it('should match the generator output byte for byte', () => {
    const changed = files
      .filter(file => file in manifest)
      .filter(file => hashContent(fs.readFileSync(path.join(STATIC_DIR, file), 'utf8')) !== manifest[file])
      .map(file => `${file} does not match the generator output. ${HOW_TO_FIX}`);

    expect(changed).toEqual([]);
  });
});
