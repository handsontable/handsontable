# Source Code Link

Depends on generating links to the source code, maintains theirs output HTML, styling, and behavior.
It allows management (edit) the HTML output without regenerating API References, which is important for released docs versions.

## Flow:

1. When `npm run docs:api` generates API References pages, to all classes members is added `::: source-code-link <URL>`
2. The `<URL>` points on the GitHub repository, to the commit hash, file, and line.
3. Then during `npm run docs:build` or `npm run docs:start` the markdown loader recognizes this container and outputs the Vue template.
4. Then Vue loader handles the template and the OutboundLink within (a Vue component).
5. Finally, the link HTML is on the output, with an applied CSS class which allows to style this element.
