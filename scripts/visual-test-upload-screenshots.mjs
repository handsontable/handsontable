/* eslint-disable max-len */
import { spawnProcess } from './utils/processes.mjs';

const baseBranches = ['develop'];

const commitSha = (await spawnProcess('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);

const currentBranchName = (await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;

process.chdir('./visual-test');
await spawnProcess('npx @argos-ci/cli upload tests/screenshots');
await spawnProcess(`npx viswiz build --image-dir ./tests/screenshots --message last-commit-message --revision ${commitSha}`);

const isBaseBranch = baseBranches.includes(currentBranchName);

if (isBaseBranch) {
  const listOfActiveBranches = (await spawnProcess('git branch', { silent: true })).stdout;

  // eslint-disable-next-line quotes
  listOfActiveBranches.split("\n").forEach((item) => {
    item = item.trim();

    if (item.startsWith('*')) {
      return;
    }

    spawnProcess(`git checkout ${item}`);
    spawnProcess('git commit --amend --no-edit');
    spawnProcess(`git push origin ${item}`);
  });
}
