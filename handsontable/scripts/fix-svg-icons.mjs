import SVGFixer from 'oslllo-svg-fixer';
import { cp, readdir, unlink, rm } from 'fs/promises';
import path from "node:path";

try {
  const theme = process.env.npm_config_theme;

  if (!theme) {
    throw new Error('Type theme name.');
  }

  const basePath = `./src/styles/themes/${theme}/icons/files`
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

  rm(tempPath, { recursive: true })
} catch (err) {
  console.log(err);
  throw err;
}
