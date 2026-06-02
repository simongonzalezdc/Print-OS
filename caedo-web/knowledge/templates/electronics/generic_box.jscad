/**
 * Generic Parametric Project Box
 * Custom sized enclosure with screw-on lid compatibility.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { length: 100, width: 80, height: 40, wall: 2 }) => {
  const { length, width, height, wall } = params;

  const shell = subtract(
    cuboid({ size: [length, width, height], center: [0, 0, height/2] }),
    translate([0, 0, wall], cuboid({ size: [length - wall*2, width - wall*2, height], center: [0, 0, height/2] }))
  );

  // Add screw posts in corners
  const postSize = 8;
  const posts = [
    translate([length/2 - postSize/2, width/2 - postSize/2, height/2], cuboid({ size: [postSize, postSize, height] })),
    translate([-length/2 + postSize/2, width/2 - postSize/2, height/2], cuboid({ size: [postSize, postSize, height] })),
    translate([length/2 - postSize/2, -width/2 + postSize/2, height/2], cuboid({ size: [postSize, postSize, height] })),
    translate([-length/2 + postSize/2, -width/2 + postSize/2, height/2], cuboid({ size: [postSize, postSize, height] }))
  ];

  return union(shell, ...posts);
};
