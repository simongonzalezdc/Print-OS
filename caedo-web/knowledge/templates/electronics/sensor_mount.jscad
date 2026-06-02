/**
 * Universal Sensor Mount
 * For mounting HC-SR04 ultrasonic or similar sensors.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = () => {
  const plate = cuboid({ size: [50, 25, 2], center: [0, 0, 1] });
  const holes = union(
    translate([-15, 0, -1], cylinder({ radius: 8.5, height: 5 })),
    translate([15, 0, -1], cylinder({ radius: 8.5, height: 5 }))
  );

  return subtract(plate, holes);
};
