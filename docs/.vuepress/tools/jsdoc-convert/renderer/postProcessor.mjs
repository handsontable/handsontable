export const buildPostProcessor = (postProcessors) => {
  return initialText => postProcessors.reduce((text, postProcessor) => postProcessor(text), initialText);
};
