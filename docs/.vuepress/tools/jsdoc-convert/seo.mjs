export const buildHeaderWriter = ({ seo, urlPrefix, isPlugin }) => {

  const genSeoTitle = file => file
    .replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, '$2') // Get first filename segment (to the first dot) without full path
    .replace(/(^[a-z])/, m => m.toUpperCase()); // To upper first letter
  const seoTitle = file => seo[file] && seo[file].title || genSeoTitle(file);

  const genSeoMetaTitle = file =>
    `${seoTitle(file)} - ${isPlugin(file) ? 'Plugin' : 'API Reference'} - Handsontable Documentation`;
  const seoMetaTitle = file => seo[file] && seo[file].metaTitle || genSeoMetaTitle(file);

  const genSeoPermalink = file => file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, '$2') // Get filename without full path and extension
    .replace(/([a-z])([A-Z]+)/g, '$1-$2') // Separate words
    .toLowerCase();
  const seoPermalink = file => seo[file] && seo[file].permalink || urlPrefix + genSeoPermalink(file);

  const seoCanonicalUrl = file => seoPermalink(file).replace('/next', '');

  return (file) => {
    const title = seoTitle(file);

    return `---
title: ${title}
metaTitle: ${seoMetaTitle(file)}
permalink: ${seoPermalink(file)}
canonicalUrl: ${seoCanonicalUrl(file)}
editLink: false
---

# ${title}

[[toc]]
`;
  };

};
