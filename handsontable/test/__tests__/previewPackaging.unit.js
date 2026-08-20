import { spawnSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve, join } from 'path';

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
 * @returns {{ status: number, output: string }}
 */
function runOnFixture(handsontableConfig, tmpFiles, args = []) {
  const cwd = mkdtempSync(join(tmpdir(), 'hot-packaging-'));

  try {
    fse.writeJsonSync(join(cwd, 'package.json'), {
      name: 'handsontable-fixture',
      handsontable: handsontableConfig,
    });

    Object.entries(tmpFiles).forEach(([filePath, content]) => {
      fse.outputFileSync(join(cwd, 'tmp', filePath), content);
    });

    const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd, encoding: 'utf8' });

    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
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

    it('should keep the ES + CJS job the only caller that skips the packaging checks', () => {
      // That job composes a tree without the UMD bundles and the theme stylesheets on purpose. Any
      // other opt-out means an incomplete package can be published without CI saying a word.
      const workflowsPath = resolve(__dirname, '../../../.github/workflows');
      const callers = fse.readdirSync(workflowsPath)
        .filter(fileName => fileName.endsWith('.yml'))
        .filter(fileName => readRepoFile(`.github/workflows/${fileName}`).includes('postbuild:partial'));

      expect(callers).toEqual(['build.yml']);
      expect(extractJob(readRepoFile('.github/workflows/build.yml'), 'es-cjs'))
        .toContain('npm run postbuild:partial');
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

    it('should downgrade the checks to warnings in the partial mode', () => {
      const { status, output } = runOnFixture(
        { copy: ['dist/themes'], exports: EXPORTS_ONE_RULE, fields: ['name'] },
        { 'index.js': '' },
        ['--partial']
      );

      expect(status).toBe(0);
      expect(output).toContain('WARNING');
    });
  });
});
