/* eslint-disable max-len */
import { spawnProcess } from './utils/processes.mjs';

const baseBranches = ['develop'];
const currentBranchName = (await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
const isBaseBranch = baseBranches.includes(currentBranchName);

if (isBaseBranch) {
  const listOfActiveBranches = (await spawnProcess('git branch', { silent: true })).stdout;

  console.log(listOfActiveBranches);

  // eslint-disable-next-line quotes, no-restricted-syntax
  for (let item of listOfActiveBranches.split("\n")) {
    item = item.trim();

    if (!item.startsWith('*')) {
      if (!baseBranches.includes(item)) {
        await spawnProcess(`git checkout ${item}`);
        await spawnProcess('git commit --amend --no-edit');
        await spawnProcess(`git push origin ${item}`);
      }
    }
  }
}
