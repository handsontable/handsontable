const { fs, path, hash, parseFrontmatter, inferTitle, extractHeaders } = require('@vuepress/shared-utils')
const helpers = require('../helpers');

module.exports= function (src) {
  let version = this.resourcePath.split('/docs/').pop().split('/')[0];
  let latest =  helpers.getLatestVersion()
  const fm = parseFrontmatter(src);
  // 1 regex ()[@/}
  // 2 find file
  // 3 parse permalink
  // 4 replace
}

