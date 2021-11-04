const MAPPED_KEYS = new Map([
  ['ShiftLeft', 'shift'],
  ['ShiftRight', 'shift'],
  ['ControlLeft', 'control'],
  ['ControlRight', 'control'],
  ['MetaLeft', 'meta'],
  ['MetaRight', 'meta'],
  ['AltLeft', 'alt'],
  ['AltRight', 'alt'],
]);

export const normalizeKeys = (keys) => {
  return keys.sort().join('+').toLowerCase();
};

export const normalizeKeyCode = (code) => {
  if (MAPPED_KEYS.has(code)) {
    return MAPPED_KEYS.get(code);
  }

  return code.toLowerCase().replace(/key/, '');
};
