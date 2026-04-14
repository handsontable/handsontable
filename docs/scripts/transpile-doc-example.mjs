#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const tsPath = process.argv[2];
if (!tsPath || !tsPath.endsWith('.ts')) {
  console.error('Usage: node scripts/transpile-doc-example.mjs <path-to-example.ts>');
  process.exit(1);
}
const absoluteTs = path.resolve(process.cwd(), tsPath);
if (!fs.existsSync(absoluteTs)) {
  console.error(`File not found: ${absoluteTs}`);
  process.exit(1);
}
const sourceText = fs.readFileSync(absoluteTs, 'utf8');
const jsPath = absoluteTs.replace(/\.ts$/, '.js');
const { outputText } = ts.transpileModule(sourceText, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    removeComments: false,
    esModuleInterop: true,
  },
  fileName: absoluteTs,
});
fs.writeFileSync(jsPath, outputText);
console.log(`Wrote ${path.relative(process.cwd(), jsPath)}`);
