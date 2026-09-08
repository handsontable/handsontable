import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import test from 'node:test';
// Shared with the built-output gate on purpose: one copy of the order, one
// comment-stripping rule, so the two guards cannot drift apart.
import { STARLIGHT_LAYERS, stripComments } from '../../../scripts/validate-layer-order.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylesDir = join(__dirname, '../../styles');
const componentsDir = join(__dirname, '../../components');
const customCss = stripComments(readFileSync(join(stylesDir, 'custom.css'), 'utf8'));

/**
 * Reads the `@layer a, b, c;` statement (a layer list with no block) from a
 * stylesheet.
 *
 * @param {string} css The stylesheet source.
 * @returns {{ index: number, names: string[] } | null} The statement's offset
 * and declared layer names, or `null` when the file has no layer statement.
 */
function findLayerStatement(css) {
  const match = /@layer\s+([^{;]+);/.exec(css);

  if (!match) {
    return null;
  }

  return {
    index: match.index,
    names: match[1].split(',').map((name) => name.trim()),
  };
}

/**
 * Lists every layer named by an `@layer <name> { ... }` block in a stylesheet.
 *
 * @param {string} css The stylesheet source.
 * @returns {string[]} The layer names.
 */
function findLayerBlocks(css) {
  return [...stripComments(css).matchAll(/@layer\s+([\w.-]+)\s*\{/g)].map((match) => match[1]);
}

/**
 * Lists every file under `dir` whose extension is in `extensions`, recursively.
 *
 * @param {string} dir The directory to walk.
 * @param {string[]} extensions The extensions to keep, dot-prefixed.
 * @returns {string[]} Absolute file paths.
 */
function walk(dir, extensions) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      return walk(path, extensions);
    }

    return extensions.includes(extname(path)) ? [path] : [];
  });
}

test('custom.css declares Starlight\'s layer order', () => {
  const statement = findLayerStatement(customCss);

  assert.ok(statement, 'custom.css has no @layer statement');

  const declared = statement.names.filter((name) => name.startsWith('starlight.'));

  assert.deepEqual(declared, STARLIGHT_LAYERS);
  assert.ok(
    statement.names.indexOf('rapide') > statement.names.indexOf('starlight.utils'),
    'rapide must come after every starlight sublayer'
  );
});

test('the layer statement comes before any other rule in custom.css', () => {
  const statement = findLayerStatement(customCss);
  const firstImport = customCss.indexOf('@import');

  assert.ok(firstImport > -1, 'custom.css no longer imports the style manifest');
  assert.ok(
    statement.index < firstImport,
    'the @layer statement must precede the @import list, or the imported files declare the layers first'
  );
});

test('no docs stylesheet writes into an undeclared starlight layer', () => {
  const statement = findLayerStatement(customCss);
  const files = [...walk(stylesDir, ['.css']), ...walk(componentsDir, ['.astro'])];
  const offenders = [];

  for (const file of files) {
    for (const layer of findLayerBlocks(readFileSync(file, 'utf8'))) {
      if (layer.startsWith('starlight.') && !statement.names.includes(layer)) {
        offenders.push(`${file}: @layer ${layer}`);
      }
    }
  }

  // A docs-side @layer block the statement does not list becomes that layer's
  // first appearance in the bundle, which is what silently reorders the cascade
  // and zeroes every markdown gap.
  assert.deepEqual(offenders, []);
});
