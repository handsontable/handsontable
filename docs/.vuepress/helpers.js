const fs = require('fs');
const path = require('path');
const semver = require('semver');
const execa = require('execa');

const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const availableVersions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))));

module.exports = {
  getVersions() {
    return ['next', ...availableVersions];
  },

  getLatestVersion() {
    return availableVersions[0];
  },

  getSidebars() {
    const sidebars = { };
    const versions = this.getVersions();

    versions.forEach((version) => {
      // eslint-disable-next-line
      const s = require(path.join(__dirname, `../${version}/sidebars.js`));

      sidebars[`/${version}/api/`] = s.api;
      sidebars[`/${version}/`] = s.guide;
    });

    return sidebars;
  },

  parseVersion(url) {
    return url.split('/')[1] || this.getLatestVersion();
  },

  spawnProcess(command, options = {}) {
    const cmdSplit = command.split(' ');
    const mainCmd = cmdSplit[0];

    cmdSplit.shift();

    if (!options.silent) {
      options.stdin = options.stdin ?? 'inherit';
      options.stdout = options.stdout ?? 'inherit';
      options.stderr = options.stderr ?? 'inherit';
    }

    return execa(mainCmd, cmdSplit, options);
  }
};
