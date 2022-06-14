/**
 * Run the npm install command for the examples monorepo and all of the framework mini-monorepos.
 */
import execa from 'execa';
import thisPackageJson from '../package.json' assert { type: 'json' };
import glob from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  spawnProcess,
  displayErrorMessage
} from '../../scripts/utils/index.mjs';

const argv = yargs(hideBin(process.argv))
  .boolean('skip-clean')
  .default('skip-clean', false)
  .argv;

const [version] = argv._;

if (!version) {
  displayErrorMessage('Version for the examples was not provided.');

  process.exit(1);
}

(async() => {
  if (!argv.skipClean) {
    // Clean node_modules, package-lock and /dist/ for the versioned subpackages.
    await spawnProcess(`node ./scripts/clean-subpackages.mjs ${version}`);
  }

  // Run `npm i` for all the examples in the versioned directory.
  for (const frameworkPackage of thisPackageJson.internal.framework_dirs) {
    const frameworkUrls = glob.sync(`${frameworkPackage}`);

    const installs = [];

    for (const frameworkUrl of frameworkUrls) {
      if ((version && frameworkUrl.startsWith(version))) {
        console.log(`\nRunning npm install for ${frameworkUrl}:\n`);

        installs.push(execa('npm', ['install', '--no-audit'], {
          cwd: frameworkUrl,
          stdio: 'inherit'
        }));
      }
    }

    await Promise.all(installs);

    // Link the main-level packages from the base ./node_modules to the local ./node_modules (to be read by the
    // examples).
    await spawnProcess([
      'node --experimental-json-modules ./scripts/link-packages.mjs',
      '--f js ts angular angular-9 angular-10 angular-11 angular-12 react vue',
      `--examples-version ${version}`,
    ].join(' '));
  }
})();
