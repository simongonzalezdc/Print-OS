/**
 * Arch Support Insole (Parametric)
 * Features Low/Medium/High arch height variants.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, scale } = transforms;
const { union } = booleans;

export const main = (params = { size: 40, archType: 'medium' }) => {
  const { size, archType } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const baseHeight = 3;
  
  const archHeights = { low: 18, medium: 22, high: 26 };
  const archHeight = archHeights[archType] || 22;

  const base = roundedCuboid({ size: [length, width, baseHeight], roundRadius: 3, center: [0, 0, baseHeight/2] });
  const arch = translate([length * 0.05, width * 0.25, baseHeight], scale([1, 0.6, 1], cylinder({ radius: width * 0.35, height: archHeight - baseHeight })));

  return union(
    color.apply([0.2, 0.4, 0.6], base),
    color.apply([0.3, 0.5, 0.8], arch)
  );
};
