/**
 * The step boundary of the VoiceOver reader: the part of `screenreader/screenreader.spec.ts` that
 * reads what VoiceOver said and needs no VoiceOver to prove.
 *
 * VoiceOver keeps the last phrase it spoke (`content of last phrase` in its AppleScript dictionary),
 * and Guidepup's capture polls that phrase until it holds still. A step VoiceOver says nothing on
 * leaves the previous step's phrase in place, and Guidepup takes a phrase that has not changed for
 * about 600 ms as new, so silence would read as a repeat of the previous announcement: an empty
 * `close-editor` would carry the editor's announcement. Before each step the reader makes VoiceOver
 * speak the boundary (`output`), waits until the boundary is the last phrase, then captures the step.
 * A step that speaks replaces the boundary; a silent step captures the boundary alone, and
 * `stripStepBoundary()` turns that into an empty string, which is what a silent step records on NVDA.
 *
 * No I/O in here: the spec runs the AppleScript these strings build.
 */

/**
 * The phrase VoiceOver speaks between two steps. Two plain words, so VoiceOver reports them back as
 * written, and a phrase no fixture holds: only a whole phrase equal to it is removed.
 */
export const STEP_BOUNDARY = 'Step boundary';

/**
 * The separator Guidepup's VoiceOver capture joins the phrases of one capture with.
 */
export const PHRASE_SEPARATOR = '. ';

/**
 * The AppleScript that makes VoiceOver speak the boundary.
 */
export const OUTPUT_STEP_BOUNDARY = `output "${STEP_BOUNDARY}"`;

/**
 * The AppleScript that reads VoiceOver's last phrase, inside a transaction, the way Guidepup reads it.
 */
export const READ_LAST_PHRASE = 'with transaction\nreturn content of last phrase\nend transaction';

/**
 * A script for VoiceOver's AppleScript dictionary: `body` inside `tell application "VoiceOver"`.
 *
 * @param {string} body The commands.
 * @returns {string} The script, for `osascript`.
 */
export function voiceOverAppleScript(body) {
  return `tell application "VoiceOver"\n${body}\nend tell`;
}

/**
 * Whether a phrase is the step boundary: the same words, whatever the case, the surrounding
 * whitespace or a closing full stop.
 *
 * @param {unknown} phrase The phrase VoiceOver reported.
 * @returns {boolean} Whether it is the boundary.
 */
export function isStepBoundary(phrase) {
  return String(phrase ?? '').trim().replace(/\.+$/, '').trim().toLowerCase() === STEP_BOUNDARY.toLowerCase();
}

/**
 * What a capture spoke without the step boundary: every phrase of the joined capture that is the
 * boundary is removed, the others stay in their order with the separator they had. A capture of the
 * boundary alone is a silent step, an empty string.
 *
 * @param {unknown} spoken The capture's joined phrases.
 * @returns {string} The phrases the step spoke.
 */
export function stripStepBoundary(spoken) {
  return String(spoken ?? '')
    .split(PHRASE_SEPARATOR)
    .filter(phrase => !isStepBoundary(phrase))
    .join(PHRASE_SEPARATOR)
    .trim();
}
