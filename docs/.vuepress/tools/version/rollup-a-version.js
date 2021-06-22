const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const replaceInFiles = require('replace-in-files');

const { logger } = require('../utils');

const workingDir = path.resolve(__dirname, '../../../');
const isTTY = process.stdout.isTTY;

logger.log('\n-----------------------------------------------------\n');

(async() => {
  let version = process.argv[2];

  if (isTTY) {
    {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueApiGen',
          message: 'This script will generate a new API and Guides. \nContinue?',
          default: true,
        }
      ]);

      if (!answers.continueApiGen) {
        process.exit(0);
      }
    }
    {
      const answers = await inquirer.prompt([
        {
          name: 'version',
          type: 'input',
          message: 'What version do you want to generate (required format "Major.Minor" e.g. 9.1)',
          validate: s => (/^\d+.\d+$/.test(s) ? true : 'The provided version is not correct'),
        },
      ]);

      version = answers.version;
    }
  }

  if (version === '--help') {
    logger.info('Usages: `version <version>`, where version must be in format "Major.Minor".\n');
    process.exit(0);

  } else if (!/^\d+.\d+$/.test(version)) {
    logger.error(`The provided version is not correct.`);
    process.exit(1);

  } else if (fs.existsSync(path.join(workingDir, version))) {
    logger.error(`This version of the documentation (${version}) is already generated.`);
    process.exit(1);
  }

  // * copy `/next/` to `/${version}/`
  fse.copySync(path.join(workingDir, 'next'), path.join(workingDir, version));

  // * replace all `/next/` into `/${version}/` for the new version
  await replaceInFiles({
    files: path.join(workingDir, version, '**/*.md'),
    from: /permalink: \/next\//g,
    to: `permalink: /${version}/`,
  });
  logger.success(`Permalinks for current latest (${version}) updated.\n`);

  // * print kind information, that version was been created.
  logger.success(`Version: ${version} successfully created.\n`);
})();
