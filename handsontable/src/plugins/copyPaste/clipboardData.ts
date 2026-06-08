/**
 * @private
 */
export default class ClipboardData {
  /**
   * Key-value store mapping MIME type strings to their clipboard content.
   */
  declare data: Record<string, string>;
  /**
   * Initializes the clipboard data store as an empty object.
   */
  constructor() {
    this.data = {};
  }
  /**
   * Stores a value in the clipboard data under the given MIME type key.
   */
  setData(type: string, value: string) {
    this.data[type] = value;
  }
  /**
   * Returns the clipboard data stored under the given MIME type key, or `undefined` if absent.
   */
  getData(type: string) {
    return this.data[type] || void 0;
  }
}
