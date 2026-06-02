/**
 * SD Card Holder (Desk)
 * Organize SD and Micro SD cards on your desk.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = () => {
  const base = cuboid({ size: [60, 40, 10], center: [0, 0, 5] });
  
  const sdSlot = cuboid({ size: [32, 2.5, 8], center: [0, 0, 4] });
  const msdSlot = cuboid({ size: [15, 1.5, 8], center: [0, 0, 4] });

  const slots = union(
    translate([0, 10, 3], sdSlot),
    translate([0, 0, 3], sdSlot),
    translate([-15, -10, 3], msdSlot),
    translate([0, -10, 3], msdSlot),
    translate([15, -10, 3], msdSlot)
  );

  return subtract(base, slots);
};
