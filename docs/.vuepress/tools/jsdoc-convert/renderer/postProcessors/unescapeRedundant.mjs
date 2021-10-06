export const unescapeRedundant = text => text
  .replace(/`[^`\n]*`/g, m => // get all inline codes
    m.replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\.</g, '<')
      .replace(/\\\*/g, '*')
      .replace(/\\_/g, '_')
  )
  // fix randomly added quota to @default tag.
  .replace(/\*\*Default\*\*: <code>&quot;((undefined)|(false)|(true))&quot;<\/code>/g, '**Default**: <code>$1</code>')
  // remove redundant dot, which eslint enforce to add after list closing tag.
  .replace(/<\/ul>\./g, '</ul>')
  .replace(/&quot;&#x27;/g, '"')
  .replace(/&#x27;&quot;/g, '"');
