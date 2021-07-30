const escape = text => text.replace(/[{}<>]/g, '').replace(/~/g, '-');

export const buildHeaderWriter = ({ seo, urlPrefix }) => {
  const genSeoTitle = file => escape(
    file.replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, '$2') // Get first filename segment (to the first dot) without full path
  ).replace(/(^[a-z])/, m => m.toUpperCase()); // To upper first letter
  const seoTitle = file => seo[file] && seo[file].title || genSeoTitle(file);

  const genSeoMetaTitle = (file, isPlugin) => {
    return `${seoTitle(file)} - ${isPlugin ? 'Plugin' : 'API Reference'} - Handsontable Documentation`;
  };
  const seoMetaTitle = (file, isPlugin) => seo[file] && seo[file].metaTitle || genSeoMetaTitle(file, isPlugin);

  const genSeoPermalink = file => escape(file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, '$2') // Get filename without full path and extension
  )
    .replace(/([a-z])([A-Z]+)/g, '$1-$2') // Separate words
    .toLowerCase();
  const seoPermalink = file => seo[file] && seo[file].permalink || urlPrefix + genSeoPermalink(file);

  const seoCanonicalUrl = file => seoPermalink(file).replace('/next', '');

  return (file, isPlugin) => {
    const title = seoTitle(file, isPlugin);

    return `---
title: ${title}
metaTitle: ${seoMetaTitle(file, isPlugin)}
permalink: ${seoPermalink(file)}
canonicalUrl: ${seoCanonicalUrl(file)}
hotPlugin: ${isPlugin ? 'true' : 'false'}
editLink: false
---

# ${title}

[[toc]]
`;
  };

};
