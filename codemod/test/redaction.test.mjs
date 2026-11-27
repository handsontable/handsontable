import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { redact } from '../src/lib/redact.mjs';
import { run } from '../src/runner.mjs';
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

  it('hides a password that holds an @, up to the last one of the authority', () => {
    assert.equal(redact('git+https://user:p@ssword1@github.com/o/r.git'), 'git+https://***@github.com/o/r.git');
    assert.equal(redact('https://a:b@c:d@host:8080/x@y'), 'https://***@host:8080/x@y');
    assert.equal(redact('https://tok@en@host?mail=a@b#c@d'), 'https://***@host?mail=a@b#c@d');
  });

  it('hides the value of a query parameter named like a secret and keeps its name', () => {
    assert.equal(redact('https://host.example/h.tgz?token=TOKQ&x=1'), 'https://host.example/h.tgz?token=***&x=1');
    assert.equal(redact('https://h.example/a.tgz?x=1&access_token=TOKQ'),
      'https://h.example/a.tgz?x=1&access_token=***');
    assert.equal(redact('https://h.example/a?auth=A&key=B&password=C&secret=D&sig=E'),
      'https://h.example/a?auth=***&key=***&password=***&secret=***&sig=***');
    assert.equal(redact('https://h.example/a?TOKEN=A&Api_Key=B&X-Amz-Signature=C'),
      'https://h.example/a?TOKEN=***&Api_Key=***&X-Amz-Signature=***');
    assert.equal(redact('a "https://h.example/a?token=TOKQ" in dependencies'),
      'a "https://h.example/a?token=***" in dependencies');
  });

  it('hides a credential in the fragment, alone or after another parameter', () => {
    assert.equal(redact('https://h.example/a.tgz#access_token=TOKQ'), 'https://h.example/a.tgz#access_token=***');
    assert.equal(redact('https://h.example/a.tgz#v=1&token=TOKQ&w=2'), 'https://h.example/a.tgz#v=1&token=***&w=2');
    assert.equal(redact('git+https://h.example/r.git?ref=main#key=TOKQ'),
      'git+https://h.example/r.git?ref=main#key=***');
  });

  it('hides the user information and a query credential of one URL together', () => {
    assert.equal(redact('https://user:pw@h.example/a?token=TOKQ'), 'https://***@h.example/a?token=***');
  });

  it('leaves everything else as it was', () => {
    for (const text of [
      '//cdn.example.com/npm/@scope/pkg',
      'https://cdn.example.com/npm/@scope/pkg@1.0.0/a.js',
      'https://example.com?mail=a@b.c',
      'https://example.com#a@b',
      '^17.1.0',
      'git+https://github.com/o/r.git#v1',
      'git@github.com:o/r.git',
      'https://cdn.jsdelivr.net/npm/@handsontable/pikaday@1.0.0/dist/a.js',
      'https://example.com/path?mail=user@example.com',
      'npm:handsontable@^17.0.0',
      'file:../handsontable',
      'https://example.com/a?monkey=1&tokens=2&keyboard=3&author=me',
      'https://example.com/a?page=2#section=token',
      'https://example.com/a?token=&x=1',
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

  it('a token in the query or the fragment of a spec is hidden in the console, report file, stderr, and dry-run',
    async() => {
      const packageJson = `{
  "dependencies": {
    "handsontable": "https://host.example/h.tgz?token=${TOKEN}&x=1",
    "@handsontable/react-wrapper": "https://host.example/react.tgz#access_token=${TOKEN}",
    "private-lib": "https://host.example/p.tgz?x=1&Secret=${TOKEN}"
  }
}
`;

      await inPlainProject({ 'package.json': packageJson }, async(dir) => {
        for (const extra of [[], ['--dry-run']]) {
          const result = await migrate(dir, [...RANGE, ...extra, '--report', 'report.md', '.']);
          const report = await readFile(join(dir, 'report.md'), 'utf8');

          assert.equal(result.stdout.includes(TOKEN), false, `stdout leaked: ${result.stdout}`);
          assert.equal(result.stderr.includes(TOKEN), false, `stderr leaked: ${result.stderr}`);
          assert.equal(report.includes(TOKEN), false, `the report leaked: ${report}`);
          assert.match(result.stdout + report, /h\.tgz\?token=\*\*\*&x=1/, 'the spec is named, without its token');
        }
      });
    });

  it('a credential on the hyperformula spec of a parent package.json is hidden in the entry, report, and console',
    async() => {
      await inPlainProject({
        'package.json': `{
  "dependencies": {
    "hyperformula": "git+https://user:${TOKEN}@github.com/handsontable/hyperformula.git#semver:^2.0.0"
  }
}
`,
        'packages/app/package.json': '{ "dependencies": { "handsontable": "^17.1.0" } }\n',
        'packages/app/src/grid.js':
          'import { HyperFormula } from \'hyperformula\';\nimport Handsontable from \'handsontable\';\n'
          + 'new Handsontable(document.body, { formulas: { engine: HyperFormula } });\n',
      }, async(dir) => {
        const result = await migrate(dir, [...RANGE, '--report', 'report.md', '.']);
        const report = await readFile(join(dir, 'report.md'), 'utf8');
        const entry = result.stdout + report;

        const direct = await run({ cwd: dir, from: '17.1', to: '18.1', dryRun: true, allowDirty: true });
        const messages = direct.report.entries.map(item => item.message).join('\n');

        assert.match(messages, /Update hyperformula in package\.json to \^3\.0\.0/, messages);
        assert.equal(messages.includes(TOKEN), false, `an entry message leaked: ${messages}`);
        assert.match(entry, /Update hyperformula in package\.json to \^3\.0\.0/, entry);
        assert.equal(entry.includes(TOKEN), false, entry);
        assert.equal(result.stderr.includes(TOKEN), false, result.stderr);
      });
    });

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
