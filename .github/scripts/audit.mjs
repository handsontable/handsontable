// Audits production dependencies using npm audit (pnpm audit hits retired endpoints).
// Merges deps from all workspace packages into a temp dir, runs npm audit, and
// exits non-zero only for fixable vulnerabilities (replicates --ignore-unfixable).

import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'audit-'));
const deps = {};

for (const pkg of ['handsontable', 'wrappers/react-wrapper', 'wrappers/vue3', 'wrappers/angular-wrapper']) {
  const json = JSON.parse(readFileSync(join(root, pkg, 'package.json'), 'utf8'));

  for (const field of ['dependencies', 'optionalDependencies'])
    for (const [k, v] of Object.entries(json[field] ?? {}))
      if (!v.startsWith('workspace:')) deps[k] = v;
}

writeFileSync(join(tmp, 'package.json'), JSON.stringify({ dependencies: deps }));
execSync('npm install --package-lock-only --ignore-scripts --no-fund', { cwd: tmp, stdio: 'inherit' });

let result;

try {
  result = JSON.parse(execSync('npm audit --omit=dev --json', { cwd: tmp }).toString());
} catch (e) {
  result = JSON.parse(e.stdout?.toString() || '{}');
}

const fixable = Object.values(result.vulnerabilities ?? {}).filter(v => v.fixAvailable !== false);

if (fixable.length) {
  for (const v of fixable) console.error(`  ${v.name} (${v.severity})`);
  process.exit(1);
}
