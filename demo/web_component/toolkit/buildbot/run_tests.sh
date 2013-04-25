#!/bin/bash
xvfb-run grunt test-buildbot
rc=$?
echo "@@@STEP_CURSOR test@@@"
if [ "x$rc" != "x0" ]; then
  echo "@@@STEP_FAILURE@@@"
fi
