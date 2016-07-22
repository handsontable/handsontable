// Definitions by: Vincent Bortone <https://github.com/vbortone/>

export interface NumbroLanguage {
  delimiters: {
    thousands: string;
    decimal: string;
  };
  abbreviations: {
    thousand: string;
    million: string;
    billion: string;
    trillion: string;
  };
  ordinal(num: number): string;
  currency: {
    symbol: string;
  };
}

export interface Numbro {
  (value?: any): Numbro;
  version: string;
  isNumbro: boolean;

  culture(code: string, values?: NumbroLanguage): Numbro;
  // Deprecated: language will be removed after Numbro 2.0, use culture instead
  language(key: string, values?: NumbroLanguage): Numbro;

  zeroFormat(format: string): string;
  clone(): Numbro;
  format(inputString?: string): string;
  formatCurrency(inputString?: string): string;
  unformat(inputString: string): number;
  value(): number;
  valueOf(): number;
  set (value: any): Numbro;
  add(value: any): Numbro;
  subtract(value: any): Numbro;
  multiply(value: any): Numbro;
  divide(value: any): Numbro;
  difference(value: any): number;
}

declare var numbro: Numbro;
export default numbro;
