// setup Jasmine
const Jasmine = require('jasmine');
const jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: 'spec',
    spec_files: ['**/*[sS]pec.js'],
    helpers: ['helpers/**/*.js'],
    random: true,
    stopSpecOnExpectationFailure: false
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
    beep: true
});

// initialize and execute
jasmine.env.clearReporters();
jasmine.addReporter(reporter);
jasmine.execute(); 