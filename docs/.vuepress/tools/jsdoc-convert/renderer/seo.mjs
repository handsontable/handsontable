const escape = text => text.replace(/[{}<>]/g, '').replace(/~/g, '-');

export const buildHeaderWriter = ({ seo, urlPrefix }) => {
  const genSeoTitle = file => escape(
    file.replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, '$2') // Get first filename segment (to the first dot) without full path
  ).replace(/(^[a-z])/, m => m.toUpperCase()); // To upper first letter

  const genSeoMetaTitle = (file, isPlugin) => {
    return `${genSeoTitle(file)} - ${isPlugin ? 'Plugin' : 'API Reference'} - Handsontable Documentation`;
  };

  const genSeoPermalink = file => urlPrefix + escape(file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, '$2') // Get filename without full path and extension
  )
    .replace(/([a-z])([A-Z]+)/g, '$1-$2') // Separate words
    .toLowerCase();

  // Simple converter from JS object to YAML
  const toYaml = (meta, indent = 0) => {
    return Object.keys(meta).map((key) => {
      if (typeof meta[key] === 'object') {
        return `${key}:\n${toYaml(meta[key], indent + 2)}`;
      }

      return `${' '.repeat(indent)}${key}: ${meta[key]}`;
    }).join('\n');
  };

  return (file, isPlugin) => {
    const pageMeta = {
      title: genSeoTitle(file),
      metaTitle: genSeoMetaTitle(file, isPlugin),
      permalink: genSeoPermalink(file),
      canonicalUrl: genSeoPermalink(file),
      hotPlugin: isPlugin,
      editLink: false,
      ...seo[file],
    };

    return `---
${toYaml(pageMeta)}
---

# ${pageMeta.title}

[[toc]]
`;
  };

};
