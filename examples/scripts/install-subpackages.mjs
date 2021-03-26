/**
 * Run the npm install command for the examples monorepo and all of the framework mini-monorepos.
 */
import execa from 'execa';
import thisPackageJson from '../package.json';
import glob from 'glob';
import {
  spawnProcess,
  displayErrorMessage
} from '../../scripts/utils/index.mjs';

const [version] = process.argv.slice(2);

if (!version) {
  displayErrorMessage('Version for the examples was not provided.');

  process.exit(1);
}

(async() => {
  // Clean node_modules, package-lock and /dist/ for the versioned subpackages.
  await spawnProcess(`node ./scripts/clean-subpackages.mjs ${version}`);

  // Run `npm i` for all the examples in the versioned directory.
  for (const frameworkPackage of thisPackageJson.workspaces.packages) {
    const frameworkUrls = glob.sync(`${frameworkPackage}`);

    for (const frameworkUrl of frameworkUrls) {
      if ((version && frameworkUrl.startsWith(version))) {
        console.log(`\nRunning npm install for ${frameworkUrl}:\n`);

        await execa('npm', ['install', '--no-audit'], {
          cwd: frameworkUrl,
          stdio: 'inherit'
        });
      }
    }

    // Link the main-level packages from the base ./node_modules to the local ./node_modules (to be read by the
    // examples).
    await spawnProcess(
      `node --experimental-json-modules ./scripts/link-packages.mjs --f js angular react vue --examples-version ${version}`
    );
  }
})();
