import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { UsageError } from '../src/errors.mjs';
import {
  compareVersions,
  defaultTo,
  detectInstalledVersion,
  minimumOfRange,
  parseVersion,
  resolveFrom,
  resolveTo,
  selectManifests,
} from '../src/versions.mjs';

const manifests = [
  { version: '17.2.0', status: 'released' },
  { version: '18.0.0', status: 'released' },
  { version: '18.1.0', status: 'released' },
  { version: '18.1.1', status: 'released' },
  { version: '19.0.0', status: 'draft' },
];

/**
 * Select versions for a `--from` and `--to` pair, the way the runner does.
 *
 * @param {string|null} from The `--from` text.
 * @param {string} to The `--to` text.
 * @param {boolean} [includeDraft] Whether drafts may run.
 * @returns {string[]} The selected version names.
 */
function pick(from, to, includeDraft = false) {
  const { selected } = selectManifests(manifests, {
    from: from ? resolveFrom(from) : null,
    to: resolveTo(to, manifests.map(manifest => manifest.version)),
    includeDraft,
  });

  return selected.map(manifest => manifest.version);
}

describe('parseVersion', () => {
  it('parses full, partial, and prefixed versions', () => {
    assert.deepEqual(parseVersion('18.0.0'), { major: 18, minor: 0, patch: 0, parts: 3, prerelease: '' });
    assert.deepEqual(parseVersion('17.1'), { major: 17, minor: 1, patch: 0, parts: 2, prerelease: '' });
    assert.deepEqual(parseVersion('17'), { major: 17, minor: 0, patch: 0, parts: 1, prerelease: '' });
    assert.equal(parseVersion('v18.0.0-rc.1').prerelease, 'rc.1');
  });

  it('rejects text that is not a version', () => {
    for (const bad of ['', 'latest', '17.x', '1.2.3.4', '^17.1.0']) {
      assert.throws(() => parseVersion(bad), UsageError, bad);
    }
  });
});

describe('compareVersions', () => {
  it('orders numerically, not as text', () => {
    assert.ok(compareVersions(parseVersion('17.10.0'), parseVersion('17.9.0')) > 0);
    assert.ok(compareVersions(parseVersion('18.0.0'), parseVersion('17.99.99')) > 0);
    assert.equal(compareVersions(parseVersion('18.0.0'), parseVersion('18')), 0);
  });

  it('sorts a prerelease below its release', () => {
    assert.ok(compareVersions(parseVersion('18.0.0-rc.1'), parseVersion('18.0.0')) < 0);
  });
});

describe('range selection', () => {
  it('selects from < version <= to', () => {
    assert.deepEqual(pick('17.1.0', '18.1.0'), ['17.2.0', '18.0.0', '18.1.0']);
    assert.deepEqual(pick('18.0.0', '18.1.0'), ['18.1.0']);
    assert.deepEqual(pick('17.2.0', '18.0.0'), ['18.0.0']);
  });

  it('treats a partial --from as "any version of that line"', () => {
    assert.deepEqual(pick('17', '18.1.0'), ['18.0.0', '18.1.0']);
    assert.deepEqual(pick('17.1', '18.0.0'), ['17.2.0', '18.0.0']);
    assert.deepEqual(pick('18.0', '18.1.1'), ['18.1.0', '18.1.1']);
  });

  it('resolves a partial --to against the known versions', () => {
    assert.deepEqual(pick('17', '18'), ['18.0.0', '18.1.0', '18.1.1']);
    assert.deepEqual(pick('17', '18.0'), ['18.0.0']);
    assert.deepEqual(resolveTo('18', manifests.map(manifest => manifest.version)).minor, 1);
    assert.equal(resolveTo('18', manifests.map(manifest => manifest.version)).patch, 1);
  });

  it('returns an empty range when from is at or above to', () => {
    assert.deepEqual(pick('18', '18.1'), []);
    assert.deepEqual(pick('18.1.1', '18.1.1'), []);
    assert.deepEqual(pick('19', '18'), []);
  });

  it('keeps a version whose prerelease is installed in range', () => {
    assert.deepEqual(pick('18.0.0-rc.1', '18.0.0'), ['18.0.0']);
  });

  it('gates draft manifests behind includeDraft', () => {
    assert.deepEqual(pick('18', '19'), []);
    assert.deepEqual(pick('18', '19', true), ['19.0.0']);

    const { skippedDrafts } = selectManifests(manifests, {
      from: resolveFrom('18'),
      to: resolveTo('19', ['19.0.0']),
      includeDraft: false,
    });

    assert.deepEqual(skippedDrafts.map(manifest => manifest.version), ['19.0.0']);
  });

  it('accepts no lower bound', () => {
    assert.deepEqual(pick(null, '18.0.0'), ['17.2.0', '18.0.0']);
  });
});

describe('defaultTo', () => {
  it('picks the latest released manifest', () => {
    assert.equal(defaultTo(manifests, false), '18.1.1');
  });

  it('picks the latest manifest of any status when drafts count', () => {
    assert.equal(defaultTo(manifests, true), '19.0.0');
  });

  it('returns null when nothing qualifies', () => {
    assert.equal(defaultTo([{ version: '19.0.0', status: 'draft' }], false), null);
  });
});

describe('minimumOfRange', () => {
  it('takes the lowest version a range allows', () => {
    assert.equal(minimumOfRange('^17.1.0'), '17.1.0');
    assert.equal(minimumOfRange('~17.1'), '17.1');
    assert.equal(minimumOfRange('17.x'), '17');
    assert.equal(minimumOfRange('>=17 <19'), '17');
    assert.equal(minimumOfRange('17.1.0-rc.2'), '17.1.0-rc.2');
  });

  it('returns null when the range names no version', () => {
    for (const range of ['latest', '*', 'workspace:*', '']) {
      assert.equal(minimumOfRange(range), null, range);
    }
  });

  it('reads no version out of a path, a URL, a repository, or a protocol', () => {
    for (const range of [
      'file:../vendor/handsontable-build-2025.11.tgz',
      'link:../forks/handsontable-v2',
      'portal:../handsontable-17',
      'workspace:^17.1.0',
      'workspace:*',
      'catalog:',
      'catalog:v17',
      'git+https://github.com/example/handsontable.git#v17.1.0',
      'git+ssh://git@github.com/example/handsontable.git',
      'github:example/handsontable#17.1.0',
      'example/handsontable#v17',
      'https://example.com/handsontable-17.1.0.tgz',
      'http://example.com/handsontable-17.1.0.tgz',
      '../vendor/handsontable-17.1.0.tgz',
      '/opt/handsontable-17.1.0',
      '~/handsontable-17',
      'patch:handsontable@17.1.0#./fix.patch',
    ]) {
      assert.equal(minimumOfRange(range), null, range);
    }
  });

  it('still reads the range of an npm alias', () => {
    assert.equal(minimumOfRange('npm:handsontable@^17.1.0'), '17.1.0');
    assert.equal(minimumOfRange('npm:@handsontable/vue3@~17.1'), '17.1');
  });
});

describe('detectInstalledVersion', () => {
  /**
   * Run a callback with a fresh temporary directory.
   *
   * @param {(dir: string) => Promise<void>} callback Test body.
   * @returns {Promise<void>}
   */
  async function withProject(callback) {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-versions-'));

    try {
      await callback(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it('prefers the installed package over the declared range', async() => {
    await withProject(async(dir) => {
      await mkdir(join(dir, 'node_modules', 'handsontable'), { recursive: true });
      await writeFile(join(dir, 'node_modules', 'handsontable', 'package.json'), '{"version":"17.1.2"}');
      await writeFile(join(dir, 'package.json'), '{"dependencies":{"handsontable":"^16.0.0"}}');

      assert.deepEqual(await detectInstalledVersion(dir), { version: '17.1.2', source: 'node_modules/handsontable' });
    });
  });

  it('falls back to the minimum of the package.json range', async() => {
    await withProject(async(dir) => {
      await writeFile(join(dir, 'package.json'), '{"devDependencies":{"handsontable":"^17.1.0"}}');

      const detected = await detectInstalledVersion(dir);

      assert.equal(detected?.version, '17.1.0');
      assert.match(detected?.source, /package\.json/);
    });
  });

  it('finds a hoisted install in a parent directory', async() => {
    await withProject(async(dir) => {
      await mkdir(join(dir, 'node_modules', 'handsontable'), { recursive: true });
      await writeFile(join(dir, 'node_modules', 'handsontable', 'package.json'), '{"version":"17.0.0"}');
      await mkdir(join(dir, 'packages', 'app'), { recursive: true });

      assert.equal((await detectInstalledVersion(join(dir, 'packages', 'app')))?.version, '17.0.0');
    });
  });

  it('returns null when the project never names Handsontable', async() => {
    await withProject(async(dir) => {
      await writeFile(join(dir, 'package.json'), '{"dependencies":{"react":"^19.0.0"}}');

      const detected = await detectInstalledVersion(dir);

      // A hoisted install above the temp directory would be a valid answer on a developer machine.
      assert.ok(detected === null || detected.source === 'node_modules/handsontable');
    });
  });
});
