#!/usr/bin/env node

/**
 * Purges the jsDelivr CDN cache for a given Handsontable version.
 *
 * Usage: node purge-jsdelivr-cache.mjs <version>
 *   e.g. node purge-jsdelivr-cache.mjs 12.1.3
 */

import { readdirSync } from 'fs';
import { join, relative } from 'path';

const version = process.argv[2];

if (!version) {
  console.error('Usage: node purge-jsdelivr-cache.mjs <version>');
  process.exit(1);
}

const [major, minor, patch] = version.split('.').map(Number);

const EXTENSIONS = ['.js', '.css'];

function collectFiles(dir) {
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));

    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

const PKG_DIR = 'handsontable/tmp';

const distDir = join(PKG_DIR, 'dist');
const stylesDir = join(PKG_DIR, 'styles');

const DIST_FILES = collectFiles(distDir)
  .map(f => relative(distDir, f));

const STYLES_FILES = collectFiles(stylesDir)
  .map(f => relative(stylesDir, f));

const tags = ['latest'];

if (patch !== 0) {
  tags.push(`${major}`, `${major}.${minor}`);
} else if (minor !== 0) {
  tags.push(`${major}`);
}

let failed = false;

for (const tag of tags) {
  console.log(`\nPurging @${tag} cache...`);

  for (const file of DIST_FILES) {
    const url = `https://purge.jsdelivr.net/npm/handsontable@${tag}/dist/${file}`;
    const res = await fetch(url);

    console.log(`${res.status} @${tag}/dist/${file}`);

    if (!res.ok) {
      failed = true;
    }
  }

  for (const file of STYLES_FILES) {
    const url = `https://purge.jsdelivr.net/npm/handsontable@${tag}/styles/${file}`;
    const res = await fetch(url);

    console.log(`${res.status} @${tag}/styles/${file}`);

    if (!res.ok) {
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nSome purge requests failed (see above).');
  process.exit(1);
}

console.log('\nAll purge requests completed successfully.');
