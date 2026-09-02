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
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafPromisified = promisify(rimraf);
const args = process.argv.slice(2);
const resetLockfiles = args.includes('--reset-lockfiles');
const [version] = args.filter(arg => !arg.startsWith('--'));

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
  rimraf.sync('./package-lock.json');
}
