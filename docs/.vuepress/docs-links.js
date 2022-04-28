const { fs, path, parseFrontmatter } = require('@vuepress/shared-utils');
const helpers = require('./helpers');

module.exports = function(src) {
  const resourcePathNormalized = path.sep === '\\' ? this.resourcePath.replace(/\\/g, '/') : this.resourcePath;
  const realPath = fs.realpathSync(resourcePathNormalized);
  const version = realPath.split('/docs/').pop().split('/')[0];
  const latest = helpers.getLatestVersion();
  const basePath = this.rootContext;

  return src.replace(/\((@\/([^)]*\.md))(#[^)]*)?\)/g, (m, full, file, hash) => {
    let permalink = full;

    try {
      const fm = parseFrontmatter(fs.readFileSync(path.resolve(basePath, version, file)));

      if (fm.data.permalink) {
        permalink = fm.data.permalink;

        if (helpers.getEnvDocsVersion() || latest === version) {
          permalink = permalink.replace(new RegExp(`^/${version}/`), '/');
        }
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
