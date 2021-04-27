/* eslint-disable import/no-unresolved */
/// Usages: `version ${version}`

const semver = require('semver');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const {logger} = require('../utils');

const workingDir = path.resolve(__dirname, '../../../');

/// parse and validate argument
const version = process.argv[2];

if (!version) {
  throw new Error('<version> is required.');
} else if (version === '--help') {
  logger.info('Usages: `version <version>`, where version must be a valid semver.\n');
  process.exit(0);
} else if (!semver.valid(semver.coerce(version))) {
  throw new Error('<version> must be a valid semver.');
} else if (fs.existsSync(path.join(workingDir, version))) {
  throw new Error('<version> should be unique.');
}
const replaceInFiles = require('replace-in-files');

(async() => {
  /// * copy `/next/` to `/${version}/`
  fse.copySync(path.join(workingDir, 'next'), path.join(workingDir, version));

  /// * replace all `/next/` into `/${version}/` for the new version
  await replaceInFiles({
    files: path.join(workingDir, version, '**/*.md'),
    from: /permalink: \/next\//g,
    to: `permalink: /${version}/`,
  });
  logger.success(`Permalinks for current latest (${version}) updated.\n`);

  /// * print kind information, that version was been created.
  logger.success(`Version: ${version} successfully created.\n`);
})();
