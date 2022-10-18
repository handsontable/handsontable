import { displayErrorMessage } from './utils/console.mjs';
import { setVersion } from './utils/pre-release.mjs';

import execa from 'execa';
import moment from 'moment';

const { stdout: hash } = await execa.command('git rev-parse HEAD');
const date = moment().format('YYYYMMDD');
const newVersionNumber = `0.0.0-next-dev.${hash
  .toString()
  .trim()
  .slice(0, 7)}-${date}`;

setVersion(newVersionNumber);

try {
  await execa.command('npm run publish-all');
} catch (error) {
  displayErrorMessage(`error during publishing`);
  process.exit(error);
}
