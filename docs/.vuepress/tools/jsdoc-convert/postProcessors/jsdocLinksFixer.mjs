export const buildJsdocLinksFixer = ({ linkAliases }) => {
  return text => text
    .replace(/\[([^\]]*?)\]\(([^#)]*?)((#)([^)]*?))?\)/g,
      (all, label, target, _, hash = '', anchor = '') => { // @see https://regexr.com/611b8
        if (target.includes('://')) { // e.g https://handsontable.com/blog
          return all;
        }
        let fixedAnchor = anchor.toLowerCase();

        // e.g. #Options+autoColumnSize or #getData
        if (!target) {
          if (!fixedAnchor.includes('+')) {
            return `[${label}](${hash}${fixedAnchor})`;
          } else {
            const [newTarget, newAnchor] = anchor.split('+');

            target = newTarget;
            fixedAnchor = newAnchor.toLowerCase();
            label = `${newTarget}#${label}`;
          }
        }

        // e.g. @/api/plugins.md
        if (target.startsWith('@')) {
          return `[${label}](${target}${hash}${fixedAnchor})`;
        }

        let targetCamelCase = !target.length ? '' : `${target[0].toLowerCase()}${target.substring(1)}`
          .replace(/-([a-z])/g, (__, char) => char.toUpperCase());

        targetCamelCase = linkAliases[targetCamelCase] || targetCamelCase;

        return `[${label}](@/api/${targetCamelCase}.md${hash}${fixedAnchor})`;
      }
    );
};
