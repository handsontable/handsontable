/**
 * Raised for problems the user can fix by changing the command line or the project state: an unknown flag,
 * an empty version range, or a refused dirty git tree. The CLI maps it to exit code 2.
 */
export class UsageError extends Error {
  /**
   * @param {string} message Message shown to the user.
   */
  constructor(message) {
    super(message);

    this.name = 'UsageError';
  }
}

/**
 * Raised when a manifest file is malformed. It names the file and the rule so the author can find it.
 */
export class ManifestError extends Error {
  /**
   * @param {string} message Message shown to the author of the manifest.
   */
  constructor(message) {
    super(message);

    this.name = 'ManifestError';
  }
}
