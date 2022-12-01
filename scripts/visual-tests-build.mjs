import { spawnProcess } from './utils/processes.mjs';

const wrappers = ['js', 'angular', 'react', 'vue'];
const version = '12.2.0';

await spawnProcess('npx playwright install --with-deps');

for (const wrapper of wrappers) {
  await spawnProcess('npx playwright test', { env: { WRAPPER: wrapper, VERSION: version } });
}
