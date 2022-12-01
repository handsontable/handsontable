import { spawnProcess } from './utils/processes.mjs';

const wrappers = ['js', 'angular', 'react', 'vue'];
const version = '12.2.0';
const testsFolder = 'visual-test';

if (!process.cwd().endsWith(testsFolder)) {
  process.chdir(testsFolder);
}

await spawnProcess('npx playwright install --with-deps');

for (const wrapper of wrappers) {
  await spawnProcess('npx playwright test', { env: { WRAPPER: wrapper, VERSION: version } });
}
