/* eslint-disable max-len */
import { spawnProcess } from './utils/processes.mjs';

const baseBranches = ['develop'];
const currentBranchName = (await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
const isBaseBranch = baseBranches.includes(currentBranchName);

if (isBaseBranch) {
  const listOfActiveBranches = (await spawnProcess('git branch', { silent: true })).stdout;

  // eslint-disable-next-line quotes
  listOfActiveBranches.split("\n").forEach((item) => {
    item = item.trim();

    if (item.startsWith('*')) {
      return;
    }

    if (baseBranches.includes('item')) {
      return;
    }

    spawnProcess(`git checkout ${item}`);
    spawnProcess('git commit --amend --no-edit');
    spawnProcess(`git push origin ${item}`);
  });
}
