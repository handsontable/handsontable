const kebab = name => name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

const glyphRule = (name) => {
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

export const iconStyles = (icons, scopeSelector) => {
  const names = Object.keys(icons);
  const variables = names
    .map(name => `  --ht-icon-${kebab(name)}: url("${icons[name].replace(/"/g, '%22')}");`)
    .join('\n');

  return `${scopeSelector} {\n${variables}\n}\n\n${names.map(glyphRule).join('\n\n')}\n`;
};
