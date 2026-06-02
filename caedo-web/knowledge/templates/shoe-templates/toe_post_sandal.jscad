/**
 * Toe-Post Sandal (Parametric)
 * Classic flip-flop design with reinforced post.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 41 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 15;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 7,
    center: [0, 0, height/2] 
  });

  const post = translate([-length * 0.3, 0, height], cylinder({ radius: 3, height: 25, center: [0, 0, 12.5] }));
  
  const strapL = translate([-length * 0.1, width * 0.3, height + 20], rotate([0, 0, Math.PI/6], cuboid({ size: [length * 0.5, 5, 2] })));
  const strapR = translate([-length * 0.1, -width * 0.3, height + 20], rotate([0, 0, -Math.PI/6], cuboid({ size: [length * 0.5, 5, 2] })));

  return union(
    color.apply([0.2, 0.3, 0.4], sole),
    color.apply([0.8, 0.8, 0.8], post, strapL, strapR)
  );
};
