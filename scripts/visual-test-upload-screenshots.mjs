/* eslint-disable max-len */
import { spawnProcess } from './utils/processes.mjs';

const commitSha = (await spawnProcess('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);

process.chdir('./visual-test');
await spawnProcess('npx @argos-ci/cli upload tests/screenshots');
await spawnProcess(`npx viswiz build --image-dir ./tests/screenshots --message last-commit-message --revision ${commitSha}`);

