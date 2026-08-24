/**
 * Interning of Expressive Code token styles.
 *
 * Expressive Code (which highlights every code block rendered through
 * `renderMarkdown()` in framework-loader.mjs) emits an inline
 * `style="--0:<dark>;--1:<light>"` attribute on every token `<span>`. With
 * ~1.1 million token spans across all framework variants of all pages, these
 * attributes alone add ~35 MB to `.astro/data-store.json`, which Astro's dev
 * server loads fully into memory (DEV-1991).
 *
 * The distinct style values are limited to the github-dark/github-light
 * theme palette below, so the loader replaces each known inline style with a
 * short class. The matching CSS custom-property declarations live in
 * `src/styles/ec-token-classes.css` (registered in Starlight's `customCss`),
 * which MUST stay in sync with this map — a unit test enforces that the file
 * equals `buildEcTokenClassesCss()`.
 *
 * To regenerate the CSS after editing the map:
 *   node -e "import('./src/plugins/ec-token-styles.mjs').then(m => process.stdout.write(m.buildEcTokenClassesCss()))" > src/styles/ec-token-classes.css
 *
 * Unknown style values (e.g. after an Expressive Code theme change) are left
 * inline — pages stay correct, only the size win degrades. The loader logs a
 * hint when that happens so the map can be extended.
 */

/**
 * Maps an exact inline style value to its class name. Multiple keys may share
 * a class when they only differ in hex-digit case (CSS colors are
 * case-insensitive). Class declarations are derived from the FIRST key that
 * names each class.
 */
export const EC_TOKEN_STYLE_CLASSES = new Map([
  ['--0:#E1E4E8;--1:#24292E', 'hot-tk-0'],
  ['--0:#e1e4e8;--1:#24292e', 'hot-tk-0'],
  ['--0:#9ECBFF;--1:#032F62', 'hot-tk-1'],
  ['--0:#F97583;--1:#BF3441', 'hot-tk-2'],
  ['--0:#79B8FF;--1:#005CC5', 'hot-tk-3'],
  ['--0:#B392F0;--1:#6F42C1', 'hot-tk-4'],
  ['--0:#99A0A6;--1:#616972', 'hot-tk-5'],
  ['--0:#FFAB70;--1:#AE4B07', 'hot-tk-6'],
  ['--0:#85E89D;--1:#1E7734', 'hot-tk-7'],
  ['--0:#9ECBFF', 'hot-tk-8'],
  ['--0:#DBEDFF', 'hot-tk-9'],
  ['--0:#DBEDFF;--1:#032F62', 'hot-tk-10'],
  ['--0:#FDAEB7;--0fs:italic;--1:#B31D28;--1fs:italic', 'hot-tk-11'],
  ['--0:#85E89D;--0fw:bold;--1:#1E7734;--1fw:bold', 'hot-tk-12'],
]);

/** Matches a token span carrying only a known-shape inline style. */
const TOKEN_SPAN_RE = /<span style="(--0[^"]*)">/g;

/**
 * Replaces known Expressive Code inline token styles with class references.
 * Only bare `<span style="--0...">` tags are rewritten; spans with other
 * attributes or unknown style values are left untouched.
 *
 * @param {string} html
 * @param {(styleValue: string) => void} [onUnknownStyle] – called once per
 *   unknown `--0...` style value, for logging.
 * @returns {string}
 */
export function internEcTokenStyles(html, onUnknownStyle) {
  const reported = new Set();

  return html.replace(TOKEN_SPAN_RE, (match, styleValue) => {
    const className = EC_TOKEN_STYLE_CLASSES.get(styleValue);

    if (!className) {
      if (onUnknownStyle && !reported.has(styleValue)) {
        reported.add(styleValue);
        onUnknownStyle(styleValue);
      }

      return match;
    }

    return `<span class="${className}">`;
  });
}

/**
 * Builds the stylesheet content matching {@link EC_TOKEN_STYLE_CLASSES}.
 * The first map key that names a class provides its declarations.
 *
 * Two kinds of rules are emitted:
 *
 * 1. Per-class definitions of the `--0`/`--1` (+`fs`/`fw`) custom properties
 *    that used to sit in each token's inline `style` attribute.
 * 2. Applying rules that mirror Expressive Code's own token rules. EC targets
 *    `span[style^='--']:not([class])`, which interned spans no longer match,
 *    so the same declarations are repeated here for `span[class^='hot-tk-']`
 *    with EC's exact selector structure and cascade order (dark base rule
 *    first, light-theme overrides after).
 *
 * @returns {string}
 */
export function buildEcTokenClassesCss() {
  const rules = new Map();

  for (const [styleValue, className] of EC_TOKEN_STYLE_CLASSES) {
    if (!rules.has(className)) {
      rules.set(className, styleValue);
    }
  }

  const token = "span[class^='hot-tk-']";
  const darkBody = [
    'color:var(--0, inherit)',
    'background-color:var(--0bg, transparent)',
    'font-style:var(--0fs, inherit)',
    'font-weight:var(--0fw, inherit)',
    'text-decoration:var(--0td, inherit)',
  ].join(';');
  const lightBody = darkBody.replace(/--0/g, '--1');

  const lines = [
    '/* Generated from src/plugins/ec-token-styles.mjs — do not edit by hand.',
    ' * Regenerate with the command documented in that file.',
    ' */',
    ...[...rules].map(([className, styleValue]) => `.${className} { ${styleValue}; }`),
    '',
    '/* Applying rules — mirror Expressive Code\'s token rules for interned spans. */',
    `.expressive-code .ec-line :where(${token}),`,
    `:root:not([data-theme='dark']) .expressive-code[data-theme='dark'] .ec-line :where(${token}) {`,
    `  ${darkBody};`,
    '}',
    `:root:not([data-theme='dark']) .expressive-code .ec-line :where(${token}) {`,
    `  ${lightBody};`,
    '}',
    `:root[data-theme='light'] .expressive-code:not([data-theme='dark']) .ec-line :where(${token}),`,
    `.expressive-code[data-theme='light'] .ec-line :where(${token}) {`,
    `  ${lightBody};`,
    '}',
  ];

  return `${lines.join('\n')}\n`;
}
