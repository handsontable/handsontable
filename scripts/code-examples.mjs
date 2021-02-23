import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import rimraf from 'rimraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT_DIR = __dirname.split('scripts')[0];
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
    if (file !== 'node_modules' && fs.statSync(path.join(dirPath, file)).isDirectory()) {
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
}

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
    // TODO: uncomment it when wrappers will be using the same versioning as Handsontable
    // packageJson.dependencies[wrapper] = version;
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
    console.error(error);
    process.exit(error.exitCode);
  }
};

// EXECUTE SCRIPTS

if (!hotVersion) {
  throw Error('You must provide the version of the Handsontable as the last parameter to the script.');
}

const versionedDir = path.join(REPO_ROOT_DIR, 'examples', hotVersion);
const versionedExamplesExist = fs.existsSync(versionedDir);

switch (shellCommand) {
  case 'version': { // npm run examples:version <version_number>
    if (versionedExamplesExist) {
      throw Error(`Examples already exist: ${path.join('examples', hotVersion)}.`);
    }

    rimraf.sync(`${NEXT_EXAMPLES_DIR}/node_modules`);

    rimraf.sync(`${NEXT_EXAMPLES_DIR}/**/node_modules`);

    fs.copySync(NEXT_EXAMPLES_DIR, versionedDir);

    const versionedExamplesFolders = getExamplesFolders(versionedDir);
    const workspaceConfigFolders = getWorkspaceConfigFolders(versionedDir);

    versionedExamplesFolders.forEach((versionedExampleDir) => {
      updatePackageJsonWithVersion(versionedExampleDir, hotVersion);
    });

    workspaceConfigFolders.forEach((frameworkFolder) => {
      updateFrameworkWorkspacesNames(frameworkFolder, hotVersion);
    });

    break;
  }

  case 'install': { // npm run examples:install <version_number>
    if (!versionedExamplesExist) {
      throw Error('Examples don\'t exist! First, create a directory with versioned examples.');
    }

    runNpmCommandInExample(versionedDir, `npm run install:version ${hotVersion}`)

    break;
  }

  case 'build': { // npm run examples:build <version_number>
    if (!versionedExamplesExist) {
      throw Error('Examples don\'t exist! First, create a directory with versioned examples.');
    }

    const examplesFolders = getExamplesFolders(versionedDir);

    examplesFolders.forEach((exampleDir) => {
      rimraf.sync(path.join(exampleDir, 'dist'));

      runNpmCommandInExample(exampleDir, 'npm run build');

      const prodOutputDir = path.join(exampleDir, 'dist');
      const deployDir = path.join(TMP_DIR, exampleDir.split('examples')[1]);

      fs.mkdirSync(deployDir, { recursive: true });
      fs.copySync(prodOutputDir, deployDir);
    });
    break;
  }

  case 'test': { // npm run examples:test <version_number>
    if (!versionedExamplesExist) {
      throw Error('Examples don\'t exist! First, create a directory with versioned examples.');
    }

    const examplesFolders = getExamplesFolders(versionedDir);

    examplesFolders.forEach((exampleDir) => {
      runNpmCommandInExample(exampleDir, 'npm run test');
    });

    break;
  }

  default:
    throw Error('Command doesn\'t exist.');
}
