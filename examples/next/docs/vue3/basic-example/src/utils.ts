export function getRangeValue(
  value: number,
  minAllowedValue: number,
  maxAllowedValue: number
): number {
  if (value < minAllowedValue || !value) {
    return minAllowedValue;
  }

  if (value > maxAllowedValue) {
    return maxAllowedValue;
  }

  return value;
}
