import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { redact } from '../src/lib/redact.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const TOKEN = 'ghp_SECRETTOKEN0123456789';
const RANGE = ['--from', '17.1', '--to', '18.1', '--allow-dirty'];

describe('redact()', () => {
  it('hides the user information of a URL, with or without a password', () => {
    assert.equal(redact(`git+https://user:${TOKEN}@github.com/o/r.git#v1`), 'git+https://***@github.com/o/r.git#v1');
    assert.equal(redact(`https://${TOKEN}@example.com/a.tgz`), 'https://***@example.com/a.tgz');
    assert.equal(redact(`a ssh://git:${TOKEN}@host/r and https://u:${TOKEN}@h/x`),
      'a ssh://***@host/r and https://***@h/x');
  });

  it('leaves everything else as it was', () => {
    for (const text of [
      '^17.1.0',
      'git+https://github.com/o/r.git#v1',
      'git@github.com:o/r.git',
      'https://cdn.jsdelivr.net/npm/@handsontable/pikaday@1.0.0/dist/a.js',
      'https://example.com/path?mail=user@example.com',
      'npm:handsontable@^17.0.0',
      'file:../handsontable',
    ]) {
      assert.equal(redact(text), text);
    }
  });

  it('passes a value that is not text through', () => {
    assert.equal(redact(undefined), undefined);
    assert.equal(redact(null), null);
  });
});

describe('a credential in a dependency spec never reaches the output', () => {
  const projects = {
    'handsontable from a git URL': `{
  "dependencies": {
    "handsontable": "git+https://user:${TOKEN}@github.com/handsontable/handsontable.git#v17.1.0",
    "private-lib": "git+https://user:${TOKEN}@github.com/o/private.git",
    "@handsontable/react-wrapper": "https://user:${TOKEN}@registry.example.com/react-wrapper.tgz"
  }
}
`,
    'a catalog next to a credential': `{
  "dependencies": {
    "@handsontable/vue3": "^17.1.0",
    "handsontable": "https://${TOKEN}@registry.example.com/hot.tgz"
  }
}
`,
  };

  for (const [name, packageJson] of Object.entries(projects)) {
    it(`${name}: console, report file, stderr, and dry-run diff are clean`, async() => {
      await inPlainProject({ 'package.json': packageJson }, async(dir) => {
        for (const extra of [[], ['--dry-run']]) {
          const result = await migrate(dir, [...RANGE, ...extra, '--report', 'report.md', '.']);
          const report = await readFile(join(dir, 'report.md'), 'utf8');

          assert.equal(result.stdout.includes(TOKEN), false, `stdout leaked: ${result.stdout}`);
          assert.equal(result.stderr.includes(TOKEN), false, `stderr leaked: ${result.stderr}`);
          assert.equal(report.includes(TOKEN), false, `the report leaked: ${report}`);
          assert.match(result.stdout + report, /\/\/\*\*\*@/, 'the spec should still be named, without its credential');
        }
      });
    });
  }

  it('the usage error for a spec with no version does not print the credential', async() => {
    await inPlainProject({
      'package.json': `{ "dependencies": { "handsontable": "git+https://user:${TOKEN}@github.com/o/r.git" } }\n`,
    }, async(dir) => {
      const result = await migrate(dir, ['--to', '18.1', '.']);

      assert.equal(result.status, 2);
      assert.match(result.stderr, /is not a version/);
      assert.equal((result.stdout + result.stderr).includes(TOKEN), false, result.stderr);
    });
  });

  it('a --from value that holds a credential is not echoed back', async() => {
    await inPlainProject({ 'package.json': '{}\n' }, async(dir) => {
      const result = await migrate(dir, ['--from', `https://user:${TOKEN}@example.com`, '.']);

      assert.equal(result.status, 2);
      assert.equal((result.stdout + result.stderr).includes(TOKEN), false, result.stderr);
    });
  });

  it('a diff line that sits next to a credential is printed without it', async() => {
    await inPlainProject({
      'package.json': `{
  "dependencies": {
    "handsontable": "^17.1.0",
    "private-lib": "git+https://user:${TOKEN}@github.com/o/private.git"
  }
}
`,
    }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--dry-run', '.']);

      assert.match(result.stdout, /\+\s+"handsontable": "\^18\.1\.0"/, result.stdout);
      assert.equal(result.stdout.includes(TOKEN), false, result.stdout);
    });
  });

  it('keeps a spec without credentials exactly as written', async() => {
    await inPlainProject({
      'package.json': '{ "dependencies": { "handsontable": "git+https://github.com/o/r.git#v17.1.0" } }\n',
    }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '.']);

      assert.match(result.stdout, /git\+https:\/\/github\.com\/o\/r\.git#v17\.1\.0/);
    });
  });
});
