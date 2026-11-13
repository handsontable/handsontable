import assert from 'node:assert/strict';
import { chmod, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { decodeUtf8 } from '../src/lib/text-file.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const RANGE = ['--from', '17.1', '--to', '18.0', '--allow-dirty'];
const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

/**
 * A text with a Latin-1 byte (`0xE9`, "é") that is not valid UTF-8, as a Buffer.
 *
 * @param {string} before Text before the byte.
 * @param {string} after Text after the byte.
 * @returns {Buffer} The bytes.
 */
function latin1(before, after) {
  return Buffer.concat([Buffer.from(before, 'latin1'), Buffer.from([0xE9]), Buffer.from(after, 'latin1')]);
}

const JS_BODY = '\nimport Handsontable from \'handsontable\';\n'
  + 'new Handsontable(el, { data: [], correctFormat: true });\n';

describe('a file that is not valid UTF-8 is left alone', () => {
  const cases = {
    'a.js': latin1('// caf', JS_BODY),
    'a.ts': latin1('// caf', JS_BODY),
    'a.css': latin1('/* caf', ' */\n.ht-theme-main { --ht-wrapper-border-width: 1px; }\n'),
    'a.vue': latin1('<script>\n// caf', `${JS_BODY}</script>\n`),
    'a.html': latin1('<!-- caf', ' -->\n<script>new Handsontable(el, { correctFormat: true });</script>\n'),
    'package.json': latin1('{ "name": "caf', '", "dependencies": { "handsontable": "^17.1.0" } }\n'),
  };

  for (const [name, bytes] of Object.entries(cases)) {
    it(`${name}: the bytes stay and a skipped-file warning says why`, async() => {
      await inPlainProject({ [name]: bytes }, async(dir) => {
        const result = await migrate(dir, [...RANGE, '.']);

        assert.deepEqual(await readFile(join(dir, name)), bytes, 'the file was rewritten');
        assert.match(result.stdout, /not valid UTF-8/, result.stdout);
        assert.match(result.stdout, new RegExp(`${name.replace('.', '\\.')}`));
        assert.doesNotMatch(result.stdout, /�/);
        assert.equal(result.status, 0, result.stderr);
      });
    });
  }

  it('also skips it in a dry run, and the summary counts no changed file for it', async() => {
    await inPlainProject({ 'a.js': latin1('// caf', JS_BODY) }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--dry-run', '.']);

      assert.match(result.stdout, /not valid UTF-8/);
      assert.match(result.stdout, /Summary: 0 files would change/);
    });
  });

  it('still migrates the valid UTF-8 files of the same project', async() => {
    await inPlainProject({
      'bad.js': latin1('// caf', JS_BODY),
      'good.js': `// café${JS_BODY}`,
    }, async(dir) => {
      await migrate(dir, [...RANGE, '.']);

      const good = await readFile(join(dir, 'good.js'), 'utf8');

      assert.match(good, /café/);
      assert.doesNotMatch(good, /correctFormat: true/);
    });
  });

  it('keeps a UTF-8 byte order mark, in a script and in a stylesheet', async() => {
    await inPlainProject({
      'a.js': Buffer.concat([BOM, Buffer.from(`// café${JS_BODY}`)]),
      'a.css': Buffer.concat([BOM, Buffer.from('.ht-theme-main { --ht-wrapper-border-width: 1px; }\n')]),
    }, async(dir) => {
      await migrate(dir, [...RANGE, '.']);

      for (const name of ['a.js', 'a.css']) {
        const bytes = await readFile(join(dir, name));

        assert.deepEqual(bytes.subarray(0, 3), BOM, `${name} lost its byte order mark`);
        assert.equal(bytes.subarray(3).includes(BOM), false);
      }

      assert.doesNotMatch(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
    });
  });
});

// A read-only file is the way to make `writeFile` fail. Windows and root ignore the mode bits that matter here.
const CAN_BLOCK_WRITES = process.platform !== 'win32' && process.getuid?.() !== 0;

describe('a file that cannot be written', () => {
  it('is a warning, not a changed file, and the other files are still migrated', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': JS_BODY, 'b.js': JS_BODY }, async(dir) => {
      await chmod(join(dir, 'a.js'), 0o444);

      const result = await migrate(dir, [...RANGE, '.']);

      assert.match(result.stdout, /could not be written/, result.stdout);
      assert.match(result.stdout, /Summary: 1 file changed/, result.stdout);
      assert.equal(result.status, 1);
      assert.doesNotMatch(result.stderr, /EACCES.*\n\s+at /, 'a stack trace reached the user');
      assert.match(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
      assert.doesNotMatch(await readFile(join(dir, 'b.js'), 'utf8'), /correctFormat: true/);
    });
  });
});

describe('decodeUtf8()', () => {
  it('keeps a byte order mark as the first character', () => {
    assert.equal(decodeUtf8(Buffer.concat([BOM, Buffer.from('a')])), '﻿a');
  });

  it('throws on a byte that is not UTF-8 and on a truncated sequence', () => {
    assert.throws(() => decodeUtf8(Buffer.from([0x61, 0xE9, 0x62])), /not valid UTF-8/);
    assert.throws(() => decodeUtf8(Buffer.from([0xE2, 0x82])), /not valid UTF-8/);
  });

  it('accepts text outside the Basic Multilingual Plane', () => {
    assert.equal(decodeUtf8(Buffer.from('a\u{1F600}')), 'a\u{1F600}');
  });
});

describe('a package.json with a byte order mark', () => {
  const body = '{\n  "dependencies": { "handsontable": "^17.1.0" }\n}\n';

  it('gets the bump, keeps the mark, and stays valid JSON for npm', async() => {
    await inPlainProject({ 'package.json': Buffer.concat([BOM, Buffer.from(body)]) }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '.']);
      const bytes = await readFile(join(dir, 'package.json'));

      assert.deepEqual(bytes.subarray(0, 3), BOM);
      assert.equal(JSON.parse(bytes.subarray(3).toString('utf8')).dependencies.handsontable, '^18.0.0');
      assert.equal(bytes.subarray(3).toString('utf8'), body.replace('^17.1.0', '^18.0.0'));
      assert.doesNotMatch(result.stdout, /could not be parsed/);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });

  it('is left without a mark when it had none', async() => {
    await inPlainProject({ 'package.json': body }, async(dir) => {
      await migrate(dir, [...RANGE, '.']);

      assert.equal(await readFile(join(dir, 'package.json'), 'utf8'), body.replace('^17.1.0', '^18.0.0'));
    });
  });

  it('counts exactly the files it changed', async() => {
    await inPlainProject({
      'package.json': Buffer.concat([BOM, Buffer.from(body)]),
      'a.js': `${JS_BODY}`,
    }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '.']);

      assert.match(result.stdout, /Summary: 2 files changed/, result.stdout);
    });
  });
});
