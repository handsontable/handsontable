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

    // Take every match, not just the first. A leftover duplicate would stay in
    // `customTags` and render as `**Configscope**: ...` beneath the badge, which is the
    // exact output this pre-processor exists to prevent.
    const scopeTags = tags.filter(tag => tag.tag?.toLowerCase() === 'configscope');

    if (!scopeTags.length) {
      return member;
    }

    if (scopeTags.length > 1) {
      throw new Error(
        `\`${member.name}\` declares @configScope ${scopeTags.length} times; it must appear once.`
      );
    }

    const [scopeTag] = scopeTags;
    const remaining = tags.filter(tag => tag !== scopeTag);
    const levels = String(scopeTag.value ?? '').trim().split(/\s+/).filter(Boolean);

    return {
      ...member,
      configScopeLevels: levels,
      customTags: remaining.length ? remaining : undefined,
    };
  });
};
