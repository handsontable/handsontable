export function isNumeric(value: any, additionalDelimiters?: string[]): boolean;
export function isNumericLike(value: any): boolean;
export function isCommaThousandsGroupedInteger(
  value: string,
  decimalSeparator: '.' | ',' | undefined
): boolean;
export function rangeEach(rangeFrom: number, rangeTo: number, iteratee: (index: number) => void): void;
export function rangeEachReverse(rangeFrom: number, rangeTo: number, iteratee: (index: number) => void): void;
export function valueAccordingPercent(value: number, percent: string | number): number;
export function clamp(value: number, minValue: number, maxValue: number): number;
export function getParsedNumber(
  numericData: string,
  options?: { decimalSeparator?: '.' | ',' }
): number | null;
