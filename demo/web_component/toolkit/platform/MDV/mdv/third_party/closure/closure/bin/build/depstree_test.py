#!/usr/bin/env python
# Copyright 2009 The Closure Library Authors. All Rights Reserved.


"""Unit test for depstree."""




import unittest

import depstree


def _GetProvides(sources):
  """Get all namespaces provided by a collection of sources."""

  provides = set()
  for source in sources:
    provides.update(source.provides)
  return provides


class MockSource(object):
  """Mock Source file."""

  def __init__(self, provides, requires):
    self.provides = set(provides)
    self.requires = set(requires)

  def __repr__(self):
    return 'MockSource %s' % self.provides


class DepsTreeTestCase(unittest.TestCase):
  """Unit test for DepsTree.  Tests several common situations and errors."""

  def AssertValidDependencies(self, deps_list):
    """Validates a dependency list.

    Asserts that a dependency list is valid: For every source in the list,
    ensure that every require is provided by a source earlier in the list.

    Args:
      deps_list: A list of sources that should be in dependency order.
    """

    for i in range(len(deps_list)):
      source = deps_list[i]
      previous_provides = _GetProvides(deps_list[:i])
      for require in source.requires:
        self.assertTrue(
            require in previous_provides,
            'Namespace "%s" not provided before required by %s' % (
                require, source))

  def testSimpleDepsTree(self):
    a = MockSource(['A'], ['B', 'C'])
    b = MockSource(['B'], [])
    c = MockSource(['C'], ['D'])
    d = MockSource(['D'], ['E'])
    e = MockSource(['E'], [])

    tree = depstree.DepsTree([a, b, c, d, e])

    self.AssertValidDependencies(tree.GetDependencies('A'))
    self.AssertValidDependencies(tree.GetDependencies('B'))
    self.AssertValidDependencies(tree.GetDependencies('C'))
    self.AssertValidDependencies(tree.GetDependencies('D'))
    self.AssertValidDependencies(tree.GetDependencies('E'))

  def testCircularDependency(self):
    # Circular deps
    a = MockSource(['A'], ['B'])
    b = MockSource(['B'], ['C'])
    c = MockSource(['C'], ['A'])

    tree = depstree.DepsTree([a, b, c])

    self.assertRaises(depstree.CircularDependencyError,
                      tree.GetDependencies, 'A')

  def testRequiresUndefinedNamespace(self):
    a = MockSource(['A'], ['B'])
    b = MockSource(['B'], ['C'])
    c = MockSource(['C'], ['D'])  # But there is no D.

    def MakeDepsTree():
      return depstree.DepsTree([a, b, c])

    self.assertRaises(depstree.NamespaceNotFoundError, MakeDepsTree)

  def testDepsForMissingNamespace(self):
    a = MockSource(['A'], ['B'])
    b = MockSource(['B'], [])

    tree = depstree.DepsTree([a, b])

    # There is no C.
    self.assertRaises(depstree.NamespaceNotFoundError,
                      tree.GetDependencies, 'C')

  def testMultipleRequires(self):
    a = MockSource(['A'], ['B'])
    b = MockSource(['B'], ['C'])
    c = MockSource(['C'], [])
    d = MockSource(['D'], ['B'])

    tree = depstree.DepsTree([a, b, c, d])
    self.AssertValidDependencies(tree.GetDependencies(['D', 'A']))


if __name__ == '__main__':
  unittest.main()
