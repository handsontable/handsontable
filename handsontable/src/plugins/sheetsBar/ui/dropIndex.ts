/**
 * Decides which slot a dragged tab belongs in.
 *
 * The tab takes a neighbour's slot once the pointer crosses that neighbour's centre, which is
 * what makes the strip settle rather than oscillate: the swap point and the point that would
 * swap it back are the same coordinate, so a pointer resting on a boundary does not flicker.
 *
 * The centres array reflects the layout direction: ascending under LTR, descending under RTL.
 * The function works on both by detecting the orientation and comparing accordingly, so the
 * caller does not need an RTL branch.
 *
 * @param {number[]} centers The centre coordinate of every tab, in DOM order (ascending LTR, descending RTL).
 * @param {number} pointer The pointer coordinate along the same axis.
 * @param {number} from The dragged tab's current index.
 * @returns {number} The index the dragged tab should occupy.
 */
export function computeDropIndex(centers: number[], pointer: number, from: number): number {
  let index = from;

  const isAscending = centers.length < 2 || centers[0] < centers[centers.length - 1];

  if (isAscending) {
    while (index > 0 && pointer < centers[index - 1]) {
      index -= 1;
    }

    while (index < centers.length - 1 && pointer > centers[index + 1]) {
      index += 1;
    }
  } else {
    while (index > 0 && pointer > centers[index - 1]) {
      index -= 1;
    }

    while (index < centers.length - 1 && pointer < centers[index + 1]) {
      index += 1;
    }
  }

  return index;
}
