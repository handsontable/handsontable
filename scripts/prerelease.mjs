import { displayErrorMessage } from './utils/console.mjs';
import { setVersion } from './utils/pre-release.mjs';

import { spawnProcess } from './utils/processes.mjs';
import moment from 'moment';

const hash = await spawnProcess('git rev-parse HEAD', { silent: true });
const date = moment().format('YYYYMMDD');
const newVersionNumber = `0.0.0-next-dev.${hash.stdout
  .toString()
  .trim()
  .slice(0, 7)}-${date}`;

setVersion(newVersionNumber);

try {
  await spawnProcess('npm run publish-all', { silent: true });
} catch (error) {
  displayErrorMessage(`error during publishing`);
  throw new Error(error);
}
