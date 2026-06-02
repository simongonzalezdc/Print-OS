/**
 * ESP32 Development Board Case
 * Fits standard 30-pin ESP32 DevKit V1.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = () => {
  const inner = [55, 30, 15];
  const wall = 1.6;
  
  const shell = subtract(
    cuboid({ size: [inner[0] + wall*2, inner[1] + wall*2, inner[2] + wall], center: [0, 0, (inner[2]+wall)/2] }),
    translate([0, 0, wall], cuboid({ size: [inner[0], inner[1], inner[2] + 2], center: [0, 0, inner[2]/2] }))
  );

  const usb = translate([-inner[0]/2 - wall, 0, wall + 2], cuboid({ size: [wall*2 + 2, 12, 8], center: [0, 0, 4] }));

  return subtract(shell, usb);
};
