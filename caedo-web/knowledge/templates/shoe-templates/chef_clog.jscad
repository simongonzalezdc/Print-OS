/**
 * Chef Clog (Parametric)
 * Aggressive tread pattern and oil-resistant design features.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 44 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 65;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 10, center: [0, 0, height/2] }),
    translate([0, 0, 15], roundedCuboid({ size: [length - 12, width - 12, height], roundRadius: 8, center: [0, 0, height/2] }))
  );

  // Anti-slip tread
  const treads = [];
  for (let x = -length/2 + 10; x < length/2 - 10; x += 15) {
    for (let y = -width/2 + 10; y < width/2 - 10; y += 15) {
      treads.push(translate([x, y, 0], cylinder({ radius: 3, height: 2, segments: 4 })));
    }
  }

  return color.apply([0.1, 0.1, 0.1], subtract(shell, ...treads));
};
