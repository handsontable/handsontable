/* eslint-disable max-len */
import { spawnProcess } from './utils/processes.mjs';

const testsFolder = 'visual-test';
const commitSha = (await spawnProcess('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);

if (!process.cwd().endsWith(testsFolder)) {
  process.chdir(testsFolder);
}

console.log('Upload to Argos');
await spawnProcess('npx @argos-ci/cli upload tests/screenshots');

console.log('Upload to Viswiz');
await spawnProcess(`npx viswiz build --image-dir ./tests/screenshots --message last-commit-message --revision ${commitSha}`);

console.log('Upload to Percy');
await spawnProcess('npx percy upload ./tests/screenshots');
