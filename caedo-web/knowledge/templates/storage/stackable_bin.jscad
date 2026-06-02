/**
 * Stackable Bin
 * Storage bin that can be stacked on others of the same size.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 60, height: 40, wall: 2 }) => {
  const { size, height, wall } = params;

  const body = subtract(
    cuboid({ size: [size, size, height], center: [0, 0, height/2] }),
    translate([0, 0, wall], cuboid({ size: [size - wall*2, size - wall*2, height], center: [0, 0, height/2] }))
  );

  // Stacking lip at bottom
  const lip = subtract(
    cuboid({ size: [size - wall*0.5, size - wall*0.5, wall], center: [0, 0, -wall/2] }),
    cuboid({ size: [size - wall*2.5, size - wall*2.5, wall + 2], center: [0, 0, -wall/2] })
  );

  return union(body, lip);
};
