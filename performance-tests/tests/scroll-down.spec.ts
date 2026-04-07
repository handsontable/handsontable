import { Page, test } from '@playwright/test'
import { resolve } from 'node:path'
import { writeFileSync, readFileSync } from 'node:fs'

const testVersion = async (version: 'current' | 'latest', iteration: number, page: Page) => {

  

  const url = resolve(  `fixtures/tests-${version}.html`);
  // Create a CDP session on the page's target
  const cdp = await page.context().newCDPSession(page);
  // Start tracing via CDP
  await cdp.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'v8.execute',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-v8.cpu_profiler',
    ].join(','),
    transferMode: 'ReturnAsStream', // <-- stream handle, NOT dataCollected events
  });

  await page.goto(`file:${url}`);

  const hrefElement = await page.$('#example1 .wtHolder'); // <-- this is the container of the table, breaking changes between versions
  //@ts-ignore
  await hrefElement.hover()
  const sample = 500

  for (let i = 0; i < sample; i++) {
    await page.mouse.wheel(0, 350);
  }

  // Stop + read the stream
  const traceJson = await new Promise<string>((resolve, reject) => {
    cdp.on('Tracing.tracingComplete', async ({ stream }) => {
      try {
        let result = '';
        // Read chunks from the IO stream until EOF
        while (true) {
          const { data, eof, base64Encoded } = await cdp.send('IO.read', {
            handle: stream ?? '',
            size: 65536, // 64KB chunks
          });

          result += base64Encoded
            ? Buffer.from(data, 'base64').toString('utf-8')
            : data;

          if (eof) break;
        }

        await cdp.send('IO.close', { handle: stream ?? '' });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    cdp.send('Tracing.end');
  });

  writeFileSync(`output/test-${version}-${iteration}.json`, traceJson);
  // console.log('trace.json saved ✓', traceJson.length, 'chars');

}

export const VERSIONS: ('current' | 'latest')[] = ['current', 'latest'];
export const ITERATIONS = Number(process.env.ITERATIONS) || 3;
test.describe('Scroll down performance tests', () => {
  VERSIONS.forEach(async (version: 'current' | 'latest') => {
    for (let i = 1; i <= ITERATIONS; i++) {
    test(`${version} iteration ${i}`, async ({ page }) => {
        await testVersion(version as 'current' | 'latest', i, page);
      })
    }
  })
})


