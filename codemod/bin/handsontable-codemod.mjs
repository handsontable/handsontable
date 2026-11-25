#!/usr/bin/env node
import { main } from '../src/cli.mjs';

// A reader that closes early (`migrate --dry-run | head -1`) makes the next write fail with EPIPE. That is the reader's
// choice and no error of the tool, so it is not reported. Any other failure of a stream is still thrown.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      throw error;
    }
  });
}

// The first Ctrl-C asks the run to stop after the file it is on, so no file is left half written and the tool can say
// what it did. The listener is removed by `once`, so a second Ctrl-C ends the process at once.
const interrupt = new AbortController();

process.once('SIGINT', () => interrupt.abort());

process.exitCode = await main(process.argv.slice(2), { signal: interrupt.signal });
