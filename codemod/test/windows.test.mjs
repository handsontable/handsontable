import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import jscodeshift from 'jscodeshift';
import { insideRelative, leavesDirectory, toPosix } from '../src/lib/paths.mjs';
import { printTree } from '../src/lib/print.mjs';
import { print } from './helpers/parse.mjs';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const PRINT_MODULE = pathToFileURL(path.join(SRC, 'lib/print.mjs')).href;

/**
 * List every `.mjs` file below a directory.
 *
 * @param {string} dir Absolute directory.
 * @returns {string[]} Absolute file paths.
 */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(full);
    }

    return entry.name.endsWith('.mjs') ? [full] : [];
  });
}

/**
 * Read the argument text of every `.toSource(` call in a text.
 *
 * @param {string} text File text.
 * @returns {string[]} The text between the parentheses of each call.
 */
function toSourceCalls(text) {
  const calls = [];
  let at = text.indexOf('.toSource(');

  while (at !== -1) {
    const start = at + '.toSource('.length;
    let depth = 1;
    let end = start;

    while (depth > 0 && end < text.length) {
      if (text[end] === '(') {
        depth += 1;
      } else if (text[end] === ')') {
        depth -= 1;
      }

      end += 1;
    }

    calls.push(text.slice(start, end - 1));
    at = text.indexOf('.toSource(', end);
  }

  return calls;
}

describe('line terminators of a direct print', () => {
  const lf = 'const a = {\n  b: 1,\n  c: 2,\n};\n';
  const crlf = lf.replace(/\n/g, '\r\n');

  for (const [name, source] of [['LF', lf], ['CRLF', crlf]]) {
    it(`prints a ${name} source with the terminator that was asked for, never the host's`, () => {
      const j = jscodeshift.withParser('babylon');
      const root = j(source);

      assert.equal(printTree(j, root.get().node), lf);
      assert.equal(print(root), lf);
      assert.equal(print(root, { lineTerminator: '\r\n' }), crlf);
    });
  }

  it('keeps `\\n` when the host line ending is `\\r\\n`', () => {
    const script = `
      import os from 'node:os';
      Object.defineProperty(os, 'EOL', { value: '\\r\\n' });
      const { printTree } = await import(${JSON.stringify(PRINT_MODULE)});
      const { default: jscodeshift } = await import('jscodeshift');
      const j = jscodeshift.withParser('babylon');
      const root = j('const a = {\\n  b: 1,\\n};\\n');
      process.stdout.write(JSON.stringify([os.EOL, printTree(j, root.get().node)]));
    `;
    const { stdout, status, stderr } = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: path.join(SRC, '..'),
      encoding: 'utf8',
    });

    assert.equal(status, 0, stderr);
    assert.deepEqual(JSON.parse(stdout), ['\r\n', 'const a = {\n  b: 1,\n};\n']);
  });

  it('has no `toSource()` call in src/ that leaves the line terminator to the host', () => {
    const offenders = sourceFiles(SRC)
      .flatMap(file => toSourceCalls(readFileSync(file, 'utf8')).map(call => ({ file, call })))
      .filter(({ call }) => !/\blineTerminator\b/.test(call))
      .map(({ file }) => path.relative(SRC, file));

    assert.deepEqual(offenders, []);
  });
});

describe('path decisions on every platform', () => {
  const win = path.win32;
  const posix = path.posix;

  it('leavesDirectory takes both separators on Windows and only `/` on POSIX', () => {
    assert.equal(leavesDirectory('..', win), true);
    assert.equal(leavesDirectory('..\\x\\y.css', win), true);
    assert.equal(leavesDirectory('../x/y.css', win), true);
    assert.equal(leavesDirectory('D:\\other\\x.css', win), true);
    assert.equal(leavesDirectory('D:other', win), true);
    assert.equal(leavesDirectory('src\\a.js', win), false);
    assert.equal(leavesDirectory('..odd\\a.js', win), false);

    assert.equal(leavesDirectory('..', posix), true);
    assert.equal(leavesDirectory('../x/y.css', posix), true);
    assert.equal(leavesDirectory('/abs/x.css', posix), true);
    assert.equal(leavesDirectory('..odd/a.js', posix), false);
    assert.equal(leavesDirectory('..\\a.js', posix), false);
    assert.equal(leavesDirectory('src/a.js', posix), false);
  });

  it('toPosix turns Windows separators into forward slashes and leaves POSIX paths alone', () => {
    assert.equal(toPosix('src\\sub\\a.js', win), 'src/sub/a.js');
    assert.equal(toPosix('src/sub/a.js', posix), 'src/sub/a.js');
  });

  it('insideRelative places a real path below a real directory, Windows paths included', () => {
    const root = 'C:\\Users\\runneradmin\\proj';

    assert.equal(insideRelative(root, 'C:\\Users\\runneradmin\\proj\\src\\a.js', win), 'src/a.js');
    assert.equal(insideRelative(root, root, win), '');
    assert.equal(insideRelative(root, 'C:\\Users\\runneradmin\\outside\\x.css', win), null);
    assert.equal(insideRelative(root, 'C:\\Users\\runneradmin\\proj-two\\x.css', win), null);
    assert.equal(insideRelative(root, 'D:\\other\\x.css', win), null);
    assert.equal(insideRelative(root, 'c:\\users\\runneradmin\\proj\\src\\a.js', win), 'src/a.js');
    assert.equal(insideRelative('/work/proj', '/work/proj/src/a.js', posix), 'src/a.js');
    assert.equal(insideRelative('/work/proj', '/work/other/x.css', posix), null);
  });

  it('a short 8.3 name is a different path until realpath expands it, so callers compare real paths', () => {
    const short = 'C:\\Users\\RUNNER~1\\proj';
    const long = 'C:\\Users\\runneradmin\\proj';

    assert.equal(insideRelative(short, `${long}\\src\\a.js`, win), null);
    assert.equal(insideRelative(long, `${long}\\src\\a.js`, win), 'src/a.js');
  });
});
