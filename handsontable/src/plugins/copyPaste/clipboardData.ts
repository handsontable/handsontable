/**
 * @private
 */
export default class ClipboardData {
  declare data: Record<string, string>;
  constructor() {
    this.data = {};
  }
  setData(type: string, value: string) {
    this.data[type] = value;
  }
  getData(type: string) {
    return this.data[type] || void 0;
  }
}
