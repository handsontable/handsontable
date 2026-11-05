/**
 * Lists the physical indexes of one axis in the order the engine holds them, `length` of them: the elements
 * the stored engine order names first (`sequence`), then the ones the order an empty sheet was filled in names
 * (`fillSequence`), then every other physical index in ascending order, the order a sheet fed its content holds
 * them in. An empty `sequence` with no `fillSequence` is the physical order. Indexes at or past `length` are
 * left out.
 *
 * @param {number[]} sequence The physical index at each engine index, as the stored order names them.
 * @param {number[]|null} fillSequence The order an empty sheet was filled in, or `null`.
 * @param {number} length How many elements the axis has.
 * @returns {number[]} The physical index at each engine index.
 */
export function listEngineElements(sequence: number[], fillSequence: number[] | null, length: number): number[] {
  const elements: number[] = [];
  const held = new Set<number>();
  const take = (physicalIndex: number) => {
    if (physicalIndex < length && !held.has(physicalIndex)) {
      elements.push(physicalIndex);
      held.add(physicalIndex);
    }
  };

  sequence.forEach(take);
  fillSequence?.forEach(take);

  for (let physicalIndex = 0; elements.length < length; physicalIndex += 1) {
    take(physicalIndex);
  }

  return elements;
}
