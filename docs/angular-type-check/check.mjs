#!/usr/bin/env node
/**
 * Splits multi-section Angular example files into individual TS files,
 * writes them to a temp directory, then runs tsc --noEmit.
 *
 * Each source file uses the format:
 *   /* file: app.component.ts * /
 *   ...content...
 *   /* end-file * /
 *
 * Sections are written to: .tmp/{guide-path}/{example-name}/{filename}
 * Plain TS files (no sections) are copied as-is.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(__dirname, '../content');
const tmpDir = path.resolve(__dirname, '.tmp');

fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

function findAngularExamples(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAngularExamples(full, results);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      path.basename(path.dirname(full)) === 'angular'
    ) {
      results.push(full);
    }
  }
  return results;
}

const FILE_RE = /\/\* file: (.+?) \*\/([\s\S]*?)\/\* end-file \*\//g;
const CSS_IMPORT_RE = /^import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm;
const STYLE_URLS_RE = /styleUrls\s*:\s*\[[^\]]*\]/g;
let fileCount = 0;

function stripCssImports(code) {
  return code
    .replace(CSS_IMPORT_RE, '')
    .replace(STYLE_URLS_RE, 'styles: []');
}

for (const srcPath of findAngularExamples(contentDir)) {
  const relPath = path.relative(contentDir, srcPath);
  const source = fs.readFileSync(srcPath, 'utf8');

  FILE_RE.lastIndex = 0;
  let match;
  let hasSections = false;

  while ((match = FILE_RE.exec(source)) !== null) {
    hasSections = true;
    const [, filename, content] = match;
    const exampleName = path.basename(relPath, '.ts');
    const guideDir = path.dirname(relPath);
    const outDir = path.join(tmpDir, guideDir, exampleName);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, filename.trim()), stripCssImports(content.trim()) + '\n');
    fileCount++;
  }

  if (!hasSections) {
    const outDir = path.join(tmpDir, path.dirname(relPath));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, path.basename(relPath)), stripCssImports(fs.readFileSync(srcPath, 'utf8')));
    fileCount++;
  }
}

console.log(`Prepared ${fileCount} files in .tmp/`);

const tsconfig = {
  extends: './tsconfig.json',
  include: ['./.tmp/**/*.ts', './types/**/*.d.ts'],
  exclude: ['**/node_modules/**'],
};

const tsconfigTmpPath = path.join(__dirname, 'tsconfig.tmp.json');
fs.writeFileSync(tsconfigTmpPath, JSON.stringify(tsconfig, null, 2));

try {
  execSync(`node node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js --noEmit -p tsconfig.tmp.json`, {
    stdio: 'inherit',
    cwd: __dirname,
  });
  console.log('Type check passed.');
} finally {
  fs.rmSync(tsconfigTmpPath, { force: true });
}
