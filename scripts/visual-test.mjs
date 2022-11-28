import { spawnProcess } from './utils/processes.mjs';

process.chdir('./visual-test');
await spawnProcess('npm install');
await spawnProcess('npx playwright install --with-deps');
await spawnProcess('npx playwright test');
await spawnProcess('npx @argos-ci/cli upload tests/screenshots');
await spawnProcess('npx viswiz build --image-dir ./tests/screenshots --message last-commit-message -revision revision');
