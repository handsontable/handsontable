/**
 * Run the npm install command for the examples monorepo and all of the framework mini-monorepos.
 */
import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';
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

// Turn a TypeScript version or range into the tilde spec the examples pin, e.g. `6.0.3` and
// `>=6.0 <6.1` both give `~6.0.0`. Takes the first `<major>.<minor>` it finds, which for a range
// is its lower bound.
const typescriptSpecFrom = (versionOrRange) => {
  const bound = versionOrRange?.match(/(\d+)\.(\d+)/);

  return bound ? `~${bound[1]}.${bound[2]}.0` : null;
};

// Read a framework directory's lockfile, or `null` when it has none.
const readFrameworkLockfile = (frameworkUrl) => {
  try {
    return fs.readJsonSync(`${frameworkUrl}/package-lock.json`);
  } catch {
    // No lockfile: the tree is being resolved from scratch, so `latest` is the right answer.
    return null;
  }
};

// The TypeScript spec a framework directory's lockfile already installs.
//
// This is what keeps the alignment honest. The lockfiles are reused rather than re-resolved, so
// `latest` no longer decides which Angular installs -- the lockfile does. Aligning to `latest`
// instead would move the examples' TypeScript pin on the day Angular bumps its supported range
// while the lockfile still installed the older builder, and `--legacy-peer-deps` would swallow
// the resulting peer conflict until `ng build` failed on the compiler's own version check.
//
// The locked `typescript` version is the primary answer because it is what actually gets
// installed, and npm resolved it under the locked builder's peer range in the first place. The
// builder's own `peerDependencies` (recorded per package by `lockfileVersion: 3`) is the fallback
// for a lockfile that pins the builder but not TypeScript. Either way there is no registry call.
const lockedTypescriptSpec = (lockfile, exampleDir) => {
  const packages = lockfile.packages ?? {};
  // Either may be hoisted to the framework root or kept under the example's own tree.
  const keysFor = name => [`${exampleDir}/node_modules/${name}`, `node_modules/${name}`];

  for (const key of keysFor('typescript')) {
    const spec = typescriptSpecFrom(packages[key]?.version);

    if (spec) {
      return spec;
    }
  }

  for (const key of keysFor(ANGULAR_BUILDER_PACKAGE)) {
    const spec = typescriptSpecFrom(packages[key]?.peerDependencies?.typescript);

    if (spec) {
      return spec;
    }
  }

  return null;
};

// Each Angular major supports a narrow TypeScript range, declared by the
// `@angular-devkit/build-angular` peer dependency (e.g. Angular 22 -> `typescript >=6.0 <6.1`,
// Angular 21 -> `>=5.9 <6.0`). Resolve it from the builder peer instead of hard-coding it.
const resolveAngularTypescriptRange = async (builderSpec) => {
  const { stdout } = await execa('npm', [
    'view', `${ANGULAR_BUILDER_PACKAGE}@${builderSpec}`, 'peerDependencies.typescript'
  ]);
  // `npm view` lists one range per matching version (ascending); the last line is the newest.
  const newestRange = stdout.trim().split('\n').pop().trim();

  return typescriptSpecFrom(newestRange);
};

// Aligns the `typescript` devDependency of every Angular example in `frameworkUrl` with the
// TypeScript range required by the Angular version that will be installed. Without this, a new
// Angular major (which bumps its required TypeScript) fails `npm install` with an `ERESOLVE`
// peer conflict against the example's pinned TypeScript.
const alignTypescriptWithAngular = async (frameworkUrl) => {
  const examplePackageJsonPaths = glob.sync(`${frameworkUrl}/*/package.json`, {
    ignore: '**/node_modules/**'
  });
  // Read once, not per example: these lockfiles run to hundreds of thousands of lines.
  const lockfile = readFrameworkLockfile(frameworkUrl);

  for (const packageJsonPath of examplePackageJsonPaths) {
    const packageJson = fs.readJsonSync(packageJsonPath);
    const { devDependencies } = packageJson;
    const builderSpec = devDependencies?.[ANGULAR_BUILDER_PACKAGE];

    if (!builderSpec || !devDependencies?.typescript) {
      continue;
    }

    const exampleDir = path.basename(path.dirname(packageJsonPath));
    // Follow the lockfile when there is one, and the registry only when there is not.
    const typescriptRange = (lockfile && lockedTypescriptSpec(lockfile, exampleDir))
      || await resolveAngularTypescriptRange(builderSpec);

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
