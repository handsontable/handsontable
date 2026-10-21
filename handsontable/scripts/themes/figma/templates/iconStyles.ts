/* eslint-disable max-len, quotes */

/*
 * This file is auto-generated. Do not edit directly.
 */

const kebab = (name: string): string => name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

// The fallback is a fully transparent mask, so a `.ht-icon-<name>` element whose variable is not
// declared paints nothing. The rule is unscoped (menus and the notification host mount outside
// the grid root), so on a page where one grid loads a theme with icons and another a
// `-no-icons` bundle, the second grid's icons match it too; `mask-image: none` would then let
// `background-color: currentColor` paint a solid square.
const glyphRule = (name: string): string => {
  const variable = `--ht-icon-${kebab(name)}`;

  return `.ht-icon-${kebab(name)} {
  -webkit-mask-image: var(${variable}, linear-gradient(transparent, transparent));
  mask-image: var(${variable}, linear-gradient(transparent, transparent));
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: currentColor;
}`;
};

/**
 * Generates the icon stylesheet for a theme: one `--ht-icon-<name>` custom property per icon,
 * declared under `scopeSelector`, followed by one unscoped `.ht-icon-<name>` rule per icon that
 * paints the `<i class="ht-icon ht-icon-<name>">` element from that variable.
 *
 * `scopeSelector` is written verbatim as the selector of the variables block, so pass a full
 * selector (`.ht-theme-main`, `:root, :host`), not a theme class name or prefix. The glyph rules
 * are left unscoped on purpose: menus and the notification host mount outside the grid root.
 *
 * @param {object} icons Glyph URLs (a `data:` URI, a URL, or a path) keyed by camelCase icon name.
 * @param {string} scopeSelector The selector the `--ht-icon-*` variables are declared under.
 * @returns {string} The generated CSS.
 */
export const iconStyles = (icons: Record<string, string>, scopeSelector: string): string => {
  const names = Object.keys(icons);
  const variables = names
    .map(name => `  --ht-icon-${kebab(name)}: url("${icons[name].replace(/\\/g, "%5C").replace(/"/g, "%22")}");`)
    .join("\n");

  return `${scopeSelector} {\n${variables}\n}\n\n${names.map(glyphRule).join("\n\n")}\n`;
};
