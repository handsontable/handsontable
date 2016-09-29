// Definitions by: Dan Poggi <https://github.com/dpoggi>

interface NumbroStatic {
  (value?: any): Numbro;

  version: string;
  isNumbro(value: any): value is Numbro;

  setCulture(newCultureCode: string, fallbackCultureCode?: string): void;
  culture(): string;
  culture(cultureCode: string): void;
  culture(cultureCode: string, newCulture: NumbroCulture): NumbroStatic;
  cultureData(cultureCode?: string): NumbroCulture;
  cultures(): Array<NumbroCulture>;

  /**
   * Language functions
   *
   * @deprecated Since version 1.6.0. Will be removed in version 2.0. Use the
   * culture versions instead.
   */
  setLanguage(newCultureCode: string, fallbackCultureCode?: string): void;
  language(): string;
  language(cultureCode: string): void;
  language(cultureCode: string, newCulture: NumbroCulture): NumbroStatic;
  languageData(cultureCode?: string): NumbroCulture;
  languages(): Array<NumbroCulture>;

  zeroFormat(newFormat: string): void;
  defaultFormat(newFormat: string): void;
  defaultCurrencyFormat(newFormat: string): void;

  validate(value: string, cultureCode?: string): boolean;

  loadCulturesInNode(): void;

  /**
   * @deprecated Since version 1.6.0. Will be removed in version 2.0. Use the
   * culture version instead.
   */
  loadLanguagesInNode(): void;
}

export interface Numbro {
  clone(): Numbro;

  format(formatString?: string, roundingFunction?: RoundingFunction): string;
  formatCurrency(formatString?: string, roundingFunction?: RoundingFunction): string;
  unformat(formattedNumber: string): number;

  binaryByteUnits(): string;
  byteUnits(): string;
  decimalByteUnits(): string;

  value(): number;
  valueOf(): number;

  set(value: number): this;
  add(value: number): this;
  subtract(value: number): this;
  multiply(value: number): this;
  divide(value: number): this;

  difference(value: number): number;
}

export interface NumbroCulture {
  langLocaleCode: string;
  cultureCode: string;
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
    position: string;
  };
  defaults: {
    currencyFormat: string;
  };
  formats: {
    fourDigits: string;
    fullWithTwoDecimals: string;
    fullWithTwoDecimalsNoCurrency: string;
    fullWithNoDecimals: string;
  };
}

export interface RoundingFunction {
  (x: number): number;
}

declare const numbro: NumbroStatic;
export default numbro;
