/**
 * Check if currently it is RTL direction
 * 
 * @param {Handsontable} instance Handsontable instance
 * @return {boolean} true if RTL
 */
function isRtl(instance) {
  return instance.rootWindow.getComputedStyle(instance.rootElement).direction === 'rtl';
}
/**
 * Check if currently it is LTR direction
 * 
 * @param {Handsontable} instance Handsontable instance
 * @return {boolean} true if LTR
 */
function isLtr(instance) { 
  return !isRtl(instance);
}

/**
 * Returns 1 for LTR; -1 for RTL. Useful for calculations.
 * 
 * @param {Handsontable} instance Handsontable instance
 * @return {number} Returns 1 for LTR; -1 for RTL.
 */
function getDirectionFactor(instance) {
  return isLtr(instance) ? 1 : -1;
} 

export {
  isLtr,
  isRtl,
  getDirectionFactor
}
