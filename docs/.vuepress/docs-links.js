const { fs, path, parseFrontmatter } = require('@vuepress/shared-utils');
const helpers = require('./helpers');

module.exports = function(src) {
  const resourcePathNormalized = path.sep === '\\' ? this.resourcePath.replace(/\\/g, '/') : this.resourcePath;
  const pathForServingDocs = resourcePathNormalized.replace(/.*?docs\//, '/');
  const basePath = this.rootContext;

  return src.replace(/\((@\/([^)]*\.md))(#[^)]*)?\)/g, (m, full, file, hash) => {
    let permalink = full;

    try {
      const fm = parseFrontmatter(fs.readFileSync(path.resolve(basePath, 'content', file)));

      if (fm.data.permalink) {
        const framework = `${helpers.getEnvDocsFramework() ||
          helpers.parseFramework(pathForServingDocs)}${helpers.FRAMEWORK_SUFFIX}`;

        permalink = `/${framework}${fm.data.permalink}`;
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
