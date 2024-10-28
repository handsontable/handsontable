const { fs, path, parseFrontmatter } = require('@vuepress/shared-utils');
const {
  MULTI_FRAMEWORKED_CONTENT_DIR,
  FRAMEWORK_SUFFIX,
  parseFramework,
  getFrameworks,
} = require('./helpers');

const frameworkFromLink = new RegExp(`^(${getFrameworks().join('|')})/`);

module.exports = function(src) {
  const resourcePathNormalized = path.sep === '\\' ? this.resourcePath.replace(/\\/g, '/') : this.resourcePath;
  const pathForServingDocs = resourcePathNormalized.replace(/.*?docs\//, '/');
  const defaultFrameworkForThisFile = parseFramework(pathForServingDocs);
  const basePath = this.rootContext;

  return src.replace(/\((@\/([^)]*\.md))(#[^)]*)?\)/g, (m, full, file, hash) => {
    let frameworkPrefix = defaultFrameworkForThisFile;

    // If the link contains the framework e.g `@/react/foo/bar.md` than create the permalink for
    // that framework
    if (frameworkFromLink.test(file)) {
      frameworkPrefix = file.match(frameworkFromLink)[1];
      file = file.replace(frameworkFromLink, `$1${FRAMEWORK_SUFFIX}/`);

    } else { // otherwise, use default framework for this MD file
      file = `${defaultFrameworkForThisFile}${FRAMEWORK_SUFFIX}/${file}`;
    }

    const filePathWithBase = path.resolve(basePath, MULTI_FRAMEWORKED_CONTENT_DIR, file);
    let permalink = full;

    try {
      const fm = parseFrontmatter(fs.readFileSync(filePathWithBase));

      if (fm.data.permalink) {
        permalink = `/${frameworkPrefix}${FRAMEWORK_SUFFIX}${fm.data.permalink}`;
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
