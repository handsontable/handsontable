var treeKill = require('tree-kill');
var spawnCommand = require('spawn-command');
var supportsColor = require('supports-color');

var CMD = process.argv[2];
var CMD_TO_TRIGGER = process.argv[3];

var IS_WINDOWS = /^win/.test(process.platform);
var waitForFirstBuild = true;
var triggeredChild;
var delayedTrigger;

setTimeout(function() {
  waitForFirstBuild = false;
}, 5000);

run(CMD, CMD_TO_TRIGGER);

function run(commands, commandToTrigger, spawnOpts) {
  spawnOpts = spawnOpts || {};

  if (IS_WINDOWS) {
    spawnOpts.detached = false;
  }
  spawnOpts.env = Object.assign({FORCE_COLOR: supportsColor.level}, process.env);

  var child;
  try {
    child = spawnCommand(commands, spawnOpts);
  } catch(ex) {
    console.log('Error occured when executing command: ' + commands);
    console.log(ex.stack);
    process.exit(1);
  }

  if (commandToTrigger) {
    child.stdout.on('data', function(data) {
      if (waitForFirstBuild) {
        return;
      }
      if (triggeredChild) {
        treeKill(triggeredChild.pid);
      }
      if (!delayedTrigger) {
        delayedTrigger = debounce(function() {
          triggeredChild = run(commandToTrigger);
        }, 1000);
      }
      delayedTrigger();
    });
  }

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  if (commandToTrigger) {
    ['SIGINT', 'SIGTERM'].forEach(function(signal) {
      process.on(signal, function() {
        treeKill(child.pid, signal);
      });
    });
  }

  return child;
}

function debounce(func, wait) {
  var lastTimer = null;
  var result;

  function _debounce() {
    var args = arguments;

    if (lastTimer) {
      clearTimeout(lastTimer);
    }
    lastTimer = setTimeout(function() {
      result = func.apply(this, args);
    }, wait);

    return result;
  }

  return _debounce;
}
