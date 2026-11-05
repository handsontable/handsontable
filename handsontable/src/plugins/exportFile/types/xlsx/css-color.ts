/**
 * The CSS named colors (CSS Color Module Level 4), as `RRGGBB`. A `Map`, so a name such as
 * `constructor` or `toString` finds nothing instead of an `Object.prototype` member.
 */
const NAMED_COLORS = new Map<string, string>([
  ['aliceblue', 'F0F8FF'], ['antiquewhite', 'FAEBD7'], ['aqua', '00FFFF'], ['aquamarine', '7FFFD4'],
  ['azure', 'F0FFFF'], ['beige', 'F5F5DC'], ['bisque', 'FFE4C4'], ['black', '000000'],
  ['blanchedalmond', 'FFEBCD'], ['blue', '0000FF'], ['blueviolet', '8A2BE2'], ['brown', 'A52A2A'],
  ['burlywood', 'DEB887'], ['cadetblue', '5F9EA0'], ['chartreuse', '7FFF00'], ['chocolate', 'D2691E'],
  ['coral', 'FF7F50'], ['cornflowerblue', '6495ED'], ['cornsilk', 'FFF8DC'], ['crimson', 'DC143C'],
  ['cyan', '00FFFF'], ['darkblue', '00008B'], ['darkcyan', '008B8B'], ['darkgoldenrod', 'B8860B'],
  ['darkgray', 'A9A9A9'], ['darkgreen', '006400'], ['darkgrey', 'A9A9A9'], ['darkkhaki', 'BDB76B'],
  ['darkmagenta', '8B008B'], ['darkolivegreen', '556B2F'], ['darkorange', 'FF8C00'], ['darkorchid', '9932CC'],
  ['darkred', '8B0000'], ['darksalmon', 'E9967A'], ['darkseagreen', '8FBC8F'], ['darkslateblue', '483D8B'],
  ['darkslategray', '2F4F4F'], ['darkslategrey', '2F4F4F'], ['darkturquoise', '00CED1'],
  ['darkviolet', '9400D3'], ['deeppink', 'FF1493'], ['deepskyblue', '00BFFF'], ['dimgray', '696969'],
  ['dimgrey', '696969'], ['dodgerblue', '1E90FF'], ['firebrick', 'B22222'], ['floralwhite', 'FFFAF0'],
  ['forestgreen', '228B22'], ['fuchsia', 'FF00FF'], ['gainsboro', 'DCDCDC'], ['ghostwhite', 'F8F8FF'],
  ['gold', 'FFD700'], ['goldenrod', 'DAA520'], ['gray', '808080'], ['green', '008000'],
  ['greenyellow', 'ADFF2F'], ['grey', '808080'], ['honeydew', 'F0FFF0'], ['hotpink', 'FF69B4'],
  ['indianred', 'CD5C5C'], ['indigo', '4B0082'], ['ivory', 'FFFFF0'], ['khaki', 'F0E68C'],
  ['lavender', 'E6E6FA'], ['lavenderblush', 'FFF0F5'], ['lawngreen', '7CFC00'], ['lemonchiffon', 'FFFACD'],
  ['lightblue', 'ADD8E6'], ['lightcoral', 'F08080'], ['lightcyan', 'E0FFFF'],
  ['lightgoldenrodyellow', 'FAFAD2'], ['lightgray', 'D3D3D3'], ['lightgreen', '90EE90'],
  ['lightgrey', 'D3D3D3'], ['lightpink', 'FFB6C1'], ['lightsalmon', 'FFA07A'], ['lightseagreen', '20B2AA'],
  ['lightskyblue', '87CEFA'], ['lightslategray', '778899'], ['lightslategrey', '778899'],
  ['lightsteelblue', 'B0C4DE'], ['lightyellow', 'FFFFE0'], ['lime', '00FF00'], ['limegreen', '32CD32'],
  ['linen', 'FAF0E6'], ['magenta', 'FF00FF'], ['maroon', '800000'], ['mediumaquamarine', '66CDAA'],
  ['mediumblue', '0000CD'], ['mediumorchid', 'BA55D3'], ['mediumpurple', '9370DB'],
  ['mediumseagreen', '3CB371'], ['mediumslateblue', '7B68EE'], ['mediumspringgreen', '00FA9A'],
  ['mediumturquoise', '48D1CC'], ['mediumvioletred', 'C71585'], ['midnightblue', '191970'],
  ['mintcream', 'F5FFFA'], ['mistyrose', 'FFE4E1'], ['moccasin', 'FFE4B5'], ['navajowhite', 'FFDEAD'],
  ['navy', '000080'], ['oldlace', 'FDF5E6'], ['olive', '808000'], ['olivedrab', '6B8E23'],
  ['orange', 'FFA500'], ['orangered', 'FF4500'], ['orchid', 'DA70D6'], ['palegoldenrod', 'EEE8AA'],
  ['palegreen', '98FB98'], ['paleturquoise', 'AFEEEE'], ['palevioletred', 'DB7093'], ['papayawhip', 'FFEFD5'],
  ['peachpuff', 'FFDAB9'], ['peru', 'CD853F'], ['pink', 'FFC0CB'], ['plum', 'DDA0DD'],
  ['powderblue', 'B0E0E6'], ['purple', '800080'], ['rebeccapurple', '663399'], ['red', 'FF0000'],
  ['rosybrown', 'BC8F8F'], ['royalblue', '4169E1'], ['saddlebrown', '8B4513'], ['salmon', 'FA8072'],
  ['sandybrown', 'F4A460'], ['seagreen', '2E8B57'], ['seashell', 'FFF5EE'], ['sienna', 'A0522D'],
  ['silver', 'C0C0C0'], ['skyblue', '87CEEB'], ['slateblue', '6A5ACD'], ['slategray', '708090'],
  ['slategrey', '708090'], ['snow', 'FFFAFA'], ['springgreen', '00FF7F'], ['steelblue', '4682B4'],
  ['tan', 'D2B48C'], ['teal', '008080'], ['thistle', 'D8BFD8'], ['tomato', 'FF6347'], ['turquoise', '40E0D0'],
  ['violet', 'EE82EE'], ['wheat', 'F5DEB3'], ['white', 'FFFFFF'], ['whitesmoke', 'F5F5F5'],
  ['yellow', 'FFFF00'], ['yellowgreen', '9ACD32'],
]);

// The two alternatives cannot match the same digits, so a long malformed string fails fast. A looser
// `\d+\.?\d*` splits a run of digits in many ways, and 300-digit arguments then took seconds.
const NUMBER = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[+-]?\\d+)?';
const ARG = `(${NUMBER})(%|deg|grad|rad|turn)?`;
const ALPHA = `(?:${NUMBER})%?`;
// `name(a, b, c[, alpha])` or `name(a b c[ / alpha])`, with each of the three arguments captured as a
// number plus an optional unit.
const COMMA_ARGS = `\\(\\s*${ARG}\\s*,\\s*${ARG}\\s*,\\s*${ARG}\\s*(?:,\\s*${ALPHA}\\s*)?\\)`;
const SPACE_ARGS = `\\(\\s*${ARG}\\s+${ARG}\\s+${ARG}\\s*(?:\\/\\s*${ALPHA}\\s*)?\\)`;
const FUNCTION_COLOR = new RegExp(`^(rgba?|hsla?)(?:${COMMA_ARGS}|${SPACE_ARGS})$`);
const HUE_UNIT_TO_DEGREES: Record<string, number> = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 };

/**
 * Clamps a value into a range.
 *
 * @param {number} value The value.
 * @param {number} min The lower bound.
 * @param {number} max The upper bound.
 * @returns {number}
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Formats three 0-255 channels as an `RRGGBB` string.
 *
 * @param {number[]} channels The red, green, and blue channels.
 * @returns {string}
 */
function channelsToHex(channels: number[]): string {
  return channels
    .map(channel => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Converts the arguments of an `rgb()` color to `RRGGBB`. Each channel is a number (0-255) or a
 * percentage. The comma syntax takes three numbers or three percentages, as browsers do, so
 * `rgb(255, 50%, 0)` gives `null`; the space syntax may mix them.
 *
 * @param {Array<[number, string|undefined]>} args The three arguments as value and unit pairs.
 * @param {boolean} isCommaSyntax `true` for the comma syntax.
 * @returns {string|null}
 */
function rgbToHex(args: Array<[number, string | undefined]>, isCommaSyntax: boolean): string | null {
  if (args.some(([, unit]) => unit !== undefined && unit !== '%')) {
    return null;
  }

  if (isCommaSyntax && args.some(([, unit]) => unit !== args[0][1])) {
    return null;
  }

  return channelsToHex(args.map(([value, unit]) => (unit === '%' ? (value * 255) / 100 : value)));
}

/**
 * Converts the arguments of an `hsl()` color to `RRGGBB`. The hue is a number of degrees or an
 * angle with a unit; saturation and lightness are percentages. As in browsers, the `%` may be left
 * out only in the space syntax, so `hsl(0, 100, 50)` gives `null`.
 *
 * @param {Array<[number, string|undefined]>} args The three arguments as value and unit pairs.
 * @param {boolean} isCommaSyntax `true` for the comma syntax.
 * @returns {string|null}
 */
function hslToHex(args: Array<[number, string | undefined]>, isCommaSyntax: boolean): string | null {
  const [[hueValue, hueUnit], [saturationValue, saturationUnit], [lightnessValue, lightnessUnit]] = args;

  const isPercentage = (unit: string | undefined) => unit === '%' || (unit === undefined && !isCommaSyntax);

  if (hueUnit === '%' || !isPercentage(saturationUnit) || !isPercentage(lightnessUnit)) {
    return null;
  }

  const degrees = hueValue * HUE_UNIT_TO_DEGREES[hueUnit ?? 'deg'];

  if (!Number.isFinite(degrees)) {
    return null;
  }

  // The CSS Color 4 reference conversion (`hslToRgb` in the specification's sample code).
  const hue = ((degrees % 360) + 360) % 360;
  const saturation = clamp(saturationValue, 0, 100) / 100;
  const lightness = clamp(lightnessValue, 0, 100) / 100;
  const chroma = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + (hue / 30)) % 12;

    return lightness - (chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };

  return channelsToHex([channel(0), channel(8), channel(4)].map(c => c * 255));
}

/**
 * Converts a CSS color written as `rgb()`, `rgba()`, `hsl()`, `hsla()`, or a named color to an
 * opaque `RRGGBB` string. The alpha component is dropped. Hex colors are read by the caller,
 * `cssColorToArgb()`.
 *
 * Returns `null` for anything else, including `var(...)`, `transparent`, and `currentcolor`: the
 * value is never resolved through the page, so a theme variable cannot leak a theme-specific color
 * into the file.
 *
 * @private
 * @param {string} color A trimmed, lowercased CSS color string.
 * @returns {string|null}
 */
export function namedOrFunctionalColorToRgb(color: string): string | null {
  const named = NAMED_COLORS.get(color);

  if (named !== undefined) {
    return named;
  }

  const match = FUNCTION_COLOR.exec(color);

  if (!match) {
    return null;
  }

  // The comma form fills groups 2-7 and the space form fills groups 8-13.
  const isCommaSyntax = match[2] !== undefined;
  const offset = isCommaSyntax ? 2 : 8;
  const args: Array<[number, string | undefined]> = [0, 1, 2].map(index => [
    Number(match[offset + (index * 2)]),
    match[offset + (index * 2) + 1],
  ]);

  return match[1].startsWith('rgb') ? rgbToHex(args, isCommaSyntax) : hslToHex(args, isCommaSyntax);
}
