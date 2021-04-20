---
title: Plugins
permalink: /next/plugins
canonicalUrl: /plugins
---

# {{ $frontmatter.title }}

A plugin contains one or more features that can be easily plugged in to Handsontable. Writing a new plugin is not a difficult task, simply cloning the [Skeleton template](https://github.com/handsontable/handsontable-skeleton) will give you a good starting point.

There are two types of plugins: internal and external. While both extend Handsontable's functionality, the former is incorporated into the Handsontable build and the latter needs to be included from a separate file. Learn more about plugins from the [Skeleton guide.](https://github.com/handsontable/handsontable-skeleton/tree/master/plugins)

Note that creating a plugin for personal needs is usually easier than writing an application destined for use by other developers. Such code has to be properly described, documented, frequently updated and supported. If you think that your plugin meets those requirements then consider sharing it with us. [Get in touch](https://handsontable.com/contact) for more details.

We support **ECMAScript 6** and follow [code style](https://github.com/handsontable/handsontable/blob/master/.eslintrc.js) (inspired by [Airbnb JavaScript Style](https://github.com/airbnb/javascript)), so those standards are required for the new plugins.
