/**
 * Mesh Upper Shell (Parametric)
 * Breathable structural panel for sneaker uppers.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { subtract } = booleans;

export const main = (params = { length: 150, width: 80 }) => {
  const { length, width } = params;
  const thickness = 1.2;

  const panel = roundedCuboid({ size: [length, width, thickness], roundRadius: 5, center: [0, 0, thickness/2] });
  
  // Mesh pattern
  const holes = [];
  for (let x = -length/2 + 5; x < length/2 - 5; x += 8) {
    for (let y = -width/2 + 5; y < width/2 - 5; y += 8) {
      holes.push(translate([x, y, -1], cylinder({ radius: 2.5, height: thickness + 2 })));
    }
  }

  return color.apply([0.4, 0.4, 0.8], subtract(panel, ...holes));
};
