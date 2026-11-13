import path from 'node:path';

/**
 * Tell whether a path from `path.relative()` leaves the directory it was made relative to. The decision takes the
 * path flavor as an argument, so a test can run the Windows rules on any host.
 *
 * Both separators count on Windows, because a path may have been through `toPosix()` already. On a POSIX host a
 * backslash is an ordinary file name character, so `..\x` is a name inside the directory.
 *
 * @param {string} rel Relative path.
 * @param {typeof path.posix} [flavor] `path`, `path.posix`, or `path.win32`. Defaults to the host's `path`.
 * @returns {boolean} `true` for `..`, a path that starts with `..` and a separator, an absolute path, and a path with
 * a drive letter (another drive on Windows). A name that merely starts with two dots, such as `..odd`, stays inside.
 */
export function leavesDirectory(rel, flavor = path) {
  const windows = flavor.sep === '\\';
  const parentFirst = windows ? /^\.\.[\\/]/ : /^\.\.\//;

  return rel === '..' || parentFirst.test(rel) || flavor.isAbsolute(rel) || (windows && /^[a-zA-Z]:/.test(rel));
}

/**
 * Convert a path with the platform separator to a forward-slash path, the form every report and file list uses.
 *
 * @param {string} value Path with the platform separator.
 * @param {typeof path.posix} [flavor] `path`, `path.posix`, or `path.win32`. Defaults to the host's `path`.
 * @returns {string} Path with forward slashes.
 */
export function toPosix(value, flavor = path) {
  return flavor.sep === '/' ? value : value.split(flavor.sep).join('/');
}

/**
 * Where a real path sits relative to a real directory. Both arguments must have gone through `realpath()` already,
 * so that links and short names are resolved.
 *
 * @param {string} root Real path of the directory.
 * @param {string} real Real path to place.
 * @param {typeof path.posix} [flavor] `path`, `path.posix`, or `path.win32`. Defaults to the host's `path`.
 * @returns {string|null} The forward-slash path below `root` (empty for `root` itself), or `null` when `real` is
 * outside it, on another drive included.
 */
export function insideRelative(root, real, flavor = path) {
  const rel = flavor.relative(root, real);

  return leavesDirectory(rel, flavor) ? null : toPosix(rel, flavor);
}
