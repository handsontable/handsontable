// Shared filesystem helpers for the performance-tests package.

import { access } from 'node:fs/promises';

/**
 * @param {string} p -- file path
 * @returns {Promise<boolean>}
 */
export const exists = p => access(p).then(() => true, () => false);
