/* eslint-disable max-len */
import moment from 'moment';
import { spawnProcess } from './utils/processes.mjs';

const currentDate = moment().format('hhmmss');

process.chdir('./visual-test');
await spawnProcess('npx @argos-ci/cli upload tests/screenshots');
await spawnProcess(`npx viswiz build --image-dir ./tests/screenshots --message last-commit-message --revision ${currentDate}`);
