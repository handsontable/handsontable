export const jsdocReturnsLinksFixer = text => text
  .replace(/\*\*Returns\*\*: `(Array<\[[^\]]+\]\([^\)]+\)>)`/g, '**Returns**: <code>$1</code>');
