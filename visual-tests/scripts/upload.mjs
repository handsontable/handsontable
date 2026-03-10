/**
 * This script uploads the screenshots package to an external service (Argos).
 */
import { upload } from '@argos-ci/core';
import { isReferenceBranch } from './utils/utils.mjs';

console.log('Upload to Argos');

if (isReferenceBranch() && !process.env.CI) {
  throw new Error('Screenshots from base branch can be uploaded only from Github');
} else {
  await upload({ root: './screenshots' });
}
