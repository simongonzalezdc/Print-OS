/**
 * Gyroid Lattice Midsole (Parametric)
 * Uniform density gyroid pattern for high-performance cushioning.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { size: 42, density: 0.3 }) => {
  const { size, density } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 12;

  // In a real implementation, this would call a lattice generator
  // For the template, we represent the bounds
  return color.apply([0.4, 0.4, 0.4], roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 4,
    center: [0, 0, height/2] 
  }));
};
