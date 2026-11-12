import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Files of a small project that is on Handsontable 17.1: the vanilla, React, Angular, and Vue wrappers, a type
 * module, a theme stylesheet, a file that has nothing to do with Handsontable, and decoys the tool must not touch
 * (`node_modules`, `dist`). Every decoy holds code that a rule would rewrite, so "untouched" proves the filter.
 *
 * @type {Record<string, string>}
 */
export const SAMPLE_FILES = {
  '.gitignore': '.env\ncoverage/\n',
  'package.json': `${JSON.stringify({
    name: 'sample-app',
    version: '1.0.0',
    private: true,
    dependencies: {
      '@handsontable/react-wrapper': '^17.1.0',
      handsontable: '^17.1.0',
      react: '^18.0.0',
    },
  }, null, 2)}\n`,
  'src/grid.js': `import Handsontable from 'handsontable';

export const hot = new Handsontable(document.querySelector('#grid'), {
  licenseKey: 'non-commercial-and-evaluation',
  data: [],
  columns: [
    { type: 'numeric', numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' } },
    { type: 'date', dateFormat: 'DD/MM/YYYY', correctFormat: true },
  ],
});
`,
  'src/types.ts': `import type { CellValue, RowObject } from 'handsontable/common';
import type { SortOrderType } from 'handsontable/plugins/columnSorting';
import Handsontable from 'handsontable';

export type Cell = CellValue | RowObject;

export let order: SortOrderType;

export let coords: Handsontable.CellCoords;
`,
  'src/App.tsx': `import { HotTable, HotColumn } from '@handsontable/react-wrapper';

export function App() {
  return (
    <HotTable data={[]} licenseKey="non-commercial-and-evaluation">
      <HotColumn type="numeric" numericFormat={{ pattern: '0,0.00', culture: 'ja-JP' }} />
    </HotTable>
  );
}
`,
  'src/angular.component.ts': `import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [HotTableModule],
  templateUrl: './angular.component.html',
})
export class OrdersComponent {
  gridSettings = {
    licenseKey: 'non-commercial-and-evaluation',
    columns: [{ type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'fr-FR' } }],
  };
}
`,
  'src/angular.component.html':
    '<hot-table style="--ht-wrapper-border-radius: 4px" [settings]="gridSettings"></hot-table>\n',
  'src/Grid.vue': `<template>
  <hot-table :settings="settings" />
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import type { GridSettings } from 'handsontable/settings';
import type { CellValue } from 'handsontable/common';

const first: CellValue = 1;
const settings: GridSettings = {
  licenseKey: 'non-commercial-and-evaluation',
  data: [[first]],
  columns: [{ type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'de-DE' } }],
};
</script>

<style lang="scss">
.grid {
  --ht-wrapper-border-radius: 8px;
}
</style>
`,
  'src/theme.scss': `.ht-theme-main {
  --ht-wrapper-border-radius: 6px;
  --ht-wrapper-border-width: 1px;
}
`,
  'src/util.js': `// Not related to Handsontable. correctFormat and culture mean something else here.
export const form = { correctFormat: true, culture: 'de-DE' };
`,
  'dist/bundle.js': `import Handsontable from 'handsontable';

new Handsontable(el, { licenseKey: 'x', columns: [{ type: 'date', correctFormat: true }] });
`,
  'node_modules/other-lib/index.js': `import Handsontable from 'handsontable';

new Handsontable(el, { licenseKey: 'x', columns: [{ type: 'date', correctFormat: true }] });
`,
};

/**
 * Environment for a git child process that ignores any repository the test runner itself sits in.
 *
 * @returns {NodeJS.ProcessEnv} The environment.
 */
function gitEnv() {
  const env = { ...process.env };

  ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'].forEach(name => delete env[name]);

  return env;
}

/**
 * Run git in a project with an explicit identity, so the test needs no global configuration.
 *
 * @param {string} dir Project directory.
 * @param {string[]} args Git arguments.
 * @returns {string} Standard output.
 */
export function git(dir, args) {
  const identity = ['-c', 'user.name=T', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false'];

  return execFileSync('git', [...identity, ...args], { cwd: dir, env: gitEnv(), encoding: 'utf8' });
}

/**
 * Write files into a directory, creating the folders on the way.
 *
 * @param {string} dir Project directory.
 * @param {Record<string, string>} files File text by project-relative path.
 * @returns {Promise<void>}
 */
export async function writeFiles(dir, files) {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true });
    await writeFile(join(dir, name), text);
  }
}

/**
 * Create the sample project under the system temp directory (never inside the monorepo, or git would see the
 * monorepo) as a git repository with one commit. Untracked ignored files are added afterwards.
 *
 * @param {Record<string, string>} [extra] Files to add or replace before the commit.
 * @returns {Promise<string>} The project directory.
 */
export async function createSampleProject(extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-e2e-'));

  await writeFiles(dir, { ...SAMPLE_FILES, ...extra });
  git(dir, ['init', '-q']);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'init']);

  return dir;
}
