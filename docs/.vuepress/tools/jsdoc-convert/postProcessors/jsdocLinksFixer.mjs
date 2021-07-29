export const jsdocLinksFixer = text => text
  .replace(/\[([^\]]*?)\]\(([^#)]*?)((#)([^)]*?))?\)/g,
    (all, label, target, _, hash = '', anchor = '') => { // @see https://regexr.com/611b8
      if (target.includes('://')) { // e.g https://handsontable.com/blog
        return all;
      }
      let fixedAnchor = anchor
        .toLowerCase();

      // e.g. #Options+autoColumnSize or #getData
      if (!target) {
        if (!fixedAnchor.includes('+')) {
          return `[${label}](${hash}${fixedAnchor})`;
        } else {
          const splitted = fixedAnchor.split('+');

          target = splitted[0];
          fixedAnchor = splitted[1];
          label = `${anchor.split('+')[0]}#${label}`;
        }
      }

      // e.g. @/api/plugins.md
      if (target.startsWith('@')) {
        return `[${label}](${target}${hash}${fixedAnchor})`;
      }

      const targetCamelCase = !target.length ? '' : `${target[0].toLowerCase()}${target.substring(1)}`
        .replace(/-([a-z])/g, (__, char) => char.toUpperCase());

      return `[${label}](@/api/${targetCamelCase}.md${hash}${fixedAnchor})`;
    }
  );
