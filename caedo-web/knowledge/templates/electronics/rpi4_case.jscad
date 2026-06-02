/**
 * Raspberry Pi 4 Case (Basic)
 * Minimal protective shell with port access.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = () => {
  const outerSize = [95, 65, 30];
  const wall = 2;
  const innerSize = [outerSize[0] - wall*2, outerSize[1] - wall*2, outerSize[2] - wall*2];

  const shell = subtract(
    cuboid({ size: outerSize, center: [0, 0, outerSize[2]/2] }),
    translate([0, 0, wall], cuboid({ size: innerSize, center: [0, 0, innerSize[2]/2] }))
  );

  // USB/Ethernet cutouts
  const ports = translate([outerSize[0]/2 - 5, 0, 10 + wall], cuboid({ size: [15, 50, 15] }));

  return subtract(shell, ports);
};
