/**
 * The visual-test examples' build guard. It refuses to build an example that would render a copy of a monorepo
 * package instead of the local build, which is what the example gets from an install that ran without the linker,
 * or from the linker when the local build is missing, and, off CI, an example whose core build is older than its
 * sources. Each example's `build` script runs it first, from the example's own directory, so every way of building
 * one goes through it. `lib/local-builds.mjs` holds the judgment and the reasons.
 *
 * Usage, from an example directory: node ../../../../../visual-tests/scripts/check-linked-packages.mjs
 */
import { join } from 'node:path';
import {
  ageCheckEnabled, checkLinkedPackages, confirmationLines, formatProblems,
} from '../lib/local-builds.mjs';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const { demo, skipped, checked, problems } = checkLinkedPackages({
  repoRoot: REPO_ROOT,
  demoDir: process.cwd(),
  checkAge: ageCheckEnabled(process.env),
});

if (skipped) {
  console.log(`Linked-package check skipped: ${skipped}`);
} else if (problems.length > 0) {
  console.error(`Refusing to build ${demo}:`);
  formatProblems(problems).forEach(line => console.error(line));
  process.exitCode = 1;
} else {
  confirmationLines(checked).forEach(line => console.log(line));
}
