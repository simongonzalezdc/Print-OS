/**
 * Label Holder
 * For organizing bins and drawers with printed labels.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { width: 60, height: 30 }) => {
  const { width, height } = params;
  const wall = 1.2;

  const base = cuboid({ size: [width + wall*2, height + wall, wall], center: [0, 0, wall/2] });
  const rails = union(
    translate([-width/2, 0, wall], cuboid({ size: [wall, height + wall, wall], center: [-wall/2, 0, wall/2] })),
    translate([width/2, 0, wall], cuboid({ size: [wall, height + wall, wall], center: [wall/2, 0, wall/2] })),
    translate([0, -height/2, wall], cuboid({ size: [width + wall*2, wall, wall], center: [0, -wall/2, wall/2] }))
  );

  return union(base, rails);
};
