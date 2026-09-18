/**
 * Fill color the XLSX export paints on a read-only cell that has no explicit background of its own.
 * The value matches the Handsontable design-system token for the dimmed/disabled cell state.
 *
 * It is a sentinel rather than a user style: the import recognizes it on a cell it is about to mark
 * `readOnly` and drops it, so a round trip does not bake the grid's own dimming into a class name.
 * Both directions have to read the same constant or the round trip silently stops recognizing it,
 * which is why it lives here (in the engine-neutral layer both plugins already import) rather than
 * in either plugin.
 */
export const READ_ONLY_FILL_ARGB = 'FFF0F0F0';

/**
 * Text color the XLSX export paints on a read-only cell that has no explicit color of its own. Same
 * sentinel contract as `READ_ONLY_FILL_ARGB`.
 */
export const READ_ONLY_TEXT_ARGB = 'FF808080';
