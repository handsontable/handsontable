
export const normalizeKeys = (...keys) => {
  return keys.sort().join('+')
}
