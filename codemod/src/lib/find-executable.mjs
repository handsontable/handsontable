import { stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PATHEXT = '.COM;.EXE;.BAT;.CMD';

/**
 * The extensions `execFile` can start without a shell. A `.bat` or `.cmd` file needs `cmd.exe`, which the tool never
 * involves, so `git.cmd` in a directory of `PATH` is not a candidate.
 */
const DIRECT_EXTENSIONS = new Set(['.com', '.exe']);

/**
 * Read an environment variable the way the platform does: Windows ignores the case of a name (`Path`), while a copy of
 * `process.env` made with a spread is a plain object that does not.
 *
 * @param {Record<string, string|undefined>} env The environment.
 * @param {string} name The variable name.
 * @param {boolean} windows Whether names are case-insensitive.
 * @returns {string|undefined} The value.
 */
function readVariable(env, name, windows) {
  if (!windows) {
    return env[name];
  }

  const key = Object.keys(env).find(candidate => candidate.toLowerCase() === name.toLowerCase());

  return key === undefined ? undefined : env[key];
}

/**
 * Tell whether a path is a regular file the current user may run. On Windows there is no execute bit, so a file is
 * enough.
 *
 * @param {string} file Absolute path.
 * @param {boolean} windows Whether the host is Windows.
 * @returns {Promise<boolean>} `true` for an executable regular file.
 */
async function isExecutableFile(file, windows) {
  const info = await stat(file).catch(() => null);

  // The execute bits are 0o111: a digit of the octal mode is odd when its execute bit is set.
  const executable = info?.mode.toString(8).slice(-3).split('').some(digit => digit % 2 === 1);

  return Boolean(info?.isFile()) && (windows || executable);
}

/**
 * Find a program the way a shell would, with two differences that matter for a tool that runs inside a project it did
 * not write: a `PATH` entry that is empty or relative (`.`, `bin`) is skipped, and the current directory is never
 * searched. On Windows, `execFile('git', ..., { cwd })` can resolve `git.exe` from `cwd` before `PATH`, so a `git.exe`
 * in the project root would run on every migration. The caller runs the returned absolute path instead.
 *
 * @param {string} name The program name without an extension, for example `git`.
 * @param {object} [options] Options. Every field is injectable, so a test runs the Windows rules on any host.
 * @param {Record<string, string|undefined>} [options.env] The environment. Defaults to `process.env`.
 * @param {string} [options.platform] `process.platform` value. Defaults to the host's.
 * @param {(file: string) => Promise<boolean>} [options.isFile] Tells whether a candidate is a runnable file. Defaults
 * to a `stat` of the real file system.
 * @returns {Promise<string|null>} The absolute path of the first match, or `null` when no directory holds one.
 */
export async function findExecutable(name, { env = process.env, platform = process.platform, isFile } = {}) {
  const windows = platform === 'win32';
  const flavor = windows ? path.win32 : path.posix;
  const check = isFile ?? (file => isExecutableFile(file, windows));
  const directories = (readVariable(env, 'PATH', windows) ?? '').split(flavor.delimiter);
  const extensions = windows
    ? (readVariable(env, 'PATHEXT', windows) ?? DEFAULT_PATHEXT).split(';')
      .map(extension => extension.trim().toLowerCase())
      .filter(extension => DIRECT_EXTENSIONS.has(extension))
    : [''];
  const suffixes = windows && extensions.length === 0 ? ['.exe'] : extensions;

  for (const entry of directories) {
    // Windows allows quotes around a `PATH` entry that holds a semicolon.
    const directory = windows ? entry.replace(/^"(.*)"$/, '$1') : entry;

    if (directory === '' || !flavor.isAbsolute(directory)) {
      continue;
    }

    for (const suffix of suffixes) {
      const candidate = flavor.join(directory, `${name}${suffix}`);

      if (await check(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}
