/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import execa from 'execa';
import dotenv from 'dotenv';
// eslint-disable-next-line import/extensions
import { baseBranch } from './config.mjs';

dotenv.config();
const currentBranch = process?.env?.CURRENT_BRANCH;
const isCI = process?.argv?.includes('CI');

console.log('Upload to Argos');

if (currentBranch === baseBranch && !isCI) {
  throw new Error('Screenshots from base branch can be uploaded only from Github');
} else {
  await execa.command('npx @argos-ci/cli upload tests/screenshots',
    { env: { ARGOS_TOKEN: process?.env?.ARGOS_TOKEN }, stdio: 'inherit' });
}
