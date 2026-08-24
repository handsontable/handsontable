/**
 * Run the npm install command for the examples monorepo and all of the framework mini-monorepos.
 */
import execa from 'execa';
import fs from 'fs-extra';
import thisPackageJson from '../package.json' with { type: 'json' };
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

if (!argv.skipClean) {
  // Clean node_modules, package-lock and /dist/ for the versioned subpackages.
  await spawnProcess(`node ./scripts/clean-subpackages.mjs ${version}`);
}

// The Angular package that pins the supported TypeScript range through its peer dependency.
const ANGULAR_BUILDER_PACKAGE = '@angular-devkit/build-angular';

// Checks whether a framework example directory holds an Angular example.
const isAngularExample = frameworkUrl => /angular/.test(frameworkUrl);

// Each Angular major supports a narrow TypeScript range, declared by the
// `@angular-devkit/build-angular` peer dependency (e.g. Angular 22 -> `typescript >=6.0 <6.1`,
// Angular 21 -> `>=5.9 <6.0`). The examples track the `latest` Angular, so the matching
// TypeScript version moves over time. Resolve it from the builder peer instead of hard-coding it.
const resolveAngularTypescriptRange = async (builderSpec) => {
  const { stdout } = await execa('npm', [
    'view', `${ANGULAR_BUILDER_PACKAGE}@${builderSpec}`, 'peerDependencies.typescript'
  ]);
  // `npm view` lists one range per matching version (ascending); the last line is the newest.
  const newestRange = stdout.trim().split('\n').pop().trim();
  const lowerBound = newestRange.match(/>=?\s*(\d+)\.(\d+)/);

  return lowerBound ? `~${lowerBound[1]}.${lowerBound[2]}.0` : null;
};

// Aligns the `typescript` devDependency of every Angular example in `frameworkUrl` with the
// TypeScript range required by the Angular version that will be installed. Without this, a new
// Angular major (which bumps its required TypeScript) fails `npm install` with an `ERESOLVE`
// peer conflict against the example's pinned TypeScript.
const alignTypescriptWithAngular = async (frameworkUrl) => {
  const examplePackageJsonPaths = glob.sync(`${frameworkUrl}/*/package.json`, {
    ignore: '**/node_modules/**'
  });

  for (const packageJsonPath of examplePackageJsonPaths) {
    const packageJson = fs.readJsonSync(packageJsonPath);
    const { devDependencies } = packageJson;
    const builderSpec = devDependencies?.[ANGULAR_BUILDER_PACKAGE];

    if (!builderSpec || !devDependencies?.typescript) {
      continue;
    }

    const typescriptRange = await resolveAngularTypescriptRange(builderSpec);

    if (typescriptRange && devDependencies.typescript !== typescriptRange) {
      const previousRange = devDependencies.typescript;

      devDependencies.typescript = typescriptRange;
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

      console.log(
        `Aligned TypeScript ${previousRange} -> ${typescriptRange} in ${packageJsonPath} ` +
        `(for Angular builder "${builderSpec}").`
      );
    }
  }
};

// Run `npm i` for all the examples in the versioned directory.
for (const frameworkPackage of thisPackageJson.internal.framework_dirs) {
  const frameworkUrls = glob.sync(`${frameworkPackage}`);

  for (const frameworkUrl of frameworkUrls) {
    if ((version && frameworkUrl.startsWith(version))) {
      console.log(`\nRunning npm install for ${frameworkUrl}:\n`);

      const installArgs = ['npm install --no-audit'];

      if (isAngularExample(frameworkUrl)) {
        await alignTypescriptWithAngular(frameworkUrl);

        // The published `@handsontable/angular-wrapper` peer range can lag a brand-new Angular
        // major; the matching wrapper is built from source and symlinked into the example in the
        // `link-packages` step below. `--legacy-peer-deps` lets the example resolve the `latest`
        // Angular during install, after which the locally built wrapper takes over.
        installArgs.push('--legacy-peer-deps');
      }

      await spawnProcess(installArgs.join(' '), {
        cwd: frameworkUrl
      });
    }
  }

  // Link the main-level packages from the base ./node_modules to the local ./node_modules (to be read by the
  // examples).
  await spawnProcess([
    'node ./scripts/link-packages.mjs',
    '--f js ts angular angular-wrapper react react-wrapper vue vue3',
    `--examples-version ${version}`,
  ].join(' '));
}
