import normalizeColor from 'normalize-css-color';

/**
 * Converts keyword, short hex, long hex, rgb, rgba colors to [r, g, b] array
 *
 * orange, oRaNgE, #FFA500, #ffa500, rgb(255,165,0) -> {"r": 255, "g": 165, "b": 0, "a": 1}
 * #FA0 -> {"r": 255, "g": 170, "b": 0, "a": 1}
 * rgba(255,165,0,.2) -> {"r": 255, "g": 165, "b": 0, "a": 0.2}
 * hsla(39,100%,50%,.2) -> { r: 255, g: 166, b: 0, a: 0.2 }
 *
 * @param {String} cssColor
 * @returns {Object} An object with properties: r, g, b, a
 */
export function convertCssColorToRGBA(cssColor) {
  const nullableColor = normalizeColor(cssColor.toLowerCase());
  const colorInt = nullableColor === null ? 0x00000000 : nullableColor;
  return normalizeColor.rgba(colorInt);
}

/**
 * Compares the luminance of two colors.
 *
 * @param {Object} rgba1 An object with properties: r, g, b, a
 * @param {Object} rgba2 An object with properties: r, g, b, a
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
 * @param {Object} rgba An object with properties: r, g, b, a
 * @returns {Number} A number in range 0-255
 */
export function getLuminance(rgba) {
  const { r, g, b } = rgba;
  return (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
}
