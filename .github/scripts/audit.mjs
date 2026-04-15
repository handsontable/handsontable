/**
 * Audits production dependencies across all workspace packages using npm audit.
 *
 * Background: pnpm audit uses npm registry endpoints that were retired (HTTP 410).
 * npm 10+ uses the newer bulk advisory endpoint that still works. This script:
 *   1. Merges `dependencies` and `optionalDependencies` from all workspace packages
 *      (skipping workspace: cross-references).
 *   2. Runs `npm install --package-lock-only` in a temp dir to generate a lockfile.
 *   3. Runs `npm audit --omit=dev --json` and exits non-zero only when a fixable
 *      vulnerability is found (replicating pnpm's `--ignore-unfixable` flag).
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

const WORKSPACE_PACKAGES = [
  'handsontable',
  'wrappers/react-wrapper',
  'wrappers/vue3',
  'wrappers/angular-wrapper',
];

// Merge production deps from all workspace packages, dropping workspace: cross-refs.
const mergedDeps = {};

for (const pkg of WORKSPACE_PACKAGES) {
  const pkgJson = JSON.parse(readFileSync(join(rootDir, pkg, 'package.json'), 'utf8'));

  for (const field of ['dependencies', 'optionalDependencies']) {
    for (const [name, version] of Object.entries(pkgJson[field] ?? {})) {
      if (!version.startsWith('workspace:')) {
        mergedDeps[name] = version;
      }
    }
  }
}

// Write synthetic package.json into a temp dir.
const tmpDir = mkdtempSync(join(tmpdir(), 'ht-audit-'));

writeFileSync(
  join(tmpDir, 'package.json'),
  JSON.stringify({ name: 'ht-audit', version: '0.0.0', dependencies: mergedDeps }, null, 2)
);

console.log(`Auditing ${Object.keys(mergedDeps).length} production dependencies in ${tmpDir}`);
console.log('Dependencies:', Object.keys(mergedDeps).join(', '));

// Generate lockfile.
try {
  execSync('npm install --package-lock-only --ignore-scripts --no-fund', {
    cwd: tmpDir,
    stdio: 'inherit',
  });
} catch {
  console.error('npm install --package-lock-only failed');
  process.exit(1);
}

// Run audit, capturing JSON output.
let auditJson;

try {
  const raw = execSync('npm audit --omit=dev --json', { cwd: tmpDir });

  auditJson = JSON.parse(raw.toString());
} catch (err) {
  // npm audit exits 1 when vulnerabilities are found; stdout still contains JSON.
  const stdout = err.stdout?.toString() ?? '';

  if (!stdout) {
    console.error('npm audit produced no output');
    process.exit(1);
  }
  auditJson = JSON.parse(stdout);
}

// Replicate --ignore-unfixable: only fail on vulnerabilities that have a fix available.
const vulnerabilities = auditJson.vulnerabilities ?? {};
const fixable = Object.values(vulnerabilities).filter(v => v.fixAvailable !== false);

if (fixable.length === 0) {
  console.log('No fixable vulnerabilities found.');
  process.exit(0);
}

console.error(`Found ${fixable.length} fixable vulnerability/vulnerabilities:`);

for (const v of fixable) {
  const fix = typeof v.fixAvailable === 'object'
    ? ` (fix: upgrade to ${v.fixAvailable.name}@${v.fixAvailable.version})`
    : '';

  console.error(`  - ${v.name} (${v.severity})${fix}`);
}

process.exit(1);
