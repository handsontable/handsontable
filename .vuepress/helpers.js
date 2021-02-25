const fs = require('fs');
const path = require('path');
const semver = require('semver');

// TODO: adjust to meet the monorepo structure requirements
const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const versions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))))

module.exports = {
  getVersions () {
    return ['next', ...versions];
  },

  getLatestVersion () {
    return versions[0];
  },

  getSidebars () {
    const sidebars = { };
    const versions = this.getVersions();

    versions.forEach(version => {
      const s = require(path.join(__dirname, `../${version}/sidebars.js`));

      sidebars[`/${version}/`] = s.guide;
      sidebars[`/${version}/api`] = s.api;
    });

    return sidebars;
  },
};
