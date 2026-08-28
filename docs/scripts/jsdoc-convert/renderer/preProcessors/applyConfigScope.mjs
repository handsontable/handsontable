/**
 * Lifts the `@configScope` tag out of `customTags` onto a top-level `configScope` field.
 *
 * `@configScope` lists the configuration levels an option takes effect at, for example
 * `@configScope grid columns cells cell`. jsdoc treats it as an unknown tag: it lowercases
 * the name to `configscope` and files it under `customTags`, with no top-level field. Left
 * there, `customTags.hbs` renders it as `**Configscope**: grid columns cells cell`, which is
 * both title-cased wrongly and duplicated by the badge in `hot-header.hbs`.
 *
 * So this pre-processor moves the value to `configScope` and drops the tag from `customTags`.
 *
 * @param {object[]} data The parsed jsdoc members.
 * @returns {object[]} The same members, with `configScope` resolved.
 */
export const applyConfigScope = (data) => {
  return data.map((member) => {
    const tags = member.customTags;

    if (!Array.isArray(tags)) {
      return member;
    }

    const scopeTag = tags.find(tag => tag.tag?.toLowerCase() === 'configscope');

    if (!scopeTag) {
      return member;
    }

    const remaining = tags.filter(tag => tag !== scopeTag);
    const levels = String(scopeTag.value ?? '').trim().split(/\s+/).filter(Boolean);

    return {
      ...member,
      configScope: levels.join(' '),
      configScopeLevels: levels,
      customTags: remaining.length ? remaining : undefined,
    };
  });
};
