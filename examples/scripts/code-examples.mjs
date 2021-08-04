import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { spawnProcess } from '../../scripts/utils/processes.mjs';
import { displayInfoMessage, displayConfirmationMessage, displayErrorMessage } from '../../scripts/utils/console.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT_DIR = __dirname.split('examples')[0];
const NEXT_EXAMPLES_DIR = path.join(REPO_ROOT_DIR, 'examples', 'next');
const TMP_DIR_NAME = 'tmp';
const TMP_DIR = path.join('examples', TMP_DIR_NAME);

const HOT_WRAPPERS = ['@handsontable/react', '@handsontable/angular', '@handsontable/vue'];

const [shellCommand, hotVersion] = process.argv.slice(2);

// Function search recursively in the provided `dirPath` for the package.json file
// and gets the project directory path.
const getExamplesFolders = (dirPath, exampleFolders, onlyWorkspaceConfigs = false) => {
  const files = fs.readdirSync(dirPath);

  exampleFolders = exampleFolders || [];

  files.forEach((file) => {
    if (file !== '.cache' && file !== 'node_modules' && fs.statSync(path.join(dirPath, file)).isDirectory()) {
      exampleFolders = getExamplesFolders(path.join(dirPath, file), exampleFolders, onlyWorkspaceConfigs);
      return;
    }

    if (file === 'package.json') {
      // Check whether the found package.json file is a meant as a workspace config only.
      const isWorkspaceConfig = !!fs.readJsonSync(`${dirPath}/${file}`).workspaces;

      if (onlyWorkspaceConfigs === isWorkspaceConfig) {
        exampleFolders.push(dirPath);
      }
    }
  });

  return exampleFolders;
};

const getWorkspaceConfigFolders = (dirPath, exampleFolders) => {
  return getExamplesFolders(dirPath, exampleFolders, true);
};

const getHotWrapperName = (packageJson) => {
  const { dependencies } = packageJson;

  return HOT_WRAPPERS.find(wrapper => Object.keys(dependencies).includes(wrapper));
};

const updatePackageJsonWithVersion = (projectDir, version) => {
  const packageJsonPath = path.join(projectDir, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath);

  const wrapper = getHotWrapperName(packageJson);

  packageJson.version = version;
  packageJson.dependencies.handsontable = version;

  if (wrapper) {
    packageJson.dependencies[wrapper] = version;
  }

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
};

const updateFrameworkWorkspacesNames = (projectDir, version) => {
  const packageJsonPath = path.join(projectDir, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath);

  packageJson.name += `-${version}`;
  packageJson.version = version;

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
};

const runNpmCommandInExample = (exampleDir, command) => {
  console.log(chalk.cyan(`"${command}" STARTED IN DIRECTORY "${exampleDir}"`));

  try {
    execa.sync(command, {
      cwd: exampleDir,
      stdio: 'inherit',
      shell: true
    });

  } catch (error) {
    displayErrorMessage(error);
    process.exit(error.exitCode);
  }
};

// EXECUTE SCRIPTS

if (!hotVersion) {
  displayErrorMessage('You must provide the version of the Handsontable as the last parameter to the script.');

  process.exit(1);
}

const versionedDir = path.join(REPO_ROOT_DIR, 'examples', hotVersion);
const versionedExamplesExist = fs.existsSync(versionedDir);

switch (shellCommand) {
  case 'version': { // npm run examples:version <version_number>
    if (versionedExamplesExist) {
      displayErrorMessage(`Examples already exist: ${path.join('examples', hotVersion)}.`);

      process.exit(1);
    }

    rimraf(`${NEXT_EXAMPLES_DIR}/node_modules`, () => {
      displayConfirmationMessage(`node_modules removed from: "${NEXT_EXAMPLES_DIR}/node_modules"`);

      displayInfoMessage(`Start deleting node_modules from: "${NEXT_EXAMPLES_DIR}/**/node_modules"`);

      rimraf(`${NEXT_EXAMPLES_DIR}/**/node_modules`, () => {
        displayConfirmationMessage(`node_modules removed from: "${NEXT_EXAMPLES_DIR}/**/node_modules"`);

        displayInfoMessage(`Start copying examples to: "${versionedDir}"`);
        fs.copySync(NEXT_EXAMPLES_DIR, versionedDir);
        displayConfirmationMessage(`Examples copied to: "${versionedDir}"`);

        const versionedExamplesFolders = getExamplesFolders(versionedDir);
        const workspaceConfigFolders = getWorkspaceConfigFolders(versionedDir);

        versionedExamplesFolders.forEach((versionedExampleDir) => {
          updatePackageJsonWithVersion(versionedExampleDir, hotVersion);
        });
        displayConfirmationMessage('package.json updated for code examples');

        workspaceConfigFolders.forEach((frameworkFolder) => {
          updateFrameworkWorkspacesNames(frameworkFolder, hotVersion);
        });
        displayConfirmationMessage('package.json updated for examples workspaces');
      });
    });

    break;
  }

  case 'install': { // npm run examples:install <version_number>
    if (!versionedExamplesExist) {
      displayErrorMessage('Examples don\'t exist! First, create a directory with versioned examples.');

      process.exit(1);
    }

    spawnProcess(`npm run install:version ${hotVersion}`, {
      cwd: path.join(REPO_ROOT_DIR, 'examples')
    });

    break;
  }

  case 'build': { // npm run examples:build <version_number>
    if (!versionedExamplesExist) {
      displayErrorMessage('Examples don\'t exist! First, create a directory with versioned examples.');

      process.exit(1);
    }

    const examplesFolders = getExamplesFolders(versionedDir);

    examplesFolders.forEach((exampleDir) => {
      rimraf.sync(path.join(exampleDir, 'dist'));

      runNpmCommandInExample(exampleDir, 'npm run build');

      const prodOutputDir = path.join(exampleDir, 'dist');
      const deployDir = path.join(REPO_ROOT_DIR, TMP_DIR, exampleDir.split('examples')[1]);

      fs.mkdirSync(deployDir, { recursive: true });
      fs.copySync(prodOutputDir, deployDir);
    });
    break;
  }

  case 'test': { // npm run examples:test <version_number>
    if (!versionedExamplesExist) {
      displayErrorMessage('Examples don\'t exist! First, create a directory with versioned examples.');

      process.exit(1);
    }

    const examplesFolders = getExamplesFolders(versionedDir);

    spawnProcess('http-server . - 8080');

    examplesFolders.forEach((exampleDir, i) => {
      if (i < examplesFolders.length) {
        const split = exampleDir.split('handsontable');
        const splitLength = split.length;
        // this env is used in each `Smoke.spec.js` file inside code example directory
        process.env.TEST_URL = `http://127.0.0.1:8080${split[splitLength - 1]}/dist`;

        runNpmCommandInExample(exampleDir, 'npm run test');
      }

      if (i === examplesFolders.length - 1) {
        process.exit(0);
      }
    });

    break;
  }

  default:
    displayErrorMessage('Command doesn\'t exist.');

    process.exit(1);
}
