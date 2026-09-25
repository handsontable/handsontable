/**
 * The fixed part of each ZIP record, in bytes, as APPNOTE.TXT declares it. The writer adds them up
 * to size its output buffer and the reader walks by them, so both sides read the numbers from here.
 */

/**
 * The local file header: signature through the extra-field length, before the entry's name.
 */
export const LOCAL_HEADER_SIZE = 30;

/**
 * One central-directory record: signature through the local-header offset, before the entry's name.
 */
export const CENTRAL_HEADER_SIZE = 46;

/**
 * The end-of-central-directory record, with an empty archive comment. It is also the smallest a
 * whole archive can be.
 */
export const END_RECORD_SIZE = 22;
