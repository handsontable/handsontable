const { fs, path, parseFrontmatter } = require('@vuepress/shared-utils');

module.exports = function(src) {
  const basePath = this.rootContext;

  return src.replace(/\((@\/([^)]*\.md))(#[^)]*)?\)/g, (m, full, file, hash) => {
    let permalink = full;

    try {
      const fm = parseFrontmatter(fs.readFileSync(path.resolve(basePath, 'content', file)));

      if (fm.data.permalink) {
        permalink = fm.data.permalink;
        permalink = permalink.endsWith('/') ? permalink : `${permalink}/`;
        permalink = hash ? permalink + hash : permalink;
      }
    } catch (e) {
      // eslint-disable-next-line
      console.warn(`Can't find the "${full}" permalink. Does this file exist?`);
    }

    return `(${permalink})`;
  });
};
