/**
 * Full-Length Orthotic (Parametric)
 * Complete foot correction support.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, scale } = transforms;
const { union } = booleans;

export const main = (params = { size: 43 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 5;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 5, center: [0, 0, height/2] });
  const arch = translate([length * 0.05, width * 0.2, height], scale([1, 0.5, 1.2], cylinder({ radius: width * 0.4, height: 15 })));
  const heel = translate([length * 0.35, 0, height], cylinder({ radius: width * 0.3, height: 3 }));

  return color.apply([0.5, 0.5, 0.5], union(base, arch, heel));
};
