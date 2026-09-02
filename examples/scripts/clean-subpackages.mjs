/**
 * Clean the node_modules, dist and (on request) the package-locks for the framework directories
 * (and thus, the examples).
 *
 * The shared framework lockfiles are tracked, and they record the dependency set CI tested.
 * Deleting them here made every caller reinstall from scratch, so a release cut re-resolved the
 * whole tree and committed the result unchecked. They are therefore kept by default and removed
 * only when `--reset-lockfiles` asks for it, which is how a deliberate refresh is done: run it,
 * review the diff, land it on `develop` as its own change.
 */
import { promisify } from 'util';

const args = process.argv.slice(2);
const resetLockfiles = args.includes('--reset-lockfiles');
const [version] = args.filter(arg => !arg.startsWith('--'));

// Without a version the script falls through to the no-version branch below, which cleans the
// `examples` workspace root and nothing under it. Silently doing that in answer to
// `--reset-lockfiles` would look like the refresh succeeded while all nine framework lockfiles
// sat untouched.
if (resetLockfiles && !version) {
  console.error('--reset-lockfiles needs the examples version to reset, for example: '
    + 'node ./scripts/clean-subpackages.mjs next --reset-lockfiles');

  process.exit(1);
}

// Imported after the argument check, not with the other imports: a static import is hoisted, so
// an unusable argument would come back as `Cannot find package 'rimraf'` anywhere the examples
// workspace is not installed (the `tooling tests` CI job, for one) instead of as the message
// above.
const { default: rimraf } = await import('rimraf');
const rimrafPromisified = promisify(rimraf);

if (version) {
  console.log(`Removing:
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/dist
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/.cache
  ${version}/**/(angular|angular-*)/**/.angular`);

  if (resetLockfiles) {
    console.log(`  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/package-lock.json
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/pnpm-lock.yaml`);
  } else {
    console.log('\nKeeping the shared framework lockfiles. Pass --reset-lockfiles to remove them.');
  }

  const removes = [];

  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/dist`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/.cache`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(angular|angular-*)/@(!(node_modules))/.angular`));

  if (resetLockfiles) {
    removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/package-lock.json`));
    removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/pnpm-lock.yaml`));
  }

  await Promise.all(removes);
} else {
  console.log(`Removing:
  ./node_modules
  ./package-lock.json`);

  rimraf.sync('./node_modules');
  // The `examples` workspace root's own lockfile, which is untracked (`examples/.gitignore` does
  // not need a rule for it because it has never been committed). Nothing depends on its
  // resolution, so this one stays unconditional.
  rimraf.sync('./package-lock.json');
}
