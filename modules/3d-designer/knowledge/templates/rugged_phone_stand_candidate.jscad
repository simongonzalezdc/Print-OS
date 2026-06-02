const createMilkCrate = () => {
  // Basic dimensions and parameters for the milk crate
  const width = 3;
  const depth = 2;
  const height = 1;
  const wallThickness = 0.15;
  const handleSize = 0.4;
  const gridSpacing = 0.6;
  
  // Create the base of the crate
  const base = cuboid({ size: [width, depth, height], center: [0, 0, height/2] });
  
  // Add handles to the top and bottom edges of the crate
  const handleTop = translate([0, -depth/2 + wallThickness/2, height/2], cuboid({ size: [handleSize, wallThickness, handleSize] }));
  const handleBottom = translate([0, -depth/2 + wallThickness/2, -height/2], cuboid({ size: [handleSize, wallThickness, handleSize] }));
  
  // Add reinforcement corners to the crate
  const corner1 = translate([-width/2 + wallThickness/2, -depth/2 + wallThickness/2, 0], cuboid({ size: [wallThickness, wallThickness, height] }));
  const corner2 = translate([width/2 - wallThickness/2, -depth/2 + wallThickness/2, 0], cuboid({ size: [wallThickness, wallThickness, height] }));
  const corner3 = translate([-width/2 + wallThickness/2, depth/2 - wallThickness/2, 0], cuboid({ size: [wallThickness, wallThickness, height] }));
  const corner4 = translate([width/2 - wallThickness/2, depth/2 - wallThickness/2, 0], cuboid({ size: [wallThickness, wallThickness, height] }));
  
  // Create the grid pattern inside the crate
  const gridWidth = width - 2 * wallThickness;
  const gridDepth = depth - 2 * wallThickness;
  for (let x = -gridWidth/2 + wallThickness; x < gridWidth/2; x += gridSpacing) {
    for (let z = -gridDepth/2 + wallThickness; z < gridDepth/2; z += gridSpacing) {
      const gridSlot = translate([x, 0, z], cuboid({ size: [wallThickness, height, wallThickness] }));
      base.subtract(gridSlot);
    }
  }
  
  // Combine all parts to create the final milk crate
  return union(base, handleTop, handleBottom, corner1, corner2, corner3, corner4);
};

// Output the complete JSCAD code for the user's request
return createMilkCrate();