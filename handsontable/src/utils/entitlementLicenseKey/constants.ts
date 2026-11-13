/**
 * The length of the checksum that closes the machine-readable
 * block of every entitlement license key.
 *
 * @type {number}
 */
export const CHECKSUM_LENGTH = 128;

/**
 * The length of the value a current key stores for its text.
 *
 * @type {number}
 */
export const PROSE_DIGEST_LENGTH = 64;

/**
 * The two mutually exclusive date fields of a product entry. Exactly one of
 * them is present:
 *
 *   - "usage_until"   the last licensed day (inclusive, compared in UTC),
 *   - "release_until" builds released on or before that day may be used
 *                     forever (compared against the build release date as
 *                     text, no clock involved).
 *
 * The pair replaces the contract type - nothing in the payload says
 * "subscription" or "perpetual".
 *
 * @type {string[]}
 */
export const DATE_FIELDS = ['usage_until', 'release_until'];

/**
 * The name of the product this build reads its own license from. A key that
 * does not grant it is not a Handsontable license, however many other products
 * it grants. Product names are append-only - renaming one silently drops the
 * entitlement it used to carry.
 *
 * @type {string}
 */
export const HANDSONTABLE_PRODUCT = 'handsontable';

/**
 * Marks a license as an evaluation one. A flag is present or absent - there is
 * no `false` value - and an unrecognized flag is ignored, for the same reason
 * an unrecognized capability token is.
 *
 * @type {string}
 */
export const TRIAL_FLAG = 'trial';

/**
 * Closes the console channel: nothing this module has to say reaches it.
 *
 * @type {string}
 */
export const NO_CONSOLE_WARNS_FLAG = 'no-console-warns';

/**
 * Closes the UI WARNING surfaces: no corner badge, no popover, no bottom bar.
 * Both this flag and the one above are the default for a key issued for
 * external, end-user-facing use. It does not close the "Powered by" bar a
 * `badge` key asks for - see `BADGE_FLAG`.
 *
 * It does NOT close the hard-stop lock screen. The lock is enforcement rather
 * than a warning, so `mountBrandingSurface` (`utils/licenseBranding/index.ts`)
 * routes it BEFORE reading this channel - see the note there. Product decision
 * under DEV-2709; the specification's S4.1 table header does not yet record the
 * split, so do not "restore" the old behavior from the spec alone.
 *
 * @type {string}
 */
export const NO_UI_WARNS_FLAG = 'no-ui-warns';

/**
 * Says the licensee agreed to show the product's "Powered by" bar - usually
 * the term of a sponsored license. The issuer sets it per product entry; no
 * contract type or mode implies it.
 *
 * It is not a channel, and no channel closes it: the bar is branding, not a
 * warning, so a product renders it outside the `ui` channel gate, with or
 * without `no-ui-warns`. The reader does not act on it - the product checks
 * the entry's flags. A product with no bar ignores it.
 *
 * @type {string}
 */
export const BADGE_FLAG = 'badge';

/**
 * The number of milliseconds in a day, used to walk from one UTC midnight to
 * the next.
 *
 * @type {number}
 */
export const MILLISECONDS_PER_DAY = 86400000;
