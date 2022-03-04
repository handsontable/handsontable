const fs = require('fs');
const path = require('path');
const semver = require('semver');

const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const availableVersions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))));

function getVersions(buildMode) {
  const next = buildMode !== 'production' ? ['next'] : [];

  return [...next, ...availableVersions];
}

function getLatestVersion() {
  return availableVersions[0];
}

function getSidebars(buildMode) {
  const sidebars = { };
  const versions = getVersions(buildMode);

  versions.forEach((version) => {
    // eslint-disable-next-line
    const s = require(path.join(__dirname, `../${version}/sidebars.js`));

    sidebars[`/${version}/examples/`] = s.examples;
    sidebars[`/${version}/api/`] = s.api;
    sidebars[`/${version}/`] = s.guides;
  });

  return sidebars;
}

function parseVersion(url) {
  return url.split('/')[1] || this.getLatestVersion();
}

function getBuildDocsVersion() {
  return process.env.DOCS_VERSION;
}

module.exports = {
  getVersions,
  getLatestVersion,
  getSidebars,
  parseVersion,
  getBuildDocsVersion,
};
