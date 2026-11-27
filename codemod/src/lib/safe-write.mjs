import { randomBytes } from 'node:crypto';
import { access, chmod, lstat, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { readUtf8 } from './text-file.mjs';

/**
 * The file changed between the read and the write, so the transformed text is built on stale input.
 */
export class StaleFileError extends Error {
  constructor(file) {
    super(`${file} changed while the tool was running, so it was left as it is now. Run the tool again.`);
    this.name = 'StaleFileError';
  }
}

/**
 * Write a file the tool transformed, so that a mistake or an interruption cannot cost the user a source file.
 *
 * - The output goes to a new file in the same directory first and then replaces the original with one `rename`, which
 *   is atomic on a local file system. A full disk or a kill mid-write leaves the original whole and, at worst, a stray
 *   temporary file that the tool removes when it can.
 * - Just before the rename the file is read again and must still be the text the transformation started from, on the
 *   same inode. An editor that saved while the tool parsed would otherwise lose its edit. The check narrows the window
 *   to the time between that read and the rename. It does not close it, and nothing short of a lock does.
 * - The permission bits of the original stay. A read-only file is refused, as the old in-place write refused it:
 *   a replace would otherwise go around the permission the user set on purpose.
 * - A path that is a symbolic link now is refused. The caller checked it before the transformation, and this is the
 *   last look before the write.
 *
 * Replacing the file gives it a new inode. A hard link to the old one keeps the old text, and an extended attribute or
 * an owner that only root could restore is not carried over.
 *
 * @param {string} path Absolute path of the file.
 * @param {string} expected The text the transformation read.
 * @param {string} output The text to write.
 * @param {object} [hooks] Injection points for tests.
 * @param {() => Promise<void>|void} [hooks.beforeRename] Called after the temporary file is complete.
 * @returns {Promise<void>}
 * @throws {StaleFileError} When the file no longer holds `expected`.
 * @throws {Error} When the file is not a regular, writable file, or the system call fails.
 */
export async function writeFileSafely(path, expected, output, { beforeRename } = {}) {
  const info = await lstat(path);

  if (info.isSymbolicLink() || !info.isFile()) {
    throw new Error(`${basename(path)} is no longer a regular file.`);
  }

  await access(path, constants.W_OK);

  // The permission bits, without the type bits of the file.
  const mode = parseInt(info.mode.toString(8).slice(-4), 8);
  const temporary = join(dirname(path), `.${basename(path)}.${randomBytes(6).toString('hex')}.codemod-tmp`);

  try {
    await writeFile(temporary, output, { flag: 'wx', mode });
    // The mode of a new file is cut by the umask, so set it again.
    await chmod(temporary, mode);
    await beforeRename?.();

    // The last look, as close to the rename as it gets: the path must still be the file that was read, with the text
    // that was read.
    const [now, current] = await Promise.all([stat(path), readUtf8(path).catch(() => null)]);

    if (now.ino !== info.ino || now.dev !== info.dev || current !== expected) {
      throw new StaleFileError(basename(path));
    }

    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => {});

    throw error;
  }
}
