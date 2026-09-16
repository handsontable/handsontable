#!/usr/bin/env node
/**
 * Emit a sibling `.js` or `.jsx` file from a documentation `.ts` or `.tsx` example.
 *
 * Two stages: the TypeScript compiler API strips the types (transpile only -- no typecheck,
 * no path resolution), then Prettier formats the result so the generated file matches the
 * one-statement-per-line, one-JSX-prop-per-line shape of its `.ts`/`.tsx` source. Without the
 * Prettier pass the raw compiler printer collapses JSX onto a single line and drops blank
 * lines, which is what a reader saw embedded on the docs page (DEV-2931).
 *
 * Blank lines survive the round-trip through a sentinel comment: `ts.transpileModule` drops
 * blank lines that sit in code, so each such line is swapped for a sentinel before transpiling
 * and restored after formatting. Blank lines inside string/template literals and JSX are left
 * untouched -- the compiler already preserves the former, and a bare comment is invalid inside
 * the latter.
 *
 * Usage: node scripts/transpile-doc-example.mjs <path-to-example.ts|path-to-example.tsx>
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const BLANK_SENTINEL = '/*__HOT_BLANK__*/';

/**
 * Collect the source line numbers (0-based) covered by a string/template literal or JSX, so a
 * blank line inside them is never swapped for a sentinel comment.
 *
 * @param {import('typescript').SourceFile} sourceFile The parsed example.
 * @returns {Set<number>} The protected line numbers.
 */
function collectProtectedLines(sourceFile) {
  const protectedLines = new Set();
  const markRange = (node) => {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;

    for (let line = start; line <= end; line += 1) {
      protectedLines.add(line);
    }
  };
  const visit = (node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateExpression(node) ||
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      markRange(node);

      return;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return protectedLines;
}

/**
 * Transpile a documentation `.ts`/`.tsx` example to formatted `.js`/`.jsx` source.
 *
 * @param {string} sourceText The example source.
 * @param {string} fileName The example file name; its extension selects the TS/TSX parser.
 * @returns {Promise<string>} The formatted JavaScript output.
 */
export async function transpileDocExample(sourceText, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    false,
    fileName.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const protectedLines = collectProtectedLines(sourceFile);
  const markedSource = sourceText
    .split('\n')
    .map((line, index) => (line.trim() === '' && !protectedLines.has(index) ? BLANK_SENTINEL : line))
    .join('\n');

  const { outputText } = ts.transpileModule(markedSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      removeComments: false,
      esModuleInterop: true,
    },
    fileName,
  });

  const formatted = await prettier.format(outputText, {
    parser: 'babel',
    singleQuote: true,
    printWidth: 120,
  });

  const sentinelLine = new RegExp(`^[ \\t]*${BLANK_SENTINEL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*$`, 'gm');

  return formatted.replace(sentinelLine, '').replace(/\n+$/, '\n');
}

async function main() {
  const tsPath = process.argv[2];

  if (!tsPath || !/\.(ts|tsx)$/.test(tsPath)) {
    console.error('Usage: node scripts/transpile-doc-example.mjs <path-to-example.ts|path-to-example.tsx>');
    process.exit(1);
  }

  const absoluteTs = path.resolve(process.cwd(), tsPath);

  if (!fs.existsSync(absoluteTs)) {
    console.error(`File not found: ${absoluteTs}`);
    process.exit(1);
  }

  const sourceText = fs.readFileSync(absoluteTs, 'utf8');
  const jsPath = absoluteTs.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
  const output = await transpileDocExample(sourceText, absoluteTs);

  fs.writeFileSync(jsPath, output);
  console.log(`Wrote ${path.relative(process.cwd(), jsPath)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
