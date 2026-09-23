/**
 * Milliseconds in one day, the unit a millisecond timestamp is divided by to become a whole-day
 * offset — and therefore the unit every conversion between a `Date` and an Excel serial goes
 * through.
 */
export const MS_PER_DAY = 86400000;

/**
 * The Excel epoch (1899-12-30) expressed in UTC milliseconds, the base every date serial counts
 * from. The 1900 date system counts from 1899-12-30 rather than 1899-12-31 because it reproduces
 * Lotus 1-2-3's non-existent 1900-02-29.
 */
export const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

/**
 * Serial-number offset between the Unix epoch and the 1900 date system's day zero: 1970-01-01 is
 * day 25569. It is the same epoch {@link EXCEL_EPOCH_UTC} states in milliseconds, expressed in
 * days, so a conversion that already works in serials adds it rather than converting twice.
 *
 * Both xlsx adapters read a `Date` back into a serial with it, and they used to declare it twice
 * under two names — the drift `compression.ts` and `sheetNames.ts` exist to prevent.
 */
export const EXCEL_EPOCH_OFFSET = 25569;
