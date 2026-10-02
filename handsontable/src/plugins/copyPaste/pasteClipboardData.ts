import type { PasteClipboardData } from '../../core/settings';

/**
 * The part of a paste event's clipboard that the snapshot reads. Both a real `DataTransfer` and the
 * `ClipboardData` stand-in that the public `paste()` method builds satisfy it.
 */
export interface PasteClipboardSource {
  readonly types?: readonly string[];
  getData(type: string): string | undefined;
}

/**
 * Flavors that are read explicitly. A browser can leave one out of `types` while still returning its
 * content from `getData()`, and the plugin needs all three.
 */
export const SOURCE_DATA_HTML_MIME_TYPE = 'application/ht-source-data-json-html';
const KNOWN_TYPES = ['text/plain', 'text/html', SOURCE_DATA_HTML_MIME_TYPE];

/**
 * The name `DataTransfer.types` gives to the file entries. They are not strings and are not copied.
 */
const FILES_TYPE = 'Files';

/**
 * A writable snapshot of the clipboard that `beforePasteParse` callbacks edit.
 *
 * Copies the string flavors out of the source on construction, so editing it never touches the
 * (read-only) native clipboard. Besides what callbacks see, it remembers what each flavor held at the
 * source, because the plugin must treat a flavor nobody touched exactly as it did before the hook
 * existed: a real `DataTransfer` answers `''` for a missing `text/plain`, while the programmatic
 * `paste()` answers `undefined`, and `parse('')` and `undefined` lead to different outcomes.
 *
 * @private
 */
export class PasteClipboardSnapshot implements PasteClipboardData {
  /**
   * What the callbacks currently see, by flavor.
   */
  #values = new Map<string, string>();
  /**
   * What the source returned for each known flavor, untouched. `undefined` when the source had none.
   */
  #sourceValues = new Map<string, string | undefined>();
  /**
   * What each flavor held when the snapshot was built, used to detect an edit by comparing strings.
   */
  #initialValues = new Map<string, string>();
  /**
   * Flavors a callback set or cleared. Only these leave the source's own answer behind.
   */
  #edited = new Set<string>();

  /**
   * Copies the string flavors of `source`. With `copyEveryType` off, only the three flavors the plugin
   * reads are copied, which keeps a paste with no callback from copying a large `text/rtf`.
   */
  constructor(source: PasteClipboardSource, copyEveryType = true) {
    const types = copyEveryType ?
      Array.from(source.types ?? []).filter(type => type !== FILES_TYPE) : [];

    KNOWN_TYPES.forEach((type) => {
      this.#sourceValues.set(type, source.getData(type));
    });

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
    return this.#values.get(type) ?? '';
  }

  /**
   * Sets the content of a flavor.
   */
  setData(type: string, value: string): void {
    this.#values.set(type, String(value));
    this.#edited.add(type);
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

    this.#values.delete(type);
    this.#edited.add(type);
  }

  /**
   * Whether a flavor holds another string than it did when the snapshot was built.
   */
  isChanged(type: string): boolean {
    return this.getData(type) !== (this.#initialValues.get(type) ?? '');
  }

  /**
   * Returns the content of a known flavor for the plugin to parse: `undefined` when there is none.
   *
   * A flavor no callback touched answers exactly what the source did, which is the behavior from
   * before the hook existed. A flavor a callback set or cleared answers what the callbacks left.
   */
  resolve(type: string): string | undefined {
    if (!this.#edited.has(type)) {
      return this.#sourceValues.get(type);
    }

    return this.#values.get(type);
  }
}
