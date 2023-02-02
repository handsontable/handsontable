/**
 * This script is responsible for uploading package of screenshots to external comparing services.
 */
import execa from 'execa';
import { isReferenceBranch } from './utils/utils.mjs';

console.log('Upload to Argos');

if (isReferenceBranch() && !process.env.CI) {
  throw new Error('Screenshots from base branch can be uploaded only from Github');
} else {
  await execa.command('npx @argos-ci/cli upload screenshots', {
    env: { ARGOS_TOKEN: process.env.ARGOS_TOKEN },
    stdio: 'inherit'
  });
}
