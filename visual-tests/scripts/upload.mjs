/**
 * This script is responsible for uploading package of screenshots to external comparing services.
 */
import execa from 'execa';
import dotenv from 'dotenv';
import { getCurrentBranchName } from './utils/utils.mjs';
import { baseBranch } from './utils/config.mjs';

dotenv.config();

const currentBranch = getCurrentBranchName();

console.log('Upload to Argos');

if (currentBranch === baseBranch && !process.env.CI) {
  throw new Error('Screenshots from base branch can be uploaded only from Github');
} else {
  await execa.command('npx @argos-ci/cli upload screenshots', {
    env: { ARGOS_TOKEN: process.env.ARGOS_TOKEN },
    stdio: 'inherit'
  });
}
