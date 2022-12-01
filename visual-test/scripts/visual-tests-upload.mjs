/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
// import { spawnProcess } from './utils/processes.mjs';
import execa from 'execa';

const commitSha = (await execa.command('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);

console.log('Upload to Argos');
await execa.command('npx @argos-ci/cli upload tests/screenshots');

console.log('Upload to Viswiz');
await execa.command(`npx viswiz build --image-dir ./tests/screenshots --message last-commit-message --revision ${commitSha}`);

console.log('Upload to Percy');
await execa.command('npx percy upload ./tests/screenshots');
