export const buildPreProcessor = (preProcessors) => {
  return initialData => preProcessors.reduce((data, preProcessor) => preProcessor(data), initialData);
};
