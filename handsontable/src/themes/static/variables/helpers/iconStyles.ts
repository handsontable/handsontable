/* eslint-disable max-len, quotes */

/*
 * This file is auto-generated. Do not edit directly.
 */

const kebab = (name: string): string => name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

const glyphRule = (name: string): string => {
  const variable = `--ht-icon-${kebab(name)}`;

  return `.ht-icon-${kebab(name)} {
  -webkit-mask-image: var(${variable});
  mask-image: var(${variable});
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
