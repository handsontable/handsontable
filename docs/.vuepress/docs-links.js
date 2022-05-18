const { fs, path, parseFrontmatter } = require('@vuepress/shared-utils');
const helpers = require('./helpers');

module.exports = function(src) {
  const resourcePathNormalized = path.sep === '\\' ? this.resourcePath.replace(/\\/g, '/') : this.resourcePath;
  const pathForServingDocs = resourcePathNormalized.replace(/.*?docs\//, '/');
  const version = helpers.parseVersion(pathForServingDocs);
  const framework = helpers.parseFramework(pathForServingDocs);
  const latest = helpers.getLatestVersion();
  const basePath = this.rootContext;

  return src.replace(/\((@\/([^)]*\.md))(#[^)]*)?\)/g, (m, full, file, hash) => {
    let permalink = full;

    try {
      const fm = parseFrontmatter(fs.readFileSync(path.resolve(basePath, version, file)));
      const frameworkPathPart = framework ? `${framework}${helpers.FRAMEWORK_SUFFIX}/` : '';

      if (fm.data.permalink) {
        permalink = fm.data.permalink;
        permalink = permalink.replace(new RegExp(`^(/${version}/)`), `$1${frameworkPathPart}`);

        if ((helpers.getEnvDocsVersion() && helpers.getEnvDocsFramework()) || latest === version) {
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
