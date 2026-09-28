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

export const iconStyles = (icons: Record<string, string>, scopeSelector: string): string => {
  const names = Object.keys(icons);
  const variables = names
    .map(name => `  --ht-icon-${kebab(name)}: url("${icons[name].replace(/"/g, "%22")}");`)
    .join("\n");

  return `${scopeSelector} {\n${variables}\n}\n\n${names.map(glyphRule).join("\n\n")}\n`;
};
