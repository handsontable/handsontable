import fsPromises from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';

/**
 * A preload for a child process of a test (`node --import <this file> bin/handsontable-codemod.mjs ...`): every
 * `rename` of `node:fs/promises` waits first, so a run that writes many files takes long enough for the test to send a
 * signal in the middle of it. The tool replaces a file with one `rename`, so this slows each write and changes nothing
 * else. The wait is `CODEMOD_TEST_RENAME_DELAY_MS` milliseconds, 50 when it is unset.
 */
const delay = Number(process.env.CODEMOD_TEST_RENAME_DELAY_MS ?? 50);
const { rename } = fsPromises;

fsPromises.rename = async(...args) => {
  await new Promise((resolve) => {
    setTimeout(resolve, delay);
  });

  return rename(...args);
};

// The tool imports `rename` by name, and a named import of a built-in module is a copy until it is synchronized.
syncBuiltinESMExports();
