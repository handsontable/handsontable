"""Step generator script for the annotated Toolkit builders.

For more information, see scripts/slave/annotated_run.py in
https://chromium.googlesource.com/chromium/tools/build/"""

def GetSteps(api, _factory_properties, build_properties):
  steps = api.Steps(build_properties)
  return [
    steps.step('update-install',
               ['npm', 'install'],
               cwd=api.checkout_path()),
    steps.step('test',
               ['xvfb-run', 'grunt', 'test'],
               cwd=api.checkout_path()),
  ]
