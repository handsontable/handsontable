/**
 * A writable snapshot of the clipboard content of a paste, passed to the `beforePasteParse` hook.
 *
 * A subset of `DataTransfer`. It holds every string flavor the paste event carries, such as
 * `text/plain` and `text/html`, and edits to it never reach the system clipboard. File entries are
 * not copied: read them from `event.clipboardData.files`. Like `DataTransfer`, it lowercases a type
 * and reads `'text'` as `'text/plain'` and `'url'` as `'text/uri-list'`.
 */
export interface PasteClipboardData {
  /**
   * The flavors the snapshot currently holds.
   */
  readonly types: string[];
  /**
   * Returns the content of a flavor, or an empty string when the flavor is absent.
   */
  getData(type: string): string;
  /**
   * Sets the content of a flavor.
   */
  setData(type: string, value: string): void;
  /**
   * Removes a flavor, or every flavor when called without an argument.
   */
  clearData(type?: string): void;
}

/**
 * The part of a paste event's clipboard that the snapshot reads. Both a real `DataTransfer` and the
 * `ClipboardData` stand-in that the public `paste()` method builds satisfy it.
 */
export interface PasteClipboardSource {
  readonly types?: readonly string[];
  getData(type: string): string | undefined;
}

/**
 * The flavor Handsontable writes on copy, with the source data of the copied cells.
 */
export const SOURCE_DATA_HTML_MIME_TYPE = 'application/ht-source-data-json-html';

/**
 * Flavors that are read explicitly. A browser can leave one out of `types` while still returning its
 * content from `getData()`, and the plugin needs all three.
 */
const KNOWN_TYPES = ['text/plain', 'text/html', SOURCE_DATA_HTML_MIME_TYPE];

/**
 * The name `DataTransfer.types` gives to the file entries. They are not strings and are not copied.
 */
const FILES_TYPE = 'Files';

/**
 * Maps a type the way `DataTransfer` does: lowercase, with `'text'` and `'url'` as the legacy names
 * of `text/plain` and `text/uri-list`.
 */
function normalizeType(type: string): string {
  const lowerCased = String(type).toLowerCase();

  if (lowerCased === 'text') {
    return 'text/plain';
  }

  return lowerCased === 'url' ? 'text/uri-list' : lowerCased;
}

/**
 * A writable snapshot of the clipboard that `beforePasteParse` callbacks edit.
 *
 * Copies the string flavors out of the source on construction, so editing it never touches the
 * (read-only) native clipboard. The plugin reads a flavor no callback touched straight from the source,
 * exactly as it did before the hook existed: a real `DataTransfer` answers `''` for a missing
 * `text/plain`, while the programmatic `paste()` answers `undefined`, and `parse('')` and `undefined`
 * lead to different outcomes.
 *
 * @private
 */
export class PasteClipboardSnapshot implements PasteClipboardData {
  /**
   * The clipboard the snapshot was built from.
   */
  #source: PasteClipboardSource;
  /**
   * What the callbacks currently see, by flavor.
   */
  #values = new Map<string, string>();
  /**
   * What each flavor held when the snapshot was built, used to detect an edit by comparing strings.
   */
  #initialValues = new Map<string, string>();
  /**
   * Flavors a callback set or cleared. Only these stop answering what the source answers.
   */
  #edited = new Set<string>();

  /**
   * Copies the string flavors of `source`. With `copyEveryType` off nothing is copied, because a
   * paste with no callback reads the source directly.
   */
  constructor(source: PasteClipboardSource, copyEveryType = true) {
    this.#source = source;

    if (!copyEveryType) {
      return;
    }

    const types = Array.from(source.types ?? [])
      .filter(type => type !== FILES_TYPE)
      .map(normalizeType);

    new Set(types.concat(KNOWN_TYPES)).forEach((type) => {
      const value = source.getData(type);

      // A known flavor that is empty is not a flavor the clipboard carries. Listing it would put
      // `text/html` into `types` for a plain-text paste.
      if (value !== undefined && (value !== '' || types.includes(type))) {
        this.#values.set(type, value);
        this.#initialValues.set(type, value);
      }
    });
  }

  /**
   * The flavors currently in the snapshot.
   */
  get types(): string[] {
    return Array.from(this.#values.keys());
  }

  /**
   * Returns the content of a flavor, or `''` when it is absent, as `DataTransfer` does.
   */
  getData(type: string): string {
    return this.#values.get(normalizeType(type)) ?? '';
  }

  /**
   * Sets the content of a flavor.
   */
  setData(type: string, value: string): void {
    const normalizedType = normalizeType(type);

    this.#values.set(normalizedType, String(value));
    this.#edited.add(normalizedType);
  }

  /**
   * Removes one flavor, or all of them when called without an argument.
   */
  clearData(type?: string): void {
    if (type === undefined) {
      Array.from(this.#values.keys()).forEach(key => this.clearData(key));

      KNOWN_TYPES.forEach(key => this.#edited.add(key));

      return;
    }

    const normalizedType = normalizeType(type);

    this.#values.delete(normalizedType);
    this.#edited.add(normalizedType);
  }

  /**
   * Whether a flavor holds another string than it did when the snapshot was built.
   */
  isChanged(type: string): boolean {
    const normalizedType = normalizeType(type);

    return this.getData(normalizedType) !== (this.#initialValues.get(normalizedType) ?? '');
  }

  /**
   * Returns the content of a known flavor for the plugin to parse: `undefined` when there is none.
   *
   * A flavor no callback touched answers exactly what the source does, which is the behavior from
   * before the hook existed. A flavor a callback set or cleared answers what the callbacks left.
   */
  resolve(type: string): string | undefined {
    if (!this.#edited.has(type)) {
      return this.#source.getData(type);
    }

    return this.#values.get(type);
  }
}
