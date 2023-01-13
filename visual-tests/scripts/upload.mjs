/**
 * This script is responsible for uploading package of screenshots to external comparing services.
 */
import execa from 'execa';
import dotenv from 'dotenv';
import { baseBranch } from './config.mjs';

dotenv.config();

const currentBranch = process.env.CURRENT_BRANCH;
const isCI = process.argv.includes('CI');

console.log('Upload to Argos');

if (currentBranch === baseBranch && !isCI) {
  throw new Error('Screenshots from base branch can be uploaded only from Github');
} else {
  await execa.command('npx @argos-ci/cli upload screenshots', {
    env: { ARGOS_TOKEN: process.env.ARGOS_TOKEN },
    stdio: 'inherit'
  });
}
