---
title: Versioning policy
metaTitle: Versioning policy - Guide - Handsontable Documentation
permalink: /10.0/versioning-policy
canonicalUrl: /versioning-policy
---

# Versioning policy

[[toc]]

Handsontable follows the principles of SemVer  [Semantic Versioning](https://semver.org/). We use the version format of X.Y.Z (Major.Minor.Patch), incrementing them when a certain type of change occurs to the code. The following table outlines which number would change when a Major, Minor, or Patch release occurs: 

| Type| Version Number | Description |
|--|--|--|
| Major | X (X.y.z) | Any backward-incompatible changes are introduced to the public API.| 
| Minor | Y (x.Y.z) | New backward-compatible functionality is introduced to the public API, or if any public API functionality is marked as deprecated.|
| Patch | Z (x.y.Z)  | Backward-compatible bug fixes are introduced. We define a bug fix as an internal change that fixes incorrect behavior in Handsontable or one of the supported framework wrappers.|

## Releasing framework wrappers

Prior to version 8.4.0, we released Handsontable vanilla and the wrappers separately. However, we noticed that this led to some confusion among customers. In an effort to make the maintenance of updates easier to understand, we have switched to the unified number starting with version 8.4.0 (released in May 2021). 

A benefit of this is that each backward-incompatible change now requires the major version to increment for the entire project. Previously, the single wrapper version number would just be updated, whereas now the whole codebase is updated.
