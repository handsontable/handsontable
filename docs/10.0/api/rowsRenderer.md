---
title: RowsRenderer
metaTitle: RowsRenderer - API Reference - Handsontable Documentation
permalink: /10.0/api/rows-renderer
canonicalUrl: /api/rows-renderer
hotPlugin: false
editLink: false
---

# RowsRenderer

[[toc]]

## Description

Rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TBODY.

  <tbody> (root node)
    ├ <tr>   \
    ├ <tr>    \
    ├ <tr>     - RowsRenderer
    ├ <tr>    /
    └ <tr>   /.



## Description

TableRenderer class collects all renderers and properties necessary for table creation. It's
responsible for adjusting and rendering each renderer.

Below is a diagram of the renderers together with an indication of what they are responisble for.
  <table>
    <colgroup>  \ (root node)
      <col>      \
      <col>       \___ ColGroupRenderer
      <col>       /
      <col>      /
    </colgroup> /
    <thead>     \ (root node)
      <tr>       \
        <th>      \
        <th>       \____ ColumnHeadersRenderer
        <th>       /
        <th>      /
      </tr>      /
    </thead>    /
    <tbody>   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\ (root node)
      <tr>   (root node)          \
        <th>  --- RowHeadersRenderer
        <td>  \                     \
        <td>   -- CellsRenderer      \
        <td>  /                       \
      </tr>                            \
      <tr>   (root node)                \
        <th>  --- RowHeadersRenderer     \
        <td>  \                           \___ RowsRenderer
        <td>   -- CellsRenderer           /
        <td>  /                          /
      </tr>                             /
      <tr>   (root node)               /
        <th>  --- RowHeadersRenderer  /
        <td>  \                      /
        <td>   -- CellsRenderer     /
        <td>  /                    /
      </tr>                       /
    </tbody>  ___________________/
  </table>.


## Methods

## Description

Rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TBODY.

  <tbody> (root node)
    ├ <tr>   \
    ├ <tr>    \
    ├ <tr>     - RowsRenderer
    ├ <tr>    /
    └ <tr>   /.



## Description

TableRenderer class collects all renderers and properties necessary for table creation. It's
responsible for adjusting and rendering each renderer.

Below is a diagram of the renderers together with an indication of what they are responisble for.
  <table>
    <colgroup>  \ (root node)
      <col>      \
      <col>       \___ ColGroupRenderer
      <col>       /
      <col>      /
    </colgroup> /
    <thead>     \ (root node)
      <tr>       \
        <th>      \
        <th>       \____ ColumnHeadersRenderer
        <th>       /
        <th>      /
      </tr>      /
    </thead>    /
    <tbody>   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\ (root node)
      <tr>   (root node)          \
        <th>  --- RowHeadersRenderer
        <td>  \                     \
        <td>   -- CellsRenderer      \
        <td>  /                       \
      </tr>                            \
      <tr>   (root node)                \
        <th>  --- RowHeadersRenderer     \
        <td>  \                           \___ RowsRenderer
        <td>   -- CellsRenderer           /
        <td>  /                          /
      </tr>                             /
      <tr>   (root node)               /
        <th>  --- RowHeadersRenderer  /
        <td>  \                      /
        <td>   -- CellsRenderer     /
        <td>  /                    /
      </tr>                       /
    </tbody>  ___________________/
  </table>.



