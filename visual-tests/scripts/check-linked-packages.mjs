/**
 * The visual-test demos' build guard. It refuses to build a demo that would render a copy of a monorepo package
 * instead of the local build, which is what the demo gets from an install that ran without the linker, or from
 * the linker when the local build is missing. Each demo's `build` script runs it first, from the demo's own
 * directory, so every way of building a demo goes through it. `lib/local-builds.mjs` holds the judgment and
 * the reasons.
 *
 * Usage, from a demo directory: node ../../../../../visual-tests/scripts/check-linked-packages.mjs
 */
import { join } from 'node:path';
import { checkLinkedPackages } from '../lib/local-builds.mjs';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const { demo, skipped, checked, problems } = checkLinkedPackages({ repoRoot: REPO_ROOT, demoDir: process.cwd() });

if (skipped) {
  console.log(`Linked-package check skipped: ${skipped}`);
} else if (problems.length > 0) {
  console.error(`Refusing to build ${demo}: it would render a copy of a monorepo package instead of the local build.`);

  problems.forEach(({ summary, detail, remedy }) => {
    console.error(`\n- ${summary}`);
    detail.forEach(line => console.error(`  ${line}`));
    console.error(`  ${remedy}`);
  });

  console.error('\nRun the commands from the repository root. See visual-tests/AGENTS.md (Local builds).');
  process.exitCode = 1;
} else {
  checked.forEach(({ name, buildDir }) => console.log(`${name} resolves to the local build ${buildDir}.`));
}
