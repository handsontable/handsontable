/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
// import { spawnProcess } from './utils/processes.mjs';
import execa from 'execa';

console.log('Upload to Argos');
await execa('npx @argos-ci/cli upload tests/screenshots', { stdout: 'inherit' });

console.log('Upload to Percy');
await execa('npx percy upload ./tests/screenshots', { stdout: 'inherit' });
