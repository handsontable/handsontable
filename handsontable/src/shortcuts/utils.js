export const normalizeKeys = (keys) => {
  return keys.sort().join('+').toLowerCase();
};

export const normalizeEventKey = (code) => {
  return code.toLowerCase();
};
