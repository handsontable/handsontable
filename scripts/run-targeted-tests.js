const WRAPPERS = [
  'angular-handsontable',
  'react-handsontable',
  'vue-handsontable',
];
const FULL_TEST_BRANCHES = [
  'master',
  'develop',
  'release/',
];

const { spawnSync, execSync } = require('child_process');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).replace(/(\n)/gm, '');
const filesModifiedInLastCommit = execSync('git log --name-only --oneline HEAD^..HEAD', { encoding: 'utf8' })
  .split('\n');
let hasErrors = false;

const spawnCommand = (command) => {
  if (hasErrors) {
    return;
  }
  const spawnedCommand = spawnSync('npm', command.split(' '), {
    stdio: 'inherit'
  });

  if (spawnedCommand.status) {
    hasErrors = true;
  }

  return !hasErrors;
};

filesModifiedInLastCommit.shift();
filesModifiedInLastCommit.pop();

const fullTestBranchMatch = currentBranch.match(
  `(${FULL_TEST_BRANCHES.join('|').replace('/', '\\\\/')}).*`
);

if (fullTestBranchMatch !== null && fullTestBranchMatch.index === 0) {
  const status = spawnCommand('run all test');

  if (!status) {
    process.exitCode = 1;
  }

  return;
}

const touchedProjects = [];

filesModifiedInLastCommit.forEach((fileUrl) => {
  if (fileUrl.includes('CHANGELOG')) {
    return;
  }

  const wrappersMatch = fileUrl.match('(wrappers\/)([^\/]*)(\/)');

  if (wrappersMatch) {
    const projectName = wrappersMatch[2];

    if (
      WRAPPERS.includes(projectName) &&
      !touchedProjects.includes(projectName)
    ) {
      touchedProjects.push(projectName);
    }

  } else if (!touchedProjects.includes('handsontable')) {
    touchedProjects.push('handsontable');
  }
});

touchedProjects.forEach((project) => {
  const status = spawnCommand(`run in ${project} test`);

  if (!status) {
    process.exitCode = 1;
  }
});
