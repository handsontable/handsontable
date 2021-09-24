const escape = text => text.replace(/[{}<>]/g, '').replace(/~/g, '-');

export const buildParser = ({ logger, parseJsdoc }) => function* () {
  const getName = member => escape(
    (member.kind === 'class' && member.name) // if class get class name
    || member.memberof?.split('#')[0] // if member of a class
    || 'global' // else (if global)
  );
  const groupMember = (map, member) => map.set(getName(member), [...map.get(getName(member)) || [], member]);

  logger.info('Parsing jsdoc comments...');
  const data = parseJsdoc('**/*.js');

  logger.success('Jsdoc comments parsed successfully.');

  const membersPerFile = data.reduce(groupMember, new Map());

  logger.info(`Parsed ${membersPerFile.size} API Refs pages.`);

  const parsedTypes = [...membersPerFile.keys()];

  /* eslint-disable-next-line no-restricted-syntax */
  for (const [type, members] of membersPerFile) {
    yield { type, members, metaData: { parsedTypes } };
  }
};
