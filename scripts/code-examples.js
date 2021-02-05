const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const REPO_ROOT = __dirname.split('scripts')[0];
const NEXT_EXAMPLES = path.join('examples', 'next');
const TMP_DIR_NAME = 'tmp';
const TMP_DIR = path.join('examples', TMP_DIR_NAME);

const HOT_WRAPPERS = ['@handsontable/react', '@handsontable/angular', '@handsontable/vue'];

const [/* node bin */, /* path to this script */, shellCommand, hotVersion] = process.argv;

// __dirname

const currentEnvironment = process.env.NODE_ENV;

// Function search recursively in the provided `dirPath` for the package.json file
// and gets the project directory path.
const getExamplesFolders = (dirPath, exampleFolders) => {
  const files = fs.readdirSync(dirPath);

  exampleFolders = exampleFolders || [];

  files.forEach((file) => {
    if (file !== 'node_modules' && fs.statSync(path.join(dirPath, file)).isDirectory()) {
      exampleFolders = getExamplesFolders(path.join(dirPath, file), exampleFolders);
      return;
    }
    if (file === 'package.json') {
      exampleFolders.push(dirPath);
    }
  });

  return exampleFolders;
};

const getNodeModulesInDir = (dirPath, nodeModules) => {
  const files = fs.readdirSync(dirPath);

  nodeModules = nodeModules || [];

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory() && file !== 'node_modules') {
      nodeModules = getNodeModulesInDir(path.join(dirPath, file), nodeModules);
    }
    if (file === 'node_modules') {
      nodeModules.push(path.join(dirPath, 'node_modules'));
    }
  });

  return nodeModules;
};

/**
 * Remove `node_modules` from `/next` directory.
 */
const removeNodeModulesFromNext = () => {
  const nodeModules = getNodeModulesInDir(path.join(REPO_ROOT, NEXT_EXAMPLES));
  nodeModules.forEach((dir) => {
    fs.removeSync(dir);
  });
};

/**
 * Get Handsontable wrapper from current projet.
 *
 * @param {object} deps - Arg is the package.json dependencies object.
 * @returns {string|undefined}
 */
const getHotWrapper = (deps) => {
  return HOT_WRAPPERS.find(wrapper => Object.keys(deps).find(dependency => dependency === wrapper));
};

const updatePackageJsonWithVersion = (projectDir, version) => {
  const pJsonPath = path.join(projectDir, 'package.json');
  const pJsonFile = fs.readJsonSync(pJsonPath);

  const wrapper = getHotWrapper(pJsonFile.dependencies);
  pJsonFile.version = version;
  pJsonFile.dependencies.handsontable = version;
  if (wrapper) {
    // TODO: uncomment it when wrappers will be using the same versioning as Handsontable
    // pJsonFile.dependencies[wrapper] = hotVersion;
  }
  fs.writeJsonSync(pJsonPath, pJsonFile, { spaces: 2 });
};

const runNpmCommandInExample = (exampleDir, command) => {
  console.log(chalk.yellow(`"${command}" STARTED IN DIRECTORY "${exampleDir}"`));
  execSync(command, {
    cwd: exampleDir,
    stdio: 'inherit',
    shell: true
  });
};

const updateExamplesWithVersion = (examplesFolders, version) => {
  examplesFolders.forEach((exampleDir) => {
    updatePackageJsonWithVersion(exampleDir, version);
  });
};

const renameDirectory = (oldDirPath, distDirPath) => {
  try {
    fs.renameSync(oldDirPath, distDirPath);
  } catch (e) {
    // Don't have to rename folder, because folder to rename doesn't exist
    // console.log(e.message)
  }
};

// EXECUTE SCRIPTS

if (!hotVersion) {
  throw Error('You must provide version of the Handsontable as a last parameter to the script');
}

/**
 * Directory to the versioned examples.
 */
const dirDest = path.join(REPO_ROOT, 'examples', hotVersion);
const examplesExist = fs.existsSync(dirDest);

// npm run examples:version <version_number>
if (shellCommand === 'version') {
  if (examplesExist) {
    throw Error(`Examples already exist: ${path.join('examples', hotVersion)}`);
  }
  // remove node_modules before copy files
  removeNodeModulesFromNext();
  fs.copySync(NEXT_EXAMPLES, dirDest);
  const examplesFolders = getExamplesFolders(dirDest);
  updateExamplesWithVersion(examplesFolders, hotVersion);
}

// npm run examples:install <version_number>
if (shellCommand === 'install') {
  if (!examplesExist) {
    throw Error('Examples don\'t exist! First, create a directory with versioned examples');
  }
  const examplesFolders = getExamplesFolders(dirDest);
  examplesFolders.forEach((exampleDir) => {
    runNpmCommandInExample(exampleDir, 'npm install');
  });
}

// npm run examples:build <version_number>
if (shellCommand === 'build') {
  if (!examplesExist) {
    throw Error('Examples don\'t exist! First, create a directory with versioned examples');
  }
  const examplesFolders = getExamplesFolders(dirDest);
  examplesFolders.forEach((exampleDir) => {
    if (currentEnvironment === 'gh-actions') {
      runNpmCommandInExample(exampleDir, 'npm run build');
    } else {
      runNpmCommandInExample(exampleDir, 'npm install');
      runNpmCommandInExample(exampleDir, 'npm run build');
    }

    // unify production output folder names to `dist` (React creates production output with `build` directory)
    const prodOutputDir = path.join(exampleDir, 'dist');
    renameDirectory(path.join(exampleDir, 'build'), prodOutputDir);

    // create example's deploy directory path
    const deployDirDest = path.join(TMP_DIR, exampleDir.split('examples')[1]);

    // create deploy directory
    fs.mkdirSync(deployDirDest, { recursive: true });

    fs.copySync(prodOutputDir, deployDirDest);
  });
}

// npm run examples:test <version_number>
if (shellCommand === 'test') {
  if (!examplesExist) {
    throw Error('Examples don\'t exist! First, create a directory with versioned examples');
  }
  const examplesFolders = getExamplesFolders(dirDest);
  examplesFolders.forEach((exampleDir) => {
    if (currentEnvironment === 'gh-actions') {
      runNpmCommandInExample(exampleDir, 'npm run test:ci');
    } else {
      runNpmCommandInExample(exampleDir, 'npm install');
      runNpmCommandInExample(exampleDir, 'npm run test');
    }
  });
}
