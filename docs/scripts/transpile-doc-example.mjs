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
 * Collect the source line numbers (0-based) where a blank line must NOT be swapped for a
 * sentinel comment: inside a string/template literal, inside JSX text, or inside a block
 * comment. `ts.transpileModule` already keeps a blank line in those regions, and a sentinel
 * there would corrupt the output -- a bare `/* ... *\/` closes a comment early, and it is not
 * valid JSX text. Code embedded in a JSX expression container (`{ ... }`) is deliberately left
 * unprotected so its own blank lines are restored like any other code.
 *
 * Comments are found from the parsed tree, not a raw re-scan: walking every token with
 * `getChildren` and reading each one's leading and trailing comment trivia catches an empty JSX
 * expression-container comment (as leading trivia of its close-brace token) without letting a
 * stray backtick in JSX text mis-lex the rest of the file.
 *
 * @param {import('typescript').SourceFile} sourceFile The parsed example.
 * @returns {Set<number>} The protected line numbers.
 */
function collectProtectedLines(sourceFile) {
  const protectedLines = new Set();
  const fullText = sourceFile.getFullText();
  const markSpan = (startPos, endPos) => {
    const start = sourceFile.getLineAndCharacterOfPosition(startPos).line;
    const end = sourceFile.getLineAndCharacterOfPosition(endPos).line;

    for (let line = start; line <= end; line += 1) {
      protectedLines.add(line);
    }
  };
  const seenComments = new Set();
  const markComments = (ranges) => {
    for (const range of ranges ?? []) {
      if (range.kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
        continue;
      }
      const key = `${range.pos}:${range.end}`;

      if (seenComments.has(key)) {
        continue;
      }
      seenComments.add(key);
      markSpan(range.pos, range.end);
    }
  };
  const visit = (node) => {
    markComments(ts.getLeadingCommentRanges(fullText, node.getFullStart()));
    markComments(ts.getTrailingCommentRanges(fullText, node.getEnd()));

    if (ts.isJsxText(node)) {
      // JsxText carries the whitespace between JSX children, so use its full extent.
      markSpan(node.getFullStart(), node.getEnd());

      return;
    }
    if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
      markSpan(node.getStart(sourceFile), node.getEnd());

      return;
    }
    for (const child of node.getChildren(sourceFile)) {
      visit(child);
    }
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
    process.exitCode = 1;

    return;
  }

  const absoluteTs = path.resolve(process.cwd(), tsPath);

  if (!fs.existsSync(absoluteTs)) {
    console.error(`File not found: ${absoluteTs}`);
    process.exitCode = 1;

    return;
  }

  const relativeTs = path.relative(process.cwd(), absoluteTs);
  const jsPath = absoluteTs.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');

  try {
    const sourceText = fs.readFileSync(absoluteTs, 'utf8');
    const output = await transpileDocExample(sourceText, absoluteTs);

    fs.writeFileSync(jsPath, output);
    console.log(`Wrote ${path.relative(process.cwd(), jsPath)}`);
  } catch (error) {
    console.error(`Failed to transpile ${relativeTs}: ${error.message}`);
    process.exitCode = 1;
  }
}

/**
 * True when this module is the process entry point rather than an import. Compares real paths so
 * a symlinked launcher (for example a `node_modules/.bin` shim) still matches.
 *
 * @returns {boolean} Whether the script was run directly.
 */
function isDirectRun() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(path.resolve(process.argv[1]));
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  await main();
}
