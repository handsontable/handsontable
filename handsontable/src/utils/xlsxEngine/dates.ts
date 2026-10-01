// `MS_PER_DAY` and `EXCEL_EPOCH_UTC` are declared in the neutral `helpers/dateTime.ts`, so a core
// plugin can use them without importing the xlsx layer. They are re-exported here so every engine
// import keeps one source.
export { MS_PER_DAY, EXCEL_EPOCH_UTC } from '../../helpers/dateTime';

/**
 * Serial-number offset between the Unix epoch and the 1900 date system's day zero: 1970-01-01 is
 * day 25569. It is the same epoch `EXCEL_EPOCH_UTC` states in milliseconds, expressed in
 * days, so a conversion that already works in serials adds it rather than converting twice.
 *
 * Both xlsx adapters read a `Date` back into a serial with it, and they used to declare it twice
 * under two names — the drift `compression.ts` and `sheetNames.ts` exist to prevent.
 */
export const EXCEL_EPOCH_OFFSET = 25569;
