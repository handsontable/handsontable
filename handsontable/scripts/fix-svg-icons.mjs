/**
 * Script for fix SVG files and make it font compatible 
 * to run script SVG's directory is required, example: `./src/styles/themes/[theme]/icons/files`
*/

import SVGFixer from 'oslllo-svg-fixer';
import { cp, readdir, unlink, rm } from 'node:fs/promises';
import path from 'node:path';

try {
  const theme = process.env.npm_config_theme;

  if (!theme) {
    throw new Error('Enter font theme name. Example: npm run fix-svg-icons --theme=main-light');
  }

  const basePath = `./src/styles/themes/${theme}/icons/files`;
  const tempPath = `./src/styles/themes/${theme}/icons/files-to-fix`;

  await cp(
    basePath,
    tempPath,
    { recursive: true }
  );

  for (const file of await readdir(basePath)) {
    await unlink(path.join(basePath, file));
  }

  await SVGFixer(
    tempPath,
    basePath,
    { showProgressBar: true }
  ).fix();

  await rm(tempPath, { recursive: true });
} catch (err) {
  console.log(err);
  throw err;
}
