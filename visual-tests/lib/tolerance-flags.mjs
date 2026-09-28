/**
 * Maps `regconfig.json`'s comparison tolerances to reg-cli flags.
 *
 * One place for the mapping, so every reg-cli invocation outside `reg-suit run` (the credential-free
 * fork comparison, the stability matrix) applies the tolerances the same-repo run applies. Hard-coding
 * them at a call site would let that path drift into failing on antialiasing noise the gate tolerates.
 *
 * @param {object} config Parsed `regconfig.json`.
 * @returns {string[]} reg-cli flags.
 */
export function toleranceFlags(config) {
  const core = config?.core ?? {};
  const flags = [];

  if (core.enableAntialias) {
    flags.push('-A');
  }

  if (core.thresholdPixel !== undefined) {
    flags.push('-S', String(core.thresholdPixel));
  }

  if (core.thresholdRate !== undefined) {
    flags.push('-T', String(core.thresholdRate));
  }

  if (core.matchingThreshold !== undefined) {
    flags.push('-M', String(core.matchingThreshold));
  }

  return flags;
}
