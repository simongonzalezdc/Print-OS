/**
 * Classic Clog (Parametric)
 * Lightweight design with ventilation and heel strap.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 60;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 15, center: [0, 0, height/2] }),
    translate([0, 0, 15], roundedCuboid({ size: [length - 10, width - 10, height], roundRadius: 10, center: [0, 0, height/2] }))
  );

  // Ventilation holes
  const holes = [];
  for (let x = -length/4; x < length/4; x += 20) {
    for (let z = 20; z < height - 10; z += 15) {
      holes.push(translate([x, -width/2, z], rotate([Math.PI/2, 0, 0], cylinder({ radius: 4, height: 10 }))));
    }
  }

  return color.apply([0.2, 0.6, 0.3], subtract(shell, ...holes));
};
