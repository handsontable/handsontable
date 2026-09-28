import semver from 'semver';

/**
 * Helpers for the `addedIn` frontmatter field (DEV-2877): the Handsontable
 * version that introduced the feature a guide page documents. The value is
 * rendered as an "Added in Handsontable X.Y.Z" badge next to the page title
 * (src/components/PageTitle.astro), written under the H1 of the page's
 * Markdown route and llms files (astro.config.mjs), and validated at build
 * time (scripts/validate-added-in.mjs). Everything that reads the field goes
 * through this module so the three surfaces cannot disagree.
 */

/** A full `MAJOR.MINOR.PATCH` version, e.g. "17.0.0". */
export const ADDED_IN_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Whether a frontmatter value is a well-formed `addedIn` version string.
 *
 * The content loader falls back to the raw frontmatter when schema validation
 * fails, so a YAML float such as `17.0` reaches the components as the number
 * `17`. Callers must therefore guard with this function rather than trust the
 * schema.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidVersion(value) {
  return typeof value === 'string' && ADDED_IN_PATTERN.test(value);
}

/**
 * The badge text for a valid `addedIn` value, or null when the value is
 * missing or malformed.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function formatAddedIn(value) {
  return isValidVersion(value) ? `Added in Handsontable ${value}` : null;
}

/**
 * The versions an `addedIn` value may name: every released version plus the
 * three releases that can come next (next major, next minor, next patch of
 * the newest release). A page written for an unreleased feature on `develop`
 * names one of those three; anything else (a skipped minor, a version that
 * was never cut) is a typo.
 *
 * @param {Iterable<string>} releasedVersions Full version strings, e.g. from
 *   the changelog parser.
 * @returns {Set<string>}
 */
export function allowedVersions(releasedVersions) {
  const released = [...releasedVersions].filter((version) => semver.valid(version));
  const allowed = new Set(released);

  if (released.length > 0) {
    const newest = released.reduce((a, b) => (semver.gt(b, a) ? b : a));

    allowed.add(semver.inc(newest, 'major'));
    allowed.add(semver.inc(newest, 'minor'));
    allowed.add(semver.inc(newest, 'patch'));
  }

  return allowed;
}

/**
 * Why an `addedIn` value is rejected, or null when it is acceptable. An
 * absent field (`undefined`) is always acceptable: the field is optional.
 *
 * @param {unknown} value The raw frontmatter value.
 * @param {Set<string>} allowed From {@link allowedVersions}.
 * @returns {string|null}
 */
export function addedInError(value, allowed) {
  if (value === undefined) {
    return null;
  }

  if (!isValidVersion(value)) {
    return `addedIn must be a quoted "MAJOR.MINOR.PATCH" string such as "17.0.0", got ${JSON.stringify(value)}`;
  }

  if (!allowed.has(value)) {
    return `addedIn ${value} is not a released Handsontable version or the next major, minor, or patch release`;
  }

  return null;
}

/**
 * Assembles the Markdown served for a page (the "Copy Markdown" and
 * `/_md/` routes, and the llms files): an H1 from the frontmatter title, the
 * "Added in" sentence when the page has a valid `addedIn`, then the body.
 *
 * @param {{ title: string, addedIn?: unknown }} data The page frontmatter.
 * @param {string} content The page body, frontmatter already stripped.
 * @param {(text: string) => string} [transform] Applied to the assembled
 *   Markdown, e.g. template-variable substitution.
 * @returns {string}
 */
export function buildPageMarkdown(data, content, transform = (text) => text) {
  const addedIn = formatAddedIn(data.addedIn);
  const lead = addedIn ? `${addedIn}.\n\n` : '';

  return transform(`# ${data.title}\n\n${lead}${content.trim()}`);
}
