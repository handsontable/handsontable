import { spawnSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve, join, sep } from 'path';

import fse from 'fs-extra';

const SCRIPT_PATH = resolve(__dirname, '../../scripts/prepare-package-for-publish.mjs');

const readRepoFile = relativePath => readFileSync(resolve(__dirname, '../../../', relativePath), 'utf8');

/**
 * Extract a single job's YAML block from a workflow file.
 *
 * @param {string} workflow The workflow file content.
 * @param {string} jobId The job key to extract.
 * @returns {string}
 */
function extractJob(workflow, jobId) {
  const match = workflow.match(new RegExp(`\\n {2}${jobId}:\\n([\\s\\S]*?)(?=\\n {2}[a-z][\\w-]*:\\n|$)`));

  expect(match).not.toBeNull();

  // Comments describe the steps in the same words the steps use, so they are dropped before any
  // step ordering is read off the text.
  return match[1].split('\n').filter(line => !/^\s*#/.test(line)).join('\n');
}

/**
 * Compose a throwaway package tree and run the packaging script against it.
 *
 * @param {object} handsontableConfig The `handsontable` key of the fixture package.json.
 * @param {object} tmpFiles A map of `tmp/`-relative paths to file contents.
 * @param {string[]} args Extra CLI arguments for the script.
 * @param {object} sourceFiles A map of checkout-relative paths to file contents, for the copy step.
 * @returns {{ status: number, output: string, files: string[] }}
 */
function runOnFixture(handsontableConfig, tmpFiles, args = [], sourceFiles = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'hot-packaging-'));

  try {
    fse.writeJsonSync(join(cwd, 'package.json'), {
      name: 'handsontable-fixture',
      handsontable: handsontableConfig,
    });

    Object.entries(tmpFiles).forEach(([filePath, content]) => {
      fse.outputFileSync(join(cwd, 'tmp', filePath), content);
    });

    Object.entries(sourceFiles).forEach(([filePath, content]) => {
      fse.outputFileSync(join(cwd, filePath), content);
    });

    const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd, encoding: 'utf8' });

    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
      files: fse.existsSync(join(cwd, 'tmp')) ?
        fse.readdirSync(join(cwd, 'tmp'), { recursive: true }).map(file => file.split(sep).join('/')) : [],
    };

  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

describe('preview package composition', () => {
  describe('CI wiring', () => {
    it('should build the theme UMD bundles in the UMD job', () => {
      // dist/themes/** is emitted only by these two tasks. Without them the UMD artifact is not
      // the full UMD output, and every package composed from it ships no theme bundles.
      const umdJob = extractJob(readRepoFile('.github/workflows/build.yml'), 'umd');

      expect(umdJob).toContain('npm run build:themes-umd\n');
      expect(umdJob).toContain('npm run build:themes-umd.min\n');
    });

    it('should compose a publishable package only where the whole package exists', () => {
      // Both directions matter. A job composing a partial tree with the strict script fails on
      // every run; a job composing the published tree with the partial script publishes whatever
      // happens to be there. Both are spelled out, so a new call site has to pick one on purpose.
      // Composite actions run the same commands as a workflow step, so they are scanned too.
      const ciRoot = resolve(__dirname, '../../../.github');
      const workflowFiles = fse.readdirSync(join(ciRoot, 'workflows'))
        .filter(fileName => /\.ya?ml$/.test(fileName))
        .map(fileName => `workflows/${fileName}`);
      const actionFiles = fse.readdirSync(join(ciRoot, 'actions'), { recursive: true })
        .map(entry => entry.split(sep).join('/'))
        .filter(entry => /(^|\/)action\.ya?ml$/.test(entry))
        .map(entry => `actions/${entry}`);
      const callers = { strict: new Set(), partial: new Set() };

      [...workflowFiles, ...actionFiles].forEach((filePath) => {
        readRepoFile(`.github/${filePath}`)
          .split('\n')
          .filter(line => !/^\s*#/.test(line))
          .forEach((line) => {
            if (/\bpostbuild:partial\b/.test(line)) {
              callers.partial.add(filePath);
            } else if (/\bpostbuild\b/.test(line)) {
              callers.strict.add(filePath);
            }
          });
      });

      // Only the preview publish composes a complete package.
      expect([...callers.strict].sort()).toEqual(['workflows/integration.yml']);
      // The ES + CJS build runs before the UMD bundles and the theme stylesheets exist; the
      // visual runs compose a tree for screenshots that never reaches a registry.
      expect([...callers.partial].sort()).toEqual(['workflows/build.yml', 'workflows/visual.yml']);
    });

    it('should compose the preview package after the artifacts land and before the publish', () => {
      const previewJob = extractJob(readRepoFile('.github/workflows/integration.yml'), 'preview-packages');
      const extractIndex = previewJob.indexOf('tar -zxf dist.tar.gz');
      const composeIndex = previewJob.indexOf('npm run postbuild');
      const publishIndex = previewJob.indexOf('pkg-pr-new publish');

      expect(extractIndex).toBeGreaterThan(-1);
      expect(composeIndex).toBeGreaterThan(extractIndex);
      expect(publishIndex).toBeGreaterThan(composeIndex);
    });

    it('should not touch the composed package after the composition step', () => {
      // The exports map describes the tree as it looked when the script ran. Copying files in
      // afterwards is what shipped previews whose theme stylesheets were absent from the map.
      const previewJob = extractJob(readRepoFile('.github/workflows/integration.yml'), 'preview-packages');
      const afterCompose = previewJob.slice(
        previewJob.indexOf('npm run postbuild'),
        previewJob.indexOf('pkg-pr-new publish')
      );

      expect(afterCompose).not.toMatch(/\b(cp|mv|rsync)\b[^\n]*handsontable\/tmp/);
    });
  });

  describe('completeness checks', () => {
    const EXPORTS_ONE_RULE = ['./styles/**/*.+(css)'];

    it('should fail when a copied file or directory is missing', () => {
      const { status, output } = runOnFixture(
        { copy: ['dist/themes'], exports: EXPORTS_ONE_RULE, fields: ['name'] },
        { 'styles/ht-theme-main.css': '' }
      );

      expect(status).toBe(1);
      expect(output).toContain('dist/themes');
      expect(output).toContain('postbuild:partial');
    });

    it('should fail when an exports rule matches no file', () => {
      const { status, output } = runOnFixture(
        { copy: [], exports: EXPORTS_ONE_RULE, fields: ['name'] },
        { 'index.js': '' }
      );

      expect(status).toBe(1);
      expect(output).toContain('./styles/**/*.+(css)');
    });

    it('should pass on a complete tree', () => {
      const { status } = runOnFixture(
        { copy: [], exports: EXPORTS_ONE_RULE, fields: ['name'] },
        { 'styles/ht-theme-main.css': '' }
      );

      expect(status).toBe(0);
    });

    it('should fail when a copy pattern is met by neither the checkout nor the composed tree', () => {
      // A pattern matching no source file records no destination, so the destination-side check
      // never sees the entry unless the pattern itself is checked against the composed tree.
      const { status, output } = runOnFixture(
        { copy: [{ pattern: 'types/**/*.d.ts', pathSlice: 1 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '' }
      );

      expect(status).toBe(1);
      expect(output).toContain('types/**/*.d.ts');
      expect(output).toContain('postbuild:partial');
    });

    it('should accept a copy pattern the composed tree already carries', () => {
      // The preview job's case: the pattern's source is absent from the checkout because the
      // files arrive inside an artifact's `tmp/`. The package is complete, so this must pass.
      const { status } = runOnFixture(
        { copy: [{ pattern: 'types/**/*.d.ts', pathSlice: 1 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'base.d.ts': 'export {};\n' }
      );

      expect(status).toBe(0);
    });

    it('should read an unmet copy pattern in the same order the copy step does', () => {
      // The copy step slices the matched path first and drops a leading `../` only afterwards, so
      // `../types/**` with pathSlice 1 lands in `tmp/types/`, not in the root of the package.
      const unmetPattern = { pattern: '../types/**/*.d.ts', pathSlice: 1 };
      const rootOnly = runOnFixture(
        { copy: [unmetPattern], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'base.d.ts': 'export {};\n' }
      );
      const inPlace = runOnFixture(
        { copy: [unmetPattern], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'types/base.d.ts': 'export {};\n' }
      );

      expect(rootOnly.status).toBe(1);
      expect(inPlace.status).toBe(0);
    });

    it('should drop a leading `..` from a pattern nothing is sliced off', () => {
      // Sibling of the order test above with one variable changed: at pathSlice 1 the slice is
      // what consumes the `..`, so the documented drop itself runs only at pathSlice 0. The
      // destination is the same either way – the copy step joins the unsliced path onto `tmp/`
      // after dropping one `../` – so `tmp/types/` satisfies the entry and the root does not.
      const unmetPattern = { pattern: '../types/**/*.d.ts', pathSlice: 0 };
      const rootOnly = runOnFixture(
        { copy: [unmetPattern], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'base.d.ts': 'export {};\n' }
      );
      const inPlace = runOnFixture(
        { copy: [unmetPattern], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'types/base.d.ts': 'export {};\n' }
      );

      expect(rootOnly.status).toBe(1);
      expect(inPlace.status).toBe(0);
    });

    it('should accept a copy pattern that declares no pathSlice', () => {
      // `pathSlice` is optional. Read raw, it slices nothing in the copy step but keeps every
      // segment in the wildcard guard, which would refuse a complete package as unverifiable.
      const { status } = runOnFixture(
        { copy: [{ pattern: 'themes/**/*.css' }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'themes/ht-theme-main.css': '' }
      );

      expect(status).toBe(0);
    });

    it('should refuse to verify a copy pattern sliced through a wildcard', () => {
      // `pathSlice` counts path segments while the pattern is sliced by pattern segments, so a
      // `**` inside the sliced prefix makes the destination undecidable. That must fail loudly
      // rather than be checked against a pattern that means something else.
      const { status, output } = runOnFixture(
        { copy: [{ pattern: 'src/**/types/*.d.ts', pathSlice: 2 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'types/base.d.ts': 'export {};\n' }
      );

      expect(status).toBe(1);
      expect(output).toContain('not literal');
      expect(output).toContain('src/**/types/*.d.ts');
    });

    it('should refuse a sliced prefix that is a single-segment wildcard too', () => {
      // Deliberately broader than the `**` case above: `*` never matches a separator, so the
      // segment count does line up here and the destination would be decidable. The guard still
      // refuses it, because a wildcard prefix is not a known prefix. Pinned so the breadth reads
      // as the choice it is rather than as an oversight to tidy up.
      const { status, output } = runOnFixture(
        { copy: [{ pattern: 'src/*/types/*.d.ts', pathSlice: 2 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'types/base.d.ts': 'export {};\n' }
      );

      expect(status).toBe(1);
      expect(output).toContain('not literal');
      expect(output).toContain('src/*/types/*.d.ts');
    });

    it('should refuse a copy pattern that slices away entirely', () => {
      // The prefix here is fully literal, so the wildcard branch does not apply, yet nothing is
      // left to address the files by: the copy step drops such a match into the root of `tmp/`
      // unnamed. Refusing is right, but reporting a non-literal prefix would send a reader
      // looking for a wildcard that is not in the pattern.
      const { status, output } = runOnFixture(
        { copy: [{ pattern: 'types', pathSlice: 1 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '', 'types/base.d.ts': 'export {};\n' }
      );

      expect(status).toBe(1);
      expect(output).toContain('leaves nothing to address the files by');
      expect(output).not.toContain('not literal');
      expect(output).toContain('postbuild:partial');
    });

    it('should copy a pattern match to its sliced destination', () => {
      const { status, files } = runOnFixture(
        { copy: [{ pattern: 'types/**/*.d.ts', pathSlice: 1 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '' },
        [],
        { 'types/base.d.ts': 'export {};\n' }
      );

      expect(status).toBe(0);
      expect(files).toContain('base.d.ts');
    });

    it('should downgrade the checks to warnings in the partial mode', () => {
      const { status, output } = runOnFixture(
        { copy: ['dist/themes'], exports: EXPORTS_ONE_RULE, fields: ['name'] },
        { 'index.js': '' },
        ['--partial']
      );

      expect(status).toBe(0);
      expect(output).toContain('WARNING');
    });

    it('should downgrade an unmet copy pattern to a warning in the partial mode', () => {
      const { status, output } = runOnFixture(
        { copy: [{ pattern: 'types/**/*.d.ts', pathSlice: 1 }], exports: ['./*.js'], fields: ['name'] },
        { 'index.js': '' },
        ['--partial']
      );

      expect(status).toBe(0);
      expect(output).toContain('WARNING');
      expect(output).toContain('types/**/*.d.ts');
    });
  });
});
