
export const normalizeKeys = (...keys) => {
  return keys.sort().join('+');
};

export const normalizeKeyCode = (code) => {
  return code.toLowerCase().replace(/key/, '');
};
