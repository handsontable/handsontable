#!/usr/bin/env python
#
# Copyright 2010 The Closure Library Authors. All Rights Reserved.


"""Unit test for source."""




import unittest

import source


class SourceTestCase(unittest.TestCase):
  """Unit test for source.  Tests the parser on a known source input."""

  def testSourceScan(self):
    test_source = source.Source(_TEST_SOURCE)

    self.assertEqual(set(['foo', 'foo.test']),
                     test_source.provides)
    self.assertEqual(test_source.requires,
                     set(['goog.dom', 'goog.events.EventType']))


_TEST_SOURCE = """// Fake copyright notice

/** Very important comment. */

goog.provide('foo');
goog.provide('foo.test');

goog.require('goog.dom');
goog.require('goog.events.EventType');

function foo() {
  // Set bar to seventeen to increase performance.
  this.bar = 17;
}
"""

if __name__ == '__main__':
  unittest.main()
