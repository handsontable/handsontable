/**
 * Class representing a container structure for the comments present in the snippet.
 */
class Comments {
  constructor(parsedContent) {
    this.commentsByLine = new Map();

    this.readComments(parsedContent);
  }

  /**
   * Go through the comments being present in the object returned from the parser and categorized them by the line
   * in which they appeared.
   *
   * @param {object} parsedContent Object returned from the snippet parser.
   */
  readComments(parsedContent) {
    if (parsedContent.comments) {
      // Map the comments to their lines.
      parsedContent.comments.forEach((commentObject) => {
        this.commentsByLine.set(commentObject.loc.end.line, {
          type: commentObject.type,
          value: commentObject.value
        });
      });
    }
  }

  /**
   * Get a comment appearing the provided line of the snippet. If the line was the end of a multi-line comment, the
   * method returns the entire comment.
   *
   * @param {string} codeLine Line index in the snippet.
   * @returns {string} Comment value.
   */
  getCommentForLine(codeLine) {
    const commentsForLine = [];
    let currentLine = codeLine - 1;
    let commentObject = null;

    while (this.commentsByLine.has(currentLine)) {
      commentObject = this.commentsByLine.get(currentLine);

      switch (commentObject.type) {
        case 'Block':
          commentsForLine.push(`/* ${commentObject.value} */`);
          break;
        case 'Line':
        default:
          commentsForLine.push(`// ${commentObject.value}`);
      }

      currentLine -= 1;
    }

    return `${commentsForLine.reverse().join('\n')}`;
  }
}

module.exports = {
  Comments
};
