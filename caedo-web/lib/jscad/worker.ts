import * as jscad from '@jscad/modeling';

// Get bounding box of geometry
const measureBounds = jscad.measurements.measureBoundingBox;

// =============================================================================
// PRIMITIVE SHAPES (like TinkerCAD, Fusion 360, OpenSCAD)
// =============================================================================

const API = {
  // ---------------------------------------------------------------------------
  // BASIC 3D PRIMITIVES
  // ---------------------------------------------------------------------------
  
  // Box/Cube - most common shape
  cuboid: jscad.primitives.cuboid,
  cube: (size: number) => jscad.primitives.cuboid({ size: [size, size, size] }),
  box: jscad.primitives.cuboid,
  
  // Rounded box - great for ergonomic designs
  roundedCuboid: jscad.primitives.roundedCuboid,
  roundedBox: jscad.primitives.roundedCuboid,
  
  // Cylinder - for holes, posts, tubes
  cylinder: jscad.primitives.cylinder,
  roundedCylinder: jscad.primitives.roundedCylinder,
  
  // Sphere - decorative, joints
  sphere: jscad.primitives.sphere,
  
  // Torus/Donut - o-rings, handles
  torus: jscad.primitives.torus,
  
  // Ellipsoid - stretched sphere
  ellipsoid: jscad.primitives.ellipsoid,
  
  // Geodesic sphere - low-poly sphere
  geodesicSphere: jscad.primitives.geodesicSphere,
  
  // Polyhedron - custom shape from vertices
  polyhedron: jscad.primitives.polyhedron,
  
  // ---------------------------------------------------------------------------
  // 2D SHAPES (for extrusion)
  // ---------------------------------------------------------------------------
  
  // Circle - base for cylinders
  circle: jscad.primitives.circle,
  
  // Ellipse - stretched circle
  ellipse: jscad.primitives.ellipse,
  
  // Rectangle - base for boxes
  rectangle: jscad.primitives.rectangle,
  roundedRectangle: jscad.primitives.roundedRectangle,
  
  // Polygon - custom 2D shape
  polygon: jscad.primitives.polygon,
  
  // Star - decorative
  star: jscad.primitives.star,
  
  // ---------------------------------------------------------------------------
  // EXTRUSIONS (2D to 3D)
  // ---------------------------------------------------------------------------
  
  // Linear extrude - pull 2D shape into 3D
  extrudeLinear: jscad.extrusions.extrudeLinear,
  
  // Rotate extrude - spin 2D shape around axis (vases, bowls)
  extrudeRotate: jscad.extrusions.extrudeRotate,
  
  // Rectangular extrude - extrude with different start/end sizes
  extrudeRectangular: jscad.extrusions.extrudeRectangular,
  
  // Extrude from slices - loft between profiles
  extrudeFromSlices: jscad.extrusions.extrudeFromSlices,
  
  // Project - 3D to 2D projection
  project: jscad.extrusions.project,
  
  // ---------------------------------------------------------------------------
  // BOOLEAN OPERATIONS (combine shapes)
  // ---------------------------------------------------------------------------
  
  union: jscad.booleans.union,           // Add shapes together
  subtract: jscad.booleans.subtract,     // Cut one from another
  intersect: jscad.booleans.intersect,   // Keep only overlap
  
  // Scission - split into separate parts
  scission: jscad.booleans.scission,
  
  // ---------------------------------------------------------------------------
  // TRANSFORMS (move, rotate, scale)
  // ---------------------------------------------------------------------------
  
  translate: jscad.transforms.translate,  // Move
  rotate: jscad.transforms.rotate,        // Rotate (radians)
  rotateX: jscad.transforms.rotateX,      // Rotate around X
  rotateY: jscad.transforms.rotateY,      // Rotate around Y
  rotateZ: jscad.transforms.rotateZ,      // Rotate around Z
  scale: jscad.transforms.scale,          // Resize
  mirror: jscad.transforms.mirror,        // Mirror/flip
  center: jscad.transforms.center,        // Center on origin
  align: jscad.transforms.align,          // Align to reference
  
  // ---------------------------------------------------------------------------
  // HULLS & EXPANSIONS
  // ---------------------------------------------------------------------------
  
  // Hull - convex hull wrapping shapes (great for organic forms)
  hull: jscad.hulls.hull,
  hullChain: jscad.hulls.hullChain,
  
  // Expand/Contract - offset surfaces
  expand: jscad.expansions.expand,
  offset: jscad.expansions.offset,
  
  // ---------------------------------------------------------------------------
  // MEASUREMENTS
  // ---------------------------------------------------------------------------
  
  measureBoundingBox: jscad.measurements.measureBoundingBox,
  measureVolume: jscad.measurements.measureVolume,
  measureArea: jscad.measurements.measureArea,
  measureCenter: jscad.measurements.measureCenter,
  
  // ---------------------------------------------------------------------------
  // COLORS (for multi-color export)
  // ---------------------------------------------------------------------------
  
  colorize: jscad.colors.colorize,
  
  // Common colors
  colors: {
    red: [1, 0, 0],
    green: [0, 1, 0],
    blue: [0, 0, 1],
    yellow: [1, 1, 0],
    cyan: [0, 1, 1],
    magenta: [1, 0, 1],
    white: [1, 1, 1],
    black: [0, 0, 0],
    orange: [1, 0.5, 0],
    purple: [0.5, 0, 0.5],
    gray: [0.5, 0.5, 0.5],
    lightGray: [0.75, 0.75, 0.75],
    darkGray: [0.25, 0.25, 0.25],
  },
  
  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------
  
  degToRad: jscad.utils.degToRad,
  radToDeg: jscad.utils.radToDeg,
  
  // Math helpers
  Math: Math,
  PI: Math.PI,
  
  // Console for debugging
  console: {
    log: (...args: unknown[]) => self.postMessage({ type: 'log', args }),
    warn: (...args: unknown[]) => self.postMessage({ type: 'warn', args }),
    error: (...args: unknown[]) => self.postMessage({ type: 'error', error: args }),
  },
  
  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS (common patterns)
  // ---------------------------------------------------------------------------
  
  // Create a tube (hollow cylinder)
  tube: (options: { outerRadius: number; innerRadius: number; height: number; center?: [number, number, number] }) => {
    const { outerRadius, innerRadius, height, center = [0, 0, 0] } = options;
    const outer = jscad.primitives.cylinder({ radius: outerRadius, height, center });
    const inner = jscad.primitives.cylinder({ radius: innerRadius, height: height + 0.1, center });
    return jscad.booleans.subtract(outer, inner);
  },
  
  // Create a cone
  cone: (options: { radius: number; height: number; center?: [number, number, number] }) => {
    const { radius, height, center = [0, 0, height/2] } = options;
    return jscad.primitives.cylinderElliptic({
      startRadius: [radius, radius],
      endRadius: [0.001, 0.001],
      height,
      center,
    });
  },
  
  // Create a pyramid
  pyramid: (options: { base: number; height: number; sides?: number; center?: [number, number, number] }) => {
    const { base, height, sides = 4, center = [0, 0, height/2] } = options;
    const baseShape = jscad.primitives.polygon({
      points: Array.from({ length: sides }, (_, i) => {
        const angle = (i / sides) * Math.PI * 2;
        return [Math.cos(angle) * base/2, Math.sin(angle) * base/2];
      }),
    });
    return jscad.transforms.translate(center,
      jscad.extrusions.extrudeLinear({ height }, baseShape)
    );
  },
  
  // Create a wedge/ramp
  wedge: (options: { width: number; depth: number; height: number; center?: [number, number, number] }) => {
    const { width, depth, height, center = [0, 0, 0] } = options;
    const points: [number, number][] = [
      [0, 0],
      [depth, 0],
      [0, height],
    ];
    const profile = jscad.primitives.polygon({ points });
    const extruded = jscad.extrusions.extrudeLinear({ height: width }, profile);
    return jscad.transforms.translate(
      [center[0] - width/2, center[1] - depth/2, center[2]],
      jscad.transforms.rotateX(Math.PI/2, 
        jscad.transforms.rotateZ(Math.PI/2, extruded)
      )
    );
  },
  
  // Create text (embossed)
  // Note: JSCAD text requires vectorText, simplified version here
  
  // Create a grid/array of objects
  grid: (object: unknown, options: { countX: number; countY: number; spacingX: number; spacingY: number }) => {
    const { countX, countY, spacingX, spacingY } = options;
    const objects: unknown[] = [];
    for (let x = 0; x < countX; x++) {
      for (let y = 0; y < countY; y++) {
        objects.push(jscad.transforms.translate(
          [x * spacingX - (countX-1) * spacingX / 2, y * spacingY - (countY-1) * spacingY / 2, 0],
          object as jscad.geometries.geom3.Geom3
        ));
      }
    }
    return jscad.booleans.union(...objects as jscad.geometries.geom3.Geom3[]);
  },
  
  // Create circular array
  circularArray: (object: unknown, options: { count: number; radius: number }) => {
    const { count, radius } = options;
    const objects: unknown[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      objects.push(jscad.transforms.translate(
        [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
        jscad.transforms.rotateZ(angle, object as jscad.geometries.geom3.Geom3)
      ));
    }
    return jscad.booleans.union(...objects as jscad.geometries.geom3.Geom3[]);
  },
};

/**
 * Ensure geometry sits on the build plate (Z=0) and is centered on X/Y.
 * This makes objects appear properly in the Three.js viewport.
 */
function ensureOnBuildPlate(geometry: unknown): unknown {
  if (!geometry || typeof geometry !== 'object') return geometry;
  
  try {
    // Get bounding box: [[minX, minY, minZ], [maxX, maxY, maxZ]]
    const bounds = measureBounds(geometry as jscad.geometries.geom3.Geom3);
    if (!bounds || bounds.length < 2) return geometry;
    
    const minX = bounds[0][0];
    const maxX = bounds[1][0];
    const minY = bounds[0][1];
    const maxY = bounds[1][1];
    const minZ = bounds[0][2];
    
    // Calculate center offset for X/Y
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Only translate if needed
    const needsCenterX = Math.abs(centerX) > 0.01;
    const needsCenterY = Math.abs(centerY) > 0.01;
    const needsZCorrection = Math.abs(minZ) > 0.01;
    
    if (needsCenterX || needsCenterY || needsZCorrection) {
      const translateX = needsCenterX ? -centerX : 0;
      const translateY = needsCenterY ? -centerY : 0;
      const translateZ = needsZCorrection ? -minZ : 0;
      
      API.console.log(`Auto-positioning: centering on X/Y and placing on build plate (offset: [${translateX.toFixed(1)}, ${translateY.toFixed(1)}, ${translateZ.toFixed(1)}]mm)`);
      return jscad.transforms.translate(
        [translateX, translateY, translateZ], 
        geometry as jscad.geometries.geom3.Geom3
      );
    }
    
    return geometry;
  } catch {
    // If measurement fails, return original geometry
    return geometry;
  }
}

self.onmessage = (event: MessageEvent<{ code: string }>) => {
  const { code } = event.data;

  try {
    const execute = new Function(...Object.keys(API), code);
    let result = execute(...Object.values(API));
    
    // Auto-correct positioning to ensure object sits on build plate
    result = ensureOnBuildPlate(result);
    
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error in worker',
    });
  }
};

export {};
