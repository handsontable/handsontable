---
id: demo-select
title: Select
sidebar_label: Select
slug: /demo-select
---

Select editor should be considered an example how to write editors rather than used as a fully featured editor. It is a much simpler form of the [Dropdown editor](https://handsontable.com/docs/8.2.0/demo-dropdown.html). It is suggested to use the latter in your projects.

Edit Log to console

var container = document.getElementById("example1"), hot; hot = new Handsontable(container, { data: \[ \['2017', 'Honda', 10\], \['2018', 'Toyota', 20\], \['2019', 'Nissan', 30\] \], colWidths: \[50, 70, 50\], colHeaders: true, columns: \[ {}, { editor: 'select', selectOptions: \['Kia', 'Nissan', 'Toyota', 'Honda'\] }, {} \] });
