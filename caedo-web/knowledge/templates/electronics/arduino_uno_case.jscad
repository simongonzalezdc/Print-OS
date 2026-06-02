/**
 * Arduino Uno Case (Basic)
 * Protective base and walls for Arduino Uno.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = () => {
  const baseSize = [75, 60, 15];
  const wall = 2;
  
  const base = cuboid({ size: [baseSize[0], baseSize[1], wall], center: [0, 0, wall/2] });
  const walls = subtract(
    cuboid({ size: [baseSize[0], baseSize[1], baseSize[2]], center: [0, 0, baseSize[2]/2] }),
    translate([0, 0, wall], cuboid({ size: [baseSize[0]-wall*2, baseSize[1]-wall*2, baseSize[2]], center: [0, 0, baseSize[2]/2] }))
  );

  // Port cutouts
  const usbCutout = translate([-baseSize[0]/2 + 5, 15, 10], cuboid({ size: [15, 15, 10] }));
  const powerCutout = translate([-baseSize[0]/2 + 5, -15, 10], cuboid({ size: [15, 12, 10] }));

  return subtract(union(base, walls), usbCutout, powerCutout);
};
