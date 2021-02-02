import execa from 'execa';
import { spawnProcess } from './utils/index.mjs';

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

(async() => {
  const currentBranch = (
    await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })
  ).stdout.replace(/(\n)/gm, '');
  const filesModifiedInLastCommit = (
    await execa('git', ['log', '--name-only', '--oneline', 'HEAD^..HEAD'], { encoding: 'utf8' })
  ).stdout.split('\n');

  filesModifiedInLastCommit.shift();
  filesModifiedInLastCommit.pop();

  const fullTestBranchMatch = currentBranch.match(
    `(${FULL_TEST_BRANCHES.join('|').replace('/', '\\\\/')}).*`
  );

  console.log(`(${FULL_TEST_BRANCHES.join('|').replace('/', '\\\\/')}).*`);

  if (fullTestBranchMatch !== null && fullTestBranchMatch.index === 0) {
    spawnProcess('run all test');
  }

  const touchedProjects = [];

  filesModifiedInLastCommit.forEach((fileUrl) => {
    if (fileUrl.includes('CHANGELOG')) {
      return;
    }

    const wrappersMatch = fileUrl.match('(wrappers\/)(?<projectName>[^\/]*)(\/)');

    if (wrappersMatch) {
      const { projectName } = wrappersMatch.groups;

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

  // If the changes consist of anything except Handsontable, rebuild the handsontable package for linking.
  if (!touchedProjects.length === 1 && touchedProjects[0] === 'handsontable') {
    await spawnProcess('npm run in handsontable build:es');
  }

  /* eslint-disable no-await-in-loop,no-restricted-syntax */
  for (const project of touchedProjects) {
    // await spawnProcess(`npm run in ${project} test`);
  }
  /* eslint-enable no-await-in-loop,no-restricted-syntax */
})();
