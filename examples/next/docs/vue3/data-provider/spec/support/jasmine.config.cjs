// setup Jasmine
const path = require('path');
const { spawn } = require('child_process');
const { createServer } = require('http-server');
const Jasmine = require('jasmine');

const jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'spec',
  spec_files: ['**/*[sS]pec.cjs'],
  helpers: ['helpers/**/*.js'],
  random: true,
  stopSpecOnExpectationFailure: false,
});
jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

// setup terminal reporter
const JasmineReporter = require('jasmine-console-reporter');
const reporter = new JasmineReporter({
  colors: 1,
  cleanStack: 1,
  verbosity: 4,
  listStyle: 'indent',
  timeUnit: 'ms',
  timeThreshold: { ok: 500, warn: 1000, ouch: 3000 },
  activity: false,
  emoji: true,
  beep: true,
});

// initialize and execute
jasmine.env.clearReporters();
jasmine.addReporter(reporter);
jasmine.execute();

const EXAMPLE_ROOT = path.resolve(__dirname, '../..');
const node = process.execPath;
let server;
let restServer;
let graphqlServer;

beforeAll((done) => {
  restServer = spawn(node, [path.join(EXAMPLE_ROOT, 'server-rest.mjs')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.REST_PORT || '4010' },
  });
  graphqlServer = spawn(node, [path.join(EXAMPLE_ROOT, 'server-graphql.mjs')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.GRAPHQL_PORT || '4011' },
  });

  if (!process.env.TEST_URL) {
    server = createServer({
      root: path.resolve(EXAMPLE_ROOT, 'dist'),
      showDir: true,
      autoIndex: true,
    });

    server.listen('8080');
  }

  // Give the backend servers a moment to start accepting connections.
  setTimeout(done, 2000);
});

afterAll(() => {
  restServer?.kill('SIGTERM');
  graphqlServer?.kill('SIGTERM');
  server?.close();
});
