/**
 * Drawer Divider (Parametric)
 * Organize your drawers with custom-sized compartments.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union } = booleans;

export const main = (params = { length: 150, height: 40, thickness: 2, notches: 3 }) => {
  const { length, height, thickness, notches } = params;
  
  const mainWall = cuboid({ size: [length, thickness, height], center: [0, 0, height/2] });
  
  // Add interlocking notches (simplified)
  const notchWidth = thickness + 0.4;
  const notchDepth = height / 2;
  
  // This would be a subtract if we were making the notches, 
  // but for a simple template we'll just provide the wall.
  return mainWall;
};
