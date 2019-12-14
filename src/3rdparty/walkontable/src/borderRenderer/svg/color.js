let helperSpanForColorPicking;
/**
 * Matches any numbers within string, including negative numbers and decimal fractions
 */
const numericRegexp = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;

/**
 * Sets up the window object for `convertCssColorToRGBA`.
 * Needed because our linting rules prohibit to use globals like `window`
 *
 * @param {Object} window DOM window object
 */
export function setCurrentWindowContext(window) {
  helperSpanForColorPicking = window.document.createElement('span');
  helperSpanForColorPicking.style.display = 'none';
}

/**
 * Converts keyword, short hex, long hex, rgb, rgba colors to [r, g, b, a] array.
 * Before calling this function, make sure to call setCurrentWindowContext to set up.
 *
 * orange, oRaNgE, #FFA500, #ffa500, rgb(255,165,0) -> {"r": 255, "g": 165, "b": 0, "a": 1}
 * #FA0 -> {"r": 255, "g": 170, "b": 0, "a": 1}
 * rgba(255,165,0,.2) -> {"r": 255, "g": 165, "b": 0, "a": 0.2}
 * hsla(39,100%,50%,.2) -> { r: 255, g: 166, b: 0, a: 0.2 }
 *
 * @param {String} cssColor
 * @returns {Array} An array with items: [r, g, b, a]
 */
export function convertCssColorToRGBA(cssColor) {
  helperSpanForColorPicking.ownerDocument.body.appendChild(helperSpanForColorPicking);
  helperSpanForColorPicking.style.color = cssColor;

  const window = helperSpanForColorPicking.ownerDocument.defaultView; // needed because our linting rules prohibit to use globals like `window`
  const colorInRgb = window.getComputedStyle(helperSpanForColorPicking).color; // returns format rgb(255, 255, 255) or rgba(255, 255, 255, 1)
  const colorParsed = colorInRgb.match(numericRegexp);

  helperSpanForColorPicking.ownerDocument.body.removeChild(helperSpanForColorPicking);
  if (colorParsed === null || colorParsed.length < 2) {
    return [0, 0, 0, 1]; // parsing went wrong, return black
  }

  const r = parseInt(colorParsed[0], 10);
  const g = parseInt(colorParsed[1], 10);
  const b = parseInt(colorParsed[2], 10);
  const a = colorParsed.length > 3 ? parseFloat(colorParsed[3]) : 1;

  return [r, g, b, a];
}

/**
 * Compares the luminance of two colors.
 *
 * @param {Array} rgba1 An array with items: [r, g, b, a]
 * @param {Array} rgba2 An array with items: [r, g, b, a]
 * @returns {Number} 1 if rgba1 has a higher luminance (is lighter) than rgba2, 0 if rgba1 has the same luminance as rgba2, -1 if rgba1 has a lower luminance (is darker) than rgba2
 */
export function compareLuminance(rgba1, rgba2) {
  const luminance1 = getLuminance(rgba1);
  const luminance2 = getLuminance(rgba2);

  if (luminance1 > luminance2) {
    return 1;
  } else if (luminance1 < luminance2) {
    return -1;
  }
  return 0;
}

/**
 * Calculates luminance of a color using ITU-R Recommendation BT.709 (aka Rec. 709, BT.709, and ITU709). The lower the luminance, the darker the color appears.
 *
 * @param {Array} rgba An array with items: [r, g, b, a]
 * @returns {Number} A number in range 0-255
 */
export function getLuminance(rgba) {
  const [r, g, b] = rgba;
  return (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
}
