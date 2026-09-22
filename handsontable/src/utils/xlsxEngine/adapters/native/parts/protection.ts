/**
 * The `<sheetProtection>` hash attributes Excel checks before it unprotects a sheet.
 */
export interface ProtectionHash {
  algorithmName: 'SHA-512';
  hashValue: string;
  saltValue: string;
  spinCount: number;
}

/**
 * The iteration count Excel itself writes; ExcelJS uses the same default.
 */
export const SHEET_PASSWORD_SPIN_COUNT = 100000;

/**
 * Protection options whose `true` means "allowed". OOXML stores them inverted: the attribute is
 * `1` when the action is LOCKED, so `formatColumns: true` is written as `formatColumns="0"` and
 * read back the same way. `selectLockedCells`/`selectUnlockedCells` and `objects`/`scenarios`
 * invert too but are not in this list because their default differs — the writer emits them only
 * when the caller explicitly asked for `false`, exactly as ExcelJS does. Only `sheet` is stored
 * non-inverted.
 */
export const PROTECTION_ALLOW_OPTIONS = [
  'formatCells', 'formatColumns', 'formatRows', 'insertColumns', 'insertRows', 'insertHyperlinks',
  'deleteColumns', 'deleteRows', 'sort', 'autoFilter', 'pivotTables',
];

/**
 * Options stored inverted in the file (attribute `1` = not allowed).
 */
export const PROTECTION_INVERTED_OPTIONS = new Set([
  ...PROTECTION_ALLOW_OPTIONS, 'selectLockedCells', 'selectUnlockedCells', 'objects', 'scenarios',
]);

/**
 * Base64 of a byte array.
 */
function toBase64(bytes: Uint8Array): string {
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

/**
 * UTF-16LE bytes of a string, the encoding Excel hashes passwords in.
 */
function utf16le(text: string): Uint8Array {
  const out = new Uint8Array(text.length * 2);

  /* eslint-disable no-bitwise -- splitting a UTF-16 code unit into its two bytes. */
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    out[i * 2] = code & 0xFF;
    out[(i * 2) + 1] = code >>> 8;
  }
  /* eslint-enable no-bitwise */

  return out;
}

/**
 * Concatenates two byte arrays into a fresh `ArrayBuffer`-backed view (what `crypto.subtle` wants).
 */
function concat(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.byteLength + b.byteLength);

  out.set(a, 0);
  out.set(b, a.byteLength);

  return out;
}

/**
 * SHA-512 through the platform.
 */
async function sha512(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest('SHA-512', bytes));
}

/**
 * Hashes a sheet password the way Excel and ExcelJS do: `H0 = SHA-512(salt ‖ UTF-16LE(password))`,
 * then `H(i+1) = SHA-512(H(i) ‖ uint32LE(i))` for `i` from `0` to `spinCount - 1`. The iterator
 * suffix is what keeps this off `PBKDF2`. This is a UI gate, not encryption: the cells stay plain
 * text in the archive.
 */
export async function hashSheetPassword(
  password: string,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16)),
  spinCount: number = SHEET_PASSWORD_SPIN_COUNT,
): Promise<ProtectionHash> {
  let key = await sha512(concat(salt, utf16le(password)));
  const iterator = new Uint8Array(4);
  const view = new DataView(iterator.buffer);

  for (let i = 0; i < spinCount; i++) {
    view.setUint32(0, i, true);
    // eslint-disable-next-line no-await-in-loop -- each spin hashes the previous one; it cannot run concurrently.
    key = await sha512(concat(key, iterator));
  }

  return {
    algorithmName: 'SHA-512',
    hashValue: toBase64(key),
    saltValue: toBase64(salt),
    spinCount,
  };
}
