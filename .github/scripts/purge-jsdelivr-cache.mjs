#!/usr/bin/env node

/**
 * Purges the jsDelivr CDN cache for a given Handsontable version.
 *
 * Usage: node purge-jsdelivr-cache.mjs <version>
 *   e.g. node purge-jsdelivr-cache.mjs 12.1.3
 */

const version = process.argv[2];

if (!version) {
  console.error('Usage: node purge-jsdelivr-cache.mjs <version>');
  process.exit(1);
}

const [major, minor, patch] = version.split('.').map(Number);

const DIST_FILES = [
  'handsontable.js',
  'handsontable.min.js',
  'handsontable.full.js',
  'handsontable.full.min.js',
  'themes/classic.js',
  'themes/classic.min.js',
  'themes/horizon.js',
  'themes/horizon.min.js',
  'themes/main.js',
  'themes/main.min.js',
  'themes/static/variables/colors/ant.js',
  'themes/static/variables/colors/ant.min.js',
  'themes/static/variables/colors/classic.js',
  'themes/static/variables/colors/classic.min.js',
  'themes/static/variables/colors/horizon.js',
  'themes/static/variables/colors/horizon.min.js',
  'themes/static/variables/colors/main.js',
  'themes/static/variables/colors/main.min.js',
  'themes/static/variables/colors/material.js',
  'themes/static/variables/colors/material.min.js',
  'themes/static/variables/colors/shadcn.js',
  'themes/static/variables/colors/shadcn.min.js',
  'themes/static/variables/density.js',
  'themes/static/variables/density.min.js',
  'themes/static/variables/helpers/iconsMap.js',
  'themes/static/variables/helpers/iconsMap.min.js',
  'themes/static/variables/icons/horizon.js',
  'themes/static/variables/icons/horizon.min.js',
  'themes/static/variables/icons/main.js',
  'themes/static/variables/icons/main.min.js',
  'themes/static/variables/sizing.js',
  'themes/static/variables/sizing.min.js',
  'themes/static/variables/tokens/classic.js',
  'themes/static/variables/tokens/classic.min.js',
  'themes/static/variables/tokens/horizon.js',
  'themes/static/variables/tokens/horizon.min.js',
  'themes/static/variables/tokens/main.js',
  'themes/static/variables/tokens/main.min.js',
];

const STYLES_FILES = [
  'handsontable.css',
  'handsontable.min.css',
  'handsontableStyles.js',
  'handsontableStyles.mjs',
  'ht-icons-horizon.css',
  'ht-icons-horizon.min.css',
  'ht-icons-main.css',
  'ht-icons-main.min.css',
  'ht-theme-classic.css',
  'ht-theme-classic.min.css',
  'ht-theme-classic-no-icons.css',
  'ht-theme-classic-no-icons.min.css',
  'ht-theme-horizon.css',
  'ht-theme-horizon.min.css',
  'ht-theme-horizon-no-icons.css',
  'ht-theme-horizon-no-icons.min.css',
  'ht-theme-main.css',
  'ht-theme-main.min.css',
  'ht-theme-main-no-icons.css',
  'ht-theme-main-no-icons.min.css',
];

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
