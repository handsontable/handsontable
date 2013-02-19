#!/usr/bin/env python
#
# Copyright 2010 The Closure Library Authors. All Rights Reserved.

"""Shared utility functions for scanning directory trees."""

import os
import re





# Matches a .js file path.
_JS_FILE_REGEX = re.compile(r'^.+\.js$')


def ScanTreeForJsFiles(root):
  """Scans a directory tree for JavaScript files.

  Args:
    root: str, Path to a root directory.

  Returns:
    An iterable of paths to JS files, relative to cwd.
  """
  return ScanTree(root, path_filter=_JS_FILE_REGEX)


def ScanTree(root, path_filter=None, ignore_hidden=True):
  """Scans a directory tree for files.

  Args:
    root: str, Path to a root directory.
    path_filter: A regular expression fileter.  If set, only paths matching
      the path_filter are returned.
    ignore_hidden: If True, do not follow or return hidden directories or files
      (those starting with a '.' character).

  Yields:
    A string path to files, relative to cwd.
  """

  def OnError(os_error):
    raise os_error

  for dirpath, dirnames, filenames in os.walk(root, onerror=OnError):
    # os.walk allows us to modify dirnames to prevent decent into particular
    # directories.  Avoid hidden directories.
    for dirname in dirnames:
      if ignore_hidden and dirname.startswith('.'):
        dirnames.remove(dirname)

    for filename in filenames:

      # nothing that starts with '.'
      if ignore_hidden and filename.startswith('.'):
        continue

      fullpath = os.path.join(dirpath, filename)

      if path_filter and not path_filter.match(fullpath):
        continue

      yield os.path.normpath(fullpath)
