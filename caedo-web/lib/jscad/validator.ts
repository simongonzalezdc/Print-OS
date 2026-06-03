/**
 * JSCAD Code Validator & Optimizer
 * 
 * Analyzes AI-generated JSCAD code before execution to:
 * 1. Detect patterns that will cause performance issues
 * 2. Auto-optimize problematic code
 * 3. Provide warnings/errors for unrepairable issues
 */

export interface ValidationResult {
  isValid: boolean;
  optimizedCode: string;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  estimatedComplexity: 'low' | 'medium' | 'high' | 'extreme';
  analytics?: FixAnalytics;
}

export interface FixAnalytics {
  promptHash?: string;
  hallucinationsDetected: string[];
  fixesApplied: string[];
  timestamp: number;
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion: string;
  line?: number;
}

export interface ValidationError {
  type: string;
  message: string;
  fatal: boolean;
}

// Patterns that cause performance issues
const PROBLEMATIC_PATTERNS = {
  // High segment counts on rounded shapes
  HIGH_SEGMENTS: {
    pattern: /segments:\s*(\d+)/g,
    maxValue: 16,
    criticalValue: 32,
  },
  
  // roundedCuboid is VERY expensive - suggest cuboid instead
  ROUNDED_CUBOID: {
    pattern: /roundedCuboid\s*\(/g,
    warning: 'roundedCuboid is computationally expensive. Consider using cuboid for faster execution.',
  },
  
  // Multiple nested unions are expensive
  NESTED_UNIONS: {
    pattern: /union\s*\([^)]*union\s*\(/g,
    warning: 'Nested union operations are slow. Flatten to a single union with spread operator.',
  },
  
  // Loops creating many objects
  LOOP_CREATION: {
    pattern: /for\s*\([^)]+\)\s*\{[^}]*(?:push|union|subtract)/g,
    warning: 'Loops creating geometry can be slow. Consider reducing iterations.',
  },
  
  // Sphere with high detail
  HIGH_DETAIL_SPHERE: {
    pattern: /sphere\s*\(\s*\{[^}]*segments:\s*(\d+)/g,
    maxValue: 16,
  },
};

// ============================================
// HALLUCINATION DETECTION PATTERNS
// ============================================

// TYPE 1: API Hallucinations - Functions/modules that don't exist
const HALLUCINATED_APIS = [
  { pattern: /jscad\.math\.random/g, name: 'jscad.math.random', fix: 'Use Math.random() or a seeded PRNG function' },
  { pattern: /jscad\.random/g, name: 'jscad.random', fix: 'Use Math.random() or a seeded PRNG function' },
  { pattern: /\{\s*random\s*\}\s*=\s*jscad\.math/g, name: '{ random } = jscad.math', fix: 'Use Math.random() instead - jscad.math has no random' },
  { pattern: /const\s+random\s*=\s*jscad\.math\.random/g, name: 'const random = jscad.math.random', fix: 'Use Math.random() instead' },
  { pattern: /random\.useSeed/g, name: 'random.useSeed', fix: 'Create a seeded PRNG function instead' },
  { pattern: /jscad\.utils/g, name: 'jscad.utils', fix: 'This module does not exist. Use JavaScript built-ins.' },
  { pattern: /jscad\.text/g, name: 'jscad.text', fix: 'Text is not built into JSCAD. Remove text features.' },
  { pattern: /jscad\.font/g, name: 'jscad.font', fix: 'Fonts are not available in JSCAD.' },
  { pattern: /jscad\.modifiers/g, name: 'jscad.modifiers', fix: 'This module does not exist.' },
  { pattern: /jscad\.io/g, name: 'jscad.io', fix: 'File I/O is handled by the app, not in code.' },
  { pattern: /\bnoise\s*\(/g, name: 'noise()', fix: 'Perlin/simplex noise is not available. Use deterministic patterns.' },
  { pattern: /\bperlin\s*\(/g, name: 'perlin()', fix: 'Perlin noise is not available.' },
  { pattern: /\bsimplex\s*\(/g, name: 'simplex()', fix: 'Simplex noise is not available.' },
  { pattern: /\bbezier\s*\(/g, name: 'bezier()', fix: 'Use polygon({ points: [...] }) with manually calculated points.' },
  { pattern: /\bspline\s*\(/g, name: 'spline()', fix: 'Splines are not available. Use polygon with calculated points.' },
  { pattern: /\bfillet\s*\(/g, name: 'fillet()', fix: 'JSCAD has no fillet. Use hull() or manual geometry.' },
  { pattern: /\bchamfer\s*\(/g, name: 'chamfer()', fix: 'JSCAD has no chamfer. Use subtract() with angled cuts.' },
  { pattern: /\btext\s*\(\s*['"]/g, name: 'text()', fix: 'Text rendering is not available in JSCAD.' },
  { pattern: /\bvoronoi\s*\(/g, name: 'voronoi()', fix: 'True Voronoi is not available. Use hexagonal grid pattern.' },
  { pattern: /\bdelaunay\s*\(/g, name: 'delaunay()', fix: 'Delaunay triangulation is not available.' },
  { pattern: /\bimport\s*\(/g, name: 'import()', fix: 'Dynamic imports not supported.' },
  { pattern: /require\s*\(['"]((?!@jscad)[^'"]+)['"]\)/g, name: 'external require', fix: 'Only @jscad/modeling is available.' },
];

// TYPE 2: Parameter Hallucinations - Wrong parameter names
const HALLUCINATED_PARAMS = [
  { pattern: /position\s*:\s*\[/g, name: '"position" parameter', fix: 'Use "center" not "position"' },
  { pattern: /\{\s*r\s*:/g, name: '"r" parameter', fix: 'Use "radius" not "r"' },
  { pattern: /\{\s*h\s*:/g, name: '"h" parameter', fix: 'Use "height" not "h"' },
  { pattern: /\{\s*d\s*:/g, name: '"d" parameter', fix: 'Use "radius" (half of diameter) not "d"' },
  { pattern: /\{\s*w\s*:/g, name: '"w" parameter', fix: 'Use "size: [w, d, h]" not separate "w"' },
  { pattern: /\{\s*depth\s*:/g, name: '"depth" parameter for primitives', fix: 'Use "size: [x, y, z]" for cuboid or "height" for extrusions' },
];

// TYPE 3: Code Completeness Issues
const CODE_COMPLETENESS_CHECKS = {
  hasMain: /(?:const|function)\s+main\s*[=\(]/,
  hasExport: /module\.exports\s*=\s*\{?\s*main/,
  hasReturn: /return\s+(?!undefined|null|;)/,
  hasJscadRequire: /require\s*\(\s*['"]@jscad\/modeling['"]\s*\)/,
};

// TYPE 4: Physics/Geometry Sanity Checks
const GEOMETRY_SANITY_CHECKS = [
  { 
    pattern: /center\s*:\s*\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*(-[\d.]+)\s*\]/g, 
    name: 'Negative Z center',
    check: (match: RegExpMatchArray) => {
      const z = parseFloat(match[1] || '0');
      return z < -1; // Allow small negative for boolean operations
    },
    message: 'Object positioned below build plate (Z < 0). Move geometry up so Z >= 0.',
  },
  {
    pattern: /size\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/g,
    name: 'Extremely thin walls',
    check: (match: RegExpMatchArray) => {
      const dims = [parseFloat(match[1] || '0'), parseFloat(match[2] || '0'), parseFloat(match[3] || '0')];
      return dims.some(d => d > 0 && d < 0.4); // Thinner than single extrusion
    },
    message: 'Dimension smaller than 0.4mm detected. This is thinner than a single extrusion line.',
  },
  {
    pattern: /size\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/g,
    name: 'Enormous object',
    check: (match: RegExpMatchArray) => {
      const dims = [parseFloat(match[1] || '0'), parseFloat(match[2] || '0'), parseFloat(match[3] || '0')];
      return dims.some(d => d > 500); // Larger than most build plates
    },
    message: 'Object dimension exceeds 500mm. This may be too large for most 3D printers.',
  },
  {
    pattern: /radius\s*:\s*([\d.]+)/g,
    name: 'Microscopic radius',
    check: (match: RegExpMatchArray) => {
      const r = parseFloat(match[1] || '0');
      return r > 0 && r < 0.2;
    },
    message: 'Radius smaller than 0.2mm detected. This is too small to print.',
  },
];

// Patterns indicating potentially disconnected/floating geometry
const FLOATING_GEOMETRY_PATTERNS = {
  // Multiple return statements or array returns without union
  ARRAY_RETURN: {
    pattern: /return\s*\[\s*\w+\s*,/g,
    warning: 'Returning array of shapes may create disconnected geometry. Use union() to combine.',
  },
  
  // Shapes created but not used in final union/subtract
  UNUSED_SHAPE: {
    // Check if const/let shapes aren't referenced in return
    check: (code: string): string[] => {
      const warnings: string[] = [];
      // Find all const/let shape assignments
      const shapeVars = code.match(/(?:const|let)\s+(\w+)\s*=\s*(?:sphere|cylinder|cuboid|cube|roundedCuboid|torus|ellipsoid)/g);
      if (shapeVars) {
        for (const match of shapeVars) {
          const varName = match.match(/(?:const|let)\s+(\w+)/)?.[1];
          if (varName) {
            // Check if this var is used in a boolean operation or return
            const usagePattern = new RegExp(`(?:union|subtract|intersect|return)\\s*\\([^)]*${varName}`, 'g');
            const spreadPattern = new RegExp(`\\.\\.\\.\\s*${varName}|${varName}\\s*\\.\\.\\.`, 'g');
            if (!usagePattern.test(code) && !spreadPattern.test(code)) {
              warnings.push(`Shape '${varName}' is created but may not be connected to the final geometry`);
            }
          }
        }
      }
      return warnings;
    },
  },
  
  // Decorative pattern: shapes positioned far above the main body (Z >> height)
  HIGH_FLOATING_SHAPES: {
    check: (code: string): string[] => {
      const warnings: string[] = [];
      // Look for center: [x, y, Z] where Z is suspiciously high compared to main object
      const centerMatches = code.matchAll(/center:\s*\[\s*[\d.+-]+\s*,\s*[\d.+-]+\s*,\s*([\d.]+)\s*\]/g);
      const heights: number[] = [];
      for (const match of centerMatches) {
        const z = parseFloat(match[1] || '0');
        if (!isNaN(z)) heights.push(z);
      }
      if (heights.length > 2) {
        const maxZ = Math.max(...heights);
        const avgZ = heights.reduce((a, b) => a + b, 0) / heights.length;
        // If some shapes are positioned way above average, they might be floating
        if (maxZ > avgZ * 3 && maxZ > 50) {
          warnings.push(`Some shapes are positioned at Z=${maxZ}mm which may be floating above the main body`);
        }
      }
      return warnings;
    },
  },
};

// Optimization replacements - SAFE replacements only
// NOTE: Complex regex replacements were breaking code. Keep these simple and safe.
const OPTIMIZATIONS = [
  {
    // Reduce high segment counts - only target literal numbers, not expressions
    // Match pattern: segments: 32 (but not segments: foo or segments: 8)
    pattern: /segments:\s*([2-9]\d|\d{3,})\b/g,
    replace: (_match: string, segments: string) => {
      const count = parseInt(segments, 10);
      if (count > 12) {
        return `segments: 12`; // Cap at 12 for better performance
      }
      return `segments: ${count}`;
    },
  },
];

// ============================================
// AUTO-FIXES FOR HALLUCINATED APIs
// These replace hallucinated code with working alternatives
// ============================================
const HALLUCINATION_FIXES = [
  {
    // Fix: const { random } = jscad.math; -> remove line, will use Math.random
    pattern: /const\s*\{\s*random\s*\}\s*=\s*jscad\.math\s*;?\n?/g,
    replace: '// random from jscad.math does not exist - using Math.random instead\n',
    description: 'Removed hallucinated jscad.math.random import',
  },
  {
    // Fix: const random = jscad.math.random; -> remove line
    pattern: /const\s+random\s*=\s*jscad\.math\.random\s*;?\n?/g,
    replace: '// random from jscad.math does not exist - using Math.random instead\n',
    description: 'Removed hallucinated jscad.math.random assignment',
  },
  {
    // Fix: jscad.math.random() -> Math.random()
    pattern: /jscad\.math\.random\s*\(\s*\)/g,
    replace: 'Math.random()',
    description: 'Replaced jscad.math.random() with Math.random()',
  },
  {
    // Fix: jscad.math.random(n) -> Math.random() * n (for single arg)
    pattern: /jscad\.math\.random\s*\(\s*(\d+)\s*\)/g,
    replace: '(Math.random() * $1)',
    description: 'Replaced jscad.math.random(n) with Math.random() * n',
  },
  {
    // Fix: random(n) when random was supposed to come from jscad.math
    // Only fix if it looks like a number argument (not random() with no args)
    pattern: /\brandom\s*\(\s*(\d+)\s*\)/g,
    replace: '(Math.random() * $1)',
    description: 'Replaced random(n) with Math.random() * n',
  },
  {
    // Fix: random() bare call -> Math.random()
    pattern: /\brandom\s*\(\s*\)/g,
    replace: 'Math.random()',
    description: 'Replaced random() with Math.random()',
  },
];

/**
 * Fix roundedCylinder/roundedCuboid where roundRadius is too large for height
 * JSCAD constraint: height must be > 2 * roundRadius
 * We fix by reducing roundRadius to (height / 2) - 0.1
 */
function fixRoundedPrimitiveConstraints(code: string): { code: string; fixes: string[] } {
  let modified = code;
  const fixes: string[] = [];
  
  // Pattern to match roundedCylinder with explicit height and roundRadius (literal numbers)
  const roundedCylinderLiteralPattern = /roundedCylinder\s*\(\s*\{([^}]*height\s*:\s*[\d.]+[^}]*roundRadius\s*:\s*[\d.]+[^}]*)\}\s*\)/g;
  
  modified = modified.replace(roundedCylinderLiteralPattern, (match, params: string) => {
    // Extract height and roundRadius values
    const heightMatch = params.match(/height\s*:\s*([\d.]+)/);
    const roundRadiusMatch = params.match(/roundRadius\s*:\s*([\d.]+)/);
    
    if (heightMatch && roundRadiusMatch) {
      const height = parseFloat(heightMatch[1] || '0');
      const roundRadius = parseFloat(roundRadiusMatch[1] || '0');
      
      // Check constraint: height must be > 2 * roundRadius
      if (height <= 2 * roundRadius) {
        // Fix by reducing roundRadius
        const safeRoundRadius = Math.max(0.5, (height / 2) - 0.5);
        const fixedParams = params.replace(
          /roundRadius\s*:\s*[\d.]+/,
          `roundRadius: ${safeRoundRadius.toFixed(1)}`
        );
        fixes.push(`Fixed roundedCylinder: roundRadius ${roundRadius} -> ${safeRoundRadius.toFixed(1)} (height constraint)`);
        return `roundedCylinder({ ${fixedParams} })`;
      }
    }
    return match;
  });
  
  // For roundedCylinder with variable expressions, wrap roundRadius in Math.min for safety
  // Match roundedCylinder where height or roundRadius contains expressions (variables, math)
  const roundedCylinderExprPattern = /roundedCylinder\s*\(\s*\{([^}]*height\s*:\s*([^,}]+)[^}]*roundRadius\s*:\s*([^,}]+)[^}]*)\}\s*\)/g;
  
  modified = modified.replace(roundedCylinderExprPattern, (match, params: string, heightExpr: string, roundRadiusExpr: string) => {
    // Skip if both are already literal numbers (handled above)
    const isHeightLiteral = /^[\d.]+$/.test((heightExpr || '').trim());
    const isRadiusLiteral = /^[\d.]+$/.test((roundRadiusExpr || '').trim());
    
    if (isHeightLiteral && isRadiusLiteral) {
      return match; // Already handled
    }
    
    // If roundRadius is already wrapped in Math.min, skip
    if (roundRadiusExpr && roundRadiusExpr.includes('Math.min')) {
      return match;
    }
    
    // Wrap roundRadius in Math.min to ensure height > 2 * roundRadius
    // Use (height / 2) - 0.5 as the safe maximum
    const safeRoundRadius = `Math.min(${(roundRadiusExpr || '').trim()}, (${(heightExpr || '').trim()}) / 2 - 0.5)`;
    const fixedParams = params.replace(
      /roundRadius\s*:\s*[^,}]+/,
      `roundRadius: ${safeRoundRadius}`
    );
    fixes.push('Added safety wrapper for roundedCylinder roundRadius (expression-based)');
    return `roundedCylinder({ ${fixedParams} })`;
  });
  
  // Same for roundedCuboid - check all dimensions (literal values only for now)
  const roundedCuboidPattern = /roundedCuboid\s*\(\s*\{([^}]*)\}\s*\)/g;
  
  modified = modified.replace(roundedCuboidPattern, (match, params: string) => {
    // Extract size and roundRadius
    const sizeMatch = params.match(/size\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/);
    const roundRadiusMatch = params.match(/roundRadius\s*:\s*([\d.]+)/);
    
    if (sizeMatch && roundRadiusMatch) {
      const x = sizeMatch[1] || '0';
      const y = sizeMatch[2] || '0';
      const z = sizeMatch[3] || '0';
      const minDim = Math.min(parseFloat(x), parseFloat(y), parseFloat(z));
      const roundRadius = parseFloat(roundRadiusMatch[1] || '0');
      
      // Check constraint: smallest dimension must be > 2 * roundRadius
      if (minDim <= 2 * roundRadius) {
        const safeRoundRadius = Math.max(0.5, (minDim / 2) - 0.5);
        const fixedParams = params.replace(
          /roundRadius\s*:\s*[\d.]+/,
          `roundRadius: ${safeRoundRadius.toFixed(1)}`
        );
        fixes.push(`Fixed roundedCuboid: roundRadius ${roundRadius} -> ${safeRoundRadius.toFixed(1)} (size constraint)`);
        return `roundedCuboid({ ${fixedParams} })`;
      }
    }
    return match;
  });
  
  return { code: modified, fixes };
}

/**
 * Apply auto-fixes for common hallucinations and JSCAD constraint violations
 * This runs BEFORE validation so the code can be corrected and still work
 */
function applyHallucinationFixes(code: string): { code: string; fixes: string[] } {
  let modified = code;
  const fixes: string[] = [];
  
  // Apply hallucination fixes (jscad.math.random, etc.)
  for (const fix of HALLUCINATION_FIXES) {
    const before = modified;
    modified = modified.replace(fix.pattern, fix.replace);
    if (modified !== before) {
      fixes.push(fix.description);
    }
  }
  
  // Apply rounded primitive constraint fixes (height > 2 * roundRadius)
  const roundedFixes = fixRoundedPrimitiveConstraints(modified);
  modified = roundedFixes.code;
  fixes.push(...roundedFixes.fixes);
  
  return { code: modified, fixes };
}

/**
 * Safely convert roundedCuboid to cuboid to avoid "roundRadius must be smaller" errors
 * This is a post-process that runs after other optimizations
 * 
 * IMPORTANT: Only removes roundRadius and segments from the converted roundedCuboid calls,
 * NOT from other primitives like cylinder, sphere, etc. that still need segments.
 */
function convertRoundedCuboidToCuboid(code: string): { code: string; changed: boolean } {
  // Count how many roundedCuboid calls exist
  const roundedCuboidCount = (code.match(/roundedCuboid\s*\(/g) || []).length;
  
  // If there are many roundedCuboid calls (likely in a loop), convert ALL to cuboid
  // This prevents the "roundRadius must be smaller" error
  if (roundedCuboidCount > 3) {
    // Match each roundedCuboid call with its parameters and convert individually
    // This preserves segments on other primitives like cylinder, sphere, etc.
    const roundedCuboidPattern = /roundedCuboid\s*\(\s*\{([^}]*)\}\s*\)/g;
    
    let modified = code.replace(roundedCuboidPattern, (_match, params: string) => {
      // Remove roundRadius parameter
      let cleanedParams = params.replace(/,?\s*roundRadius:\s*[\d.]+\s*,?/g, (m) => {
        if (m.startsWith(',') && m.endsWith(',')) return ',';
        return '';
      });
      
      // Remove segments parameter (only valid for roundedCuboid, cuboid doesn't use it)
      cleanedParams = cleanedParams.replace(/,?\s*segments:\s*\d+\s*,?/g, (m) => {
        if (m.startsWith(',') && m.endsWith(',')) return ',';
        return '';
      });
      
      // Clean up commas
      cleanedParams = cleanedParams.replace(/,\s*,/g, ',');
      cleanedParams = cleanedParams.replace(/^\s*,/, '');
      cleanedParams = cleanedParams.replace(/,\s*$/, '');
      
      return `cuboid({ ${cleanedParams.trim()} })`;
    });
    
    return { code: modified, changed: true };
  }
  
  return { code, changed: false };
}

/**
 * Count the estimated number of boolean operations
 */
function countBooleanOperations(code: string): number {
  const unions = (code.match(/union\s*\(/g) || []).length;
  const subtracts = (code.match(/subtract\s*\(/g) || []).length;
  const intersects = (code.match(/intersect\s*\(/g) || []).length;
  return unions + subtracts + intersects;
}

/**
 * Estimate the number of geometry objects created
 */
function estimateGeometryCount(code: string): number {
  const primitives = [
    'cuboid', 'cube', 'roundedCuboid', 'cylinder', 'sphere', 
    'torus', 'polyhedron', 'extrudeLinear', 'extrudeRotate'
  ];
  
  let count = 0;
  for (const prim of primitives) {
    const matches = code.match(new RegExp(`${prim}\\s*\\(`, 'g'));
    count += matches ? matches.length : 0;
  }
  
  // Check for loops that create geometry
  const forLoops = code.match(/for\s*\([^)]+;\s*\w+\s*[<>]=?\s*(\d+)/g) || [];
  for (const loop of forLoops) {
    const iterMatch = loop.match(/[<>]=?\s*(\d+)/);
    const iterCount = iterMatch?.[1];
    if (iterCount) {
      const iterations = parseInt(iterCount, 10);
      // Assume each loop iteration creates at least one geometry
      count += iterations;
    }
  }
  
  return count;
}

/**
 * Estimate computational complexity
 */
function estimateComplexity(code: string): ValidationResult['estimatedComplexity'] {
  const booleanOps = countBooleanOperations(code);
  const geometryCount = estimateGeometryCount(code);
  const hasRoundedCuboid = /roundedCuboid/.test(code);
  const highSegments = /segments:\s*(\d{2,})/.test(code);
  
  // Calculate complexity score
  let score = 0;
  score += booleanOps * 2;
  score += geometryCount;
  if (hasRoundedCuboid) score += 10;
  if (highSegments) score += 5;
  
  // Nested booleans are exponentially expensive
  if (/union\s*\([^)]*union/.test(code)) score *= 1.5;
  if (/subtract\s*\([^)]*subtract/.test(code)) score *= 1.5;
  
  if (score < 10) return 'low';
  if (score < 25) return 'medium';
  if (score < 50) return 'high';
  return 'extreme';
}

/**
 * Apply optimizations to the code
 */
function optimizeCode(code: string): { code: string; changes: string[] } {
  let optimized = code;
  const changes: string[] = [];
  
  for (const opt of OPTIMIZATIONS) {
    const before = optimized;
    if (typeof opt.replace === 'function') {
      optimized = optimized.replace(opt.pattern, opt.replace as (...args: string[]) => string);
    } else {
      optimized = optimized.replace(opt.pattern, opt.replace);
    }
    if (before !== optimized) {
      changes.push(`Applied optimization: ${opt.pattern.source.substring(0, 30)}...`);
    }
  }
  
  return { code: optimized, changes };
}

/**
 * Check for ALL types of hallucinations
 * Returns errors for fatal issues and warnings for potential problems
 */
function checkAllHallucinations(code: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // TYPE 1: Check for hallucinated APIs (FATAL - will crash)
  for (const api of HALLUCINATED_APIS) {
    api.pattern.lastIndex = 0; // Reset for global patterns
    if (api.pattern.test(code)) {
      errors.push({
        type: 'HALLUCINATED_API',
        message: `Code uses "${api.name}" which does not exist in JSCAD. ${api.fix}`,
        fatal: true,
      });
    }
  }
  
  // TYPE 2: Check for hallucinated parameters (FATAL - will crash or misbehave)
  for (const param of HALLUCINATED_PARAMS) {
    param.pattern.lastIndex = 0;
    if (param.pattern.test(code)) {
      errors.push({
        type: 'HALLUCINATED_PARAMETER',
        message: `Code uses ${param.name}. ${param.fix}`,
        fatal: true,
      });
    }
  }
  
  // TYPE 3: Check code completeness (FATAL - won't run)
  if (!CODE_COMPLETENESS_CHECKS.hasMain.test(code)) {
    errors.push({
      type: 'INCOMPLETE_CODE',
      message: 'Code is missing a main() function. JSCAD requires: const main = () => { return geometry; }',
      fatal: true,
    });
  }
  
  if (!CODE_COMPLETENESS_CHECKS.hasExport.test(code)) {
    errors.push({
      type: 'INCOMPLETE_CODE',
      message: 'Code is missing module.exports. Add: module.exports = { main };',
      fatal: true,
    });
  }
  
  if (!CODE_COMPLETENESS_CHECKS.hasReturn.test(code)) {
    warnings.push({
      type: 'POSSIBLY_INCOMPLETE',
      message: 'Code may not return geometry from main()',
      suggestion: 'Ensure main() returns a geometry object, not undefined',
    });
  }
  
  // TYPE 4: Check geometry sanity (WARNING - will run but may be wrong)
  for (const check of GEOMETRY_SANITY_CHECKS) {
    check.pattern.lastIndex = 0;
    const matches = [...code.matchAll(check.pattern)];
    for (const match of matches) {
      if (check.check(match)) {
        warnings.push({
          type: 'GEOMETRY_SANITY',
          message: check.message,
          suggestion: 'Verify dimensions are correct for your design',
        });
        break; // Only warn once per check type
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Check for potentially floating/disconnected geometry
 */
function checkFloatingGeometry(code: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for array returns without union
  if (FLOATING_GEOMETRY_PATTERNS.ARRAY_RETURN.pattern.test(code)) {
    warnings.push({
      type: 'FLOATING_GEOMETRY',
      message: FLOATING_GEOMETRY_PATTERNS.ARRAY_RETURN.warning,
      suggestion: 'Wrap all shapes in union() to create a single connected piece',
    });
  }
  
  // Check for unused shapes
  const unusedWarnings = FLOATING_GEOMETRY_PATTERNS.UNUSED_SHAPE.check(code);
  for (const msg of unusedWarnings) {
    warnings.push({
      type: 'POTENTIALLY_FLOATING',
      message: msg,
      suggestion: 'Ensure all shapes are connected via union(), subtract(), or intersect()',
    });
  }
  
  // Check for suspiciously high-positioned shapes
  const highFloatingWarnings = FLOATING_GEOMETRY_PATTERNS.HIGH_FLOATING_SHAPES.check(code);
  for (const msg of highFloatingWarnings) {
    warnings.push({
      type: 'SUSPICIOUS_POSITIONING',
      message: msg,
      suggestion: 'Verify these shapes are physically connected to the main body, not floating decorations',
    });
  }
  
  return warnings;
}

/**
 * Validate and optimize JSCAD code before execution
 */
export function validateJSCADCode(code: string): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const analytics: FixAnalytics = {
    hallucinationsDetected: [],
    fixesApplied: [],
    timestamp: Date.now()
  };
  
  // FIRST: Apply auto-fixes for common hallucinations (e.g., jscad.math.random -> Math.random)
  const { code: fixedCode, fixes: appliedFixes } = applyHallucinationFixes(code);
  analytics.fixesApplied.push(...appliedFixes);
  
  // Add warnings for any auto-fixes applied
  for (const fix of appliedFixes) {
    warnings.push({
      type: 'AUTO_FIX_APPLIED',
      message: fix,
      suggestion: 'The AI used a non-existent API which was auto-corrected.',
    });
  }
  
  // SECOND: Comprehensive hallucination check (APIs, params, completeness, geometry)
  // Now checking the FIXED code, not the original
  const hallucinations = checkAllHallucinations(fixedCode);
  errors.push(...hallucinations.errors);
  warnings.push(...hallucinations.warnings);
  
  // Track hallucinations in analytics
  analytics.hallucinationsDetected.push(...hallucinations.errors.map(e => e.type));
  analytics.hallucinationsDetected.push(...hallucinations.warnings.filter(w => w.type.includes('HALLUCINATION')).map(w => w.type));
  
  // Count fatal hallucinations
  const fatalHallucinations = hallucinations.errors.filter(e => e.fatal);
  
  // If we found fatal hallucinations, return early with helpful error
  if (fatalHallucinations.length > 0) {
    const errorTypes = [...new Set(fatalHallucinations.map(e => e.type))];
    const typeDescriptions: Record<string, string> = {
      'HALLUCINATED_API': 'non-existent functions',
      'HALLUCINATED_PARAMETER': 'wrong parameter names', 
      'INCOMPLETE_CODE': 'missing required code structure',
    };
    
    const issueDescription = errorTypes
      .map(t => typeDescriptions[t] || t)
      .join(', ');
    
    return {
      isValid: false,
      optimizedCode: fixedCode,
      warnings: [{
        type: 'HALLUCINATION_DETECTED',
        message: `AI generated code with ${fatalHallucinations.length} issue(s): ${issueDescription}`,
        suggestion: 'The AI made mistakes. Try asking it to use simpler approaches or ask what JSCAD functions are available.',
      }, ...hallucinations.warnings],
      errors: fatalHallucinations,
      estimatedComplexity: 'low',
      analytics,
    };
  }
  
  // Check for floating/disconnected geometry (CRITICAL for printability)
  const floatingWarnings = checkFloatingGeometry(fixedCode);
  warnings.push(...floatingWarnings);
  
  // If we detected likely floating geometry, add an error (non-fatal but important)
  if (floatingWarnings.some(w => w.type === 'FLOATING_GEOMETRY' || w.type === 'SUSPICIOUS_POSITIONING')) {
    errors.push({
      type: 'PRINTABILITY',
      message: 'Design may contain floating/disconnected geometry that cannot be 3D printed',
      fatal: false, // Allow execution but warn user
    });
  }
  
  // Check for high segment counts
  const segmentMatches = fixedCode.matchAll(PROBLEMATIC_PATTERNS.HIGH_SEGMENTS.pattern);
  for (const match of segmentMatches) {
    const segmentCount = match[1];
    if (segmentCount) {
      const segments = parseInt(segmentCount, 10);
      if (segments > PROBLEMATIC_PATTERNS.HIGH_SEGMENTS.criticalValue) {
        warnings.push({
          type: 'HIGH_SEGMENTS',
          message: `Segment count of ${segments} is very high`,
          suggestion: `Reduce to ${PROBLEMATIC_PATTERNS.HIGH_SEGMENTS.maxValue} for better performance`,
        });
      }
    }
  }
  
  // Check for roundedCuboid usage
  if (PROBLEMATIC_PATTERNS.ROUNDED_CUBOID.pattern.test(fixedCode)) {
    warnings.push({
      type: 'ROUNDED_CUBOID',
      message: 'roundedCuboid is computationally expensive',
      suggestion: 'Consider using cuboid with manual chamfers for complex models',
    });
  }
  
  // Check for nested booleans
  if (PROBLEMATIC_PATTERNS.NESTED_UNIONS.pattern.test(fixedCode)) {
    warnings.push({
      type: 'NESTED_UNIONS',
      message: 'Nested union operations detected',
      suggestion: 'Flatten to single union: union(a, b, c) instead of union(union(a, b), c)',
    });
  }
  
  // Auto-optimize the code
  const { code: optimizedCode, changes } = optimizeCode(fixedCode);
  
  // Convert roundedCuboid to cuboid if there are many (likely in loops)
  const { code: finalCode, changed: convertedRounded } = convertRoundedCuboidToCuboid(optimizedCode);
  
  // Add optimization notes to warnings
  for (const change of changes) {
    warnings.push({
      type: 'OPTIMIZATION',
      message: change,
      suggestion: 'Auto-applied for better performance',
    });
  }
  
  if (convertedRounded) {
    warnings.push({
      type: 'ROUNDED_CUBOID_CONVERTED',
      message: 'Converted roundedCuboid to cuboid to prevent errors',
      suggestion: 'roundedCuboid in loops causes "roundRadius must be smaller" errors',
    });
  }
  
  // Check if complexity is still extreme after optimization
  const finalComplexity = estimateComplexity(finalCode);
  if (finalComplexity === 'extreme') {
    errors.push({
      type: 'COMPLEXITY',
      message: 'Model complexity is extremely high even after optimization',
      fatal: false, // Still allow execution, just warn
    });
  }
  
  return {
    isValid: errors.filter(e => e.fatal).length === 0,
    optimizedCode: finalCode,
    warnings,
    errors,
    estimatedComplexity: finalComplexity,
    analytics,
  };
}

/**
 * Quick check if code is likely to timeout
 */
export function willLikelyTimeout(code: string): boolean {
  const complexity = estimateComplexity(code);
  return complexity === 'extreme';
}

