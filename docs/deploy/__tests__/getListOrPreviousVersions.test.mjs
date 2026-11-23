import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const script = resolve(dirname(fileURLToPath(import.meta.url)), '../getListOrPreviousVersions.mjs');

/**
 * Runs the real script in a child process whose `fetch` answers from `pages`.
 *
 * @param {object} fetchStub What the stub answers.
 * @param {Array<{ tags: string[], next?: string }>} [fetchStub.pages] GraphQL pages, newest first.
 * @param {number} [fetchStub.status] An HTTP status that overrides the pages.
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>} The exit code and both streams.
 */
async function runScript({ pages = [], status = 200 }) {
  const stub = `
    const pages = ${JSON.stringify(pages)};
    globalThis.fetch = async (url, options) => {
      const after = JSON.parse(options.body).variables.after;
      const index = after === null ? 0 : Number(after);
      const page = pages[index] ?? { tags: [] };

      return {
        ok: ${status} < 400,
        status: ${status},
        json: async () => ({
          data: { repository: { releases: {
            nodes: page.tags.map((tagName) => ({ tagName })),
            pageInfo: { hasNextPage: Boolean(page.next), endCursor: page.next ?? null },
          } } },
        }),
      };
    };
  `;

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ['--import', `data:text/javascript,${encodeURIComponent(stub)}`, script],
      { env: { ...process.env, GITHUB_TOKEN: 'test-token' } },
    );

    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('prints the latest and the previous versions down to 9.0', async() => {
  const { code, stdout } = await runScript({
    pages: [{ tags: ['19.0.0-rc5', '18.1.3', '18.0.0', '17.1.0', '10.0.0', '9.0.1', '9.0.0', '8.4.0'] }],
  });

  assert.equal(code, 0);
  assert.equal(stdout, 'PREVIOUS_VERSIONS="18.0 17.1 10.0 9.0"\nLATEST_VERSION="18.1"\n');
});

test('reads the next page when 9.0 is not on the first one', async() => {
  const { code, stdout } = await runScript({
    pages: [
      { tags: ['18.1.3', '18.0.0', '17.1.0', '10.0.0'], next: '1' },
      { tags: ['9.0.0', '8.4.0'] },
    ],
  });

  assert.equal(code, 0);
  assert.equal(stdout, 'PREVIOUS_VERSIONS="18.0 17.1 10.0 9.0"\nLATEST_VERSION="18.1"\n');
});

test('exits non-zero and prints nothing on stdout when the list never reaches 9.0', async() => {
  const { code, stdout, stderr } = await runScript({
    pages: [{ tags: ['18.1.3', '18.0.0', '17.1.0'] }],
  });

  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.match(stderr, /Failed to read the Docs versions list from GitHub: .*never reaches 9\.0/);
});

test('exits non-zero when GitHub rejects the token', async() => {
  const { code, stdout, stderr } = await runScript({ status: 401 });

  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.match(stderr, /rejected GITHUB_TOKEN \(401\)/);
});
