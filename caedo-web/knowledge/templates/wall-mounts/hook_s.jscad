/**
 * S-Hook (Parametric)
 * For hanging items on rails or racks.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cylinder, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { radius: 15, thickness: 5, width: 8 }) => {
  const { radius, thickness, width } = params;
  
  const createHalfRing = (r, t, w) => {
    return subtract(
      cylinder({ radius: r + t, height: w }),
      cylinder({ radius: r, height: w + 2 }),
      translate([-(r+t), 0, 0], cuboid({ size: [(r+t)*2, (r+t)*2, w+2] }))
    );
  };

  const top = rotate([Math.PI/2, 0, 0], createHalfRing(radius, thickness, width));
  const bottom = translate([0, -radius*2 - thickness, 0], rotate([-Math.PI/2, 0, Math.PI], createHalfRing(radius, thickness, width)));
  
  return union(top, bottom);
};
