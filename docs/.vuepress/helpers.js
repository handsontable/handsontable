const fs = require('fs');
const path = require('path');
const semver = require('semver');

const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const availableVersions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))));

module.exports = {
  getVersions(buildMode) {
    const next = buildMode !== 'production' ? ['next'] : [];

    return [...next, ...availableVersions];
  },

  getLatestVersion() {
    return availableVersions[0];
  },

  getSidebars(buildMode) {
    const sidebars = { };
    const versions = this.getVersions(buildMode);

    versions.forEach((version) => {
      // eslint-disable-next-line
      const s = require(path.join(__dirname, `../${version}/sidebars.js`));

      sidebars[`/${version}/examples/`] = s.examples;
      sidebars[`/${version}/api/`] = s.api;
      sidebars[`/${version}/`] = s.guides;
    });

    return sidebars;
  },

  parseVersion(url) {
    return url.split('/')[1] || this.getLatestVersion();
  }
};
